// Controlli automatici delle regole del Tock. Si lanciano con:  node --test tests/
// Girano anche da soli su GitHub a ogni aggiornamento (vedi .github/workflows/controlli.yml).
const test = require("node:test");
const assert = require("node:assert/strict");
const { caricaMotore } = require("./carica-motore");

const T = caricaMotore();
const BASE = T.BOARD.baseIndex; // red 0, green 16, yellow 32, blue 48
const CASA = (n) => 1000 + n; // caselle-casa 0..3

// Stato di gioco vuoto (tutte le pedine in base, nessuna carta) con le
// pedine indicate: es. partita({ red: [5, -1, -1, -1] }).
function partita(pedine = {}, turno = "red") {
  const s = T.newGameState({}, "manual");
  s.phase = "playing";
  s.turnColor = turno;
  for (const c of T.COLORS) if (pedine[c]) s.pawns[c] = pedine[c].slice();
  return s;
}

const destinazioni = (mosse) => mosse.filter((m) => m.type === "move").map((m) => m.path[m.path.length - 1]);

// ---------------- Mazzo e distribuzione ----------------

test("il mazzo ha 52 carte tutte diverse", () => {
  const mazzo = T.buildDeck();
  assert.equal(mazzo.length, 52);
  assert.equal(new Set(mazzo).size, 52);
});

test("le mani di un giro di mazzo sono 5, 4, 4 carte a testa senza sprechi", () => {
  const s = T.newGameState({}, "manual");
  for (const attese of [5, 4, 4]) {
    T.dealNewHand(s);
    for (const c of T.COLORS) assert.equal(s.hands[c].length, attese);
    for (const c of T.COLORS) s.hands[c] = [];
  }
  assert.equal(s.deck.length, 0);
  T.dealNewHand(s); // mazzo finito: si rimescola e si riparte da 5
  for (const c of T.COLORS) assert.equal(s.hands[c].length, 5);
});

test("il mazziere passa al giocatore successivo a ogni rimescolamento", () => {
  const s = T.newGameState({}, "manual");
  const mazzieri = [];
  for (let i = 0; i < 6; i++) {
    T.dealNewHand(s);
    mazzieri.push(s.dealerColor);
    for (const c of T.COLORS) s.hands[c] = [];
  }
  assert.deepEqual(mazzieri, ["red", "red", "red", "green", "green", "green"]);
});

test("scambio: ogni compagno riceve la carta scelta dall'altro, poi si gioca", () => {
  const s = T.newGameState({}, "manual");
  T.dealNewHand(s);
  assert.equal(s.phase, "exchanging");
  const date = {};
  for (const c of T.COLORS) {
    date[c] = s.hands[c][0];
    T.submitExchangeCard(s, c, date[c]);
  }
  assert.equal(s.phase, "playing");
  for (const c of T.COLORS) {
    assert.ok(s.hands[c].includes(date[T.PARTNER_OF[c]]), `${c} deve avere la carta del compagno`);
    assert.ok(!s.hands[c].includes(date[c]), `${c} non deve più avere la carta data`);
    assert.equal(s.hands[c].length, 5);
  }
});

test("scambio: non si può scegliere due volte", () => {
  const s = T.newGameState({}, "manual");
  T.dealNewHand(s);
  T.submitExchangeCard(s, "red", s.hands.red[0]);
  assert.throws(() => T.submitExchangeCard(s, "red", s.hands.red[0]));
});

// ---------------- Valore delle carte ----------------

test("valore delle carte", () => {
  assert.equal(T.moveValueOf("A-hearts", false), null); // A e K servono solo a entrare
  assert.equal(T.moveValueOf("K-hearts", false), null);
  assert.equal(T.moveValueOf("A-hearts", true), 1); // con tutte le pedine fuori muovono
  assert.equal(T.moveValueOf("K-hearts", true), 13);
  assert.equal(T.moveValueOf("Q-spades", false), 12);
  assert.equal(T.moveValueOf("4-clubs", false), -4); // il 4 va indietro
  assert.equal(T.moveValueOf("J-clubs", false), null); // Jack: scambio
  assert.equal(T.moveValueOf("9-diamonds", false), 9);
});

