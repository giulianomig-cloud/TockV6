// Controlli dell'arbitro (logica pura, senza database): partite intere coi computer, mosse rifiutate, parte
// pubblica senza carte, mani private, risultati per la classifica.
const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const M = require("../motore-generato");
const A = require("../arbitro");

const { COLORS } = M;

// Come il Realtime Database: niente null, niente liste o oggetti vuoti.
function comeDatabase(x) {
  if (Array.isArray(x)) {
    const v = x.map(comeDatabase).filter((e) => e !== undefined);
    return v.length ? v : undefined;
  }
  if (x && typeof x === "object") {
    const o = {};
    for (const [k, v] of Object.entries(x)) {
      const w = comeDatabase(v);
      if (w !== undefined) o[k] = w;
    }
    return Object.keys(o).length ? o : undefined;
  }
  return x === null ? undefined : x;
}

function stanza(posti, extra = {}) {
  const players = {};
  for (const c of COLORS) {
    const p = posti[c];
    players[c] = p === "bot" ? { name: "Computer", isBot: true, botLevel: c === "green" ? "easy" : "hard", token: "b-" + c }
      : { name: "Gioc " + p, uid: p, token: "t-" + p };
  }
  return { arbitro: true, sessione: "S1", gameId: "G1", roomMode: "manual", players, ...extra };
}

// Il server salva lo stato "come il database": si simula il giro completo dopo ogni azione.
function salva(r) { return comeDatabase(A.statoServer(r.stato)); }

function giocaFinoAllaFine(st, max = 4000) {
  let stato = salva(A.esegui(null, st, "avvia", { uid: umanoQualsiasi(st) }));
  const umani = COLORS.filter((c) => !st.players[c].isBot);
  for (let passo = 0; passo < max; passo++) {
    const s = A.inForma(stato);
    if (s.phase === "finished") return { stato: s, passi: passo };
    let r;
    if (s.phase === "exchanging") {
      const chi = umani.find((c) => !s.pendingExchange[c]);
      r = chi ? A.esegui(stato, st, "scambio", { uid: st.players[chi].uid }, { carta: s.hands[chi][0] })
        : A.esegui(stato, st, "bot", { uid: st.players[umani[0]].uid });
    } else if (st.players[s.turnColor].isBot) {
      r = A.esegui(stato, st, "bot", { uid: st.players[umani[0]].uid });
    } else {
      const seat = s.turnColor;
      const attivo = M.activeColorFor(s, seat);
      const scelta = M.botChooseCardAndMoveEasy(s, attivo, seat); // un "umano" che gioca a caso ma legale
      const uid = st.players[seat].uid;
      r = scelta.burn ? A.esegui(stato, st, "brucia", { uid }, { carta: scelta.card })
        : A.esegui(stato, st, "mossa", { uid }, { carta: scelta.card, mossa: scelta.move });
    }
    assert.ok(r.cambiato, "ogni azione valida cambia la partita");
    if (r.finita) assert.ok(A.risultati(r.stato).length > 0);
    stato = salva(r);
  }
  throw new Error("la partita non è finita in " + max + " passi");
}
const umanoQualsiasi = (st) => st.players[COLORS.find((c) => !st.players[c].isBot)].uid;

test("il motore del server è generato da index.html e allineato", () => {
  execFileSync(process.execPath, [path.join(__dirname, "..", "genera-motore.js"), "--check"], { stdio: "pipe" });
});

test("partita intera: 1 persona + 3 computer, solo azioni dell'arbitro", () => {
  const st = stanza({ red: "u1", green: "bot", yellow: "bot", blue: "bot" });
  const { stato, passi } = giocaFinoAllaFine(st);
  assert.equal(stato.phase, "finished");
  assert.ok(["A", "B"].includes(stato.winnerTeam));
  const ris = A.risultati(stato);
  assert.equal(ris.length, 1);
  assert.equal(ris[0].uid, "u1");
  assert.equal(ris[0].vinta, stato.winnerTeam === "A");
  assert.ok(passi > 10);
});

test("partita intera: 2 persone (una per squadra) + 2 computer", () => {
  const st = stanza({ red: "u1", green: "u2", yellow: "bot", blue: "bot" });
  const { stato } = giocaFinoAllaFine(st);
  const ris = A.risultati(stato);
  assert.equal(ris.length, 2);
  assert.equal(ris.filter((r) => r.vinta).length, 1, "vince esattamente una delle due persone");
});

