// Fase 5B dal vivo: il gioco vero (index.html) in Chromium con DUE telefoni, l'arbitro (Cloud Function) e le
// regole con l'arbitro, tutto sull'emulatore (npm run test-arbitro). Mai Firebase vero.
const test = require("node:test");
const assert = require("node:assert/strict");
const { preparaBanco, leggi, scrivi, aspetta, finché, LIMITE } = require("../test/e2e-banco");

const { telefono, errori } = preparaBanco("../regole/arbitro.json");

const { giocaDaSolo, fermaGioco, conTelefono, posizioneVincente } = require("./aiuti");
const { erroriConsole, apriConArbitro, stanzaConDue } = conTelefono(telefono);

test("due telefoni con l'arbitro: carte segrete, mosse controllate dal server, imbrogli rifiutati", LIMITE, async () => {
  await scrivi("config/arbitro", true);
  const { a, b } = await stanzaConDue("ARB1");
  const stanza = await leggi("games/ARB1");
  assert.equal(stanza.arbitro, true, "la stanza nuova usa l'arbitro");
  assert.ok(stanza.sessione);

  await a.page.evaluate(() => startGame());
  await finché(() => a.page.evaluate(() => currentState && currentState.phase === "exchanging" && currentState.hands[myColor].length === 5));
  await finché(() => b.page.evaluate(() => currentState && currentState.phase === "exchanging" && currentState.hands[myColor].length === 5));

  const uidA = await a.page.evaluate(() => myUid);
  const uidB = await b.page.evaluate(() => myUid);
  const server = await leggi("arbitro/ARB1/stato");
  // A vede le SUE carte vere e quelle degli altri coperte
  const vistaA = await a.page.evaluate(() => ({ mie: currentState.hands.red, bruno: currentState.hands.green, mazzo: currentState.deck.length }));
  assert.deepEqual(vistaA.mie, server.hands.red);
  assert.deepEqual(vistaA.bruno, ["??", "??", "??", "??", "??"]);
  assert.equal(vistaA.mazzo, 32);
  // …e non può leggerle in nessun altro modo
  const letture = await a.page.evaluate(async (uidB) => {
    const prova = (p) => db.ref(p).get().then(() => "letto", (e) => String(e && e.message).includes("ermission") ? "negato" : "errore: " + e.message);
    return {
      maniBruno: await prova("arbitro/ARB1/mani/" + uidB),
      stato: await prova("arbitro/ARB1/stato"),
      tutto: await prova("arbitro/ARB1"),
    };
  }, uidB);
  assert.deepEqual(letture, { maniBruno: "negato", stato: "negato", tutto: "negato" });
  const pub = JSON.stringify(await leggi("arbitro/ARB1/pub"));
  const lobby = JSON.stringify(await leggi("games/ARB1"));
  for (const carta of [...server.hands.green, ...server.hands.red, ...server.deck]) {
    assert.ok(!lobby.includes('"' + carta + '"'), "carta nella stanza: " + carta);
  }
  assert.ok(!pub.includes('"hands"') && !pub.includes('"deck"'));

  // Imbrogli
  const imbrogli = await a.page.evaluate(async (uidA) => {
    const esito = (p) => p.then(() => "accettato", (e) => String((e && (e.code || e.message)) || e));
    const nonMia = "??";
    return {
      cartaNonMia: await esito(chiamaArbitro("scambio", { carta: "K-spades-falsa" })),
      faseFinita: await esito(db.ref("games/ARB1/phase").set("finished")),
      vincitore: await esito(db.ref("games/ARB1/winnerTeam").set("A")),
      classifica: await esito(db.ref("leaderboard/" + uidA).set({ nome: "Anna", partite: 9, vinte: 9, vittorie: 9, ultimaStanza: "ARB1", ultimaPartita: "x" })),
      pubblica: await esito(db.ref("arbitro/ARB1/pub/winnerTeam").set("A")),
      perTelefono: await esito(updateState(myRoomId, (s) => { s.pawns.red = [1000, 1001, 1002, 1003]; })),
      niente: nonMia,
    };
  }, uidA);
  assert.match(imbrogli.cartaNonMia, /functions\/invalid-argument|scambio/i);
  assert.match(imbrogli.faseFinita, /PERMISSION_DENIED|permission/i);
  assert.match(imbrogli.vincitore, /PERMISSION_DENIED|permission/i);
  assert.match(imbrogli.classifica, /PERMISSION_DENIED|permission/i);
  assert.match(imbrogli.pubblica, /PERMISSION_DENIED|permission/i);
  assert.equal(imbrogli.perTelefono, "ARBITRO", "il telefono non può cambiare la partita da solo");
  assert.equal((await leggi("arbitro/ARB1/stato")).pawns.red.join(","), "-1,-1,-1,-1");

  // Si gioca davvero: scambio + mosse di persone e computer, tutte passando dal server
  await giocaDaSolo(a.page);
  await giocaDaSolo(b.page);
  await finché(async () => ((await leggi("arbitro/ARB1/pub")).log || []).filter((r) => / muove con | entra in gioco /.test(r)).length >= 12, 120000, 1000);
  await fermaGioco(a.page);
  await fermaGioco(b.page);
  await aspetta(1500);
  // Fuori turno: il server rifiuta
  const fuoriTurno = await (async () => {
    const st = await leggi("arbitro/ARB1/stato");
    const chi = st.turnColor === "red" ? b : a; // il telefono a cui NON tocca
    const colore = st.turnColor === "red" ? "green" : "red";
    const carta = (st.hands[colore] || [])[0];
    return chi.page.evaluate((carta) => chiamaArbitro("mossa", { carta, mossa: { type: "enter", pawnIndex: 0 } }).then(() => "accettato", (e) => e.code + " " + e.message), carta);
  })();
  assert.match(fuoriTurno, /failed-precondition|turno|si gioca/i);
  // la stanza riflette la partita (per "Gioca subito"), i dati restano coerenti fra i due telefoni
  const [pa, pb, ps] = await Promise.all([
    a.page.evaluate(() => JSON.stringify(currentState.pawns)),
    b.page.evaluate(() => JSON.stringify(currentState.pawns)),
    leggi("arbitro/ARB1/stato").then((s) => JSON.stringify(s.pawns)),
  ]);
  assert.equal(pa, ps);
  assert.equal(pb, ps);
  assert.equal((await leggi("games/ARB1")).phase, (await leggi("arbitro/ARB1/pub")).phase);
  const erroriGioco = await a.page.evaluate(() => window.__erroriGioco || []);
  assert.deepEqual(erroriGioco.filter((e) => !/turno|non è il momento|già scelto/i.test(e)), [], "errori durante la partita");
  assert.deepEqual(errori, []);
  assert.deepEqual(erroriConsole.splice(0), []);
});