// ---------------- Entrata in gioco ----------------

test("con A o K una pedina esce dalla base", () => {
  const s = partita();
  const mosse = T.legalMovesForCard(s, "red", "A-hearts");
  assert.deepEqual(mosse, [{ type: "enter", pawnIndex: 0 }]);
  T.applyMove(s, "red", "A-hearts", mosse[0]);
  assert.equal(s.pawns.red[0], BASE.red);
});

test("con un numero normale non si esce dalla base", () => {
  const s = partita();
  assert.deepEqual(T.legalMovesForCard(s, "red", "5-hearts"), []);
  assert.equal(T.anyLegalMove({ ...s, hands: { ...s.hands, red: ["5-hearts", "Q-clubs"] } }, "red"), false);
});

test("entrando si mangia l'avversario fermo sulla propria base", () => {
  const s = partita({ red: [-1, -1, -1, -1], green: [BASE.red, -1, -1, -1] });
  T.applyMove(s, "red", "K-hearts", { type: "enter", pawnIndex: 0 });
  assert.equal(s.pawns.red[0], BASE.red);
  assert.equal(s.pawns.green[0], -1, "la pedina verde torna in base");
});

// ---------------- Movimento ----------------

test("una pedina avanza del numero della carta", () => {
  const s = partita({ red: [5, -1, -1, -1] });
  const mosse = T.legalMovesForCard(s, "red", "6-hearts");
  assert.deepEqual(destinazioni(mosse), [11]);
  T.applyMove(s, "red", "6-hearts", mosse[0]);
  assert.equal(s.pawns.red[0], 11);
});

test("il 4 fa tornare indietro, anche oltre la casella 0", () => {
  const s = partita({ red: [2, -1, -1, -1] });
  assert.deepEqual(destinazioni(T.legalMovesForCard(s, "red", "4-hearts")), [62]);
});

test("non si può scavalcare nessuna pedina", () => {
  const s = partita({ red: [5, -1, -1, -1], green: [8, -1, -1, -1] });
  assert.deepEqual(T.legalMovesForCard(s, "red", "6-hearts"), []);
});

test("arrivando esattamente su un avversario lo si mangia", () => {
  const s = partita({ red: [5, -1, -1, -1], green: [11, -1, -1, -1] });
  const mosse = T.legalMovesForCard(s, "red", "6-hearts");
  T.applyMove(s, "red", "6-hearts", mosse[0]);
  assert.equal(s.pawns.red[0], 11);
  assert.equal(s.pawns.green[0], -1);
});

test("con una carta normale si può mangiare una propria pedina arrivandoci sopra", () => {
  const s = partita({ red: [5, 11, -1, -1] });
  const mosse = T.legalMovesForCard(s, "red", "6-hearts").filter((m) => m.pawnIndex === 0);
  assert.deepEqual(destinazioni(mosse), [11]);
  T.applyMove(s, "red", "6-hearts", mosse[0]);
  assert.equal(s.pawns.red[0], 11);
  assert.equal(s.pawns.red[1], -1);
});

test("le pedine del compagno si mangiano con le stesse regole", () => {
  let s = partita({ red: [5, -1, -1, -1], yellow: [11, -1, -1, -1] });
  T.applyMove(s, "red", "6-hearts", T.legalMovesForCard(s, "red", "6-hearts")[0]);
  assert.equal(s.pawns.yellow[0], -1, "carta normale: arrivandoci sopra");
  s = partita({ red: [5, -1, -1, -1], yellow: [8, -1, -1, -1] });
  assert.deepEqual(T.legalMovesForCard(s, "red", "6-hearts"), [], "carta normale: non si scavalca");
  T.applyMove(s, "red", "7-hearts", { type: "seven", distribution: [{ pawnIndex: 0, steps: 7 }] });
  assert.equal(s.pawns.yellow[0], -1, "col 7: anche a metà strada");
});