test("la parte pubblica non contiene mazzo, mani né carte dello scambio; le mani private solo le proprie carte", () => {
  const st = stanza({ red: "u1", green: "u2", yellow: "bot", blue: "bot" });
  let r = A.esegui(null, st, "avvia", { uid: "u1" });
  let stato = salva(r);
  r = A.esegui(stato, st, "scambio", { uid: "u1" }, { carta: A.inForma(stato).hands.red[0] });
  const pub = A.pubblica(r.stato);
  for (const k of A.CAMPI_SEGRETI) assert.equal(pub[k], undefined, k + " non deve essere pubblico");
  assert.equal(pub.players, undefined);
  assert.deepEqual(pub.carteInMano, { red: 4, green: 5, yellow: 5, blue: 5 });
  assert.equal(pub.scambioFatto.red, true);
  assert.equal(pub.scambioFatto.green, false);
  assert.equal(pub.carteNelMazzo, 32);
  const testo = JSON.stringify({ ...pub, dealerDraw: null }); // l'estrazione del mazziere usa un mazzo a parte, pubblico
  assert.ok(pub.dealerDraw && pub.dealerDraw.sequence.length > 0);
  for (const c of COLORS) for (const carta of r.stato.hands[c]) assert.ok(!testo.includes('"' + carta + '"'), "carta in mano visibile: " + carta);
  const mani = A.maniPrivate(r.stato);
  assert.deepEqual(Object.keys(mani).sort(), ["u1", "u2"], "solo le persone, i computer no");
  assert.deepEqual(mani.u1.carte, r.stato.hands.red);
  assert.equal(mani.u1.scambio, r.stato.pendingExchange.red);
  assert.equal(mani.u2.scambio, null);
  assert.deepEqual(A.specchio(r.stato), { phase: "exchanging", turnStartedAt: r.stato.turnStartedAt, gameId: "G1", winnerTeam: null });
});

test("azioni rifiutate: turno, carta, mossa, bruciatura, posto, stanza, partita non avviata", () => {
  const st = stanza({ red: "u1", green: "u2", yellow: "bot", blue: "bot" });
  const codice = (fn) => { try { fn(); } catch (e) { assert.ok(e instanceof A.ErroreArbitro, e.stack); return e.codice; } return "accettata"; };
  assert.equal(codice(() => A.esegui(null, st, "scambio", { uid: "u1" }, { carta: "5-hearts" })), "non-avviata");
  assert.equal(codice(() => A.esegui(null, { ...st, arbitro: false }, "avvia", { uid: "u1" })), "stanza-senza-arbitro");
  assert.equal(codice(() => A.esegui(null, st, "avvia", { uid: "intruso" })), "non-seduto");
  assert.equal(codice(() => A.esegui(null, st, "avvia", {})), "non-seduto");
  assert.equal(codice(() => A.esegui(null, st, "imbroglia", { uid: "u1" })), "azione-sconosciuta");
  const meno = stanza({ red: "u1", green: "u2", yellow: "bot", blue: "bot" });
  delete meno.players.blue;
  assert.equal(codice(() => A.esegui(null, meno, "avvia", { uid: "u1" })), "mancano-giocatori");

  let stato = salva(A.esegui(null, st, "avvia", { uid: "u1" }));
  assert.equal(A.esegui(stato, st, "avvia", { uid: "u1" }).cambiato, false, "avviare due volte non rimescola");
  assert.equal(codice(() => A.esegui(stato, { ...st, sessione: "ALTRA" }, "scambio", { uid: "u1" }, { carta: "x" })), "non-avviata");
  const s0 = A.inForma(stato);
  const nonMia = s0.hands.green[0];
  assert.equal(codice(() => A.esegui(stato, st, "scambio", { uid: "u1" }, { carta: nonMia })), "scambio-non-valido");
  assert.equal(codice(() => A.esegui(stato, st, "mossa", { uid: "u1" }, { carta: s0.hands.red[0], mossa: { type: "enter", pawnIndex: 0 } })), "non-si-gioca");
  // scambio completo
  stato = salva(A.esegui(stato, st, "scambio", { uid: "u1" }, { carta: s0.hands.red[0] }));
  assert.equal(codice(() => A.esegui(stato, st, "scambio", { uid: "u1" }, { carta: A.inForma(stato).hands.red[0] })), "scambio-non-valido");
  stato = salva(A.esegui(stato, st, "scambio", { uid: "u2" }, { carta: s0.hands.green[0] }));
  stato = salva(A.esegui(stato, st, "bot", { uid: "u2" }));
  let s = A.inForma(stato);
  assert.equal(s.phase, "playing");
  // porta il turno a una persona
  let guard = 0;
  while (st.players[s.turnColor].isBot && guard++ < 10) { stato = salva(A.esegui(stato, st, "bot", { uid: "u1" })); s = A.inForma(stato); }
  const mio = s.turnColor, altro = mio === "red" ? "green" : "red";
  const uidMio = st.players[mio].uid, uidAltro = st.players[altro].uid;
  const carta = s.hands[mio][0];
  assert.equal(codice(() => A.esegui(stato, st, "mossa", { uid: uidAltro }, { carta: s.hands[altro][0], mossa: { type: "enter", pawnIndex: 0 } })), "non-tocca-a-te");
  assert.equal(codice(() => A.esegui(stato, st, "bot", { uid: uidAltro })), "accettata", "il computer non muove al turno di una persona (nessun cambio)");
  assert.equal(A.esegui(stato, st, "bot", { uid: uidAltro }).cambiato, false);
  assert.equal(codice(() => A.esegui(stato, st, "mossa", { uid: uidMio }, { carta: s.hands[altro][0], mossa: { type: "enter", pawnIndex: 0 } })), "carta-non-in-mano");
  // mossa inventata: pedina che salta direttamente in casa
  assert.equal(codice(() => A.esegui(stato, st, "mossa", { uid: uidMio }, { carta, mossa: { type: "move", pawnIndex: 0, path: [1000] } })), "mossa-illegale");
  assert.equal(codice(() => A.esegui(stato, st, "mossa", { uid: uidMio }, { carta, mossa: { type: "teletrasporto" } })), "mossa-non-valida");
  assert.equal(codice(() => A.esegui(stato, st, "mossa", { uid: uidMio }, { carta, mossa: null })), "mossa-non-valida");
  const attivo = M.activeColorFor(s, mio);
  const giocabile = s.hands[mio].find((c) => M.legalMovesForCard(s, attivo, c).length > 0);
  if (giocabile) assert.equal(codice(() => A.esegui(stato, st, "brucia", { uid: uidMio }, { carta: giocabile })), "carta-giocabile");
  assert.equal(codice(() => A.esegui(stato, st, "rivincita", { uid: uidMio })), "non-finita");
});

