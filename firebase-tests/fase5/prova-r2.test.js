// R1/R2 — prova generale delle regole 5A (regole/proposte.json) con la v6.23 sui dati di produzione (COPIA,
// solo emulatore): `BACKUP_DATI=export.json npm run r2-prova`. Senza BACKUP_DATI usa i dati finti della Fase 1-2.
// Non stampa nomi, carte né codici delle stanze private.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { preparaBanco, leggi, scrivi, aspetta, finché, LIMITE } = require("../test/e2e-banco");
const { datiFinti } = require("../fase12/dati-finti");

const { telefono, errori } = preparaBanco("../regole/proposte.json");
const VERI = !!process.env.BACKUP_DATI;
const dati = () => (VERI ? JSON.parse(fs.readFileSync(process.env.BACKUP_DATI, "utf8")) : datiFinti());
const ordina = (x) => (Array.isArray(x) ? x.map(ordina) : x && typeof x === "object"
  ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, ordina(x[k])])) : x);
// Come il database: niente null né liste/oggetti vuoti.
const comeDb = (x) => {
  if (Array.isArray(x)) { const v = x.map(comeDb).filter((e) => e !== undefined); return v.length ? v : undefined; }
  if (x && typeof x === "object") {
    const o = {};
    for (const [k, v] of Object.entries(x)) { const w = comeDb(v); if (w !== undefined) o[k] = w; }
    return Object.keys(o).length ? o : undefined;
  }
  return x === null ? undefined : x;
};
const impronta = (x) => crypto.createHash("sha256").update(JSON.stringify(ordina(x))).digest("hex");

// Stanze private (non AUTO) con una partita in corso e almeno una persona seduta.
function partitePrivateInCorso(d) {
  return Object.entries(d.games || {}).filter(([k, s]) => !k.startsWith("AUTO-") && s && s.phase && s.phase !== "lobby" &&
    s.phase !== "finished" && Object.values(s.players || {}).some((p) => p && !p.isBot));
}

test("i dati si caricano con le regole 5A e si rileggono identici; nessun dato toccato dal caricamento", LIMITE, async () => {
  const d = dati();
  await scrivi("", d);
  assert.equal(impronta(await leggi("")), impronta(comeDb(d)));
  console.log(`# dati: ${VERI ? "copia dell'export reale" : "finti"} · stanze ${Object.keys(d.games || {}).length} · classifica ${Object.keys(d.leaderboard || {}).length}`);
});

test("Gioca subito con la v6.23 e i dati di adesso: trova o ricicla una stanza AUTO e la partita parte", LIMITE, async () => {
  const d = dati();
  await scrivi("", d);
  const prima = Object.fromEntries(partitePrivateInCorso(d).map(([k]) => [k, impronta(d.games[k])]));
  const t = await telefono("Nuovo");
  await t.page.evaluate(() => { localStorage.setItem("tock-player", JSON.stringify({ id: null, nome: "Prova" })); startMatchmaking(); });
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId), 30000);
  await t.page.click(".mm-bot-btns button >> nth=0");
  await finché(async () => { const s = await leggi("games/" + roomId); return s && s.phase === "exchanging"; }, 30000);
  const st = await leggi("games/" + roomId);
  const mio = await t.page.evaluate(() => myColor);
  assert.equal(st.players[mio].uid, await t.page.evaluate(() => myUid), "posto con uid");
  console.log(`# Gioca subito: usata ${roomId} (${d.games && d.games[roomId] ? "stanza esistente, " + (d.games[roomId].phase || "?") : "stanza nuova"})`);
  for (const [k, h] of Object.entries(prima)) assert.equal(impronta(await leggi("games/" + k)), h, "una partita privata in corso è stata toccata");
  assert.deepEqual(errori, []);
});

test("partite private già in corso (posti senza uid): lo stesso telefono continua a scrivere; un altro telefono non prende il posto", LIMITE, async (t) => {
  const d = dati();
  await scrivi("", d);
  const inCorso = partitePrivateInCorso(d);
  if (!inCorso.length) return t.skip("nessuna partita privata in corso in questi dati");
  for (const [stanza, s] of inCorso) {
    const colore = Object.keys(s.players).find((c) => s.players[c] && !s.players[c].isBot);
    const posto = s.players[colore];
    const tel = await telefono("Stesso-" + colore);
    // lo stesso telefono = stesso token salvato in memoria (come chi ha giocato ieri)
    const scritto = await tel.page.evaluate(async ({ stanza, colore, token }) => {
      myRoomId = stanza; myColor = colore; myToken = token;
      try { await updateState(stanza, (st) => { postChatMessage(st, colore, "Ciao a tutti! 👋"); }); return "ok"; } catch (e) { return String(e && (e.code || e.message)); }
    }, { stanza, colore, token: posto.token });
    assert.equal(scritto, "ok", "il telefono che occupa il posto continua a giocare");
    const altro = await telefono("Altro-" + colore);
    altro.page.on("dialog", (x) => x.accept("ZZZZZZ"));
    await altro.page.evaluate(({ stanza, nome }) => recoverByName(stanza, nome, null), { stanza, nome: posto.name });
    await aspetta(1500);
    const dopo = (await leggi("games/" + stanza)).players[colore];
    assert.equal(dopo.token, posto.token, "il posto resta a chi c'era");
    console.log(`# partita privata in corso (${colore}, ${posto.uid ? "con" : "SENZA"} uid): stesso telefono ok · altro telefono NO`);
  }
  assert.deepEqual(errori, []);
});

test("classifica: le voci di adesso restano identiche e nessun telefono le cambia", LIMITE, async () => {
  const d = dati();
  await scrivi("", d);
  const t = await telefono("Curioso");
  const prima = impronta(await leggi("leaderboard"));
  const esiti = await t.page.evaluate(async (chiavi) => {
    const out = [];
    for (const k of chiavi) out.push(await db.ref("leaderboard/" + k + "/vittorie").set(99).then(() => "scritto", () => "negato"));
    return out;
  }, Object.keys(d.leaderboard || {}));
  assert.ok(esiti.every((e) => e === "negato"), "le voci di altri non si cambiano");
  assert.equal(impronta(await leggi("leaderboard")), prima);
});
