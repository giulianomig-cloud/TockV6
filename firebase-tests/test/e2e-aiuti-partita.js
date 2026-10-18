// Aiuti comuni alle prove "dal vivo": far giocare da solo un telefono (anche la v6.16).
async function autoGioca(page) {
  await page.evaluate(() => {
    window.__autoGioca = setInterval(() => {
      const st = currentState;
      if (!st || moveInFlight) return;
      if (st.phase === "exchanging" && st.pendingExchange && !st.pendingExchange[myColor] && st.hands[myColor].length) {
        updateState(myRoomId, (s) => { if (s.phase === "exchanging" && !s.pendingExchange[myColor]) submitExchangeCard(s, myColor, s.hands[myColor][0]); }).catch(() => {});
        return;
      }
      if (st.phase === "playing" && st.turnColor === myColor) {
        const a = activeColorFor(st, myColor);
        const c = a ? botChooseCardAndMove(st, a, myColor) : null;
        if (!c) return;
        if (c.burn) updateState(myRoomId, (s) => { if (s.turnColor === myColor) { burnOneCard(s, myColor, c.card); advanceTurn(s); } }).catch(() => {});
        else playMove(a, c.card, c.move);
      }
    }, 500);
  });
}
const fermaAutoGioca = (page) => page.evaluate(() => clearInterval(window.__autoGioca));
const mosseNelRegistro = (s) => ((s && s.log) || []).filter((r) => / muove con | gioca il 7| entra in gioco | gioca un Jack/.test(r)).length;
async function sedutoConAmici(page, nome, colore, stanza) {
  await page.evaluate(async ({ nome, colore, stanza }) => {
    document.body.insertAdjacentHTML("beforeend", `<input id="name-input" value="${nome}">`);
    myColor = colore;
    await claimRoomMode(stanza, "manual");
    await joinManualRoom(stanza);
  }, { nome, colore, stanza });
}
// Come una persona davanti a "La mossa non è stata salvata… Riprova": riprova (fino a 4 volte).
// Serve subito dopo l'inizio della partita: il gioco stacca e riattacca l'ascolto della stanza e per un
// attimo Firebase non ha la stanza in memoria (difetto già presente nella v6.16, vedi PROPOSTE-DATI.md).
async function conRiprova(fn) {
  for (let i = 1; ; i++) {
    try { return await fn(); } catch (e) {
      if (i >= 4 || !/non è stata salvata/.test(String(e && e.message))) throw e;
      await new Promise((r) => setTimeout(r, 700));
    }
  }
}
module.exports = { autoGioca, fermaAutoGioca, mosseNelRegistro, sedutoConAmici, conRiprova };