test("la pedina appena entrata sulla propria base è protetta", () => {
  const s = partita({ red: [BASE.green - 3, -1, -1, -1], green: [BASE.green, -1, -1, -1] });
  assert.ok(T.isPawnProtected(s, "green", 0));
  assert.deepEqual(T.legalMovesForCard(s, "red", "3-hearts"), [], "non si può mangiare");
  assert.deepEqual(T.legalMovesForCard(s, "red", "5-hearts"), [], "né scavalcare");
});

test("una pedina che ha già fatto il giro e torna sulla base non è protetta", () => {
  const s = partita({ green: [BASE.green, -1, -1, -1] });
  s.lapped = { green: [true, false, false, false] };
  assert.ok(!T.isPawnProtected(s, "green", 0));
});

// ---------------- Casa ----------------

test("arrivati alla propria base si può scegliere: entrare in casa o continuare il giro", () => {
  const s = partita({ red: [62, -1, -1, -1] }); // 2 passi prima della base rossa
  const dest = destinazioni(T.legalMovesForCard(s, "red", "3-hearts"));
  assert.deepEqual(dest.sort(), [1, CASA(0)].sort());
});

test("con un numero troppo alto non si entra in casa, si continua il giro", () => {
  const s = partita({ red: [62, -1, -1, -1] });
  assert.deepEqual(destinazioni(T.legalMovesForCard(s, "red", "8-hearts")), [6]);
});

test("in casa non si può superare l'ultima casella", () => {
  const s = partita({ red: [CASA(1), -1, -1, -1] });
  assert.deepEqual(destinazioni(T.legalMovesForCard(s, "red", "2-hearts")), [CASA(3)]);
  assert.deepEqual(T.legalMovesForCard(s, "red", "3-hearts"), []);
});

test("in casa non si scavalca una propria pedina", () => {
  const s = partita({ red: [CASA(0), CASA(2), -1, -1] });
  assert.deepEqual(destinazioni(T.legalMovesForCard(s, "red", "3-hearts")), []);
});

test("la pedina entrata in gioco deve fare tutto il giro prima della casa", () => {
  const s = partita({ red: [BASE.red, -1, -1, -1] }); // appena entrata
  assert.deepEqual(destinazioni(T.legalMovesForCard(s, "red", "2-hearts")), [2]);
});

test("una pedina tornata sulla base col 4 può entrare in casa alla mossa dopo", () => {
  const s = partita({ red: [4, -1, -1, -1] });
  const quattro = T.legalMovesForCard(s, "red", "4-hearts");
  T.applyMove(s, "red", "4-hearts", quattro[0]);
  assert.equal(s.pawns.red[0], BASE.red);
  assert.ok(destinazioni(T.legalMovesForCard(s, "red", "2-hearts")).includes(CASA(1)));
});

// ---------------- Jack ----------------

test("il Jack scambia due pedine sul percorso", () => {
  const s = partita({ red: [5, -1, -1, -1], green: [20, -1, -1, -1] });
  assert.deepEqual(T.legalMovesForCard(s, "red", "J-hearts"), [{ type: "jack" }]);
  T.applyMove(s, "red", "J-hearts", {
    type: "jack",
    a: { color: "red", pawnIndex: 0 },
    b: { color: "green", pawnIndex: 0 },
  });
  assert.equal(s.pawns.red[0], 20);
  assert.equal(s.pawns.green[0], 5);
});

test("il Jack non si può usare senza proprie pedine sul percorso", () => {
  const s = partita({ red: [CASA(0), -1, -1, -1], green: [20, 30, -1, -1] });
  assert.deepEqual(T.legalMovesForCard(s, "red", "J-hearts"), []);
});

test("il Jack non tocca le pedine protette né quelle in casa", () => {
  const s = partita({ red: [5, CASA(0), -1, -1], green: [BASE.green, -1, -1, -1] });
  const bersagli = T.jackableTargets(s).map((p) => p.color + p.pawnIndex);
  assert.deepEqual(bersagli, ["red0"]);
  assert.deepEqual(T.legalMovesForCard(s, "red", "J-hearts"), [], "serve almeno un'altra pedina scambiabile");
});

