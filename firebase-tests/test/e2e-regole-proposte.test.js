// Prova "dal vivo" con le regole PROPOSTE (regole/proposte.json), solo sull'emulatore.
const test = require("node:test");
const assert = require("node:assert/strict");
const { preparaBanco, leggi, scrivi, aspetta, finché, LIMITE } = require("./e2e-banco");

const { telefono, errori } = preparaBanco("../regole/proposte.json");

// Dati "vecchi" come quelli di oggi in produzione: non devono cambiare.
const VECCHI = {
  players: { "-vecchioAnna": { nome: "Anna", creatoIl: 1 } },
  leaderboard: { "-vecchioAnna": { nome: "Anna", vittorie: 12, partite: 20, vinte: 12 } },
};

test("Passo 3: ogni telefono ha il suo profilo; stesso nome = due profili; i dati vecchi restano intatti", LIMITE, async () => {
  await scrivi("players", VECCHI.players);
  await scrivi("leaderboard", VECCHI.leaderboard);
  const a = await telefono("Anna-1", { giocatore: { id: "-vecchioAnna", nome: "Anna" } });
  const b = await telefono("Anna-2", { giocatore: { id: "-vecchioAnna", nome: "Anna" } });
  await a.page.evaluate(() => startMatchmaking());
  await b.page.evaluate(() => startMatchmaking());
  const uidA = await finché(() => a.page.evaluate(() => myUid));
  const uidB = await finché(() => b.page.evaluate(() => myUid));
  assert.notEqual(uidA, uidB);
  const prof = await finché(async () => {
    const p = await leggi("profiles");
    return p && p[uidA] && p[uidB] ? p : null;
  });
  assert.equal(prof[uidA].nome, "Anna");
  assert.equal(prof[uidB].nome, "Anna");
  assert.ok(prof[uidA].creatoIl > 0 && prof[uidA].aggiornatoIl > 0);

  // cambio nome: si aggiorna solo il proprio profilo
  await a.page.evaluate(() => saveMyProfile("Anna Rossi"));
  const p2 = await finché(async () => {
    const p = await leggi("profiles");
    return p[uidA].nome === "Anna Rossi" ? p : null;
  });
  assert.equal(p2[uidB].nome, "Anna");
  assert.equal(p2[uidA].creatoIl, prof[uidA].creatoIl, "la data di creazione non cambia");

  assert.deepEqual(await leggi("players/-vecchioAnna"), VECCHI.players["-vecchioAnna"]);
  assert.deepEqual(await leggi("leaderboard/-vecchioAnna"), VECCHI.leaderboard["-vecchioAnna"]);
  assert.deepEqual(errori, []);
});

async function partitaColComputer(t) {
  await t.page.evaluate(() => startMatchmaking());
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId));
  await t.page.evaluate(() => mmFillWithBots("easy", null));
  await finché(async () => {
    const s = await leggi(`games/${roomId}`);
    return s && s.players && Object.keys(s.players).length === 4 && s.phase !== "lobby";
  });
  await finché(() => t.page.evaluate(() => !!(currentState && myColor)));
  return roomId;
}
const finisci = (t, vinco) =>
  t.page.evaluate((v) => updateState(myRoomId, (s) => {
    s.phase = "finished";
    s.winnerTeam = v ? TEAM_OF[myColor] : TEAM_OF[myColor] === "A" ? "B" : "A";
  }), vinco);

