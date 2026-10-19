// Fase 5B — regole con l'arbitro sul server (regole/arbitro.json), solo sull'emulatore.
// Il server (Cloud Function) scrive con i permessi di amministratore e non passa dalle regole: qui si prova
// che i TELEFONI non possono leggere le carte degli altri né scrivere partita, classifica o conteggi.
const test = require("node:test");
const assert = require("node:assert/strict");
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { creaAmbiente } = require("./aiuti");

const ANNA = { name: "Anna", token: "t-a", uid: "A" };
const BRUNO = { name: "Bruno", token: "t-b", uid: "B" };
const BOT = (c) => ({ name: "Computer", token: "BOT-" + c, isBot: true, botLevel: "easy" });
function stanzaInGioco() {
  return {
    arbitro: true, sessione: "S1", gameId: "g1", roomMode: "manual", phase: "playing", turnStartedAt: 1000,
    players: { red: { ...ANNA }, green: { ...BRUNO }, yellow: BOT("yellow"), blue: BOT("blue") },
    chat: [{ id: 1, color: "red", text: "Ciao a tutti! 👋" }],
  };
}
function partitaServer() {
  return {
    stato: { sessione: "S1", gameId: "g1", phase: "playing", deck: ["2-clubs", "3-clubs"], hands: { red: ["7-hearts"], green: ["A-clubs"] } },
    pub: { sessione: "S1", gameId: "g1", phase: "playing", turnColor: "red", carteInMano: { red: 1, green: 1 } },
    mani: { A: { colore: "red", carte: ["7-hearts"] }, B: { colore: "green", carte: ["A-clubs"] } },
  };
}
const autoFinita = (oreFa) => ({
  arbitro: true, sessione: "S-vecchia", gameId: "g3", roomMode: "draw", phase: "finished", winnerTeam: "A",
  turnStartedAt: Date.now() - oreFa * 3600000, players: { red: { ...ANNA }, green: { ...BRUNO } },
});
const nuovaSala = (extra = {}) => ({ gameId: "g9", roomMode: "draw", phase: "lobby", arbitro: true, sessione: "S-nuova", ...extra });

let env;
test.before(async () => { env = await creaAmbiente("../regole/arbitro.json"); });
test.after(async () => { if (env) await env.cleanup(); });
test.beforeEach(async () => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    await db.ref("games/AMICI1").set(stanzaInGioco());
    await db.ref("arbitro/AMICI1").set(partitaServer());
    await db.ref("games/AUTO-2").set(autoFinita(1));
    await db.ref("leaderboard/A").set({ nome: "Anna", partite: 1, vinte: 1, vittorie: 1, ultimaStanza: "AMICI1", ultimaPartita: "g0" });
    await db.ref("stats/gamesFinished").set(3);
    await db.ref("config/arbitro").set(true);
  });
});
const anna = () => env.authenticatedContext("A").database();
const bruno = () => env.authenticatedContext("B").database();
const ladro = () => env.authenticatedContext("L").database();
const anonimo = () => env.unauthenticatedContext().database();

test("carte: ognuno legge SOLO la propria mano; mazzo e stato completo non li legge nessuno", async () => {
  await assertSucceeds(anna().ref("arbitro/AMICI1/mani/A").get());
  await assertFails(anna().ref("arbitro/AMICI1/mani/B").get());
  await assertFails(ladro().ref("arbitro/AMICI1/mani/A").get());
  await assertFails(anonimo().ref("arbitro/AMICI1/mani/A").get());
  await assertFails(anna().ref("arbitro/AMICI1/mani").get());
  await assertFails(anna().ref("arbitro/AMICI1/stato").get());
  await assertFails(anna().ref("arbitro/AMICI1").get());
  await assertFails(anonimo().ref("arbitro/AMICI1/stato/deck").get());
  await assertSucceeds(anonimo().ref("arbitro/AMICI1/pub").get());
  const pub = (await anna().ref("arbitro/AMICI1/pub").get()).val();
  assert.equal(pub.hands, undefined);
});