// Fine partita: si prepara (come amministratore dell'emulatore) una partita a un passo dalla vittoria della
// squadra di Anna; la mossa vincente la manda Anna dal telefono e la classifica la scrive SOLO il server.
test("fine partita: classifica scritta dal server una volta sola, poi rivincita", LIMITE, async () => {
  await scrivi("config/arbitro", true);
  await scrivi("leaderboard/-vecchiaVoce", { nome: "Vecchia", partite: 5, vinte: 3, vittorie: 3 });
  const { a, b } = await stanzaConDue("ARB2");
  await a.page.evaluate(() => startGame());
  await finché(async () => { const s = await leggi("arbitro/ARB2/stato"); return s && s.phase === "exchanging" ? s : null; });
  const s = await leggi("arbitro/ARB2/stato");
  // Anna (rosso) ha 3 pedine a casa e una a un passo; il compagno (giallo) ha già finito.
  const scelta = posizioneVincente(s);
  assert.ok(scelta, "posizione vincente trovata");
  await scrivi("arbitro/ARB2/stato", { ...scelta.stato, rev: 99 });
  const uidA = await a.page.evaluate(() => myUid);
  const uidB = await b.page.evaluate(() => myUid);
  const ris = await a.page.evaluate(({ carta, mossa }) => chiamaArbitroMossa("mossa", { carta, mossa }), { carta: scelta.carta, mossa: scelta.mossa });
  assert.equal(ris.cambiato, true);
  await finché(() => a.page.evaluate(() => currentState && currentState.phase === "finished"));
  await finché(() => b.page.evaluate(() => currentState && currentState.phase === "finished"));
  const gameId = (await leggi("arbitro/ARB2/stato")).gameId;
  const lbA = await finché(() => leggi("leaderboard/" + uidA));
  const lbB = await finché(() => leggi("leaderboard/" + uidB));
  assert.deepEqual({ p: lbA.partite, v: lbA.vinte, w: lbA.vittorie, n: lbA.nome }, { p: 1, v: 1, w: 1, n: "Anna" });
  assert.deepEqual({ p: lbB.partite, v: lbB.vinte, w: lbB.vittorie }, { p: 1, v: 0, w: 0 });
  assert.equal((await leggi("credited/ARB2/" + gameId))[uidA], true);
  assert.equal(await leggi("stats/gamesFinished"), 1);
  assert.deepEqual(await leggi("leaderboard/-vecchiaVoce"), { nome: "Vecchia", partite: 5, vinte: 3, vittorie: 3 }, "voci vecchie intatte");
  assert.equal((await leggi("games/ARB2")).winnerTeam, "A");
  // Anche il vecchio modo (il telefono che si registra da solo) è chiuso
  const vecchioModo = await a.page.evaluate(() => creditMyResult(currentState).then(() => "ok"));
  assert.equal(vecchioModo, "ok");
  assert.equal((await leggi("leaderboard/" + uidA)).partite, 1, "nessun doppio conteggio");
  // Rivincita: nuova partita sul server, la classifica non cambia
  await b.page.evaluate(() => startNewGame(document.createElement("button")));
  await finché(async () => { const st = await leggi("arbitro/ARB2/stato"); return st.phase === "exchanging" && st.gameId !== gameId; });
  await finché(() => a.page.evaluate(() => currentState.phase === "exchanging" && currentState.hands[myColor].length === 5));
  assert.equal((await leggi("leaderboard/" + uidA)).partite, 1);
  assert.deepEqual(errori, []);
  assert.deepEqual(erroriConsole.splice(0), []);
});

