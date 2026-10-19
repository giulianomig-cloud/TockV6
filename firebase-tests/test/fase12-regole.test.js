// Fasi 1-2 (preparazione) — controlli delle regole di TRANSIZIONE con dati FINTI simili a quelli veri,
// e le stesse verifiche che l'utente farà col simulatore della console. Solo emulatore.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { creaAmbiente } = require("./aiuti");
const { leggiRegole, differenze } = require("../fase0/regole-util");
const { datiFinti } = require("../fase12/dati-finti");

const RADICE = path.resolve(__dirname, "../..");

test("la transizione = regole di oggi + SOLO profiles, credited, seatKeys, seatClaims", () => {
  const oggi = leggiRegole(path.join(RADICE, "database.rules.json"));
  const trans = leggiRegole(path.resolve(__dirname, "../regole/transizione.json"));
  const diff = differenze(oggi, trans).map((d) => d.percorso.split("/")[2]);
  assert.deepEqual([...new Set(diff)].sort(), ["credited", "profiles", "seatClaims", "seatKeys"]);
  for (const d of differenze(oggi, trans)) assert.equal(d.a, "(assente)", "nessuna regola di oggi viene cambiata: " + d.percorso);
});

test.describe("transizione con dati finti come quelli veri", () => {
  let env;
  test.before(async () => { env = await creaAmbiente("../regole/transizione.json"); });
  test.after(async () => { if (env) await env.cleanup(); });
  test.beforeEach(async () => {
    await env.clearDatabase();
    await env.withSecurityRulesDisabled(async (ctx) => { await ctx.database().ref().set(datiFinti()); });
  });
  const anonimo = () => env.unauthenticatedContext().database();
  const loggato = (uid) => env.authenticatedContext(uid).database();

  // Le stesse prove da ripetere a mano nel simulatore della console dopo la pubblicazione (Fase 2).
  test("simulatore 1: lettura di /profiles/x senza login → NEGATA", async () => {
    await assertFails(anonimo().ref("profiles/x").get());
  });
  test("simulatore 2: scrittura su /games/PROVA senza login → PERMESSA (come oggi)", async () => {
    await assertSucceeds(anonimo().ref("games/PROVA").set({ phase: "lobby" }));
  });
  test("simulatore 3: scrittura su /profiles/<proprio uid> con login → PERMESSA; su quello di un altro → NEGATA", async () => {
    await assertSucceeds(loggato("u1").ref("profiles/u1").set({ nome: "Io" }));
    await assertFails(loggato("u1").ref("profiles/u2").set({ nome: "Altro" }));
  });
  test("simulatore 4: scrittura su /credited/... senza login → NEGATA", async () => {
    await assertFails(anonimo().ref("credited/AUTO-1/g/u1").set(true));
  });
  test("la v6.16 continua a fare tutto: partita in corso, classifica come oggi, rubrica, presenza, contatori", async () => {
    const db = anonimo();
    await assertSucceeds(db.ref("games/AUTO-2/turnColor").set("yellow"));
    await assertSucceeds(db.ref("presence/AUTO-2/green/nuova").set("v6.16"));
    await assertSucceeds(db.ref().update({ "leaderboard/-FINTOlia/partite": 4, "games/AUTO-4/leaderboardClaimed": true }));
    await assertSucceeds(db.ref("players/-FINTOnuovo").set({ nome: "Nuovo", creatoIl: 1 }));
    await assertSucceeds(db.ref("stats/matchmaking").set(26));
  });
  test("i dati vecchi si leggono come oggi (classifica, rubrica, stanze)", async () => {
    const db = anonimo();
    const lb = (await db.ref("leaderboard").get()).val();
    assert.deepEqual(lb, datiFinti().leaderboard);
    await assertSucceeds(db.ref("players").get());
    await assertSucceeds(db.ref("games/AUTO-1").get());
  });
});

test.describe("regole DEFINITIVE e stanze bloccate come AUTO-1", () => {
  let env;
  test.before(async () => { env = await creaAmbiente("../regole/proposte.json"); });
  test.after(async () => { if (env) await env.cleanup(); });
  test.beforeEach(async () => {
    await env.clearDatabase();
    await env.withSecurityRulesDisabled(async (ctx) => { await ctx.database().ref().set(datiFinti()); });
  });
  const nuova = { gameId: "gnuovo", roomMode: "draw", phase: "lobby", draft: { players: { "t-x": "Ugo" }, order: ["t-x"], uids: { "t-x": "u-x" } } };
  test("una stanza AUTO bloccata in attesa (nessun posto al tavolo) si può riciclare", async () => {
    await assertSucceeds(env.authenticatedContext("u-x").database().ref("games/AUTO-1").set(nuova));
  });
  test("una partita in corso con qualcuno collegato NON si può riciclare", async () => {
    await assertFails(env.authenticatedContext("u-x").database().ref("games/AUTO-2").set(nuova));
  });
});