test("nessun telefono scrive la partita del server, la classifica, i 'già contata' o le partite finite", async () => {
  await assertFails(anna().ref("arbitro/AMICI1/pub/turnColor").set("green"));
  await assertFails(anna().ref("arbitro/AMICI1/mani/A/carte").set(["J-hearts", "J-spades"]));
  await assertFails(anna().ref("arbitro/AMICI1/stato").remove());
  await assertFails(anna().ref("leaderboard/A/vittorie").set(99));
  await assertFails(anna().ref("leaderboard/A").set({ nome: "Anna", partite: 2, vinte: 2, vittorie: 2, ultimaStanza: "AMICI1", ultimaPartita: "g1" }));
  await assertFails(ladro().ref("leaderboard/L").set({ nome: "Ladro", partite: 1, vinte: 1, vittorie: 1, ultimaStanza: "AMICI1", ultimaPartita: "g1" }));
  await assertFails(anna().ref("leaderboard/A").remove());
  await assertFails(anna().ref("credited/AMICI1/g1/A").set(true));
  await assertFails(anna().ref("stats/gamesFinished").set(4));
  await assertSucceeds(anna().ref("stats/roomsCreated").set(1));
  await assertSucceeds(anonimo().ref("leaderboard").get());
  await assertFails(anna().ref("config/arbitro").set(false));
  await assertSucceeds(anonimo().ref("config/arbitro").get());
});

test("stanza in gioco: i telefoni cambiano chat e posti, NON fase, partita, vincitore, turno, sessione o arbitro", async () => {
  const r = (db) => db.ref("games/AMICI1");
  const cambia = async (db, fn) => { const s = (await r(anna()).get()).val(); fn(s); return r(db).set(s); };
  await assertSucceeds(cambia(anna(), (s) => s.chat.push({ id: 2, color: "red", text: "Bella mossa! 👏" })));
  await assertFails(cambia(anna(), (s) => { s.phase = "finished"; }));
  await assertFails(cambia(anna(), (s) => { s.winnerTeam = "A"; }));
  await assertFails(cambia(anna(), (s) => { s.gameId = "g2"; }));
  await assertFails(cambia(anna(), (s) => { s.turnStartedAt = 1; }));
  await assertFails(cambia(anna(), (s) => { s.sessione = "S2"; }));
  await assertFails(cambia(anna(), (s) => { s.arbitro = false; }));
  await assertFails(cambia(anna(), (s) => { delete s.arbitro; }));
  await assertFails(r(anna()).child("phase").set("lobby"));
  await assertFails(r(anna()).child("winnerTeam").set("A"));
  // posti protetti come nella Fase 5A
  await assertFails(cambia(ladro(), (s) => { s.players.red = { name: "Ladro", token: "t-l", uid: "L" }; }));
  await assertFails(r(ladro()).remove());
});

test("stanze nuove: solo con arbitro e sessione, in sala d'attesa", async () => {
  await assertSucceeds(ladro().ref("games/NUOVA1").set(nuovaSala({ roomMode: "manual" })));
  await assertFails(ladro().ref("games/NUOVA2").set(nuovaSala({ arbitro: false })));
  const senza = nuovaSala();
  delete senza.arbitro;
  await assertFails(ladro().ref("games/NUOVA3").set(senza));
  const senzaSessione = nuovaSala();
  delete senzaSessione.sessione;
  await assertFails(ladro().ref("games/NUOVA4").set(senzaSessione));
  await assertFails(ladro().ref("games/NUOVA5").set(nuovaSala({ phase: "playing" })));
  await assertFails(ladro().ref("games/NUOVA6").set(nuovaSala({ winnerTeam: "A" })));
});

test("Gioca subito: una stanza finita e abbandonata si ricicla con una sessione nuova, una in corso no", async () => {
  await assertSucceeds(ladro().ref("games/AUTO-2").set(nuovaSala()));
  await env.withSecurityRulesDisabled((ctx) => ctx.database().ref("games/AUTO-2").set(autoFinita(1)));
  await assertFails(ladro().ref("games/AUTO-2").set(nuovaSala({ sessione: "S-vecchia" })), "stessa sessione: la partita vecchia tornerebbe valida");
  await assertFails(ladro().ref("games/AUTO-2").set(nuovaSala({ arbitro: false })));
  await env.withSecurityRulesDisabled((ctx) => ctx.database().ref("presence/AUTO-2/red/c1").set("v6.23"));
  await assertFails(ladro().ref("games/AUTO-2").set(nuovaSala()), "qualcuno è collegato");
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    await db.ref("presence/AUTO-2").remove();
    await db.ref("games/AUTO-3").set({ ...stanzaInGioco(), roomMode: "draw", turnStartedAt: Date.now() });
  });
  await assertFails(ladro().ref("games/AUTO-3").set(nuovaSala()), "partita in corso");
});

// R7 — recupero delle stanze AUTO "di prima" (senza arbitro) rimaste in sala d'attesa.
const autoDiPrimaInAttesa = (extra = {}) => ({
  gameId: "gv", roomMode: "draw", phase: "lobby",
  draft: { players: { "t-x": "Fantasma" }, order: ["t-x"], seen: { "t-x": 1000 } },
  ...extra,
});
const recuperata = (extra = {}) => ({
  gameId: "g-nuova", roomMode: "draw", phase: "lobby", arbitro: true, sessione: "S-rec",
  draft: { players: { "t-l": "Luca" }, order: ["t-l"], uids: { "t-l": "L" } }, ...extra,
});

