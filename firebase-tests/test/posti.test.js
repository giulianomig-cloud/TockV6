// Passo 5 — posti protetti e "Sono io" con codice di rientro. Regole PROPOSTE, solo sull'emulatore.
// Chi attacca ("ladro", uid L) è collegato e conosce SOLO il codice della stanza.
const test = require("node:test");
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { creaAmbiente } = require("./aiuti");

const VERA = { name: "Vera", token: "t-vera", uid: "V", playerId: "-pVera" };
function amici() {
  return {
    gameId: "g1", roomMode: "manual", phase: "playing", turnColor: "red", turnStartedAt: Date.now(),
    players: { red: { ...VERA }, green: { name: "Robo", token: "BOT-green", isBot: true, botLevel: "easy" } },
    hands: { red: ["7-hearts"], green: ["A-clubs"] },
    pawns: { red: [5, -1, -1, -1], green: [-1, -1, -1, -1], yellow: [-1, -1, -1, -1], blue: [-1, -1, -1, -1] },
  };
}
function autoInAttesa() {
  return {
    gameId: "g2", roomMode: "draw", phase: "lobby",
    draft: { players: { "t-a": "Anna", "t-b": "Bruno" }, order: ["t-a", "t-b"], uids: { "t-a": "A", "t-b": "B" } },
  };
}
function autoFinita(oreFa = 0) {
  return {
    gameId: "g3", roomMode: "draw", phase: "finished", winnerTeam: "A", turnStartedAt: Date.now() - oreFa * 3600000,
    players: { red: { name: "Anna", token: "t-a", uid: "A" }, green: { name: "Bruno", token: "t-b", uid: "B" } },
  };
}
const NUOVA_AUTO = { gameId: "g4", roomMode: "draw", phase: "lobby", draft: { players: { "t-l": "Luca" }, order: ["t-l"], uids: { "t-l": "L" } } };

let env;
test.before(async () => { env = await creaAmbiente("../regole/proposte.json"); });
test.after(async () => { if (env) await env.cleanup(); });
test.beforeEach(async () => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    await db.ref("games/AMICI1").set(amici());
    await db.ref("games/AUTO-1").set(autoInAttesa());
    await db.ref("games/AUTO-2").set(autoFinita());
    await db.ref("games/AUTO-3").set(autoFinita());
    await db.ref("presence/AUTO-3/red/c1").set("v6.20");
    await db.ref("seatKeys/AMICI1/red").set({ uid: "V", key: "K7P2QX" });
  });
});
const come = (uid) => env.authenticatedContext(uid).database();
const ladro = () => come("L");
const stanza = (db, r = "AMICI1") => db.ref("games/" + r);

test.describe("un altro utente NON può prendersi il posto di Vera conoscendo solo il codice", () => {
  test("cambiare il token del posto", async () => {
    await assertFails(stanza(ladro()).child("players/red/token").set("t-ladro"));
  });
  test("cambiare l'uid del posto", async () => {
    await assertFails(stanza(ladro()).child("players/red/uid").set("L"));
  });
  test("riscrivere tutto il posto con i propri dati", async () => {
    await assertFails(stanza(ladro()).child("players/red").set({ name: "Vera", token: "t-ladro", uid: "L" }));
  });
  test("cancellare il posto (per poi sedersi)", async () => {
    await assertFails(stanza(ladro()).child("players/red").remove());
    await assertFails(stanza(ladro()).child("players").remove());
  });
  test("riscrivere l'intera stanza (transazione) con il posto cambiato", async () => {
    const s = amici();
    s.players.red = { ...VERA, token: "t-ladro", uid: "L" };
    await assertFails(stanza(ladro()).set(s));
  });
  test("trasformare il posto in un computer", async () => {
    await assertFails(stanza(ladro()).child("players/red/isBot").set(true));
  });
  test("cambiare il nome sul posto", async () => {
    await assertFails(stanza(ladro()).child("players/red/name").set("Ladro"));
  });
  test("cancellare la stanza o rimetterla da capo", async () => {
    await assertFails(stanza(ladro()).remove());
    await assertFails(stanza(ladro()).set({ gameId: "x", roomMode: "manual", phase: "lobby" }));
  });
  test("leggere il codice di rientro di Vera", async () => {
    await assertFails(ladro().ref("seatKeys/AMICI1/red").get());
  });
  test("indovinare il codice di rientro (sbagliato) e poi cambiare il posto", async () => {
    await assertFails(ladro().ref("seatClaims/AMICI1/red").set({ uid: "L", key: "AAAAAA" }));
    await assertFails(stanza(ladro()).child("players/red").set({ ...VERA, token: "t-ladro", uid: "L" }));
  });
  test("riscrivere il codice di rientro di Vera", async () => {
    await assertFails(ladro().ref("seatKeys/AMICI1/red").set({ uid: "L", key: "LADRO1" }));
  });
  test("scrivere la presenza (o una versione finta) sul colore di Vera", async () => {
    await assertFails(ladro().ref("presence/AMICI1/red/x").set("v99.99"));
  });
  test("senza login non si scrive nulla nella stanza", async () => {
    await assertFails(stanza(env.unauthenticatedContext().database()).child("turnColor").set("green"));
  });
  test("Gioca subito: sostituire l'uid di un altro in attesa", async () => {
    await assertFails(stanza(ladro(), "AUTO-1").child("draft/uids/t-a").set("L"));
  });
  test("Gioca subito: creare il posto di un altro con un uid diverso dal suo", async () => {
    await assertFails(stanza(ladro(), "AUTO-1").child("players/red").set({ name: "Anna", token: "t-a", uid: "L" }));
  });
  test("creare un posto umano SENZA uid su un colore libero (posto 'bloccato')", async () => {
    await assertFails(stanza(ladro()).child("players/blue").set({ name: "Fantasma", token: "t-x" }));
  });
  test("riciclare una stanza AUTO finita mentre qualcuno è ancora collegato", async () => {
    await assertFails(stanza(ladro(), "AUTO-3").set(NUOVA_AUTO));
  });
});