// ---------------- 7 ----------------

test("il 7 si può dividere tra due pedine", () => {
  const s = partita({ red: [5, 20, -1, -1] });
  assert.deepEqual(T.legalMovesForCard(s, "red", "7-hearts"), [{ type: "seven" }]);
  T.applyMove(s, "red", "7-hearts", {
    type: "seven",
    distribution: [{ pawnIndex: 0, steps: 3 }, { pawnIndex: 1, steps: 4 }],
  });
  assert.deepEqual(s.pawns.red.slice(0, 2), [8, 24]);
});

test("il 7 deve usare esattamente 7 passi", () => {
  const s = partita({ red: [5, 20, -1, -1] });
  assert.equal(T.sevenValidateDistribution(s, "red", [{ pawnIndex: 0, steps: 3 }, { pawnIndex: 1, steps: 3 }]), null);
});

test("il 7 mangia tutti gli avversari che incontra e prosegue", () => {
  const s = partita({ red: [5, -1, -1, -1], green: [7, -1, -1, -1], blue: [9, -1, -1, -1] });
  T.applyMove(s, "red", "7-hearts", { type: "seven", distribution: [{ pawnIndex: 0, steps: 7 }] });
  assert.equal(s.pawns.red[0], 12);
  assert.equal(s.pawns.green[0], -1);
  assert.equal(s.pawns.blue[0], -1);
});

test("il 7 mangia anche le proprie pedine, pure a metà strada", () => {
  const s = partita({ red: [5, 8, -1, -1] });
  T.applyMove(s, "red", "7-hearts", { type: "seven", distribution: [{ pawnIndex: 0, steps: 7 }] });
  assert.equal(s.pawns.red[0], 12);
  assert.equal(s.pawns.red[1], -1, "la pedina rossa a metà strada torna in base");
});

test("il 7 non passa sopra una pedina protetta, neanche propria", () => {
  const s = partita({ red: [60, BASE.red, -1, -1] }); // la seconda è appena entrata
  assert.equal(T.sevenValidateDistribution(s, "red", [{ pawnIndex: 0, steps: 7 }]), null);
});

test("il 7: se le proprie pedine finiscono tutte in casa, i passi avanzati vanno al compagno", () => {
  const s = partita({ red: [CASA(3), CASA(2), CASA(1), 63], yellow: [40, -1, -1, -1] });
  // 2 passi portano l'ultima rossa (a 63, una casella prima della base) nella casa#1, che è libera.
  const dist = [{ pawnIndex: 3, steps: 2 }, { pawnIndex: 0, steps: 5, forPartner: true }];
  assert.ok(T.sevenValidateDistribution(s, "red", dist));
  T.applyMove(s, "red", "7-hearts", { type: "seven", distribution: dist });
  assert.equal(s.pawns.red[3], CASA(0));
  assert.equal(s.pawns.yellow[0], 45);
});

test("il 7: muove prima la pedina in casa per far entrare l'altra (6+1)", () => {
  // Segnalato (v6.16): #3 a 5 caselle dalla base, #4 in casa#1. Con 6 passi a #3 e 1 a #4,
  // #4 va in casa#2 e #3 entra in casa#1 (prima #3 proseguiva il giro).
  const s = partita({ red: [CASA(3), CASA(2), 59, CASA(0)] });
  T.applyMove(s, "red", "7-hearts", {
    type: "seven",
    distribution: [{ pawnIndex: 2, steps: 6 }, { pawnIndex: 3, steps: 1 }],
  });
  assert.equal(s.pawns.red[2], CASA(0));
  assert.equal(s.pawns.red[3], CASA(1));
});