test("Passo 4: a fine partita ognuno registra il PROPRIO risultato, una volta sola; rivincita = partita nuova", LIMITE, async () => {
  await scrivi("leaderboard", VECCHI.leaderboard);
  const t = await telefono("Elena", { giocatore: { id: "p-elena", nome: "Elena" } });
  const roomId = await partitaColComputer(t);
  const uid = await t.page.evaluate(() => myUid);
  const g1 = (await leggi(`games/${roomId}`)).gameId;
  assert.ok(g1, "la partita ha un identificativo");

  await finisci(t, true);
  const v1 = await finché(async () => { const v = await leggi(`leaderboard/${uid}`); return v && v.partite === 1 ? v : null; });
  assert.deepEqual({ partite: v1.partite, vinte: v1.vinte, vittorie: v1.vittorie, nome: v1.nome }, { partite: 1, vinte: 1, vittorie: 1, nome: "Elena" });
  assert.equal(await leggi(`credited/${roomId}/${g1}/${uid}`), true);
  assert.equal(await leggi("leaderboard/p-elena"), null, "niente più accrediti sulla chiave della rubrica");

  // stesso risultato registrato di nuovo (come riaprendo la partita finita): nessun doppio conteggio
  await t.page.evaluate(() => { _leaderboardClaimAttempted = false; return creditMyResult(currentState); });
  await aspetta(1500);
  assert.equal((await leggi(`leaderboard/${uid}`)).partite, 1);

  // rivincita: nuovo identificativo, si perde → partite 2, vinte resta 1
  await t.page.evaluate(() => startNewGame(document.createElement("button")));
  const g2 = await finché(async () => { const s = await leggi(`games/${roomId}`); return s.phase !== "finished" && s.gameId !== g1 ? s.gameId : null; });
  await finisci(t, false);
  const v2 = await finché(async () => { const v = await leggi(`leaderboard/${uid}`); return v && v.partite === 2 ? v : null; });
  assert.equal(v2.vinte, 1);
  assert.equal(v2.ultimaPartita, g2);

  assert.deepEqual(await leggi("leaderboard/-vecchioAnna"), VECCHI.leaderboard["-vecchioAnna"], "voce vecchia intatta");
  assert.deepEqual(errori, []);
});

// ---------------- Passo 5: posti protetti, con le regole definitive attive ----------------

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
const mosseNelRegistro = (s) => (s.log || []).filter((r) => / muove con | gioca il 7| entra in gioco | gioca un Jack/.test(r)).length;

test("Passo 5: Gioca subito a 4 persone con le regole definitive (posti creati per tutti)", LIMITE, async () => {
  const nomi = ["Anna", "Bruno", "Carla", "Dario"];
  const tel = [];
  for (const n of nomi) {
    const t = await telefono(n, { giocatore: { id: "p-" + n.toLowerCase(), nome: n } });
    await t.page.evaluate(() => startMatchmaking());
    tel.push(t);
    await aspetta(400);
  }
  const uids = [];
  for (const t of tel) uids.push(await finché(() => t.page.evaluate(() => myUid)));
  const stanza = await finché(async () => {
    const g = (await leggi("games")) || {};
    return Object.values(g).find((s) => s.players && Object.keys(s.players).length === 4 && s.phase !== "lobby");
  });
  for (const [i, n] of nomi.entries()) assert.equal(Object.values(stanza.players).find((p) => p.name === n).uid, uids[i]);
  // ognuno vede il proprio colore e il proprio codice di rientro
  for (const t of tel) await finché(() => t.page.evaluate(() => !!(myColor && mySeatKey)));
  assert.deepEqual(errori, []);
});

test("Passo 5: partita coi computer con le regole definitive (mosse, fine, classifica, rivincita)", LIMITE, async () => {
  const t = await telefono("Elena", { giocatore: { id: "p-elena", nome: "Elena" } });
  const roomId = await partitaColComputer(t);
  await autoGioca(t.page);
  const n = await finché(async () => { const k = mosseNelRegistro(await leggi(`games/${roomId}`)); return k >= 8 ? k : null; }, 90000, 1000);
  assert.ok(n >= 8);
  await t.page.evaluate(() => clearInterval(window.__autoGioca));
  await aspetta(1500);
  await finisci(t, true);
  const uid = await t.page.evaluate(() => myUid);
  await finché(async () => { const v = await leggi(`leaderboard/${uid}`); return v && v.partite === 1; });
  await t.page.evaluate(() => startNewGame(document.createElement("button")));
  const dopo = await finché(async () => { const s = await leggi(`games/${roomId}`); return s.phase !== "finished" ? s : null; });
  assert.equal(Object.values(dopo.players).find((p) => !p.isBot).uid, uid);
  assert.deepEqual(errori, []);
});

