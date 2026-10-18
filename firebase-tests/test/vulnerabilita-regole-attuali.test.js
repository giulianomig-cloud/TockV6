// DIMOSTRAZIONE delle falle delle regole ATTUALI (database.rules.json della v6.16).
// Gira SOLO sull'emulatore locale (progetto finto "demo-tock"): niente tocca Firebase vero.
//
// Ogni test qui sotto PASSA quando la falla ESISTE. Quando arriveranno le regole nuove,
// questi stessi casi andranno capovolti (assertFails) nel file delle regole nuove.
const test = require("node:test");
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { creaAmbiente, partitaDiProva } = require("./aiuti");

let env;
test.before(async () => {
  env = await creaAmbiente("../../database.rules.json");
});
test.after(async () => {
  if (env) await env.cleanup();
});
test.beforeEach(async () => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    await db.ref("games/AMICI1").set(partitaDiProva());
    await db.ref("games/AUTO-1").set(partitaDiProva());
    await db.ref("leaderboard/p-anna").set({ nome: "Anna", vittorie: 12, partite: 20, vinte: 12 });
    await db.ref("players/p-anna").set({ nome: "Anna", creatoIl: 1 });
    await db.ref("presence/AMICI1/red/c1").set("v6.16");
    await db.ref("stats/roomsCreated").set(5);
    await db.ref("codes/AMICI1").set("room");
  });
});

// Chi attacca: uno sconosciuto SENZA login (basta conoscere l'indirizzo del database).
const sconosciuto = () => env.unauthenticatedContext().database();

test("FALLA: chiunque cambia la classifica di un altro", async () => {
  await assertSucceeds(sconosciuto().ref("leaderboard/p-anna/vittorie").set(9999));
});

test("FALLA: chiunque cancella la classifica di un altro", async () => {
  await assertSucceeds(sconosciuto().ref("leaderboard/p-anna").remove());
});

test("FALLA: chiunque inventa un giocatore in classifica", async () => {
  await assertSucceeds(sconosciuto().ref("leaderboard/finto").set({ nome: "Finto", vittorie: 500, partite: 500, vinte: 500 }));
});

test("FALLA: chiunque cancella una stanza", async () => {
  await assertSucceeds(sconosciuto().ref("games/AMICI1").remove());
});

test("FALLA: chiunque dichiara vinta una partita", async () => {
  await assertSucceeds(sconosciuto().ref("games/AMICI1").update({ winnerTeam: "A", phase: "finished" }));
});

test("FALLA: chiunque azzera il segno 'vittoria già accreditata' (accredito ripetibile)", async () => {
  await assertSucceeds(sconosciuto().ref("games/AMICI1/leaderboardClaimed").set(null));
});

test("FALLA: chiunque legge le carte in mano a tutti e il mazzo", async () => {
  const db = sconosciuto();
  await assertSucceeds(db.ref("games/AMICI1/hands").get());
  await assertSucceeds(db.ref("games/AMICI1/deck").get());
});

test("FALLA: chiunque si prende il posto di un altro (cambia il token del posto)", async () => {
  await assertSucceeds(sconosciuto().ref("games/AMICI1/players/red/token").set("tok-ladro"));
});

test("FALLA: chiunque scrive una versione finta nella presenza (blocca la partita)", async () => {
  await assertSucceeds(sconosciuto().ref("presence/AMICI1/green/finta").set("v99.99"));
});

test("FALLA: chiunque scrive testo libero nella chat delle stanze AUTO", async () => {
  await assertSucceeds(sconosciuto().ref("games/AUTO-1/chat/1").set({ id: 2, color: "red", text: "testo libero qualsiasi" }));
});

test("FALLA: chiunque cambia i contatori stats/ e l'indice codes/", async () => {
  const db = sconosciuto();
  await assertSucceeds(db.ref("stats/roomsCreated").set(-1));
  await assertSucceeds(db.ref("codes/AMICI1").remove());
});

test("FALLA: chiunque crea voci arbitrarie nella rubrica dei nomi", async () => {
  await assertSucceeds(sconosciuto().ref("players/spam1").set({ nome: "x".repeat(5000) }));
});

// Le poche cose che le regole attuali proteggono già.
test("PROTETTO: non si può riscrivere una voce della rubrica già esistente", async () => {
  await assertFails(sconosciuto().ref("players/p-anna/nome").set("Ladro"));
});

test("PROTETTO: non si può scrivere sulla radice né su percorsi non previsti", async () => {
  const db = sconosciuto();
  await assertFails(db.ref("/").set(null));
  await assertFails(db.ref("tournaments/x").set({ a: 1 }));
  await assertFails(db.ref("games").set(null));
});
