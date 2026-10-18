// Prova "dal vivo" con le regole ATTUALI (database.rules.json, quelle di oggi):
// le versioni nuove del gioco devono funzionare anche prima che si pubblichino regole nuove.
const test = require("node:test");
const assert = require("node:assert/strict");
const { preparaBanco, leggi, scrivi, aspetta, finché, LIMITE } = require("./e2e-banco");
const { conRiprova } = require("./e2e-aiuti-partita");

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

test("Gioca subito con i computer: i bot giocano, la rivincita riparte (classifica: serve almeno la transizione)", LIMITE, async () => {
  const t = await telefono("Elena", { giocatore: { id: "p-elena", nome: "Elena" } });
  await t.page.evaluate(() => startMatchmaking());
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId));
  await t.page.click(".mm-bot-btns button >> nth=0"); // "🤖 Normale", come una persona: compare solo a stanza ricevuta
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
  await conRiprova(() => t.page.evaluate(() => updateState(myRoomId, (s) => { s.phase = "finished"; s.winnerTeam = TEAM_OF[myColor]; })));
  // Dalla v6.19 ognuno registra il proprio risultato in leaderboard/<uid> + credited/...:
  // con le regole di OGGI quei percorsi sono chiusi, quindi la classifica non cambia (e il gioco
  // non si blocca). Per questo vanno pubblicate almeno le regole di transizione insieme al gioco nuovo.
  await aspetta(3000);
  assert.equal(await leggi("leaderboard"), null);
  assert.equal(await leggi("credited"), null);

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

test("Con gli amici: il posto ha l'uid; 'Sono io' da un altro telefono chiede il codice di rientro", LIMITE, async () => {
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
  // Con le regole di OGGI il codice di rientro non si può salvare (seatKeys/ è chiuso):
  // niente codice nelle Impostazioni e niente "Sono io" da un altro telefono finché non si
  // pubblicano almeno le regole di transizione. Il posto non passa a chi non ha il codice.
  await aspetta(1500);
  assert.equal(await a.page.evaluate(() => mySeatKey), null);
  const b = await telefono("Fabio-2");
  let chiesto = false;
  b.page.on("dialog", (d) => { chiesto = true; d.accept("ABCDEF"); });
  await b.page.evaluate(() => recoverByName("AMICI1", "Fabio", null));
  await aspetta(1500);
  assert.ok(chiesto, "il codice di rientro viene chiesto");
  assert.equal((await leggi("games/AMICI1")).players.red.uid, uidA, "il posto resta a Fabio");
  assert.deepEqual(errori, []);
});

test("Se il login non è disponibile si gioca come prima (posto senza uid)", LIMITE, async () => {
  const t = await telefono("Gina", { senzaLogin: true, giocatore: { id: "p-gina", nome: "Gina" } });
  const prima = Date.now();
  await t.page.evaluate(() => startMatchmaking());
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId));
  assert.ok(Date.now() - prima < 8000, "l'attesa del login non deve bloccare l'ingresso");
  await t.page.click(".mm-bot-btns button >> nth=1"); // "🤖 Difficile"
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

test("Rete di sicurezza delle prove: il database e il login VERI non sono raggiungibili dal browser di prova", LIMITE, async () => {
  const t = await telefono("Controllo");
  const esiti = await t.page.evaluate(async () => {
    const prova = async (u) => { try { await fetch(u, { mode: "no-cors" }); return "raggiunto"; } catch (e) { return "bloccato"; } };
    const ws = await new Promise((res) => {
      try {
        const s = new WebSocket("wss://tock-v6-default-rtdb.europe-west1.firebasedatabase.app/.ws?v=5");
        s.onopen = () => res("raggiunto");
        s.onerror = s.onclose = () => res("bloccato");
        setTimeout(() => res("bloccato"), 5000);
      } catch (e) { res("bloccato"); }
    });
    return {
      db: await prova("https://tock-v6-default-rtdb.europe-west1.firebasedatabase.app/.json"),
      login: await prova("https://identitytoolkit.googleapis.com/v1/accounts:signUp"),
      ws,
    };
  });
  assert.deepEqual(esiti, { db: "bloccato", login: "bloccato", ws: "bloccato" });
});