test("'Sono io' da un altro telefono (codice di rientro): le carte passano al nuovo telefono, il vecchio non le vede più", LIMITE, async () => {
  await scrivi("config/arbitro", true);
  const { a } = await stanzaConDue("ARB3");
  await a.page.evaluate(() => startGame());
  await finché(() => a.page.evaluate(() => currentState && currentState.phase === "exchanging" && currentState.hands[myColor].length === 5));
  const chiave = await finché(() => a.page.evaluate(() => mySeatKey));
  const uidVecchio = await a.page.evaluate(() => myUid);
  const a2 = await apriConArbitro("Anna-2");
  a2.page.on("dialog", (d) => d.accept(chiave));
  await a2.page.evaluate(() => recoverByName("ARB3", "Anna", null));
  const uidNuovo = await a2.page.evaluate(() => myUid);
  await finché(async () => (await leggi("games/ARB3")).players.red.uid === uidNuovo);
  const server = await leggi("arbitro/ARB3/stato");
  const mie = await finché(() => a2.page.evaluate(() => currentState && myColor === "red" && currentState.hands.red.length === 5 && currentState.hands.red[0] !== "??" ? currentState.hands.red : null), 20000);
  assert.deepEqual(mie, server.hands.red);
  const maniServer = await leggi("arbitro/ARB3/mani");
  assert.ok(maniServer[uidNuovo] && !maniServer[uidVecchio], "le carte sono pubblicate solo per il posto attuale");
  const vecchio = await a.page.evaluate((u) => db.ref("arbitro/ARB3/mani/" + u).get().then((s) => s.val(), (e) => "negato"), uidNuovo);
  assert.equal(vecchio, "negato");
  // il telefono nuovo gioca davvero
  await a2.page.evaluate(() => sendExchangeCard(currentState.hands.red[0]));
  await finché(async () => (await leggi("arbitro/ARB3/pub")).scambioFatto.red === true);
  assert.deepEqual(errori, []);
  assert.deepEqual(erroriConsole.splice(0), []);
});

test("Gioca subito con l'arbitro: coi computer la partita la fa partire il server", LIMITE, async () => {
  await scrivi("config/arbitro", true);
  const t = await apriConArbitro("Ugo");
  await t.page.evaluate(() => { localStorage.setItem("tock-player", JSON.stringify({ id: null, nome: "Ugo" })); startMatchmaking(); });
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId));
  await t.page.click(".mm-bot-btns button >> nth=0"); // "🤖 Normale"
  await finché(async () => { const s = await leggi("arbitro/" + roomId + "/stato"); return s && s.phase === "exchanging"; }, 30000);
  const stanza = await leggi("games/" + roomId);
  assert.equal(stanza.arbitro, true);
  assert.equal(stanza.phase, "exchanging", "la stanza riflette la partita del server");
  await finché(() => t.page.evaluate(() => currentState && currentState.phase === "exchanging" && currentState.hands[myColor].length === 5));
  // la persona dà la sua carta; lo scambio e le mosse dei computer li fa partire l'app da sola (come sul telefono)
  await t.page.evaluate(() => sendExchangeCard(currentState.hands[myColor][0]));
  await finché(async () => (await leggi("arbitro/" + roomId + "/pub")).phase === "playing", 30000);
  await finché(async () => {
    const pub = await leggi("arbitro/" + roomId + "/pub");
    const seat = (await leggi("games/" + roomId)).players;
    return pub.turnColor && !seat[pub.turnColor].isBot ? true : (pub.log || []).some((r) => / muove con | entra in gioco | brucia/.test(r));
  }, 30000, 500);
  await giocaDaSolo(t.page);
  await finché(async () => ((await leggi("arbitro/" + roomId + "/pub")).log || []).length >= 8, 60000, 1000);
  await fermaGioco(t.page);
  assert.deepEqual(errori, []);
  assert.deepEqual(erroriConsole.splice(0), []);
});

test("arbitro spento (config/arbitro assente): le stanze nuove sono quelle di sempre", LIMITE, async () => {
  // Con le regole dell'arbitro una stanza "di sempre" non si può creare: è il motivo per cui arbitro.json si
  // pubblica SOLO dopo aver acceso config/arbitro. Qui si controlla il comportamento del telefono.
  const t = await telefono("Senza");
  await aspetta(1500);
  assert.equal(await t.page.evaluate(() => ARBITRO_ATTIVO), false);
  const st = await t.page.evaluate(() => preparaStanzaNuova(newGameState({}, "manual")));
  assert.equal(st.arbitro, undefined);
  assert.equal(st.sessione, undefined);
});