async function amiciSeduto(t, nome, colore, stanza) {
  await t.page.evaluate(async ({ nome, colore, stanza }) => {
    document.body.insertAdjacentHTML("beforeend", `<input id="name-input" value="${nome}">`);
    myColor = colore;
    await claimRoomMode(stanza, "manual");
    await joinManualRoom(stanza);
  }, { nome, colore, stanza });
  await finché(() => t.page.evaluate(() => !!mySeatKey));
}

test("Passo 5: 'Sono io' — senza il codice di rientro nessuno prende il posto; con il codice sì", LIMITE, async () => {
  const fabio = await telefono("Fabio");
  await amiciSeduto(fabio, "Fabio", "red", "AMICI1");
  const uidF = await fabio.page.evaluate(() => myUid);
  const chiave = await fabio.page.evaluate(() => mySeatKey);
  assert.match(chiave, /^[A-Z2-9]{6}$/);
  // il codice si vede nelle Impostazioni (e non viene tradotto)
  await fabio.page.evaluate(() => openSettingsPanel());
  assert.equal(await fabio.page.locator(".sx-key").innerText(), chiave);

  // un altro telefono conosce SOLO il codice della stanza
  const ladro = await telefono("Ladro");
  ladro.page.on("dialog", (d) => d.accept("ZZZZZZ"));
  await ladro.page.evaluate(() => recoverByName("AMICI1", "Fabio", null));
  await aspetta(1500);
  let s = await leggi("games/AMICI1");
  assert.equal(s.players.red.uid, uidF, "con il codice sbagliato il posto resta a Fabio");
  // nemmeno sedendosi sullo stesso colore con lo stesso nome
  await ladro.page.evaluate(async () => {
    document.body.insertAdjacentHTML("beforeend", '<input id="name-input" value="Fabio">');
    myColor = "red";
    await joinManualRoom("AMICI1").catch(() => {});
  });
  await aspetta(1500);
  s = await leggi("games/AMICI1");
  assert.equal(s.players.red.uid, uidF, "lo stesso nome non basta");

  // il secondo telefono di Fabio, con il codice giusto
  const fabio2 = await telefono("Fabio-2");
  fabio2.page.on("dialog", (d) => d.accept(chiave.toLowerCase()));
  await fabio2.page.evaluate(() => recoverByName("AMICI1", "Fabio", null));
  const uidF2 = await fabio2.page.evaluate(() => myUid);
  s = await finché(async () => { const x = await leggi("games/AMICI1"); return x.players.red.uid === uidF2 ? x : null; });
  assert.equal(s.players.red.name, "Fabio");
  const chiave2 = await finché(() => fabio2.page.evaluate(() => mySeatKey));
  assert.notEqual(chiave2, chiave, "dopo il rientro il codice cambia");
  // il codice vecchio non serve più
  const ladro2 = await telefono("Ladro-2");
  ladro2.page.on("dialog", (d) => d.accept(chiave));
  await ladro2.page.evaluate(() => recoverByName("AMICI1", "Fabio", null));
  await aspetta(1500);
  assert.equal((await leggi("games/AMICI1")).players.red.uid, uidF2);
  assert.deepEqual(errori, []);
});

test("Passo 5: Gioca subito ricicla una stanza AUTO abbandonata anche con le regole definitive", LIMITE, async () => {
  await scrivi("games/AUTO-1", {
    gameId: "vecchia", roomMode: "draw", phase: "finished", winnerTeam: "A", turnStartedAt: Date.now() - 3600000,
    players: { red: { name: "Zeno", token: "t-z", uid: "uid-zeno" }, green: { name: "Robo", token: "bot-1", isBot: true } },
  });
  const t = await telefono("Gaia", { giocatore: { id: "p-gaia", nome: "Gaia" } });
  await t.page.evaluate(() => startMatchmaking());
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId));
  assert.equal(roomId, "AUTO-1");
  const s = await finché(async () => { const x = await leggi("games/AUTO-1"); return x.phase === "lobby" && x.draft ? x : null; });
  assert.notEqual(s.gameId, "vecchia");
  assert.equal(s.players, undefined);
  assert.deepEqual(errori, []);
});
