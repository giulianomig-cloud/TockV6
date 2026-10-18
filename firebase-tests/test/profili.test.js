// Passo 3 — profili legati all'uid: regole PROPOSTE (regole/proposte.json), solo sull'emulatore.
const test = require("node:test");
const { assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { creaAmbiente } = require("./aiuti");

let env;
test.before(async () => { env = await creaAmbiente("../regole/proposte.json"); });
test.after(async () => { if (env) await env.cleanup(); });
test.beforeEach(async () => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    await db.ref("profiles/uid-anna").set({ nome: "Anna", creatoIl: 1, aggiornatoIl: 1 });
    // dati VECCHI: devono restare intatti
    await db.ref("players/-vecchio").set({ nome: "Anna", creatoIl: 1 });
    await db.ref("leaderboard/-vecchio").set({ nome: "Anna", vittorie: 12, partite: 20, vinte: 12 });
  });
});
const come = (uid) => env.authenticatedContext(uid).database();
const sconosciuto = () => env.unauthenticatedContext().database();

test("profilo: ognuno crea e aggiorna il PROPRIO profilo", async () => {
  await assertSucceeds(come("uid-bruno").ref("profiles/uid-bruno").set({ nome: "Bruno", creatoIl: 2, aggiornatoIl: 2 }));
  await assertSucceeds(come("uid-anna").ref("profiles/uid-anna/nome").set("Anna B."));
});

test("profilo: due persone con lo stesso nome restano due profili diversi", async () => {
  await assertSucceeds(come("uid-anna-2").ref("profiles/uid-anna-2").set({ nome: "Anna" }));
});

test("profilo: non si scrive né si cancella il profilo di un altro", async () => {
  await assertFails(come("uid-ladro").ref("profiles/uid-anna/nome").set("Ladro"));
  await assertFails(come("uid-ladro").ref("profiles/uid-anna").remove());
});

test("profilo: senza login non si legge né si scrive", async () => {
  await assertFails(sconosciuto().ref("profiles/uid-anna").get());
  await assertFails(sconosciuto().ref("profiles/x").set({ nome: "X" }));
});

test("profilo: nome vuoto, troppo lungo o campi estranei rifiutati", async () => {
  const db = come("uid-c");
  await assertFails(db.ref("profiles/uid-c").set({ nome: "" }));
  await assertFails(db.ref("profiles/uid-c").set({ nome: "x".repeat(41) }));
  await assertFails(db.ref("profiles/uid-c").set({ nome: "C", admin: true }));
  await assertFails(db.ref("profiles/uid-c").set({ creatoIl: 1 }));
});

test("profilo: i vecchi dati (rubrica e classifica) non vengono toccati dai profili", async () => {
  await assertSucceeds(come("uid-d").ref("profiles/uid-d").set({ nome: "Anna" }));
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    const lb = (await db.ref("leaderboard/-vecchio").get()).val();
    const pl = (await db.ref("players/-vecchio").get()).val();
    if (lb.vittorie !== 12 || lb.partite !== 20 || pl.nome !== "Anna") throw new Error("dati vecchi cambiati");
  });
});