test("Jack e 7: scambi e distribuzioni inventati vengono rifiutati, quelli legali accettati", () => {
  const st = stanza({ red: "u1", green: "bot", yellow: "bot", blue: "bot" });
  const s = A.inForma(salva(A.esegui(null, st, "avvia", { uid: "u1" })));
  s.phase = "playing";
  s.turnColor = "red";
  s.pawns = { red: [5, 20, -1, -1], green: [30, -1, -1, -1], yellow: [-1, -1, -1, -1], blue: [40, -1, -1, -1] };
  s.hands.red = ["J-hearts", "7-spades", "5-clubs"];
  const stato = comeDatabase(A.statoServer(s));
  const codice = (fn) => { try { fn(); return "accettata"; } catch (e) { return e.codice; } };
  assert.equal(codice(() => A.esegui(stato, st, "mossa", { uid: "u1" }, { carta: "J-hearts", mossa: { type: "jack", a: { color: "red", pawnIndex: 0 }, b: { color: "red", pawnIndex: 0 } } })), "mossa-illegale");
  assert.equal(codice(() => A.esegui(stato, st, "mossa", { uid: "u1" }, { carta: "J-hearts", mossa: { type: "jack", a: { color: "red", pawnIndex: 0 }, b: { color: "yellow", pawnIndex: 0 } } })), "mossa-illegale", "pedina in base");
  const ok = A.esegui(stato, st, "mossa", { uid: "u1" }, { carta: "J-hearts", mossa: { type: "jack", a: { color: "red", pawnIndex: 0 }, b: { color: "green", pawnIndex: 0 } } });
  assert.equal(ok.stato.pawns.red[0], 30);
  assert.equal(ok.stato.pawns.green[0], 5);
  assert.equal(codice(() => A.esegui(stato, st, "mossa", { uid: "u1" }, { carta: "7-spades", mossa: { type: "seven", distribution: [{ pawnIndex: 0, steps: 9 }] } })), "mossa-illegale");
  assert.equal(codice(() => A.esegui(stato, st, "mossa", { uid: "u1" }, { carta: "7-spades", mossa: { type: "seven", distribution: [{ pawnIndex: 0, steps: 3 }, { pawnIndex: 1, steps: 3 }] } })), "mossa-illegale");
  const sette = A.esegui(stato, st, "mossa", { uid: "u1" }, { carta: "7-spades", mossa: { type: "seven", distribution: [{ pawnIndex: 0, steps: 3 }, { pawnIndex: 1, steps: 4 }] } });
  assert.deepEqual(sette.stato.pawns.red.slice(0, 2), [8, 24]);
  assert.ok(!sette.stato.hands.red.includes("7-spades"));
});

