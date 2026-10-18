// Prova "dal vivo" con le regole ATTUALI (database.rules.json, quelle di oggi):
// le versioni nuove del gioco devono funzionare anche prima che si pubblichino regole nuove.
const test = require("node:test");
const assert = require("node:assert/strict");
const { preparaBanco, leggi, scrivi, aspetta, finché, LIMITE } = require("./e2e-banco");

const { telefono, errori } = preparaBanco("../../database.rules.json");

test("Gioca subito con 4 persone: ogni posto ha l'uid del proprio telefono", LIMITE, async () => {
  const nomi = ["Anna", "Bruno", "Carla", "Dario"];
  const tel = [];
  for (const [i, n] of nomi.entries()) {
    tel.push(await telefono(n, { giocatore: { id: "p-" + n.toLowerCase(), nome: n } }));
    await tel[i].page.evaluate(() => startMatchmaking());
    await aspetta(400);
  }
  const uids = [];
  for (const t of tel) uids.push(await finché(() => t.page.evaluate(() => myUid)));
  assert.equal(new Set(uids).size, 4, "ogni telefono deve avere un uid diverso");

  const stanza = await finché(async () => {
    const g = (await leggi("games")) || {};
    return Object.values(g).find((s) => s.players && Object.keys(s.players).length === 4);
  });
  const posti = Object.values(stanza.players);
  for (const [i, n] of nomi.entries()) {
    const p = posti.find((x) => x.name === n);
    assert.ok(p, `${n} deve essere seduto`);
    assert.equal(p.uid, uids[i], `il posto di ${n} deve avere l'uid del suo telefono`);
    assert.equal(p.playerId, "p-" + n.toLowerCase(), "il playerId della rubrica resta com'era");
  }
  assert.notEqual(stanza.phase, "lobby");
  // Con le regole di oggi profiles/ non è scrivibile: il salvataggio del profilo fallisce in silenzio.
  assert.equal(await leggi("profiles"), null);
  assert.deepEqual(errori, []);
  for (const t of tel) await t.ctx.close();
});

test("Gioca subito con i computer: i bot giocano, la rivincita riparte, la classifica conta", LIMITE, async () => {
  const t = await telefono("Elena", { giocatore: { id: "p-elena", nome: "Elena" } });
  await t.page.evaluate(() => startMatchmaking());
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId));
  await t.page.evaluate(() => mmFillWithBots("easy", null));
  const uid = await t.page.evaluate(() => myUid);
  assert.ok(uid);

  // Partita avviata, con l'uid sul posto della persona
  const st0 = await finché(async () => {
    const s = await leggi(`games/${roomId}`);
    return s && s.players && Object.keys(s.players).length === 4 && s.phase !== "lobby" ? s : null;
  });
  const mio = Object.values(st0.players).find((p) => !p.isBot);
  assert.equal(mio.uid, uid);
  assert.equal(Object.values(st0.players).filter((p) => p.isBot).length, 3);

  // La persona gioca da sola come farebbe un bot (scambio e mosse), i bot fanno il resto.
  await t.page.evaluate(() => {
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
  const mosse = await finché(async () => {
    const s = await leggi(`games/${roomId}`);
    const n = (s.log || []).filter((r) => / muove con | gioca il 7| entra in gioco | gioca un Jack/.test(r)).length;
    return n >= 8 ? n : null;
  }, 90000, 1000);
  assert.ok(mosse >= 8, "la partita deve andare avanti");

  // Fine partita simulata (solo nell'emulatore), poi rivincita come col pulsante.
  await t.page.evaluate(() => clearInterval(window.__autoGioca));
  await aspetta(1500);
  await t.page.evaluate(() => updateState(myRoomId, (s) => { s.phase = "finished"; s.winnerTeam = TEAM_OF[myColor]; }));
  const lb = await finché(async () => {
    const v = await leggi("leaderboard/p-elena");
    return v && v.partite ? v : null;
  });
  assert.equal(lb.partite, 1);
  assert.equal(lb.vinte, 1);

  await t.page.evaluate(() => startNewGame(document.createElement("button")));
  const dopo = await finché(async () => {
    const s = await leggi(`games/${roomId}`);
    return s && s.phase !== "finished" ? s : null;
  });
  assert.equal(Object.values(dopo.players).find((p) => !p.isBot).uid, uid, "dopo la rivincita il posto tiene l'uid");
  assert.equal(dopo.leaderboardClaimed || null, null, "il segno dell'accredito si azzera per la nuova partita");
  assert.deepEqual(errori, []);
  await t.ctx.close();
});

test("Con gli amici: il posto ha l'uid; 'Sono io' da un altro telefono lo passa al nuovo uid (comportamento di oggi)", LIMITE, async () => {
  const a = await telefono("Fabio");
  await a.page.evaluate(async () => {
    document.body.insertAdjacentHTML("beforeend", '<input id="name-input" value="Fabio">');
    myColor = "red";
    await claimRoomMode("AMICI1", "manual");
    await joinManualRoom("AMICI1");
  });
  const uidA = await a.page.evaluate(() => myUid);
  const s1 = await finché(async () => {
    const s = await leggi("games/AMICI1");
    return s && s.players && s.players.red ? s : null;
  });
  assert.equal(s1.players.red.uid, uidA);
  assert.equal(s1.players.red.name, "Fabio");

  const b = await telefono("Fabio-2");
  await b.page.evaluate(() => recoverByName("AMICI1", "Fabio", null));
  const uidB = await b.page.evaluate(() => myUid);
  assert.notEqual(uidA, uidB);
  const s2 = await finché(async () => {
    const s = await leggi("games/AMICI1");
    return s.players.red.uid === uidB ? s : null;
  });
  // Oggi chiunque può farlo: sarà il passo 5 a permetterlo solo se il titolare è offline.
  assert.equal(s2.players.red.name, "Fabio");
  assert.deepEqual(errori, []);
  await a.ctx.close();
  await b.ctx.close();
});

test("Se il login non è disponibile si gioca come prima (posto senza uid)", LIMITE, async () => {
  const t = await telefono("Gina", { senzaLogin: true, giocatore: { id: "p-gina", nome: "Gina" } });
  const prima = Date.now();
  await t.page.evaluate(() => startMatchmaking());
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId));
  assert.ok(Date.now() - prima < 8000, "l'attesa del login non deve bloccare l'ingresso");
  await t.page.evaluate(() => mmFillWithBots("hard", null));
  const s = await finché(async () => {
    const st = await leggi(`games/${roomId}`);
    return st && st.players && Object.keys(st.players).length === 4 ? st : null;
  });
  const mio = Object.values(s.players).find((p) => !p.isBot);
  assert.equal(mio.name, "Gina");
  assert.equal(mio.uid || null, null);
  assert.equal(await t.page.evaluate(() => myUid), null);
  assert.deepEqual(errori, []);
  await t.ctx.close();
});