test("recupero: una stanza AUTO di prima in sala d'attesa e senza posti diventa una stanza con l'arbitro", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    await db.ref("games/AUTO-7").set(autoDiPrimaInAttesa());
    await db.ref("games/AUTO-8").set({ roomMode: "draw" }); // stanza vecchissima senza fase
  });
  await assertSucceeds(ladro().ref("games/AUTO-7").set(recuperata()));
  await assertSucceeds(ladro().ref("games/AUTO-8").set(recuperata()));
  // dopo il recupero vale la regola normale: la fase la cambia solo il server
  await assertFails(ladro().ref("games/AUTO-7/phase").set("playing"));
});

test("recupero: NO se la stanza ha posti, è iniziata, è privata, ha già l'arbitro o il risultato non è una sala d'attesa con l'arbitro", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    await db.ref("games/AUTO-7").set(autoDiPrimaInAttesa({ players: { red: { ...ANNA } } }));
    await db.ref("games/AUTO-8").set(autoDiPrimaInAttesa({ phase: "playing", turnStartedAt: Date.now(), players: { red: { name: "Zeno", token: "t-z" } } }));
    await db.ref("games/AUTO-9").set(autoDiPrimaInAttesa({ phase: "exchanging" }));
    await db.ref("games/PRIVATA1").set(autoDiPrimaInAttesa({ roomMode: "manual" }));
    await db.ref("games/AUTO-10").set({ ...autoDiPrimaInAttesa(), arbitro: true, sessione: "S-x" });
    await db.ref("games/AUTO-11").set(autoDiPrimaInAttesa());
  });
  await assertFails(ladro().ref("games/AUTO-7").set(recuperata()), "c'è qualcuno seduto");
  await assertFails(ladro().ref("games/AUTO-8").set(recuperata()), "partita di prima iniziata (posto senza uid)");
  await assertFails(ladro().ref("games/AUTO-9").set(recuperata()), "partita iniziata");
  await assertFails(ladro().ref("games/PRIVATA1").set(recuperata()), "stanza privata");
  await assertFails(ladro().ref("games/AUTO-10").set(recuperata()), "ha già l'arbitro: vale la sessione");
  await assertFails(ladro().ref("games/AUTO-11").set(recuperata({ arbitro: false })), "deve diventare con l'arbitro");
  await assertFails(ladro().ref("games/AUTO-11").set(recuperata({ phase: "playing" })), "deve restare in sala d'attesa");
  await assertFails(ladro().ref("games/AUTO-11").set(recuperata({ winnerTeam: "A" })), "niente vincitore");
  await assertFails(ladro().ref("games/AUTO-11").set(recuperata({ players: { red: { name: "Anna", token: "t-a", uid: "A" } } })), "posto di un altro uid");
  await assertFails(anonimo().ref("games/AUTO-11").set(recuperata()), "senza login");
  await assertSucceeds(ladro().ref("games/AUTO-11").set(recuperata({ players: { red: { name: "Luca", token: "t-l", uid: "L" } } })), "il proprio posto sì");
  // la partita del server di una stanza in gioco resta intoccabile
  await assertFails(ladro().ref("games/AMICI1").set(recuperata()));
});

// Ultima: carica sull'emulatore le regole 5A al posto di quelle dell'arbitro.
test("Fase 5A (proposte.json): config e parte pubblica leggibili, mani private, arbitro non scrivibile", async () => {
  const env5a = await creaAmbiente("../regole/proposte.json");
  try {
    await env5a.withSecurityRulesDisabled((ctx) => ctx.database().ref("arbitro/AMICI1").set(partitaServer()));
    const a = env5a.authenticatedContext("A").database();
    const b = env5a.authenticatedContext("B").database();
    await assertSucceeds(env5a.unauthenticatedContext().database().ref("config/arbitro").get());
    await assertSucceeds(a.ref("arbitro/AMICI1/pub").get());
    await assertSucceeds(a.ref("arbitro/AMICI1/mani/A").get());
    await assertFails(b.ref("arbitro/AMICI1/mani/A").get());
    await assertFails(a.ref("arbitro/AMICI1/stato").get());
    await assertFails(a.ref("arbitro/AMICI1/pub/phase").set("finished"));
    await assertFails(a.ref("config/arbitro").set(true));
  } finally {
    await env5a.cleanup();
  }
});

