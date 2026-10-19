// Aiuti comuni alle prove dell'arbitro (gioco vero in Chromium + Cloud Function nell'emulatore).
const { leggi, finché } = require("../test/e2e-banco");
const { sedutoConAmici } = require("../test/e2e-aiuti-partita");

// Un telefono che gioca da solo come una persona: scambio, mosse legali (calcolate sul SUO stato, dove le carte
// degli altri sono coperte) e, per velocità, fa muovere anche i computer quando tocca a loro.
async function giocaDaSolo(page) {
  await page.evaluate(() => {
    let occupato = false;
    window.__gioca = setInterval(async () => {
      const st = currentState;
      if (occupato || !st || moveInFlight) return;
      occupato = true;
      try {
        if (st.phase === "exchanging") {
          if (!st.pendingExchange[myColor] && st.hands[myColor].length) await sendExchangeCard(st.hands[myColor][0]);
          else if (COLORS.some((c) => st.players[c].isBot && !st.pendingExchange[c])) await chiamaArbitro("bot");
        } else if (st.phase === "playing" && st.players[st.turnColor] && st.players[st.turnColor].isBot) {
          await chiamaArbitro("bot");
        } else if (st.phase === "playing" && st.turnColor === myColor) {
          const attivo = activeColorFor(st, myColor);
          let fatto = false;
          for (const carta of st.hands[myColor]) {
            const opz = legalMovesForCard(st, attivo, carta);
            const semplice = opz.find((o) => o.type === "enter" || o.type === "move");
            if (semplice) { await chiamaArbitroMossa("mossa", { carta, mossa: semplice }); fatto = true; break; }
            if (opz.some((o) => o.type === "seven")) {
              const prove = [];
              for (let i = 0; i < 4; i++) {
                prove.push([{ pawnIndex: i, steps: 7 }]);
                for (let j = 0; j < 4; j++) for (let k = 1; k < 7; k++) if (i !== j) prove.push([{ pawnIndex: i, steps: k }, { pawnIndex: j, steps: 7 - k }]);
              }
              const d = prove.find((x) => sevenValidateDistribution(st, attivo, x));
              if (d) { await chiamaArbitroMossa("mossa", { carta, mossa: { type: "seven", distribution: d } }); fatto = true; break; }
            }
            if (opz.some((o) => o.type === "jack")) {
              const t = jackableTargets(st);
              const mia = t.find((p) => p.color === attivo);
              const altra = mia && t.find((p) => !(p.color === mia.color && p.pawnIndex === mia.pawnIndex));
              if (mia && altra) {
                await chiamaArbitroMossa("mossa", { carta, mossa: { type: "jack", a: { color: mia.color, pawnIndex: mia.pawnIndex }, b: { color: altra.color, pawnIndex: altra.pawnIndex } } });
                fatto = true; break;
              }
            }
          }
          if (!fatto) {
            const brucia = st.hands[myColor].find((c) => legalMovesForCard(st, attivo, c).length === 0) || st.hands[myColor][0];
            await chiamaArbitroMossa("brucia", { carta: brucia });
          }
        }
      } catch (e) {
        window.__erroriGioco = (window.__erroriGioco || []).concat(String(e && e.message));
      } finally {
        occupato = false;
      }
    }, 250);
  });
}
const fermaGioco = (page) => page.evaluate(() => clearInterval(window.__gioca));

// Telefoni con l'arbitro acceso, legati al banco di prova del file di test.
function conTelefono(telefono) {
  // Errori della pagina scritti in console (es. disegni rotti): non devono essercene.
  const erroriConsole = [];
  const ATTESI = /Failed to load resource|updateState error|FirebaseError|bot: |avvia|aggiorna|permission_denied/i;
  async function apriConArbitro(nome) {
    const t = await telefono(nome);
    t.page.on("console", (m) => { if (m.type() === "error" && !ATTESI.test(m.text())) erroriConsole.push(`[${nome}] ${m.text().slice(0, 200)}`); });
    await t.page.waitForFunction(() => ARBITRO_ATTIVO === true && !!myUid);
    return t;
  }

  async function stanzaConDue(codice) {
    const a = await apriConArbitro("Anna");
    await sedutoConAmici(a.page, "Anna", "red", codice);
    const b = await apriConArbitro("Bruno");
    await sedutoConAmici(b.page, "Bruno", "green", codice);
    await a.page.evaluate(async () => {
      await assignBotToColor(myRoomId, "yellow", () => {}, "easy");
      await assignBotToColor(myRoomId, "blue", () => {}, "easy");
    });
    await finché(async () => { const s = await leggi("games/" + codice); return s && s.players && Object.keys(s.players).length === 4; });
    return { a, b };
  }
  return { erroriConsole, apriConArbitro, stanzaConDue };
}

// Stato del server a un passo dalla vittoria della squadra di `colore` (il compagno ha già finito): la mossa
// vincente la manda poi il telefono di quel colore. Si usa il motore del server per trovarla.
const path = require("node:path");
const M = require(path.join(__dirname, "../../functions/motore-generato"));
function posizioneVincente(s, colore = "red") {
  const compagno = M.PARTNER_OF[colore];
  let scelta = null;
  for (const casa of [[1001, 1002, 1003], [1000, 1001, 1002]]) {
    for (let pos = 0; pos < 64 && !scelta; pos++) {
      const prova = M.normalizeState(JSON.parse(JSON.stringify(s)));
      prova.phase = "playing";
      prova.turnColor = colore;
      prova.pendingExchange = {};
      prova.hands[colore] = ["2-hearts", "3-hearts", "5-hearts", "6-hearts", "8-hearts"];
      prova.pawns = { red: [-1, -1, -1, -1], green: [-1, -1, -1, -1], yellow: [-1, -1, -1, -1], blue: [-1, -1, -1, -1] };
      prova.pawns[colore] = [...casa, pos];
      prova.pawns[compagno] = [1000, 1001, 1002, 1003];
      for (const carta of prova.hands[colore]) {
        const m = M.legalMovesForCard(prova, colore, carta).find((o) => o.type === "move" && o.path[o.path.length - 1] >= 1000);
        if (m) { scelta = { stato: prova, carta, mossa: m }; break; }
      }
    }
  }
  return scelta;
}

module.exports = { giocaDaSolo, fermaGioco, conTelefono, posizioneVincente };
