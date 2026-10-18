// Regole DEFINITIVE: la versione VECCHIA (v6.16, senza login) non può più scrivere nulla.
// Per questo le definitive si pubblicano solo quando tutti hanno la v6.20. Solo emulatore.
const test = require("node:test");
const assert = require("node:assert/strict");
const { preparaBanco, leggi, scrivi, aspetta, finché, LIMITE } = require("./e2e-banco");

const { telefono } = preparaBanco("../regole/proposte.json");

test("v6.16 con le regole definitive: non crea stanze, non entra, non tocca la classifica", LIMITE, async () => {
  await scrivi("leaderboard/p-ugo", { nome: "Ugo", vittorie: 3, partite: 5, vinte: 3 });
  const t = await telefono("Ugo-v616", { vecchia: true, giocatore: { id: "p-ugo", nome: "Ugo" } });
  const esito = await t.page.evaluate(async () => {
    try { await claimRoomMode("AMICI3", "manual"); return "scritto"; } catch (e) { return String(e && e.message); }
  });
  assert.match(esito, /permission_denied/i);
  await t.page.evaluate(() => { startMatchmaking(); });
  await aspetta(5000);
  assert.equal(await leggi("games"), null, "nessuna stanza creata dalla v6.16");
  assert.deepEqual(await leggi("leaderboard/p-ugo"), { nome: "Ugo", vittorie: 3, partite: 5, vinte: 3 });
  // la pagina resta viva (nessun blocco), e la classifica si legge ancora
  assert.equal(await t.page.evaluate(() => APP_VERSION), "v6.16");
});