test.describe("quello che deve continuare a funzionare", () => {
  test("Vera aggiorna il proprio posto (rientro sullo stesso telefono)", async () => {
    await assertSucceeds(stanza(come("V")).child("players/red/token").set("t-vera-2"));
  });
  test("Vera legge il proprio codice di rientro", async () => {
    await assertSucceeds(come("V").ref("seatKeys/AMICI1/red").get());
  });
  test("'Sono io' da un altro telefono di Vera, con il codice giusto", async () => {
    const v2 = come("V2");
    await assertSucceeds(v2.ref("seatClaims/AMICI1/red").set({ uid: "V2", key: "K7P2QX" }));
    await assertSucceeds(stanza(v2).child("players/red").set({ ...VERA, token: "t-vera-tel2", uid: "V2" }));
    await assertSucceeds(v2.ref("seatKeys/AMICI1/red").set({ uid: "V2", key: "NUOVO7" }));
    // il vecchio telefono non legge il codice nuovo e non si riprende il posto senza
    await assertFails(come("V").ref("seatKeys/AMICI1/red").get());
    await assertFails(stanza(come("V")).child("players/red/uid").set("V"));
  });
  test("chi è nella stanza fa le mosse (stato di gioco) senza toccare i posti", async () => {
    await assertSucceeds(stanza(ladro()).transaction((s) => {
      if (!s) return s;
      s.pawns.red = [9, -1, -1, -1];
      s.turnColor = "green";
      s.log = ["mossa"];
      return s;
    }));
  });
  test("sedersi su un posto libero, aggiungere e togliere un computer", async () => {
    await assertSucceeds(stanza(ladro()).child("players/blue").set({ name: "Luca", token: "t-l", uid: "L" }));
    await assertSucceeds(stanza(ladro()).child("players/yellow").set({ name: "Bip", token: "BOT-yellow", isBot: true, botLevel: "hard" }));
    await assertSucceeds(stanza(ladro()).child("players/green").remove());
  });
  test("Gioca subito: il 4° giocatore crea i posti di tutti dagli uid in attesa", async () => {
    await assertSucceeds(stanza(come("C"), "AUTO-1").transaction((s) => {
      if (!s) return s;
      s.draft.players["t-c"] = "Carla";
      s.draft.uids["t-c"] = "C";
      s.players = {
        red: { name: "Anna", token: "t-a", uid: "A" },
        green: { name: "Bruno", token: "t-b", uid: "B" },
        yellow: { name: "Carla", token: "t-c", uid: "C" },
        blue: { name: "Robo", token: "bot-1", isBot: true, botLevel: "easy" },
      };
      s.phase = "exchanging";
      return s;
    }));
  });
  test("Gioca subito: una stanza AUTO finita e vuota si ricicla da zero", async () => {
    await assertSucceeds(stanza(ladro(), "AUTO-2").set(NUOVA_AUTO));
  });
  test("presenza e versione sul proprio colore", async () => {
    await assertSucceeds(come("V").ref("presence/AMICI1/red/c9").set("v6.20"));
    await assertSucceeds(come("V").ref("presence/AMICI1/red/c9").remove());
  });
  test("contatori e indice dei codici: solo +1 e solo creazione", async () => {
    const db = come("V");
    await assertSucceeds(db.ref("stats/roomsCreated").set(1));
    await assertSucceeds(db.ref("stats/roomsCreated").set(2));
    await assertFails(db.ref("stats/roomsCreated").set(999));
    await assertSucceeds(db.ref("codes/NUOVA1").set("room"));
    await assertFails(db.ref("codes/NUOVA1").remove());
  });
});

test.describe("LIMITI NOTI (servono controlli sul server)", () => {
  test("chi conosce il codice può ancora scrivere lo stato di gioco (pedine, turno)", async () => {
    await assertSucceeds(stanza(ladro()).child("pawns/red").set([60, 61, 62, 63]));
  });
  test("le carte in mano restano leggibili da chi conosce il codice", async () => {
    await assertSucceeds(ladro().ref("games/AMICI1/hands").get());
  });
  test("chi siede può scrivere una versione 'più nuova' per il proprio colore", async () => {
    await assertSucceeds(come("V").ref("presence/AMICI1/red/c1").set("v99.99"));
  });
});