test("rivincita: nuova partita (nuovo gameId) solo a partita finita; i posti veri sono quelli della stanza", () => {
  const st = stanza({ red: "u1", green: "bot", yellow: "bot", blue: "bot" });
  const { stato } = giocaFinoAllaFine(st);
  const r = A.esegui(comeDatabase(A.statoServer(stato)), st, "rivincita", { uid: "u1" });
  assert.notEqual(r.stato.gameId, stato.gameId);
  assert.equal(r.stato.phase, "exchanging");
  assert.equal(r.stato.winnerTeam, null);
  // un computer messo al posto di chi è uscito vale subito
  const st2 = stanza({ red: "u1", green: "bot", yellow: "bot", blue: "bot" });
  st2.players.red = { name: "Computer", isBot: true, botLevel: "easy", token: "b" };
  st2.players.green = { name: "Gioc u9", uid: "u9", token: "t9" };
  assert.throws(() => A.esegui(comeDatabase(A.statoServer(r.stato)), st2, "scambio", { uid: "u1" }, { carta: "x" }), (e) => e.codice === "non-seduto");
});

test("classifica: una persona su due posti conta una volta; su tutte e due le squadre non conta", () => {
  const s = { winnerTeam: "A", players: {
    red: { name: "Uno", uid: "u1" }, yellow: { name: "Uno", uid: "u1" },
    green: { name: "Due", uid: "u2" }, blue: { name: "Due", uid: "u3" },
  } };
  assert.deepEqual(A.risultati(s), [
    { uid: "u1", nome: "Uno", vinta: true, contro: "persone" },
    { uid: "u2", nome: "Due", vinta: false, contro: "persone" },
    { uid: "u3", nome: "Due", vinta: false, contro: "persone" },
  ]);
  s.players.green.uid = "u1";
  assert.deepEqual(A.risultati(s).map((r) => r.uid), ["u3"], "u1 è su tutte e due le squadre: non conta");
  s.winnerTeam = null;
  assert.deepEqual(A.risultati(s), []);
});

test("classifica separata: 'contro persone' solo se i due avversari sono persone (il compagno può essere un computer)", () => {
  const conta = (players) => Object.fromEntries(A.risultati({ winnerTeam: "A", players }).map((r) => [r.uid, r.contro]));
  const bot = { name: "Computer", isBot: true };
  // 4 persone: tutti contro persone
  assert.deepEqual(conta({ red: { name: "A", uid: "a" }, yellow: { name: "B", uid: "b" }, green: { name: "C", uid: "c" }, blue: { name: "D", uid: "d" } }),
    { a: "persone", b: "persone", c: "persone", d: "persone" });
  // 3 persone: chi ha un computer fra gli avversari gioca "contro computer"
  assert.deepEqual(conta({ red: { name: "A", uid: "a" }, yellow: bot, green: { name: "C", uid: "c" }, blue: { name: "D", uid: "d" } }),
    { a: "persone", c: "computer", d: "computer" });
  // 2 persone una per squadra + 2 computer: entrambe contro computer
  assert.deepEqual(conta({ red: { name: "A", uid: "a" }, yellow: bot, green: { name: "C", uid: "c" }, blue: bot }),
    { a: "computer", c: "computer" });
  // 1 persona + 3 computer
  assert.deepEqual(conta({ red: { name: "A", uid: "a" }, yellow: bot, green: bot, blue: bot }), { a: "computer" });
  // un posto umano senza uid (versione vecchia) non è una persona verificata
  assert.deepEqual(conta({ red: { name: "A", uid: "a" }, yellow: bot, green: { name: "C" }, blue: { name: "D", uid: "d" } }),
    { a: "computer", d: "computer" });
});
