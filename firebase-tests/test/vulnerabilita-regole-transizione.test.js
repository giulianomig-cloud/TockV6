// Gli stessi attacchi, con le regole di TRANSIZIONE (da usare solo nel periodo di passaggio).
// ATTENZIONE: in transizione la stanza e la classifica restano APERTE come oggi (servono alla v6.16).
// "RESTA" = possibile anche in transizione. "PROTETTO" = già chiuso in transizione.
const test = require("node:test");
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { creaAmbiente, partitaDiProva } = require("./aiuti");

let env;
test.before(async () => { env = await creaAmbiente("../regole/transizione.json"); });
test.after(async () => { if (env) await env.cleanup(); });
test.beforeEach(async () => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    const p = partitaDiProva();
    for (const c of Object.keys(p.players)) p.players[c].uid = "u-" + c;
    await db.ref("games/AMICI1").set(p);
    await db.ref("leaderboard/p-anna").set({ nome: "Anna", vittorie: 12, partite: 20, vinte: 12 });
    await db.ref("leaderboard/u-red").set({ nome: "Anna", vittorie: 1, partite: 1, vinte: 1, ultimaStanza: "X", ultimaPartita: "g" });
    await db.ref("profiles/u-red").set({ nome: "Anna" });
    await db.ref("seatKeys/AMICI1/red").set({ uid: "u-red", key: "K7P2QX" });
    await db.ref("credited/AMICI1/g/u-red").set(true);
  });
});
const sconosciuto = () => env.unauthenticatedContext().database();
const collegato = () => env.authenticatedContext("u-estraneo").database();

test("RESTA: leggere le carte in mano e il mazzo", async () => {
  await assertSucceeds(sconosciuto().ref("games/AMICI1/hands").get());
  await assertSucceeds(sconosciuto().ref("games/AMICI1/deck").get());
});
test("RESTA: modificare lo stato della partita (anche senza login)", async () => {
  await assertSucceeds(sconosciuto().ref("games/AMICI1/pawns/red").set([60, 61, 62, 63]));
  await assertSucceeds(sconosciuto().ref("games/AMICI1").update({ winnerTeam: "A", phase: "finished" }));
});
test("RESTA: prendersi un posto con una scrittura diretta (il gioco chiede il codice, il database no)", async () => {
  await assertSucceeds(sconosciuto().ref("games/AMICI1/players/red/token").set("tok-ladro"));
});
test("RESTA: cancellare una stanza", async () => {
  await assertSucceeds(sconosciuto().ref("games/AMICI1").remove());
});
test("RESTA: manipolare la classifica (voci vecchie e nuove)", async () => {
  await assertSucceeds(sconosciuto().ref("leaderboard/p-anna/vittorie").set(9999));
  await assertSucceeds(sconosciuto().ref("leaderboard/u-red").remove());
});
test("PROTETTO: profili (solo il proprio, solo con login)", async () => {
  await assertFails(collegato().ref("profiles/u-red/nome").set("Ladro"));
  await assertFails(sconosciuto().ref("profiles/u-red").get());
});
test("PROTETTO: codice di rientro (non si legge, non si riscrive, non si indovina)", async () => {
  await assertFails(collegato().ref("seatKeys/AMICI1/red").get());
  await assertFails(collegato().ref("seatKeys/AMICI1/red").set({ uid: "u-estraneo", key: "LADRO1" }));
  await assertFails(collegato().ref("seatClaims/AMICI1/red").set({ uid: "u-estraneo", key: "AAAAAA" }));
});
test("PROTETTO: segno 'partita registrata' (non si riscrive, non si scrive per altri)", async () => {
  await assertFails(env.authenticatedContext("u-red").database().ref("credited/AMICI1/g/u-red").set(true));
  await assertFails(collegato().ref("credited/AMICI1/g2/u-red").set(true));
});
test("PROTETTO: radice e percorsi non previsti", async () => {
  await assertFails(sconosciuto().ref("/").set(null));
  await assertFails(collegato().ref("altro/x").set(1));
});
