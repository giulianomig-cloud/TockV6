// R7 — con le regole 5B e l'arbitro acceso, le stanze AUTO "di prima" rimaste in sala d'attesa non devono bloccare
// "Gioca subito". Forme prese dai dati veri: AUTO-1 (attesa bloccata, coppie già sorteggiate, nessun posto) e AUTO-2
// (un nome in attesa da giorni). Solo emulatore.
const test = require("node:test");
const assert = require("node:assert/strict");
const { preparaBanco, leggi, scrivi, finché, LIMITE } = require("../test/e2e-banco");
const { conTelefono, senzaArbitro, senzaRecupero } = require("./aiuti");
const { datiFinti } = require("../fase12/dati-finti");

const SALTA = senzaArbitro();
const SALTA_RECUPERO = SALTA || senzaRecupero();
const { telefono, errori } = preparaBanco("../regole/arbitro.json");
const { erroriConsole, apriConArbitro } = conTelefono(telefono);
const GIORNO = 24 * 3600 * 1000;

const forme = {
  "AUTO-1 bloccata (coppie sorteggiate, nessun posto)": { salta: SALTA, stanze: () => ({ "AUTO-1": datiFinti().games["AUTO-1"] }) },
  "AUTO-1 con un nome in attesa da giorni (v6.24)": { salta: SALTA_RECUPERO, stanze: () => ({
    "AUTO-1": { roomMode: "draw", phase: "lobby", gameId: "vecchia", dealerColor: "red",
      draft: { players: { "tok-fantasma": "Fantasma" }, order: ["tok-fantasma"], seen: { "tok-fantasma": Date.now() - 3 * GIORNO } } },
  }) },
};

for (const [nome, { salta, stanze }] of Object.entries(forme)) {
  test(`Gioca subito con 5B: ${nome} → si recupera e la partita parte col server`, { ...LIMITE, skip: salta }, async () => {
    await scrivi("config/arbitro", true);
    for (const [k, v] of Object.entries(stanze())) await scrivi("games/" + k, v);
    const t = await apriConArbitro("Ugo");
    await t.page.evaluate(() => { localStorage.setItem("tock-player", JSON.stringify({ id: null, nome: "Ugo" })); startMatchmaking(); });
    const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId), 30000);
    await t.page.click(".mm-bot-btns button >> nth=0");
    await finché(async () => { const s = await leggi("arbitro/" + roomId + "/stato"); return s && s.phase === "exchanging"; }, 45000);
    const st = await leggi("games/" + roomId);
    assert.equal(st.arbitro, true);
    // la stanza di prima non resta bloccata: è stata recuperata (oppure non era in mezzo)
    const a1 = await leggi("games/AUTO-1");
    assert.equal(a1.arbitro, true, "AUTO-1 recuperata con l'arbitro");
    assert.deepEqual(errori, []);
    assert.deepEqual(erroriConsole.splice(0), []);
  });
}