test("il 7: nel foglio compaiono solo le pedine che possono davvero muovere", () => {
  // Rosse già in casa (bloccate) + una a 63: anche se i passi avanzati possono
  // andare al compagno, si propone solo la rossa che può muovere.
  const s = partita({ red: [CASA(3), CASA(2), CASA(1), 63], yellow: [40, CASA(3), -1, -1] });
  assert.deepEqual(T.sevenMovableOwnPawns(s, "red"), [3]);
  // Dopo 2 passi della rossa (tutte in casa), dei gialli solo quello sul
  // percorso può ricevere i 5 passi avanzati: quello all'ultima casella di casa no.
  const dopo = JSON.parse(JSON.stringify(s.pawns));
  dopo.red[3] = CASA(0);
  assert.deepEqual(T.sevenMovablePartnerPawns(s, "red", dopo, 5), [0]);
  // Caso normale: due pedine libere, compaiono entrambe.
  assert.deepEqual(T.sevenMovableOwnPawns(partita({ red: [5, 20, -1, -1] }), "red"), [0, 1]);
});

// ---------------- Turni e vittoria ----------------

test("il turno passa al giocatore successivo e salta chi non ha carte", () => {
  const s = partita({}, "red");
  s.hands = { red: ["2-hearts"], green: [], yellow: ["3-hearts"], blue: ["4-hearts"] };
  T.advanceTurn(s);
  assert.equal(s.turnColor, "yellow");
});

test("quando tutti hanno finito le carte si distribuisce una nuova mano", () => {
  const s = partita({}, "blue");
  s.deck = T.buildDeck().slice(0, 32);
  s.firstHandOfCycle = false;
  s.hasDealtBefore = true;
  T.advanceTurn(s);
  assert.equal(s.phase, "exchanging");
  for (const c of T.COLORS) assert.equal(s.hands[c].length, 4);
});

test("con tutte le proprie pedine in casa si muovono quelle del compagno", () => {
  const s = partita({ red: [CASA(0), CASA(1), CASA(2), CASA(3)], yellow: [10, -1, -1, -1] });
  assert.equal(T.activeColorFor(s, "red"), "yellow");
  assert.equal(T.activeColorFor(s, "green"), "green");
});

test("vince la coppia che porta tutte e 8 le pedine in casa (contata una volta sola)", () => {
  const tutteInCasa = [CASA(0), CASA(1), CASA(2), CASA(3)];
  const s = partita({ red: tutteInCasa, yellow: [CASA(0), CASA(1), CASA(2), 63] });
  T.checkWin(s);
  assert.equal(s.winnerTeam, null, "manca ancora una pedina gialla");
  s.pawns.yellow[3] = CASA(3);
  T.checkWin(s);
  T.checkWin(s); // ricontrollare non deve contare la vittoria due volte
  assert.equal(s.winnerTeam, "A");
  assert.equal(s.phase, "finished");
  assert.equal(s.roomStats.wins.A, 1);
});

// ---------------- Versioni dell'app ----------------

test("confronto tra versioni dell'app", () => {
  assert.ok(T.compareAppVersions("v5.30", "v5.29") > 0);
  assert.ok(T.compareAppVersions("v5.30", "v5.4") > 0, "confronto numerico, non alfabetico");
  assert.ok(T.compareAppVersions("v5.29", "v5.30") < 0);
  assert.equal(T.compareAppVersions("v5.30", "v5.30"), 0);
  assert.ok(T.compareAppVersions(true, "v5.29") < 0, "i client vecchi scrivono true: contano come più vecchi");
});

// ---------------- Classifica (v6.19) ----------------

test("ogni partita ha un identificativo nuovo, anche dopo la rivincita", () => {
  const a = T.newGameState({}, "manual");
  const b = T.newGameState({}, "manual");
  assert.match(a.gameId, /^[a-z0-9]{8,}$/, "solo lettere e cifre: finisce in un percorso del database");
  assert.notEqual(a.gameId, b.gameId);
  const prima = a.gameId;
  T.resetForNewGame(a);
  assert.match(a.gameId, /^[a-z0-9]{8,}$/);
  assert.notEqual(a.gameId, prima);
});
