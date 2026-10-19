// FILE GENERATO da functions/genera-motore.js a partire da index.html: NON modificarlo a mano.
// Contiene il motore del gioco e l'intelligenza dei computer, identici a quelli dei telefoni.
/* eslint-disable */
"use strict";
const motore = (function () {
const module = { exports: {} };

// Geometria del tabellone (generata dal design validato 47,2x47,2cm)
const BOARD = {
 "boardSizeMm": 472.0,
 "pitchMm": 42.0,
 "cellRadiusMm": 16.0,
 "loopCells": [
  {
   "x": 26.0,
   "y": 26.0,
   "isBase": true,
   "baseColor": "red",
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 68.0,
   "y": 26.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 110.0,
   "y": 26.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 152.0,
   "y": 26.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 194.0,
   "y": 26.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 194.0,
   "y": 68.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 194.0,
   "y": 110.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 194.0,
   "y": 152.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 236.0,
   "y": 152.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 278.0,
   "y": 152.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 278.0,
   "y": 110.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 278.0,
   "y": 68.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 278.0,
   "y": 26.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": true,
   "markerColor": "green"
  },
  {
   "x": 320.0,
   "y": 26.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 362.0,
   "y": 26.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 404.0,
   "y": 26.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 446.0,
   "y": 26.0,
   "isBase": true,
   "baseColor": "green",
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 446.0,
   "y": 68.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 446.0,
   "y": 110.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 446.0,
   "y": 152.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 446.0,
   "y": 194.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 404.0,
   "y": 194.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 362.0,
   "y": 194.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 320.0,
   "y": 194.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 320.0,
   "y": 236.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 320.0,
   "y": 278.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 362.0,
   "y": 278.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 404.0,
   "y": 278.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 446.0,
   "y": 278.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": true,
   "markerColor": "yellow"
  },
  {
   "x": 446.0,
   "y": 320.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 446.0,
   "y": 362.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 446.0,
   "y": 404.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 446.0,
   "y": 446.0,
   "isBase": true,
   "baseColor": "yellow",
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 404.0,
   "y": 446.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 362.0,
   "y": 446.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 320.0,
   "y": 446.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 278.0,
   "y": 446.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 278.0,
   "y": 404.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 278.0,
   "y": 362.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 278.0,
   "y": 320.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 236.0,
   "y": 320.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 194.0,
   "y": 320.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 194.0,
   "y": 362.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 194.0,
   "y": 404.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 194.0,
   "y": 446.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": true,
   "markerColor": "blue"
  },
  {
   "x": 152.0,
   "y": 446.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 110.0,
   "y": 446.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 68.0,
   "y": 446.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 26.0,
   "y": 446.0,
   "isBase": true,
   "baseColor": "blue",
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 26.0,
   "y": 404.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 26.0,
   "y": 362.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 26.0,
   "y": 320.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 26.0,
   "y": 278.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 68.0,
   "y": 278.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 110.0,
   "y": 278.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 152.0,
   "y": 278.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 152.0,
   "y": 236.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 152.0,
   "y": 194.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 110.0,
   "y": 194.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 68.0,
   "y": 194.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 26.0,
   "y": 194.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": true,
   "markerColor": "red"
  },
  {
   "x": 26.0,
   "y": 152.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 26.0,
   "y": 110.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  },
  {
   "x": 26.0,
   "y": 68.0,
   "isBase": false,
   "baseColor": null,
   "isMarker": false,
   "markerColor": null
  }
 ],
 "baseIndex": {
  "red": 0,
  "green": 16,
  "yellow": 32,
  "blue": 48
 },
 "homePaths": {
  "red": [
   {
    "x": 65.59797968000001,
    "y": 65.59797968000001
   },
   {
    "x": 95.29646444,
    "y": 95.29646444
   },
   {
    "x": 124.99494920000001,
    "y": 124.99494920000001
   },
   {
    "x": 154.69343396,
    "y": 154.69343396
   }
  ],
  "green": [
   {
    "x": 406.40202032,
    "y": 65.59797968000001
   },
   {
    "x": 376.70353556,
    "y": 95.29646444
   },
   {
    "x": 347.0050508,
    "y": 124.99494920000001
   },
   {
    "x": 317.30656604,
    "y": 154.69343396
   }
  ],
  "yellow": [
   {
    "x": 406.40202032,
    "y": 406.40202032
   },
   {
    "x": 376.70353556,
    "y": 376.70353556
   },
   {
    "x": 347.0050508,
    "y": 347.0050508
   },
   {
    "x": 317.30656604,
    "y": 317.30656604
   }
  ],
  "blue": [
   {
    "x": 65.59797968000001,
    "y": 406.40202032
   },
   {
    "x": 95.29646444000002,
    "y": 376.70353556
   },
   {
    "x": 124.99494920000002,
    "y": 347.0050508
   },
   {
    "x": 154.69343396,
    "y": 317.30656604
   }
  ]
 },
 "order": [
  "red",
  "green",
  "yellow",
  "blue"
 ]
};



// ============================================================
// Tock — motore di gioco
// ============================================================

const COLORS = ["red", "green", "yellow", "blue"];
const TEAM_OF = { red: "A", yellow: "A", green: "B", blue: "B" };
const TEAM_LABEL = { A: "Rosso + Giallo", B: "Verde + Blu" };
// I due colori di ciascuna squadra, nello stesso ordine di TEAM_LABEL — usati
// per i due pallini nel riquadro "Squadra" (vedi renderGameShell).
const TEAM_COLORS = { A: ["red", "yellow"], B: ["green", "blue"] };
// Classe CSS per sfumare la metà "Squadra" della pillola stanza+squadra
// con i colori della TUA squadra (vedi .room-team-team e
// --team-a-gradient/--team-b-gradient nel :root) — un fallback neutro se
// per qualche motivo myColor non è (ancora) valorizzato, invece di
// rompere il layout.
function teamBgClass(color) {
  const team = TEAM_OF[color];
  return team ? "team-" + team.toLowerCase() + "-bg" : "";
}
const ITALIAN_COLOR = { red: "Rosso", green: "Verde", yellow: "Giallo", blue: "Blu" };
function cn(color) { return ITALIAN_COLOR[color] || color; }
const SUIT_SYMBOL = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };
// Card as shown in the log — e.g. "3-clubs" -> "3♣" — instead of the raw
// internal code, which isn't meaningful to read back.
function cardLog(card) {
  const [r, s] = card.split("-");
  return r + (SUIT_SYMBOL[s] || "");
}
const PARTNER_OF = { red: "yellow", yellow: "red", green: "blue", blue: "green" };
const NEXT_COLOR = { red: "green", green: "yellow", yellow: "blue", blue: "red" };

function buildDeck() {
  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = [];
  for (const s of suits) for (const r of ranks) deck.push(r + "-" + s);
  return deck;
}

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor((rng ? rng() : Math.random()) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rankOf(card) { return card.split("-")[0]; }

// Numeric movement value of a card for THIS player's current situation.
// Returns null for cards that are entry-only, or special (J = swap, 7 = split).
function moveValueOf(card, allPawnsIn) {
  const r = rankOf(card);
  if (r === "A") return allPawnsIn ? 1 : null;
  if (r === "K") return allPawnsIn ? 13 : null;
  if (r === "Q") return 12;
  if (r === "J") return null; // special: swap
  if (r === "4") return -4;
  return parseInt(r, 10); // 2..10 (7 also handled specially for split/early-capture)
}

function isEntryCard(card) {
  const r = rankOf(card);
  return r === "A" || r === "K";
}
function isJack(card) { return rankOf(card) === "J"; }
function isSeven(card) { return rankOf(card) === "7"; }

// ------------------------------------------------------------
// Game state shape (stored in Firebase under games/<roomId>):
// {
//   phase: "lobby" | "exchanging" | "playing" | "finished",
//   players: { <uid>: { name, color } },
//   dealerColor, turnColor,
//   deck: [cards...], hands: {red:[...],...}, pawns: {red:[p,p,p,p],...},
//   pendingExchange: { red: card|null, ... }  // only during "exchanging"
//   log: [...], winnerTeam: null, firstHandOfCycle: bool, hasDealtBefore: bool
// }
// pos >= 0  -> index 0..63 on the main loop
// pos < 0   -> -1 = in base (not in play)
// pos >= 1000 -> 1000+home-cell-index (0..3)
// ------------------------------------------------------------

// Identificativo di una singola partita (v6.19): serve alla classifica per
// registrare ogni risultato una volta sola. Solo lettere e cifre (va in un percorso).
function newGameId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function newGameState(playersByColor, roomMode) {
  const hands = {}, pawns = {};
  for (const c of COLORS) {
    hands[c] = [];
    pawns[c] = [-1, -1, -1, -1];
  }
  return {
    gameId: newGameId(),
    phase: "lobby",
    players: playersByColor,
    // "manual" = ognuno sceglie subito il proprio colore (comportamento
    // storico); "draw" = si entra con solo il nome e coppie/colori si
    // decidono con un'estrazione quando la stanza è piena. Vedi il blocco
    // "Estrazione squadre" più sotto.
    roomMode: roomMode || "manual",
    draft: roomMode === "draw"
      ? { players: {}, order: [], pairDraw: null, pairChoice: null, colorPicks: {}, botTokens: {} }
      : null,
    dealerColor: "red",
    turnColor: null,
    deck: [],
    hands,
    pawns,
    pendingExchange: {},
    playedThisCycle: [],
    // Contatore vittorie per squadra IN QUESTA STANZA — a differenza del
    // resto dello stato, resetForNewGame (il pulsante "Nuova partita" sulla
    // schermata di vittoria) non lo tocca: è lo storico della stanza, non
    // della singola partita.
    roomStats: { wins: { A: 0, B: 0 } },
    chat: [],
    log: [],
    winnerTeam: null,
    firstHandOfCycle: true,
    hasDealtBefore: false,
    lastSwap: null,
    lastCapture: null,
    lastReceivedCard: {},
  };
}

function normalizeState(state) {
  if (!state) return state;
  if (!Array.isArray(state.deck)) state.deck = [];
  if (!Array.isArray(state.log)) state.log = [];
  if (!Array.isArray(state.chat)) state.chat = [];
  if (!state.hands) state.hands = {};
  if (!state.pawns) state.pawns = {};
  if (!state.players) state.players = {};
  // Prenotazioni "leggere" (best-effort, non autoritative) scritte appena
  // qualcuno SELEZIONA un colore in lobby, prima ancora di premere "Entra
  // nella stanza" — vedi reserveColorPending/freshPendingColor. Servono
  // solo a mostrare un avviso agli altri; la vera assegnazione resta
  // sempre e solo quella (protetta da transazione) in joinManualRoom.
  if (!state.pending) state.pending = {};
  if (!state.pendingExchange) state.pendingExchange = {};
  if (!state.lastReceivedCard) state.lastReceivedCard = {};
  if (!Array.isArray(state.playedThisCycle)) state.playedThisCycle = [];
  if (!state.roomStats || !state.roomStats.wins) state.roomStats = { wins: { A: 0, B: 0 } };
  // Stanze create prima di questa funzionalità non hanno roomMode/draft:
  // trattale come "manual" (comportamento identico a prima).
  if (!state.roomMode) state.roomMode = "manual";
  if (state.roomMode === "draw" && !state.draft) {
    state.draft = { players: {}, order: [], pairDraw: null, pairChoice: null, colorPicks: {} };
  }
  if (state.draft) {
    if (!state.draft.players) state.draft.players = {};
    if (!Array.isArray(state.draft.order)) state.draft.order = [];
    if (!state.draft.colorPicks) state.draft.colorPicks = {};
    // token -> "easy"/"hard" per i posti dell'estrazione affidati al
    // computer (vedi assignBotToDraft) — assente nelle stanze create prima
    // di questa funzionalità, quindi trattato come "nessun bot".
    if (!state.draft.botTokens) state.draft.botTokens = {};
    if (!state.draft.playerIds) state.draft.playerIds = {};
  }
  for (const c of COLORS) {
    if (!Array.isArray(state.hands[c])) state.hands[c] = [];
    if (!Array.isArray(state.pawns[c])) state.pawns[c] = [-1, -1, -1, -1];
  }
  return state;
}

// Chat messages are capped so the stored state doesn't grow forever.
// `id` incrementale (stesso schema di recordCapture/lastSwap) — serve a
// botChatKeywordReply per ritrovare con certezza il messaggio giusto anche
// se altri messaggi arrivano nel frattempo, invece di fidarsi di un indice
// che può spostarsi.
function postChatMessage(state, color, text) {
  const clean = String(text || "").trim().slice(0, 200);
  if (!clean) return;
  const lastId = state.chat.length ? state.chat[state.chat.length - 1].id || 0 : 0;
  state.chat.push({ id: lastId + 1, color, text: clean, ts: Date.now() });
  if (state.chat.length > 100) state.chat = state.chat.slice(-100);
}

// Determina il primo mazziere della stanza pescando carte a turno (rosso,
// verde, giallo, blu, poi di nuovo rosso...) finché non esce l'Asso di
// Cuori: chi lo pesca dà le carte per primo. Calcolata una volta sola e
// salvata nello stato, così tutti i client mostrano la stessa identica
// sequenza durante l'animazione (vedi renderDealerDrawScreen).
function buildDealerDrawSequence() {
  const deck = shuffle(buildDeck());
  const order = COLORS;
  const sequence = [];
  for (let i = 0; i < deck.length; i++) {
    const card = deck[i];
    sequence.push({ color: order[i % 4], card });
    if (card === "A-hearts") break;
  }
  return { sequence, winnerColor: sequence[sequence.length - 1].color };
}

// Deal a new hand, then move into the blind card-exchange phase (instead of
// straight into play) — partners must each submit one card before anyone
// can start playing.
function dealNewHand(state) {
  let deck = state.deck.filter(Boolean);
  // Quante carte servono per QUESTA mano: 5 a testa se è la prima del giro
  // (mazzo appena rimescolato), altrimenti 4. PRIMA questo controllo usava
  // sempre "4 * 5" (20) a prescindere, quindi con le 32 carte rimaste dopo
  // la prima mano si faceva una sola mano da 4 (16 carte) e poi si
  // rimescolava con 16 carte ancora buone in mano — mai usate. Con un
  // mazzo da 52 le mani dovrebbero essere 5+4+4=13 a testa (13×4=52,
  // esatto, senza sprechi): ora il controllo usa la soglia giusta per la
  // mano che sta per essere data, non sempre quella della prima
  // (segnalato dall'utente: "ma se le carte sono 52" non tornava il conto
  // con solo 2 mani da 5+4=9 a testa, 16 carte restavano inutilizzate).
  const neededForThisHand = 4 * (state.firstHandOfCycle ? 5 : 4);
  if (deck.length < neededForThisHand) {
    deck = shuffle(buildDeck());
    state.firstHandOfCycle = true;
    // Nuovo mazzo intero rimescolato: tutte le carte viste finora nel giro
    // precedente non contano più nulla per il conteggio carte del bot.
    state.playedThisCycle = [];
    if (state.hasDealtBefore) {
      const order = COLORS;
      const prevIdx = order.indexOf(state.dealerColor);
      state.dealerColor = order[(prevIdx + 1) % 4];
    }
  }
  state.hasDealtBefore = true;
  const perPlayer = state.firstHandOfCycle ? 5 : 4;
  for (const c of COLORS) {
    state.hands[c] = deck.splice(0, perPlayer);
  }
  state.deck = deck;
  state.firstHandOfCycle = false;

  const order = COLORS;
  const dIdx = order.indexOf(state.dealerColor);
  state.turnColor = order[(dIdx + 1) % 4];
  state.turnStartedAt = Date.now();

  state.phase = "exchanging";
  state.pendingExchange = { red: null, green: null, yellow: null, blue: null };
  // Azzerata qui (non solo quando si risolve lo scambio) così l'evidenza
  // gold della mano precedente sparisce subito all'inizio della mano nuova,
  // anche se per qualche motivo quella carta fosse ancora in mano (es. non
  // giocata) — non deve restare evidenziata oltre la mano in cui è arrivata.
  state.lastReceivedCard = {};
  state.exchangeDebug = {};
  state.log.push(`Nuova mano distribuita (mazziere: ${cn(state.dealerColor)}). In attesa dello scambio tra compagni.`);
}

// Quante altre mani il mazziere può ancora dare col mazzo attuale prima del
// prossimo rimescolamento automatico (vedi dealNewHand): dopo la prima mano
// di un giro (5 a testa) restano sempre multipli di 16 (4 a testa × 4
// giocatori), quindi basta dividere per 16. Mostrata accanto all'icona del
// mazziere (vedi renderPlayerStatus) — richiesto dall'utente dopo aver
// scoperto il bug delle mani sprecate (v5.23).
function handsRemainingBeforeReshuffle(state) {
  return Math.max(0, Math.floor((state.deck ? state.deck.length : 0) / 16));
}

// A player submits one card, face-down, to give to their partner.
function submitExchangeCard(state, color, card) {
  if (state.phase !== "exchanging") throw new Error("non è il momento dello scambio");
  if (state.pendingExchange[color]) throw new Error("hai già scelto la tua carta");
  const hand = state.hands[color];
  const ci = hand.indexOf(card);
  if (ci === -1) throw new Error("carta non trovata in mano");
  // Solo per il registro completo di debug (downloadDebugDump): mano di
  // partenza, carta data e pedine in quel momento.
  if (!state.exchangeDebug) state.exchangeDebug = {};
  state.exchangeDebug[color] = { mano: hand.slice(), data: card, pedine: state.pawns[color].slice() };
  hand.splice(ci, 1);
  state.pendingExchange[color] = card;
  state.log.push(`${cn(color)} ha scelto la carta da scambiare.`);

  const allSubmitted = COLORS.every((c) => state.pendingExchange[c]);
  if (allSubmitted) {
    // Tiene traccia di quale carta ciascuno ha ricevuto (non quella data)
    // così renderHand può evidenziarla in mano — prima non si capiva quale
    // fosse, mescolata con le proprie.
    state.lastReceivedCard = {};
    for (const c of COLORS) {
      const received = state.pendingExchange[PARTNER_OF[c]];
      state.hands[c].push(received);
      state.lastReceivedCard[c] = received;
    }
    state.pendingExchange = {};
    state.phase = "playing";
    state.turnStartedAt = Date.now();
    state.log.push("Scambio completato, si comincia a giocare.");
  }
}

function allPawnsOnBoard(state, color) {
  return state.pawns[color].every((p) => p !== -1);
}

function pawnsInBase(state, color) {
  return state.pawns[color]
    .map((p, i) => (p === -1 ? i : -1))
    .filter((i) => i !== -1);
}

function stepsFromOwnBase(color, pos, lapped) {
  const base = BOARD.baseIndex[color];
  if (pos >= 1000) return null;
  // A pawn sitting exactly on its own base cell is ambiguous by position
  // alone: it's either freshly entered (0 steps travelled, needs an almost
  // full lap to reach home) or it just completed a full forward lap and
  // landed back on base (already at 64 steps, ready to turn into home on
  // the very next move). `lapped` — read from state.lapped, set true only
  // when a FORWARD move actually lands a pawn on its own base — resolves
  // the ambiguity. See hasLapped/setLapped.
  if (pos === base && lapped) return 64;
  return (pos - base + 64) % 64;
}

// Has this pawn, at some earlier point, completed a full forward lap and
// come to rest exactly on its own base cell? Only meaningful while the
// pawn is actually sitting there (pos === own base); otherwise irrelevant.
function hasLapped(state, color, pawnIndex) {
  return !!(state.lapped && state.lapped[color] && state.lapped[color][pawnIndex]);
}

function setLapped(state, color, pawnIndex, value) {
  if (!state.lapped) state.lapped = {};
  if (!state.lapped[color]) state.lapped[color] = [false, false, false, false];
  state.lapped[color][pawnIndex] = !!value;
}

// Pure wraparound on the shared 64-cell loop, ignoring anyone's home
// stretch entirely. Used to offer "keep going around" as an explicit
// alternative to turning into one's own home cells (entering home is a
// choice, never mandatory, per the rules).
function pathForwardLoopOnly(pos, n) {
  const steps = [];
  let cur = pos;
  for (let i = 0; i < n; i++) {
    cur = (cur + 1) % 64;
    steps.push(cur);
  }
  return steps;
}

// Sequence of intermediate positions (exclusive of start, inclusive of end)
// a pawn crosses moving forward `n` steps, turning into its own home
// stretch once it reaches/passes its base. Correctly continues within the
// home stretch if the pawn is already there. Returns null on overshoot
// past the last home cell (in that case pathForwardLoopOnly is still a
// valid alternative — see movesForValue).
function pathForward(color, pos, n, lapped) {
  const steps = [];
  const base = BOARD.baseIndex[color];
  if (pos >= 1000) {
    const curHomeIdx = pos - 1000;
    const nextIdx = curHomeIdx + n;
    if (nextIdx > 3) return null;
    for (let i = curHomeIdx + 1; i <= nextIdx; i++) steps.push(1000 + i);
    return steps;
  }
  const already = stepsFromOwnBase(color, pos, lapped);
  for (let i = 1; i <= n; i++) {
    const travelled = already + i;
    if (travelled > 64) {
      const homeIdx = travelled - 64 - 1;
      if (homeIdx > 3) return null;
      steps.push(1000 + homeIdx);
    } else if (travelled === 64) {
      steps.push(base);
    } else {
      steps.push((base + travelled) % 64);
    }
  }
  return steps;
}

function pathBackward(color, pos, n) {
  if (pos >= 1000) return null;
  const steps = [];
  let cur = pos;
  for (let i = 0; i < n; i++) {
    cur = (cur - 1 + 64) % 64;
    steps.push(cur);
  }
  return steps;
}

function occupantAt(state, pos) {
  for (const c of COLORS) {
    const idx = state.pawns[c].indexOf(pos);
    if (idx !== -1) return { color: c, pawnIndex: idx };
  }
  return null;
}

// Home cells are private to each color — position 1000+N is a completely
// different physical spot for red than for yellow. So "is this cell
// occupied" can only be asked meaningfully either on the shared loop
// (occupantAt, pos < 1000) or within ONE specific color's own home
// stretch (this helper). Never compare a raw home-cell number across
// colors — that's how a green pawn in its own casa#3 once made the game
// think yellow's casa#3 was occupied too.
function isBlockedAlongPath(state, color, cells) {
  return cells.some((p) => (p >= 1000 ? homeOccupant(state, color, p - 1000) !== -1 : !!occupantAt(state, p)));
}

function homeOccupant(state, color, homeIdx) {
  const pos = 1000 + homeIdx;
  return state.pawns[color].indexOf(pos); // -1 if none
}

function allPawnPositions(state) {
  const out = [];
  for (const c of COLORS) {
    state.pawns[c].forEach((pos, idx) => {
      if (pos !== -1) out.push({ color: c, pawnIndex: idx, pos });
    });
  }
  return out;
}

// Can this pawn legally end its move on `dest`? (checks the universal
// capture rule, with the one exception: a protected pawn on its own base
// can never be captured, so landing exactly on it is illegal.)
function destinationIsLegal(state, color, dest) {
  if (dest >= 1000) return homeOccupant(state, color, dest - 1000) === -1;
  const occ = occupantAt(state, dest);
  if (!occ) return true;
  return !isPawnProtected(state, occ.color, occ.pawnIndex);
}

// Standard (non-7) forward/backward move options for a single card value.
// Whenever the home-turning path and the "just keep circling the main
// loop" path lead to different places, BOTH are offered — entering one's
// own home is always a choice, never mandatory.
function movesForValue(state, color, value) {
  const options = [];
  state.pawns[color].forEach((pos, pawnIndex) => {
    if (pos === -1) return;
    if (value > 0) {
      const addIfLegal = (path) => {
        if (!path) return;
        const mid = path.slice(0, -1);
        if (isBlockedAlongPath(state, color, mid)) return; // can't pass over anyone
        const dest = path[path.length - 1];
        if (destinationIsLegal(state, color, dest)) {
          options.push({ type: "move", pawnIndex, path });
        }
      };
      const homePath = pathForward(color, pos, value, hasLapped(state, color, pawnIndex));
      addIfLegal(homePath);
      if (pos < 1000) {
        const loopPath = pathForwardLoopOnly(pos, value);
        const homeDest = homePath ? homePath[homePath.length - 1] : null;
        const loopDest = loopPath[loopPath.length - 1];
        // only add the loop alternative when it actually differs from (or
        // replaces, on overshoot) the home-turning path — i.e. this move
        // genuinely reaches/crosses the pawn's own base.
        if (homeDest === null || homeDest !== loopDest) addIfLegal(loopPath);
      }
    } else {
      const path = pathBackward(color, pos, -value);
      if (!path) return;
      const mid = path.slice(0, -1);
      const blocked = isBlockedAlongPath(state, color, mid);
      if (!blocked) {
        const dest = path[path.length - 1];
        if (destinationIsLegal(state, color, dest)) options.push({ type: "move", pawnIndex, path });
      }
    }
  });
  return options;
}

// Legal move OPTIONS for a card. Each option describes a distinct way to
// play it: {type:"enter",pawnIndex} | {type:"move",pawnIndex,path} |
// {type:"jack"} (opens a 2-pawn picker in the UI) |
// {type:"seven"} (opens the split allocator in the UI, only offered when
// at least one valid distribution exists).
function legalMovesForCard(state, color, card) {
  const options = [];
  const allIn = allPawnsOnBoard(state, color);

  if (isEntryCard(card) && !allIn) {
    const inBase = pawnsInBase(state, color);
    if (inBase.length > 0) options.push({ type: "enter", pawnIndex: inBase[0] });
  }

  if (isJack(card)) {
    // pawns already "a casa" (home) don't count as "in gioco" for this
    // precondition — only pawns actually on the main loop do.
    const hasOwnPawnOnBoard = state.pawns[color].some((p) => p >= 0 && p < 1000);
    const targets = jackableTargets(state);
    if (hasOwnPawnOnBoard && targets.length >= 2) options.push({ type: "jack" });
    return options; // Jack has no other use
  }

  if (isSeven(card)) {
    if (sevenHasAnyDistribution(state, color)) options.push({ type: "seven" });
    // fall through: a plain 7-on-one-pawn move is just a distribution of
    // {pawnIndex: 7}, already covered by sevenHasAnyDistribution/apply.
    return options;
  }

  const value = moveValueOf(card, allIn);
  if (value !== null) {
    options.push(...movesForValue(state, color, value));
  }
  return options;
}

// A pawn sitting on the base cell, never yet moved, cannot be chosen for
// the Jack swap. We track "never moved" implicitly: a pawn is on its own
// base index AND got there via entry — we approximate this as "pawn is
// exactly on its own base cell" (matches the physical-board rule closely
// enough: once it steps off, it's fair game again).
function protectedPawnIndex(state, color) {
  const baseIdx = BOARD.baseIndex[color];
  const idx = state.pawns[color].indexOf(baseIdx);
  if (idx === -1) return -1;
  if (hasLapped(state, color, idx)) return -1; // already completed a lap: not "just entered" anymore
  return idx;
}

function isPawnProtected(state, color, pawnIndex) {
  return protectedPawnIndex(state, color) === pawnIndex;
}

// ---- Jack: swap any two pawns on the board (not the protected one) ----
// A pawn resting in a home cell is off-limits for the Jack entirely — a
// home cell's numeric position (1000+N) means a different physical spot
// for each color, so swapping one in or out of home can never be made to
// work consistently across colors. The Jack only ever touches pawns still
// on the shared main loop.
function jackableTargets(state) {
  return allPawnPositions(state).filter(
    (p) => p.pos < 1000 && !isPawnProtected(state, p.color, p.pawnIndex)
  );
}

function applyJackSwap(state, a, b, active) {
  const posA = state.pawns[a.color][a.pawnIndex];
  const posB = state.pawns[b.color][b.pawnIndex];
  if (posA >= 1000 || posB >= 1000) {
    throw new Error("il Jack non può coinvolgere una pedina già in casa");
  }
  state.pawns[a.color][a.pawnIndex] = posB;
  state.pawns[b.color][b.pawnIndex] = posA;
  // a Jack swap is a teleport, not a completed forward lap, so the "lapped"
  // flag can't mean "finished a real lap" here — but it still has to say
  // whether a pawn now sitting exactly on ITS OWN base cell counts as
  // "just entered" (protected from further Jacks, 0 steps travelled) or
  // not. A pawn eligible for a Jack swap was always already out of home
  // (jackableTargets only offers pawns with pos < 1000), so it can never
  // be a fresh entry — landing back on its own base via a swap is always a
  // revisit, never a first deployment. Marking it lapped=true when that
  // happens keeps it correctly UNPROTECTED and ready for the home
  // stretch, instead of wrongly re-flagging it as "just entered" (bug
  // reported: a pawn Jacked onto its own base became un-jackable
  // afterwards). When the destination isn't the pawn's own base cell, the
  // flag is irrelevant (see stepsFromOwnBase), so false is a safe default.
  setLapped(state, a.color, a.pawnIndex, posB === BOARD.baseIndex[a.color]);
  setLapped(state, b.color, b.pawnIndex, posA === BOARD.baseIndex[b.color]);
  // Il Jack può scambiare DUE PEDINE QUALSIASI sul percorso, non
  // necessariamente quella di chi gioca la carta — quindi il colore di chi
  // ha effettivamente giocato (active) va detto esplicitamente, altrimenti
  // il log nomina solo i due colori scambiati e chi ha agito scompare (bug
  // segnalato: "il colore nel log non è esatto"). `active` è opzionale per
  // compatibilità con le simulazioni interne del bot, che scartano il log.
  const actorPrefix = active ? `${cn(active)} gioca un Jack: ` : `scambio (Jack) tra `;
  state.log.push(`${actorPrefix}${cn(a.color)}#${a.pawnIndex + 1} (${posLabel(a.color, posA)}→${posLabel(a.color, posB)}) e ${cn(b.color)}#${b.pawnIndex + 1} (${posLabel(b.color, posB)}→${posLabel(b.color, posA)}).`);
  bumpStat(state, "swaps", active);
  // recorded so every client can flash/highlight the swap on the board
  state.lastSwap = {
    id: (state.lastSwap && state.lastSwap.id ? state.lastSwap.id : 0) + 1,
    ts: Date.now(),
    a: { color: a.color, pawnIndex: a.pawnIndex, from: posA, to: posB },
    b: { color: b.color, pawnIndex: b.pawnIndex, from: posB, to: posA },
  };
}

// ---- 7: split freely across any of your own pawns in play, in whatever
// amounts you like as long as they sum to 7. Each portion may capture
// early (stopping before using all its allocated steps if it reaches an
// enemy). Portions are resolved IN ORDER — the first pawn actually moves
// before the second one's path is checked, so a pawn can vacate a cell
// (or step off the base) and let the very next portion use that freed
// path or open home slot in the same turn. ----

// Walks the full N-step path for one pawn. Unlike every other card, the 7
// may capture a pawn found ALONG THE WAY (not just at the very last step)
// and keep going, using its full allotted steps to the very end — it
// doesn't stop the moment it captures — anche le PROPRIE pedine (regola
// confermata, v5.30: col 7 si mangiano le proprie pedine come quelle degli
// avversari, anche a metà strada). Blocked entirely only by a protected
// pawn or an occupied home cell anywhere on the path.
// Validates one candidate path (capture/blocking rules), or returns null.
function sevenCheckPath(state, color, path, allowEarlyCapture) {
  if (!path) return null;
  for (let i = 0; i < path.length; i++) {
    const cell = path[i];
    if (cell >= 1000) {
      const homeOcc = homeOccupant(state, color, cell - 1000);
      if (homeOcc !== -1) return null; // home cells are safe, can't land/pass
      continue;
    }
    const occ = occupantAt(state, cell);
    if (occ) {
      if (isPawnProtected(state, occ.color, occ.pawnIndex)) return null; // never capturable
      const isLastStep = i === path.length - 1;
      if (!isLastStep && !allowEarlyCapture) return null; // blocked mid-path
      // otherwise: capture this one and keep going toward the full distance
    }
  }
  return path;
}

function sevenSinglePawnPath(state, color, pos, steps, allowEarlyCapture, lapped) {
  // Try turning into home first...
  const homePath = sevenCheckPath(state, color, pathForward(color, pos, steps, lapped), allowEarlyCapture);
  if (homePath) return homePath;
  // ...but entering home is never mandatory (same rule as every other
  // card): if that route is blocked (or doesn't even reach home), a pawn
  // still on the loop can just keep going around instead. Without this
  // fallback the 7 had no way to use the "vacate a home slot with part of
  // the 7, keep the rest circling" workaround the rules describe.
  if (pos < 1000) {
    const loopPath = sevenCheckPath(state, color, pathForwardLoopOnly(pos, steps), allowEarlyCapture);
    if (loopPath) return loopPath;
  }
  return null;
}

function clonePawns(pawns) {
  const out = {};
  for (const c of COLORS) out[c] = pawns[c].slice();
  return out;
}

// Applies one portion's landing to a (possibly scratch) pawns object —
// shared by validation (on a scratch copy) and the real application (on
// the live state), so both follow the exact same step-by-step logic.
function landSevenPortion(pawnsObj, color, pawnIndex, path) {
  for (const cell of path) {
    if (cell >= 1000) continue;
    for (const c of COLORS) {
      const idx = pawnsObj[c].indexOf(cell);
      if (idx !== -1) { pawnsObj[c][idx] = -1; break; }
    }
  }
  const dest = path[path.length - 1];
  pawnsObj[color][pawnIndex] = dest;
}

function sevenHasAnyDistribution(state, color) {
  const inPlay = state.pawns[color].map((p, i) => i).filter((i) => state.pawns[color][i] !== -1);
  if (inPlay.length === 0) return false;
  // whole 7 on a single pawn
  for (const idx of inPlay) {
    if (sevenValidateDistribution(state, color, [{ pawnIndex: idx, steps: 7 }])) return true;
  }
  // any split of 7 into positive parts across 2..N of the in-play pawns
  function tryAmounts(pawnIndices, remaining, idx, acc) {
    if (idx === pawnIndices.length - 1) {
      if (remaining <= 0) return false;
      const dist = acc.concat([{ pawnIndex: pawnIndices[idx], steps: remaining }]);
      return !!sevenValidateDistribution(state, color, dist);
    }
    for (let s = 1; s < remaining; s++) {
      const dist = acc.concat([{ pawnIndex: pawnIndices[idx], steps: s }]);
      if (tryAmounts(pawnIndices, remaining - s, idx + 1, dist)) return true;
    }
    return false;
  }
  for (let size = 2; size <= inPlay.length; size++) {
    for (const combo of kSubsets(inPlay, size)) {
      if (tryAmounts(combo, 7, 0, [])) return true;
    }
  }
  // Anche una distribuzione "estesa" conta: se una parte del 7 basta a
  // mandare TUTTE le proprie pedine a casa, i passi rimasti possono
  // proseguire su quelle del compagno (vedi sevenValidateDistribution) — un
  // 7 che sarebbe altrimenti "senza mosse legali" per il solo giocatore può
  // comunque essere giocabile così, quindi va offerto come opzione.
  return sevenHasAnyLeftoverToPartner(state, color);
}

// Genera TUTTE le possibili distribuzioni combinatorie (sottoinsieme +
// ripartizione) di `total` passi sulle pedine indicate in `indices` — senza
// ancora validarle contro il tabellone (percorsi bloccati, caselle-casa
// occupate, ecc.). Fattorizzato fuori da sevenHasAnyDistribution/
// botSevenDistributions così lo stesso generatore serve anche per il nuovo
// caso "parte del 7 alle mie pedine, il resto al compagno".
function sevenAllSplitsOfTotal(indices, total) {
  const out = [];
  if (!indices || indices.length === 0 || total <= 0) return out;
  for (const idx of indices) out.push([{ pawnIndex: idx, steps: total }]);
  function rec(pawnIndices, remaining, idx, acc) {
    if (idx === pawnIndices.length - 1) {
      if (remaining > 0) out.push(acc.concat([{ pawnIndex: pawnIndices[idx], steps: remaining }]));
      return;
    }
    for (let s = 1; s < remaining; s++) {
      rec(pawnIndices, remaining - s, idx + 1, acc.concat([{ pawnIndex: pawnIndices[idx], steps: s }]));
    }
  }
  for (let size = 2; size <= indices.length; size++) {
    for (const combo of kSubsets(indices, size)) rec(combo, total, 0, []);
  }
  return out;
}

// Da uno "snapshot" completo delle pedine (tutti e 4 i colori, es. dopo
// aver già applicato parte di un 7 su qualcun altro), esiste un modo
// legale di applicare `total` passi sulle pedine in gioco di `targetColor`?
// Non richiede che finiscano tutte a casa — usata per verificare se il
// COMPAGNO può davvero assorbire i passi avanzati di un 7 altrui.
function sevenSplitValidatesFromSnapshot(pawnsSnapshot, targetColor, lappedFn, total, lappedState) {
  const inPlay = pawnsSnapshot[targetColor].map((p, i) => i).filter((i) => pawnsSnapshot[targetColor][i] !== -1);
  if (inPlay.length === 0 || total <= 0) return false;
  for (const dist of sevenAllSplitsOfTotal(inPlay, total)) {
    for (const perm of permutations(dist)) {
      const scratch = clonePawns(pawnsSnapshot);
      let ok = true;
      for (const { pawnIndex, steps } of perm) {
        const pos = scratch[targetColor][pawnIndex];
        if (pos === undefined || pos === -1) { ok = false; break; }
        const path = sevenSinglePawnPath({ pawns: scratch, lapped: lappedState }, targetColor, pos, steps, true, lappedFn(pawnIndex));
        if (!path) { ok = false; break; }
        landSevenPortion(scratch, targetColor, pawnIndex, path);
      }
      if (ok) return true;
    }
  }
  return false;
}

// Esiste una ripartizione del 7 in cui una PARTE (1..6 passi) sulle proprie
// pedine le manda TUTTE a casa, e i passi rimasti (7 meno quella parte)
// possono davvero essere usati su almeno una pedina del compagno? Questa è
// la regola: "se con l'ultima porzione di un 7 completo tutte le mie
// pedine in casa, i passi avanzati proseguono sulle pedine del compagno con
// cui inizio a muovere, visto che le mie sono tutte in casa".
function sevenHasAnyLeftoverToPartner(state, color) {
  const partner = PARTNER_OF[color];
  const ownInPlay = state.pawns[color].map((p, i) => i).filter((i) => state.pawns[color][i] !== -1);
  const partnerInPlay = state.pawns[partner].map((p, i) => i).filter((i) => state.pawns[partner][i] !== -1);
  if (ownInPlay.length === 0 || partnerInPlay.length === 0) return false;
  for (let ownTotal = 1; ownTotal <= 6; ownTotal++) {
    const leftover = 7 - ownTotal;
    for (const ownDist of sevenAllSplitsOfTotal(ownInPlay, ownTotal)) {
      const ownResult = sevenValidateOwnPortions(state, color, ownDist);
      if (!ownResult || !ownResult.allHome) continue;
      if (sevenSplitValidatesFromSnapshot(ownResult.pawns, partner, (i) => hasLapped(state, partner, i), leftover, state.lapped)) {
        return true;
      }
    }
  }
  return false;
}

// Vero se esiste ALMENO UNA distribuzione valida del 7 in cui `pawnIndex`
// riceve un numero di passi > 0 — usata per non proporre nello splitter
// pedine che sono già bloccate/a fine percorso e non potrebbero comunque
// muovere nemmeno un passo, qualunque combinazione si provi.
function sevenPawnCanReceiveSteps(state, color, pawnIndex) {
  const inPlay = state.pawns[color].map((p, i) => i).filter((i) => state.pawns[color][i] !== -1);
  if (!inPlay.includes(pawnIndex)) return false;
  if (sevenValidateDistribution(state, color, [{ pawnIndex, steps: 7 }])) return true;
  const others = inPlay.filter((i) => i !== pawnIndex);
  function tryAmounts(pawnIndices, remaining, idx, acc) {
    if (idx === pawnIndices.length - 1) {
      if (remaining <= 0) return false;
      const dist = acc.concat([{ pawnIndex: pawnIndices[idx], steps: remaining }]);
      return !!sevenValidateDistribution(state, color, dist);
    }
    for (let s = 1; s < remaining; s++) {
      const dist = acc.concat([{ pawnIndex: pawnIndices[idx], steps: s }]);
      if (tryAmounts(pawnIndices, remaining - s, idx + 1, dist)) return true;
    }
    return false;
  }
  for (let size = 0; size <= others.length; size++) {
    for (const combo of kSubsets(others, size)) {
      const group = [pawnIndex, ...combo];
      if (tryAmounts(group, 7, 0, [])) return true;
    }
  }
  return false;
}

// v5.66: pedine da proporre nel foglio del 7 — solo quelle che possono
// davvero ricevere almeno un passo in una distribuzione valida. Prima, quando
// il 7 poteva far proseguire i passi avanzati sul compagno, comparivano
// TUTTE le proprie pedine (anche bloccate o già all'ultima casella di casa).
function sevenMovableOwnPawns(state, color) {
  const inPlay = state.pawns[color].map((p, i) => i).filter((i) => state.pawns[color][i] !== -1);
  const ok = new Set(inPlay.filter((i) => sevenPawnCanReceiveSteps(state, color, i)));
  if (ok.size < inPlay.length) {
    const partner = PARTNER_OF[color];
    for (let ownTotal = 1; ownTotal <= 6; ownTotal++) {
      for (const ownDist of sevenAllSplitsOfTotal(inPlay, ownTotal)) {
        if (ownDist.every((d) => ok.has(d.pawnIndex))) continue; // non aggiunge nulla di nuovo
        const ownResult = sevenValidateOwnPortions(state, color, ownDist);
        if (!ownResult || !ownResult.allHome) continue;
        if (sevenSplitValidatesFromSnapshot(ownResult.pawns, partner, (i) => hasLapped(state, partner, i), 7 - ownTotal, state.lapped)) {
          ownDist.forEach((d) => ok.add(d.pawnIndex));
        }
      }
    }
  }
  return inPlay.filter((i) => ok.has(i));
}

// Pedine del compagno che possono ricevere almeno un passo dei `total` passi
// avanzati, partendo dalla posizione dopo le porzioni proprie (snapshot).
function sevenMovablePartnerPawns(state, color, pawnsSnapshot, total) {
  const partner = PARTNER_OF[color];
  const inPlay = pawnsSnapshot[partner].map((p, i) => i).filter((i) => pawnsSnapshot[partner][i] !== -1);
  const ok = new Set();
  for (const dist of sevenAllSplitsOfTotal(inPlay, total)) {
    if (dist.every((d) => ok.has(d.pawnIndex))) continue;
    for (const perm of permutations(dist)) {
      const scratch = clonePawns(pawnsSnapshot);
      let good = true;
      for (const { pawnIndex, steps } of perm) {
        const pos = scratch[partner][pawnIndex];
        if (pos === undefined || pos === -1) { good = false; break; } // mangiata da una porzione precedente
        const path = sevenSinglePawnPath({ pawns: scratch, lapped: state.lapped }, partner, pos, steps, true, hasLapped(state, partner, pawnIndex));
        if (!path) { good = false; break; }
        landSevenPortion(scratch, partner, pawnIndex, path);
      }
      if (good) { dist.forEach((d) => ok.add(d.pawnIndex)); break; }
    }
  }
  return inPlay.filter((i) => ok.has(i));
}

function kSubsets(arr, k) {
  const out = [];
  function rec(start, chosen) {
    if (chosen.length === k) { out.push(chosen.slice()); return; }
    for (let i = start; i < arr.length; i++) {
      chosen.push(arr[i]);
      rec(i + 1, chosen);
      chosen.pop();
    }
  }
  rec(0, []);
  return out;
}

function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permutations(rest)) out.push([arr[i]].concat(p));
  }
  return out;
}

// Prova ogni ORDINE possibile per la parte di distribuzione che tocca le
// proprie pedine (`ownDistribution` — [{pawnIndex, steps}, ...], somma
// libera, non necessariamente 7) e restituisce il primo ordine che
// funziona: {order, paths, pawns, allHome}, dove `pawns` è lo snapshot
// completo (tutti i colori) dopo quella parte e `allHome` dice se questo
// ha mandato TUTTE le proprie 4 pedine a casa. null se nessun ordine è
// legale. Factored out di sevenValidateDistribution così lo stesso
// controllo serve anche per capire, in corso d'opera (splitter UI, bot),
// se i passi rimasti di un 7 possono già proseguire sul compagno.
function sevenValidateOwnPortions(state, color, ownDistribution) {
  const ordered = (ownDistribution || []).filter((d) => d.steps > 0);
  if (ordered.length === 0) {
    return { order: [], paths: [], pawns: clonePawns(state.pawns), allHome: state.pawns[color].every((p) => p >= 1000) };
  }
  // v6.16: fra gli ordini che funzionano sceglie quello che porta in casa
  // PIÙ pedine (segnalato: Blu con #3 a 5 caselle dalla base e #4 in
  // casa#1, 7 diviso 6+1: il primo ordine provato muoveva #3 per prima,
  // trovava casa#1 occupata e la faceva proseguire sul giro; muovendo
  // prima #4 in casa#2, #3 poteva entrare in casa#1).
  let best = null;
  for (const perm of permutations(ordered)) {
    const scratch = clonePawns(state.pawns);
    const order = [];
    const paths = [];
    let ok = true;
    for (const { pawnIndex, steps } of perm) {
      const pos = scratch[color][pawnIndex];
      if (pos === undefined || pos === -1) { ok = false; break; }
      const path = sevenSinglePawnPath({ pawns: scratch, lapped: state.lapped }, color, pos, steps, true, hasLapped(state, color, pawnIndex));
      if (!path) { ok = false; break; }
      landSevenPortion(scratch, color, pawnIndex, path);
      order.push({ color, pawnIndex });
      paths.push(path);
    }
    if (ok) {
      const homeCount = scratch[color].filter((p) => p >= 1000).length;
      if (!best || homeCount > best.homeCount) {
        best = { order, paths, pawns: scratch, allHome: homeCount === scratch[color].length, homeCount };
      }
      if (best.allHome || ordered.length === 1) break; // meglio di così non si può
    }
  }
  if (!best) return null;
  return { order: best.order, paths: best.paths, pawns: best.pawns, allHome: best.allHome };
}

// Validates a distribution — [{pawnIndex, steps, forPartner?}, ...] summing
// to 7 — by trying every ORDER the given portions could be resolved in
// (since which pawn moves first can matter: it may vacate a cell or step
// off the base for the next one). The player only picks how many steps
// each pawn gets; the engine finds a working sequence if one exists.
//
// `forPartner: true` marks a portion that moves one of the PARTNER's
// pawns instead of the acting player's own — only legal for the portions
// that come AFTER every one of the acting player's own pawns has already
// been sent home by an earlier portion of this same 7 (regola: se durante
// un 7 tutte le proprie pedine finiscono in casa, i passi avanzati
// proseguono sulle pedine del compagno, visto che le proprie sono finite —
// lo stesso concetto di activeColorFor applicato a metà di una giocata di
// 7, non solo a inizio turno).
function sevenValidateDistribution(state, color, distribution) {
  const ordered = distribution.filter((d) => d.steps > 0);
  const total = ordered.reduce((s, d) => s + d.steps, 0);
  if (total !== 7) return null;
  if (ordered.length === 0) return null;

  const partner = PARTNER_OF[color];
  const ownPortions = ordered.filter((d) => !d.forPartner);
  const partnerPortions = ordered.filter((d) => d.forPartner);
  // Passi del compagno senza aver prima mandato a casa le proprie pedine
  // con QUESTO 7 non hanno senso qui: se le proprie pedine erano già tutte
  // a casa PRIMA di giocare la carta, chi gioca è già il compagno stesso
  // (vedi activeColorFor) — quel caso passa già dal percorso normale.
  if (partnerPortions.length > 0 && ownPortions.length === 0) return null;

  const ownResult = sevenValidateOwnPortions(state, color, ownPortions);
  if (!ownResult) return null;
  if (partnerPortions.length === 0) {
    return { order: ownResult.order, paths: ownResult.paths };
  }
  if (!ownResult.allHome) return null; // i passi passano al compagno solo quando la propria squadra è già tutta in casa

  for (const perm of permutations(partnerPortions)) {
    const scratch = clonePawns(ownResult.pawns);
    const order = ownResult.order.slice();
    const paths = ownResult.paths.slice();
    let ok = true;
    for (const { pawnIndex, steps } of perm) {
      const pos = scratch[partner][pawnIndex];
      if (pos === undefined || pos === -1) { ok = false; break; }
      const path = sevenSinglePawnPath({ pawns: scratch, lapped: state.lapped }, partner, pos, steps, true, hasLapped(state, partner, pawnIndex));
      if (!path) { ok = false; break; }
      landSevenPortion(scratch, partner, pawnIndex, path);
      order.push({ color: partner, pawnIndex });
      paths.push(path);
    }
    if (ok) return { order, paths };
  }
  return null;
}

function applySevenDistribution(state, color, distribution) {
  const validated = sevenValidateDistribution(state, color, distribution);
  if (!validated) throw new Error("distribuzione del 7 non valida");
  const { order, paths } = validated;
  const moves = [];
  // Una porzione per ogni pedina toccata dal 7 (fino a 4, ora eventualmente
  // anche del compagno — vedi sevenValidateDistribution) — servono TUTTE,
  // non solo l'ultima, per poter "rivedere" l'intera giocata (vedi
  // recordLastSeven/flashSevenReplay): un semplice recordLastMove per
  // porzione veniva sovrascritto a ogni giro, quindi il replay a comando
  // mostrava solo l'ultima pedina mossa, come se le altre non si fossero
  // mai spostate.
  const portions = [];
  for (let i = 0; i < order.length; i++) {
    const pc = order[i].color; // colore della pedina toccata da QUESTA porzione (può differire da `color` se è del compagno)
    const pawnIndex = order[i].pawnIndex;
    const path = paths[i];
    const dest = path[path.length - 1];
    const oldPos = state.pawns[pc][pawnIndex];
    // capture EVERY pawn found anywhere along this portion's path, not
    // just at the final resting cell — the 7 keeps going after eating.
    for (const cell of path) {
      if (cell >= 1000) continue;
      const occ = occupantAt(state, cell);
      if (occ) {
        recordCapture(state, occ, cell, pc);
        state.log.push(`${cn(pc)} mangia ${cn(occ.color)} con parte del 7.`);
      }
    }
    state.pawns[pc][pawnIndex] = dest;
    if (oldPos < 1000 && dest >= 1000) recordHomeEntry(state, pc, pawnIndex, dest);
    setLapped(state, pc, pawnIndex, dest < 1000 && dest === BOARD.baseIndex[pc]);
    const label = pc === color ? `#${pawnIndex + 1}` : `${cn(pc)}#${pawnIndex + 1}`;
    moves.push(`${label} ${posLabel(pc, oldPos)}→${posLabel(pc, dest)}`);
    portions.push({ pawnIndex, from: oldPos, path: path.slice(), color: pc });
  }
  recordLastSeven(state, color, portions);
  const usedPartner = portions.some((p) => p.color !== color);
  const tail = usedPartner
    ? ` (${cn(color)} finisce in casa a metà 7: il resto continua sulle pedine di ${cn(PARTNER_OF[color])})`
    : "";
  state.log.push(`${cn(color)} gioca il 7 (${moves.join("; ")}).${tail}`);
  checkWin(state);
}

// Records the last capture so every client can flash it on the board —
// same mechanism as lastSwap for the Jack.
function bumpStat(state, kind, color) {
  if (!color) return;
  if (!state.stats) state.stats = {};
  if (!state.stats[kind]) state.stats[kind] = {};
  state.stats[kind][color] = (state.stats[kind][color] || 0) + 1;
}

function recordCapture(state, occ, atPos, byColor) {
  if (byColor && byColor !== occ.color) {
    bumpStat(state, "capt", byColor);
    bumpStat(state, "lost", occ.color);
  }
  state.lastCapture = {
    id: (state.lastCapture && state.lastCapture.id ? state.lastCapture.id : 0) + 1,
    ts: Date.now(),
    color: occ.color,
    pawnIndex: occ.pawnIndex,
    atPos,
    by: byColor || null,
  };
  state.pawns[occ.color][occ.pawnIndex] = -1;
  setLapped(state, occ.color, occ.pawnIndex, false);
}

// Stesso meccanismo di lastCapture/lastSwap/lastHomeEntry, ma per QUALSIASI
// mossa (anche una semplice, senza mangiata né arrivo in casa) — usato dal
// pulsante "🔁 Rivedi ultima mossa": quelle altre tre hanno già un flash
// automatico dedicato, ma una mossa "normale" fin qui non aveva nessun
// evento tracciato da poter rievocare a comando.
function recordLastMove(state, color, pawnIndex, toPos, fromPos) {
  state.lastMove = {
    id: (state.lastMove && state.lastMove.id ? state.lastMove.id : 0) + 1,
    ts: Date.now(),
    color,
    pawnIndex,
    pos: toPos,
    // Posizione di partenza (facoltativa: -1/undefined se la pedina entra
    // in gioco) — usata da "Rivedi ultima mossa" per far scorrere davvero
    // una pedina-fantasma dal punto di partenza a quello di arrivo, invece
    // di limitarsi a un anello statico sulla casella finale (che passava
    // facilmente inosservato — segnalato: "non fa rivedere l'ultimo
    // movimento").
    from: fromPos,
  };
}

// Stesso meccanismo di lastCapture/lastSwap, ma per l'arrivo in una delle
// caselle-casa: ogni client può così far scattare un piccolo festeggiamento
// visivo sulla pedina appena arrivata (vedi flashHomeEntry in renderPawns).
function recordHomeEntry(state, color, pawnIndex, homePos) {
  state.lastHomeEntry = {
    id: (state.lastHomeEntry && state.lastHomeEntry.id ? state.lastHomeEntry.id : 0) + 1,
    ts: Date.now(),
    color,
    pawnIndex,
    pos: homePos,
  };
}

// Stesso meccanismo di lastMove/lastCapture/lastSwap, ma per il 7: la carta
// può spezzare i 7 passi su più pedine (fino a 4), quindi un singolo
// recordLastMove per porzione (sovrascritto a ogni giro) mostrava solo
// l'ultima pedina toccata in "Rivedi ultima mossa", come se le altre non si
// fossero mosse. Qui si tiene traccia di TUTTE le porzioni della stessa
// giocata, con il percorso REALE già calcolato da applySevenDistribution
// (non ricostruito a posteriori come per una mossa normale).
function recordLastSeven(state, color, portions) {
  state.lastSeven = {
    id: (state.lastSeven && state.lastSeven.id ? state.lastSeven.id : 0) + 1,
    ts: Date.now(),
    color,
    portions, // [{ pawnIndex, from, path }, ...]
  };
}

function anyLegalMove(state, color) {
  for (const card of state.hands[color]) {
    if (legalMovesForCard(state, color, card).length > 0) return true;
  }
  return false;
}

// Human-friendly position label: describes a loop cell as "N caselle
// prima/dopo la base di <color>" — directly countable on the physical
// board — instead of a raw internal index nobody can cross-check.
function posLabel(color, pos) {
  if (pos === -1) return "base";
  if (pos >= 1000) return `casa#${pos - 1000 + 1}`;
  const stepsBefore = (64 - stepsFromOwnBase(color, pos)) % 64; // 0 = on the base itself
  if (stepsBefore === 0) return `sulla base di ${cn(color)}`;
  if (stepsBefore <= 32) return `${stepsBefore} caselle prima della base di ${cn(color)}`;
  return `${64 - stepsBefore} caselle dopo la base di ${cn(color)}`;
}

function applyMove(state, color, card, move) {
  // The card always comes out of the CURRENT TURN's own hand — not
  // necessarily `color`'s hand. Once a player's own 4 pawns are all home,
  // they spend their turn playing a card from their OWN hand to move
  // their partner's pawns instead (see activeColorFor); `color` here is
  // whichever pawns actually move, while the card itself is state.turnColor's.
  const handOwner = state.turnColor && state.hands[state.turnColor] ? state.turnColor : color;
  const hand = state.hands[handOwner];
  const ci = hand.indexOf(card);
  if (ci !== -1) hand.splice(ci, 1);
  // Mostrata vicino all'indicatore di turno (vedi renderTurnIndicator) così
  // si vede a colpo d'occhio quale carta ha appena giocato chiunque altro,
  // senza dover aprire il registro (ora chiuso di default). handOwner, non
  // `color`: è la carta di chi ha giocato il turno, anche quando muove le
  // pedine del compagno. Assente sulle simulazioni interne del bot, stesso
  // discorso di playedThisCycle qui sopra/sotto.
  if (state.playedThisCycle) {
    state.lastCardPlayed = {
      id: (state.lastCardPlayed && state.lastCardPlayed.id ? state.lastCardPlayed.id : 0) + 1,
      ts: Date.now(),
      color: handOwner,
      card,
      burned: false,
    };
  }
  // Traccia le carte REALMENTE giocate in questo giro di mazzo (non quelle
  // scambiate all'inizio mano, che restano semplicemente in un'altra mano)
  // — usato dal "conteggio carte" del bot per stimare quante carte di un
  // certo valore siano ancora verosimilmente in circolazione. Assente
  // (undefined) sulle copie di stato usate dalle simulazioni interne del
  // bot (botSimulate/botCloneStateForSearch), che quindi non la popolano:
  // giusto così, quelle sono mosse ipotetiche, non mosse reali della
  // partita.
  if (state.playedThisCycle) state.playedThisCycle.push(card);

  if (move.type === "enter") {
    const baseIdx = BOARD.baseIndex[color];
    const occ = occupantAt(state, baseIdx);
    if (occ) {
      recordCapture(state, occ, baseIdx, color);
      state.log.push(`${cn(occ.color)} mangiata sulla base da ${cn(color)} che entra.`);
    }
    state.pawns[color][move.pawnIndex] = baseIdx;
    setLapped(state, color, move.pawnIndex, false); // fresh entry, hasn't lapped
    recordLastMove(state, color, move.pawnIndex, baseIdx, -1);
    state.log.push(`${cn(color)} #${move.pawnIndex + 1} entra in gioco con ${cardLog(card)} (sulla base).`);
    return;
  }

  if (move.type === "move") {
    const oldPos = state.pawns[color][move.pawnIndex];
    const wasLapped = hasLapped(state, color, move.pawnIndex);
    const dest = move.path[move.path.length - 1];
    if (dest < 1000) {
      const occ = occupantAt(state, dest);
      if (occ) {
        recordCapture(state, occ, dest, color);
        state.log.push(`${cn(color)} mangia ${cn(occ.color)} con ${cardLog(card)}.`);
      }
    }
    state.pawns[color][move.pawnIndex] = dest;
    recordLastMove(state, color, move.pawnIndex, dest, oldPos);
    // Festeggia solo il vero INGRESSO in casa (dal percorso esterno), non
    // uno spostamento tra due caselle-casa già interne (es. casa#1→casa#3
    // con un'altra carta) — quello non è un "arrivo", la pedina era già a
    // casa.
    if (oldPos < 1000 && dest >= 1000) recordHomeEntry(state, color, move.pawnIndex, dest);
    // Regola: una pedina che si è MOSSA e si ferma sulla propria base
    // (anche tornando indietro con il 4) può entrare in casa alla prossima
    // mossa in avanti. Solo la pedina appena entrata in gioco è "congelata"
    // sulla base finché non si muove (vedi move.type === "enter").
    const allInNow = allPawnsOnBoard(state, color);
    const cardValue = moveValueOf(card, allInNow);
    const movedForward = cardValue === null || cardValue > 0; // seven/etc fall elsewhere; move-type cards are never null here
    setLapped(state, color, move.pawnIndex, dest < 1000 && dest === BOARD.baseIndex[color]);
    state.log.push(`${cn(color)} #${move.pawnIndex + 1} muove con ${cardLog(card)}: ${posLabel(color, oldPos)} → ${posLabel(color, dest)}.`);
    // if the path swung past this pawn's own base without turning into
    // its home stretch, say so explicitly — and be precise about WHY:
    // either the number genuinely didn't match any home cell, or it did
    // match but the way in was blocked by an occupied cell/home slot
    // (named exactly, for diagnosing reports without needing screenshots).
    // Solo per mosse in AVANTI: la carta "4" va sempre indietro e attraversa
    // regolarmente la propria base senza entrare in casa (si entra in casa
    // solo andando avanti) — prima questo controllo scattava anche lì,
    // scrivendo nel registro un falso allarme "motivo non identificato" per
    // ogni "4" giocato all'indietro oltre la propria base (segnalato dal
    // registro stesso: "partenza a 61 passi dalla base, numero 4").
    const baseIdx = BOARD.baseIndex[color];
    if (movedForward && dest < 1000 && dest !== baseIdx && move.path.includes(baseIdx)) {
      const steps = move.path.length;
      const stepsBefore = stepsFromOwnBase(color, oldPos, wasLapped);
      const distanceToBase = (64 - stepsBefore) % 64; // how many steps to reach base itself
      const homePath = pathForward(color, oldPos, steps, wasLapped);
      let reason;
      if (!homePath) {
        reason = `il numero (${steps}) non corrisponde a nessuna delle 4 caselle-casa da questa posizione (a ${distanceToBase} passi dalla base).`;
      } else {
        // find exactly what blocked it
        const mid = homePath.slice(0, -1);
        const blocker = mid.map((p) => (p < 1000 ? occupantAt(state, p) : null)).find((o) => o);
        const finalDest = homePath[homePath.length - 1];
        if (blocker) {
          reason = `il percorso era bloccato da ${cn(blocker.color)} #${blocker.pawnIndex + 1} sulla casella ${mid.find((p) => p < 1000 && occupantAt(state, p) === blocker)}.`;
        } else if (finalDest >= 1000 && homeOccupant(state, color, finalDest - 1000) !== -1) {
          reason = `la casella-casa di destinazione era già occupata da una tua pedina.`;
        } else if (mid.some((p) => p >= 1000 && homeOccupant(state, color, p - 1000) !== -1)) {
          // v6.16: prima finiva in "motivo non identificato"
          reason = `la strada in casa era chiusa da una tua pedina già in casa.`;
        } else if (finalDest >= 1000) {
          // v6.16: la casa era raggiungibile, ma entrarci non è obbligatorio
          reason = `ha scelto di proseguire il giro.`;
        } else {
          reason = `motivo non identificato (segnalalo: partenza a ${distanceToBase} passi dalla base, numero ${steps}).`;
        }
      }
      state.log.push(`(${cn(color)} #${move.pawnIndex + 1} ha superato la propria base senza entrare in casa — ${reason})`);
    }
    checkWin(state);
    return;
  }

  if (move.type === "jack") {
    applyJackSwap(state, move.a, move.b, color);
    return;
  }

  if (move.type === "seven") {
    applySevenDistribution(state, color, move.distribution);
    return;
  }
}

function checkWin(state) {
  if (state.winnerTeam) return; // già decisa: non ricontare una vittoria già registrata
  for (const team of ["A", "B"]) {
    const teamColors = COLORS.filter((c) => TEAM_OF[c] === team);
    const allHome = teamColors.every((c) => state.pawns[c].every((p) => p >= 1000));
    if (allHome) {
      state.winnerTeam = team;
      state.phase = "finished";
      state.log.push(`La coppia ${TEAM_LABEL[team]} vince la partita!`);
      if (state.roomStats && state.roomStats.wins) state.roomStats.wins[team]++;
    }
  }
}

// Starts a fresh game in the same room, keeping the same players/names —
// used by the "nuova partita" button on the win screen.
function resetForNewGame(state) {
  state.gameId = newGameId(); // nuova partita = nuovo identificativo (classifica, v6.19)
  for (const c of COLORS) {
    state.pawns[c] = [-1, -1, -1, -1];
    state.hands[c] = [];
  }
  state.deck = [];
  state.pendingExchange = {};
  state.log = ["Nuova partita nella stessa stanza."];
  state.winnerTeam = null;
  // Segni "vittoria già accreditata in classifica" (vedi
  // creditMyResult; dalla v6.19 conta gameId, nuovo a ogni partita): vanno azzerati
  // a ogni rivincita, altrimenti dalla 2ª partita nella stessa stanza in poi
  // nessuna vittoria veniva più contata (segnalato: "Francesco ha vinto due
  // partite e non risulta").
  state.leaderboardClaimed = null;
  state.stats = null;
  state.lastSwap = null;
  state.lastCapture = null;
  state.lastHomeEntry = null;
  state.lastMove = null;
  state.lastSeven = null;
  state.lastCardPlayed = null;
  state.hasDealtBefore = false;
  state.firstHandOfCycle = true;
  dealNewHand(state);
}

// Burn exactly ONE card (the one the player attempted/chose that had no
// legal move), then advance the turn — never the whole hand at once.
function burnOneCard(state, color, card) {
  const hand = state.hands[color];
  const ci = hand.indexOf(card);
  if (ci !== -1) hand.splice(ci, 1);
  // Vedi il commento su state.playedThisCycle in applyMove: anche una
  // carta bruciata (nessuna mossa legale) esce di scena fino al prossimo
  // rimescolamento completo del mazzo.
  if (state.playedThisCycle) state.playedThisCycle.push(card);
  if (state.playedThisCycle) {
    state.lastCardPlayed = {
      id: (state.lastCardPlayed && state.lastCardPlayed.id ? state.lastCardPlayed.id : 0) + 1,
      ts: Date.now(),
      color,
      card,
      burned: true,
    };
  }
  state.log.push(`${cn(color)} brucia ${cardLog(card)} (nessuna mossa).`);
}

function advanceTurn(state) {
  const allEmpty = COLORS.every((c) => state.hands[c].length === 0);
  if (allEmpty) {
    dealNewHand(state);
    return;
  }
  const order = COLORS;
  const i = order.indexOf(state.turnColor);
  let next = order[(i + 1) % 4];
  // skip a player whose hand is already empty this cycle (waiting for redeal)
  let guard = 0;
  while (state.hands[next].length === 0 && guard < 4) {
    next = order[(order.indexOf(next) + 1) % 4];
    guard++;
  }
  state.turnColor = next;
  state.turnStartedAt = Date.now();
}

function activeColorFor(state, seatColor) {
  const mine = state.pawns[seatColor];
  const allHome = mine.every((p) => p >= 1000);
  if (!allHome) return seatColor;
  const partner = PARTNER_OF[seatColor];
  const partnerHome = state.pawns[partner].every((p) => p >= 1000);
  return partnerHome ? null : partner;
}

// Confronta due versioni dell'app ("v5.29", "v5.30"...): >0 se a è più
// nuova di b, <0 se più vecchia, 0 se uguali. Confronto numerico pezzo per
// pezzo, quindi "v5.30" è più nuova di "v5.4". Una versione illeggibile
// (es. true scritto da un client vecchio nella presenza) conta come la più
// vecchia possibile.
function compareAppVersions(a, b) {
  const parse = (v) => (typeof v === "string" && /^v?\d+(\.\d+)*$/.test(v) ? v.replace(/^v/, "").split(".").map(Number) : null);
  const pa = parse(a), pb = parse(b);
  if (!pa && !pb) return 0;
  if (!pa) return -1;
  if (!pb) return 1;
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}


// ---- dall'app: estrazione del mazziere e computer ----
function dealAndRevealDealer(state) {
  const draw = buildDealerDrawSequence();
  state.dealerDraw = draw;
  state.dealerColor = draw.winnerColor;
  dealNewHand(state); // porta la fase a "exchanging" e distribuisce le carte
}
function botCardUsefulness(card) {
  const r = rankOf(card);
  if (r === "J") return 90; // scambio: molto versatile
  if (r === "7") return 80; // spacca su più pedine
  if (r === "Q") return 60; // 12 avanti
  if (r === "K") return 55; // ingresso, o 13 avanti a mazzo pieno
  if (r === "A") return 50; // ingresso, o 1 avanti a mazzo pieno
  if (r === "4") return 20; // solo indietro, la meno amata
  return parseInt(r, 10) * 5; // 2..10: più alto, più utile
}
function botTeamPawnsLeft(state, color) {
  let n = 0;
  for (const c of COLORS) {
    if (TEAM_OF[c] !== TEAM_OF[color]) continue;
    for (const p of state.pawns[c]) if (p < 1000) n++;
  }
  return n;
}
function botRanksAfterMove(state, pawnColor, card, move) {
  const after = botSimulate(state, pawnColor, card, move);
  return ranksThatEnterHomeFor(after, pawnColor);
}
function botReceivedCardAdjustment(state, active, seat, card, move) {
  if (!state.lastReceivedCard || state.lastReceivedCard[seat] !== card) return 0;
  if (move.type !== "move" || !move.path) return 0;
  if (botTeamPawnsLeft(state, seat) > 2) return 0;
  const dest = move.path[move.path.length - 1];
  if (dest >= 1000) return 0; // entra in casa: già premiato dalla valutazione
  const before = ranksThatEnterHomeFor(state, active);
  if (before.size > 0) return 0; // poteva già chiudere da sé
  return botRanksAfterMove(state, active, card, move).size > 0 ? 35 : 0;
}
function botGiveCompletesPath(state, color, g) {
  if (botTeamPawnsLeft(state, color) > 2) return false;
  const others = new Set(state.hands[color].filter((c) => c !== g).map(rankOf));
  for (const pc of COLORS) {
    if (TEAM_OF[pc] !== TEAM_OF[color]) continue;
    if (!state.pawns[pc].some((p) => p >= 0 && p < 1000)) continue;
    if (ranksThatEnterHomeFor(state, pc).size > 0) continue; // già chiudibile da una sola carta
    for (const move of legalMovesForCard(state, pc, g)) {
      if (move.type !== "move" || !move.path) continue;
      if (move.path[move.path.length - 1] >= 1000) continue;
      for (const r of botRanksAfterMove(state, pc, g, move)) if (others.has(r)) return true;
    }
  }
  return false;
}
function botHasTacticalUse(state, color, card) {
  for (const move of botCandidatesForCard(state, color, card)) {
    if (botMoveIsTactical(state, color, card, move)) return true;
  }
  return false;
}
function botCardToGiveAway(state, color) {
  const hand = state.hands[color];
  const partner = PARTNER_OF[color];
  const ownNeedsEntry = pawnsInBase(state, color).length > 0;
  const partnerNeedsEntry = pawnsInBase(state, partner).length > 0;
  const ownHomeRanks = ranksThatEnterHomeFor(state, color);
  const partnerHomeRanks = ranksThatEnterHomeFor(state, partner);
  const ownRescue = ranksThatRescue(state, color);
  const partnerRescue = ranksThatRescue(state, partner);
  // Senza pedine sul percorso (tutte nella base o in casa, ma non "tutto a casa"
  // = non muove quelle del compagno) Jack e 7 a me non servono: li regalo al
  // compagno se lui ha pedine in gioco.
  const loopCount = (c) => state.pawns[c].filter((p) => p >= 0 && p < 1000).length;
  const ownHasNoPawnsOut = loopCount(color) === 0 && pawnsInBase(state, color).length > 0;
  const giveJackAndSeven = ownHasNoPawnsOut && loopCount(partner) > 0;
  const partnerHasPawnsOut = loopCount(partner) > 0;
  const entryCount = hand.filter(isEntryCard).length;
  // Anche se ora la pedina è ancora nell'angolo: con un Asso/Re in mano entrerà
  // subito sulla base, e lì il 4 (indietro) sblocca la corsa verso casa.
  const ownNeedsFour = fourUnlocksHome(state, color) || (ownNeedsEntry && hand.some(isEntryCard));
  const partnerNeedsFour = fourUnlocksHome(state, partner);

  let best = hand[0], bestScore = Infinity;
  for (const card of hand) {
    let score = botCardUsefulness(card);
    if (isEntryCard(card)) {
      // Se ne ho più di una, quelle in più sono "surplus": se il compagno non ha
      // pedine in gioco (e ne ha in base) gliene regalo una anche se servono a me.
      if (ownNeedsEntry && !(entryCount >= 2 && partnerNeedsEntry)) score += 40; // mi serve per entrare: la tengo
      else if (partnerNeedsEntry) score -= loopCount(partner) === 0 ? 55 : 35; // al compagno serve (urgente se non ha pedine fuori): gliela regalo
    }
    const r = rankOf(card);
    if (ownHomeRanks.has(r)) score += 45; // mi farebbe entrare subito in casa: la tengo
    else if (partnerHomeRanks.has(r)) score -= 40; // farebbe entrare in casa il compagno: gliela regalo
    // Salvare una pedina minacciata: stessa logica (prima io, poi il compagno).
    if (ownRescue.has(r)) score += 30;
    else if (partnerRescue.has(r)) score -= 30;
    if ((r === "J" || r === "7") && partnerHasPawnsOut) {
      // Jack/7 mi servono solo se ho una mossa che mangia, entra in casa o salva
      // una pedina; altrimenti avvantaggiano di più il compagno.
      if (botHasTacticalUse(state, color, card)) score += 40;
      else if (giveJackAndSeven || loopCount(color) > 0) score -= r === "J" ? 120 : 100;
    }
    // Il 4 sblocca la pedina ferma sulla base (4 indietro e poi in casa).
    if (r === "4") {
      if (ownNeedsFour) score += 35;
      else if (partnerNeedsFour) score -= 35;
    }
    if (botGiveCompletesPath(state, color, card)) score -= 50;
    if (score < bestScore) { bestScore = score; best = card; }
  }
  return best;
}
const HOME_ENTRY_TEST_RANKS = ["A", "2", "3", "5", "6", "8", "9", "10", "Q", "K"];
function ranksThatRescue(state, color) {
  const found = new Set();
  const threatened = [];
  for (let i = 0; i < 4; i++) if (botPawnThreatened(state.pawns, color, i)) threatened.push(i);
  if (threatened.length === 0) return found;
  for (const r of HOME_ENTRY_TEST_RANKS.concat(["4"])) {
    const card = r + "-hearts";
    for (const opt of legalMovesForCard(state, color, card)) {
      if (opt.type !== "move") continue;
      const after = botSimulate(state, color, card, opt);
      if (threatened.some((i) => !botPawnThreatened(after.pawns, color, i))) { found.add(r); break; }
    }
  }
  return found;
}
function fourUnlocksHome(state, color) {
  const base = BOARD.baseIndex[color];
  const moves4 = legalMovesForCard(state, color, "4-hearts").filter((o) => o.type === "move");
  // 1) pedina ferma sulla base (non girata): 4 indietro e poi può entrare in casa;
  const idx = state.pawns[color].findIndex((p, i) => p === base && !hasLapped(state, color, i));
  if (idx !== -1 && moves4.some((o) => o.pawnIndex === idx)) return true;
  // 2) pedina 4 passi oltre la base: il 4 indietro la riporta SULLA base, da
  //    dove (regola: "è rientrata in base") può entrare subito in casa.
  return moves4.some((o) => o.path && o.path[o.path.length - 1] === base);
}
function ranksThatEnterHomeFor(state, color) {
  const found = new Set();
  for (const r of HOME_ENTRY_TEST_RANKS) {
    const card = r + "-hearts"; // il seme non conta per le regole di movimento
    const options = legalMovesForCard(state, color, card);
    const entersHome = options.some(
      (opt) => opt.type === "move" && opt.path && opt.path[opt.path.length - 1] >= 1000
    );
    if (entersHome) found.add(r);
  }
  return found;
}
const BOT_CHAT_CAPTURE = [
  "Ops, si torna alla base! 😄",
  "Presa! Scusa eh 😅",
  "Non dovevi restare lì fermo.",
  "Mangiata! Avanti il prossimo.",
  "Capita anche ai migliori 😉",
];
const BOT_CHAT_HOME = [
  "Una pedina a casa, le altre arrivano!",
  "Prima al sicuro 🏠",
  "Casa dolce casa.",
];
const BOT_CHAT_WIN = [
  "Bella partita, complimenti! 🏆",
  "Vittoria di squadra! 🎉",
  "GG a tutti, giocata bene!",
];
const BOT_CHAT_LOSE = [
  "Bella partita comunque, ci riproviamo!",
  "Complimenti, ben giocato da parte vostra!",
  "GG, alla prossima va meglio.",
];
function botRandomLine(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function botCommentOnTurn(state, seat, { captured, enteredHome, justWon }) {
  if (justWon) {
    for (const c of COLORS) {
      if (!state.players[c] || !state.players[c].isBot) continue;
      if (Math.random() >= 0.7) continue; // non tutti parlano sempre, per non intasare la chat
      const line = TEAM_OF[c] === state.winnerTeam ? botRandomLine(BOT_CHAT_WIN) : botRandomLine(BOT_CHAT_LOSE);
      postChatMessage(state, c, line);
    }
    return;
  }
  if (captured && Math.random() < 0.6) {
    postChatMessage(state, seat, botRandomLine(BOT_CHAT_CAPTURE));
    return;
  }
  if (enteredHome && Math.random() < 0.35) {
    postChatMessage(state, seat, botRandomLine(BOT_CHAT_HOME));
  }
}
function botTakeTurn(state) {
  if (state.phase !== "playing") return;
  const seat = state.turnColor;
  if (!seat || !state.players[seat] || !state.players[seat].isBot) return;
  const active = activeColorFor(state, seat);
  if (!active) { advanceTurn(state); return; } // non dovrebbe capitare, sicurezza
  const level = (state.players[seat] && state.players[seat].botLevel) || "hard";
  const choice = level === "easy"
    ? botChooseCardAndMoveEasy(state, active, seat)
    : botChooseCardAndMove(state, active, seat);
  if (choice.burn) {
    burnOneCard(state, seat, choice.card);
  } else {
    const prevCaptureId = state.lastCapture ? state.lastCapture.id : 0;
    const homeBefore = state.pawns[active].filter((p) => p >= 1000).length;
    const hadWinner = !!state.winnerTeam;
    applyMove(state, active, choice.card, choice.move);
    const captured = !!(state.lastCapture && state.lastCapture.id !== prevCaptureId && state.lastCapture.by === active);
    const enteredHome = state.pawns[active].filter((p) => p >= 1000).length > homeBefore;
    botCommentOnTurn(state, seat, { captured, enteredHome, justWon: !hadWinner && !!state.winnerTeam });
  }
  if (state.phase !== "finished") advanceTurn(state);
}
var BOT_WEIGHTS = {
  // Jack e 7 sono carte preziose e versatili: tenerle in mano per il
  // momento giusto vale spesso più che spenderle appena c'è una mossa
  // legale qualsiasi. Penalità applicata al loro punteggio quando giocarle
  // ORA non porta un vantaggio tattico chiaro (vedi botMoveIsTactical) —
  // così il bot preferisce, a parità di convenienza, una carta più
  // "semplice" e si tiene il Jack/7 per quando serve davvero.
  holdJ: 7,
  hold7: 5,
  // botCardCountAdjustment: quanto pesa la correzione basata sulle carte
  // numeriche ancora in circolazione, sia quando siamo NOI a rischio di
  // essere mangiati sia quando siamo NOI a poter mangiare un avversario.
  cardCountThreatToUs: 1.5,
  cardCountThreatFromUs: 0.9,
  // botEvaluateBoard: valore di una pedina ancora in base (negativo: meglio
  // essere in gioco), valore base di una pedina in casa e bonus per ogni
  // passo ulteriore fatto in casa, e i pesi della minaccia (quanto costa
  // avere una nostra pedina a tiro, quanto vale tenere un avversario a
  // tiro nostro).
  evalBase: -8, // era -4 — alzato per rendere il bot più cauto nelle
  // situazioni che potrebbero costringerlo più avanti a dover mangiare una
  // pedina della propria squadra (compagno o proprio colore): mandare in
  // base una pedina della propria squadra ora pesa il doppio nel calcolo,
  // quindi quando ha davvero un'alternativa la evita più spesso (nei casi
  // FORZATI dalla regola "si mangia sempre, senza eccezioni" resta comunque
  // senza scelta, questo peso non può aiutare in quei casi).
  evalHomeBase: 100,
  evalHomeStep: 4, // era 2 — alzato per far preferire al bot, a parità di
  // resto, spingere una pedina più a fondo in casa invece di fermarla
  // proprio sulla casella d'entrata (che così resta bloccata per le
  // prossime pedine in arrivo). Una minaccia reale su un'altra pedina pesa
  // comunque molto di più (vedi threatPenalty/threatBonus) e continua a
  // prevalere quando conta davvero.
  evalProtectedBase: 5, // bonus per una pedina ferma sulla propria
  // casella-base non ancora "girata": lì è protetta (non mangiabile, non
  // selezionabile dal Jack — vedi isPawnProtected). Prima botEvaluateBoard
  // non lo sapeva e la trattava come una pedina in gioco qualsiasi, quindi
  // in una ripartizione del 7 poteva spostarla fuori dalla base senza
  // nessun motivo per preferire lasciarla lì al sicuro.
  threatPenalty: 1.5,
  threatBonus: 0.9,
  // botCoordinationAdjustment: quanto conta salvare una pedina minacciata
  // del COMPAGNO. Prima erano numeri fissi (3/-2) scritti direttamente lì
  // dentro, troppo piccoli per contare davvero a confronto delle altre
  // voci del punteggio (mangiare/entrare in casa valgono decine o
  // centinaia di punti) — il bot "vedeva" il compagno in pericolo ma quasi
  // mai era abbastanza per fargli davvero cambiare mossa. Spostati qui (per
  // poterli tarare) e alzati parecchio.
  partnerRescue: 30, // salva una pedina che il compagno da solo NON avrebbe potuto salvare
  // Penalità extra per ogni pedina della PROPRIA squadra (compagno o proprio
  // colore) mandata in base da questa stessa mossa: la valutazione di
  // botEvaluateBoard la conta solo come "passi persi", troppo poco quando la
  // pedina è ancora vicina alla base (segnalato: "il bot mangia troppo il
  // compagno"). Così, se esiste un'alternativa ragionevole, la preferisce.
  teamCapturePenalty: 30,
  // Blocchi (una pedina qualunque impedisce di superarla, vedi isBlockedAlongPath):
  // - blockSeeker: una pedina in vista della propria casa (ultimi 20 passi del giro)
  //   con un'altra pedina davanti a sé entro 13 caselle. Se la bloccata è
  //   AVVERSARIA è un vantaggio (+), se è della propria squadra (compagno
  //   compreso) è un ostacolo che il bot deve evitare di creare (−).
  // - blockBack: pedina ferma sulla propria base con caselle libere dietro (4 indietro
  //   e poi in casa): se qualcuno occupa le 3 caselle dietro, non può farlo.
  // - parkBase: una pedina appena entrata e ferma sulla propria base è un "posto di
  //   blocco" (protetta e nessuno può superarla): vale per ogni avversario che le
  //   sta arrivando dietro, e costa per ogni pedina della propria squadra dietro.
  blockSeeker: 3,
  blockBack: 3,
  parkBase: 1.5,
  // botRiskAdjustment: costo atteso = probabilità di essere mangiata × (passi fatti + 8) × riskScale.
  riskScale: 0.6,
  partnerRedundantRescue: -6, // la salva ma il compagno l'avrebbe comunque salvata da sé al suo turno: leggera penalità, meglio occuparsi d'altro
  // v5.67: Jack che manda INDIETRO una pedina del compagno (segnalato: "i bot
  // a volte giocano il Jack danneggiando il compagno"). Per botEvaluateBoard
  // uno scambio con il compagno è quasi sempre "in pari" (quello che guadagna
  // una pedina lo perde l'altra) e un compagno rispedito indietro per colpire
  // un avversario sembrava conveniente. Ora ogni passo perso dal compagno
  // costa, e di più se la sua pedina era già in vista di casa — tranne
  // quando lo scambio la salva da una minaccia (botJackPartnerDamage).
  jackPartnerLossStep: 2,
  jackPartnerNearHome: 25,
};
function botJackPartnerDamage(state, active, move) {
  if (!move || move.type !== "jack") return 0;
  let pen = 0;
  for (const [t, o] of [[move.a, move.b], [move.b, move.a]]) {
    if (t.color === active || TEAM_OF[t.color] !== TEAM_OF[active]) continue; // solo le pedine del compagno
    const before = state.pawns[t.color][t.pawnIndex];
    const after = state.pawns[o.color][o.pawnIndex]; // dove finisce dopo lo scambio
    if (before < 0 || before >= 1000 || after < 0 || after >= 1000) continue;
    const sBefore = stepsFromOwnBase(t.color, before, hasLapped(state, t.color, t.pawnIndex));
    const sAfter = stepsFromOwnBase(t.color, after, after === BOARD.baseIndex[t.color]);
    const lost = sBefore - sAfter;
    if (lost <= 0) continue;
    // Salvata da una minaccia: lo scambio la aiuta, nessuna penalità.
    const afterPawns = clonePawns(state.pawns);
    afterPawns[t.color][t.pawnIndex] = after;
    afterPawns[o.color][o.pawnIndex] = before;
    if (botPawnThreatened(state.pawns, t.color, t.pawnIndex) && !botPawnThreatened(afterPawns, t.color, t.pawnIndex)) continue;
    pen += lost * BOT_WEIGHTS.jackPartnerLossStep;
    if (sBefore >= 44) pen += BOT_WEIGHTS.jackPartnerNearHome;
  }
  return pen;
}
function botHoldPenaltyFor(card) {
  const r = rankOf(card);
  if (r === "J") return BOT_WEIGHTS.holdJ;
  if (r === "7") return BOT_WEIGHTS.hold7;
  return 0;
}
function botPawnThreatened(pawns, color, pawnIndex) {
  const pos = pawns[color][pawnIndex];
  if (pos === -1 || pos >= 1000) return false;
  for (const oc of COLORS) {
    if (oc === color) continue;
    for (let j = 0; j < 4; j++) {
      const opos = pawns[oc][j];
      if (opos === -1 || opos >= 1000) continue;
      const dist = (pos - opos + 64) % 64;
      if (dist >= 1 && dist <= 10) return true;
    }
  }
  return false;
}
function botMoveIsTactical(state, active, card, move) {
  const after = botSimulate(state, active, card, move);
  if (after.lastCapture) return true; // mangia una pedina avversaria

  if (move.type === "move") {
    const dest = move.path[move.path.length - 1];
    if (dest >= 1000) return true; // entra in casa
  }

  if (move.type === "seven") {
    for (let i = 0; i < 4; i++) {
      if (state.pawns[active][i] !== -1 && state.pawns[active][i] < 1000 && after.pawns[active][i] >= 1000) return true;
    }
  }

  if (move.type === "jack") {
    for (const target of [move.a, move.b]) {
      const before = state.pawns[target.color][target.pawnIndex];
      const afterPos = after.pawns[target.color][target.pawnIndex];
      if (before === -1 || before >= 1000) continue;
      if (TEAM_OF[target.color] !== TEAM_OF[active]) {
        const beforeSteps = stepsFromOwnBase(target.color, before, hasLapped(state, target.color, target.pawnIndex));
        const afterSteps = afterPos >= 1000 ? 0 : stepsFromOwnBase(target.color, afterPos, hasLapped(after, target.color, target.pawnIndex));
        if (beforeSteps - afterSteps >= 15) return true; // rispedita indietro parecchio
      } else if (botPawnThreatened(state.pawns, target.color, target.pawnIndex) && !botPawnThreatened(after.pawns, target.color, target.pawnIndex)) {
        return true; // salvata da una minaccia imminente
      }
    }
  }

  return false;
}
function botComputeSeatLevels(state) {
  const levels = {};
  for (const c of COLORS) {
    const p = state.players && state.players[c];
    levels[c] = p && p.isBot ? (p.botLevel === "easy" ? "easy" : "hard") : null; // null = umano/sconosciuto
  }
  return levels;
}
function botTeamPawnsEaten(state, after, botTeam) {
  let n = 0;
  for (const c of COLORS) {
    if (TEAM_OF[c] !== botTeam) continue;
    for (let i = 0; i < 4; i++) {
      const before = state.pawns[c][i];
      if (before >= 0 && before < 1000 && after.pawns[c][i] === -1) n++;
    }
  }
  return n;
}
function botChooseCardAndMove(state, active, seat) {
  const hand = state.hands[seat];
  const botTeam = TEAM_OF[seat];
  const seatLevels = botComputeSeatLevels(state);
  // Il bot non vede le carte altrui: valuta ogni mossa su alcune distribuzioni
  // ipotetiche delle carte non ancora viste e ne fa la media.
  const beliefs = [];
  for (let b = 0; b < BOT_BELIEF_SAMPLES; b++) beliefs.push(botSampleBeliefState(state, seat));
  let best = null, bestScore = -Infinity;
  const t0 = Date.now();
  for (const card of hand) {
    for (const move of botCandidatesForCard(state, active, card)) {
      let acc = 0;
      // Tetto di tempo (telefoni lenti, 7 con tante ripartizioni): oltre ~2 s
      // le mosse rimaste si valutano su una sola distribuzione.
      const used = Date.now() - t0 > 2000 ? beliefs.slice(0, 1) : beliefs;
      for (const belief of used) {
        acc += botScoreMoveDeep(belief, active, card, move, botTeam, seatLevels);
        acc += botCoordinationAdjustment(belief, active, seat, card, move);
      }
      let score = acc / used.length;
      const holdPenalty = botHoldPenaltyFor(card);
      if (holdPenalty && !botMoveIsTactical(state, active, card, move)) score -= holdPenalty;
      score += botCardCountAdjustment(state, active, seat, card, move);
      score += botReceivedCardAdjustment(state, active, seat, card, move);
      score += botRiskAdjustment(state, active, seat, card, move);
      score -= BOT_WEIGHTS.teamCapturePenalty * botTeamPawnsEaten(state, botSimulate(state, active, card, move), botTeam);
      score -= botJackPartnerDamage(state, active, move);
      score += Math.random() * 0.01;
      if (score > bestScore) {
        bestScore = score;
        best = { card, move };
      }
    }
  }
  if (!best) {
    // nessuna carta ha una mossa legale: se ne brucia una, la meno utile
    return { burn: true, card: botCardToGiveAway(state, seat) };
  }
  return { burn: false, card: best.card, move: best.move };
}
function botChooseCardAndMoveEasy(state, active, seat) {
  const hand = state.hands[seat];
  const botTeam = TEAM_OF[seat];
  const belief = botSampleBeliefState(state, seat); // non conosce la mano del compagno
  let best = null, bestScore = -Infinity;
  for (const card of hand) {
    for (const move of botCandidatesForCard(state, active, card)) {
      let score = botScoreMove(state, active, card, move, botTeam);
      score += botCoordinationAdjustment(belief, active, seat, card, move);
      score -= BOT_WEIGHTS.teamCapturePenalty * botTeamPawnsEaten(state, botSimulate(state, active, card, move), botTeam);
      score -= botJackPartnerDamage(state, active, move);
      score += Math.random() * 0.5;
      if (score > bestScore) {
        bestScore = score;
        best = { card, move };
      }
    }
  }
  if (!best) {
    return { burn: true, card: botCardToGiveAway(state, seat) };
  }
  return { burn: false, card: best.card, move: best.move };
}
function botSeatCanRescue(state, seat, color, pawnIndex) {
  const active = activeColorFor(state, seat);
  if (!active) return false;
  for (const card of state.hands[seat]) {
    for (const move of botCandidatesForCard(state, active, card)) {
      const after = botSimulate(state, active, card, move);
      if (!botPawnThreatened(after.pawns, color, pawnIndex)) return true;
    }
  }
  return false;
}
function botUnseenRankCounts(state, seat) {
  const counts = { A: 4, "2": 4, "3": 4, "4": 4, "5": 4, "6": 4, "7": 4, "8": 4, "9": 4, "10": 4, J: 4, Q: 4, K: 4 };
  for (const card of state.hands[seat] || []) {
    const r = rankOf(card);
    if (counts[r] > 0) counts[r]--;
  }
  for (const card of state.playedThisCycle || []) {
    const r = rankOf(card);
    if (counts[r] > 0) counts[r]--;
  }
  return counts;
}
function botUnseenInfo(state, seat) {
  const unseen = new Set(buildDeck());
  for (const card of state.hands[seat] || []) unseen.delete(card);
  for (const card of state.playedThisCycle || []) unseen.delete(card);
  let partnerKnown = null;
  const given = state.lastReceivedCard && state.lastReceivedCard[PARTNER_OF[seat]];
  if (given && unseen.has(given)) {
    unseen.delete(given);
    partnerKnown = given; // in mano al compagno, finché non la gioca
  }
  return { unseen, partnerKnown };
}
function botUnseenCards(state, seat) {
  return botUnseenInfo(state, seat).unseen;
}
function botSampleBeliefState(state, seat) {
  const { unseen, partnerKnown } = botUnseenInfo(state, seat);
  const pool = shuffle(Array.from(unseen));
  const own = new Set(state.hands[seat] || []);
  const hands = {};
  const partner = PARTNER_OF[seat];
  let next = 0;
  for (const c of COLORS) {
    if (c === seat) { hands[c] = (state.hands[c] || []).slice(); continue; }
    const size = (state.hands[c] || []).length;
    const h = [];
    if (c === partner && partnerKnown && size > 0) h.push(partnerKnown);
    while (h.length < size) {
      if (next < pool.length) h.push(pool[next++]);
      else { // mazzo "esaurito" (stato incoerente dopo un rimescolamento): riempie con carte qualunque non in mano mia
        const any = shuffle(buildDeck().filter((x) => !own.has(x)));
        h.push(any[0]);
      }
    }
    hands[c] = h;
  }
  return Object.assign({}, state, { hands });
}
function botProbHoldsAny(k, N, handSize) {
  if (k <= 0 || N <= 0 || handSize <= 0) return 0;
  if (handSize > N - k) return 1;
  let pNone = 1;
  for (let i = 0; i < handSize; i++) pNone *= (N - k - i) / (N - i);
  return 1 - pNone;
}
function botPawnEatProbability(state, pawns, unseen, seat, color, i) {
  const pos = pawns[color][i];
  if (pos === -1 || pos >= 1000) return 0;
  const myTeam = TEAM_OF[color];
  let pNobody = 1;
  for (const oc of COLORS) {
    if (TEAM_OF[oc] === myTeam) continue;
    const ranks = new Set();
    const opponentAllIn = pawns[oc].every((p) => p !== -1);
    for (let j = 0; j < 4; j++) {
      const opos = pawns[oc][j];
      if (opos === -1 && pos === BOARD.baseIndex[oc]) { ranks.add("A"); ranks.add("K"); } // entra sulla propria base mangiandomi
      if (opos === -1 || opos >= 1000) continue;
      const d = (pos - opos + 64) % 64;
      if (d >= 2 && d <= 10) ranks.add(String(d));
      if (d >= 1 && d <= 7) ranks.add("7");
      if (d === 12) ranks.add("Q");
      if (d === 13 && opponentAllIn) ranks.add("K");
      if (d === 1 && opponentAllIn) ranks.add("A");
      if (((opos - pos + 64) % 64) === 4) ranks.add("4"); // il 4 va indietro
    }
    if (ranks.size === 0) continue;
    let k = 0;
    for (const card of unseen) if (ranks.has(rankOf(card))) k++;
    const handSize = (state.hands[oc] || []).length;
    pNobody *= 1 - botProbHoldsAny(k, unseen.size, handSize);
  }
  return 1 - pNobody;
}
function botRiskAdjustment(state, active, seat, card, move) {
  const botTeam = TEAM_OF[seat];
  const after = botSimulate(state, active, card, move);
  const unseen = botUnseenCards(state, seat);
  let delta = 0;
  for (const c of COLORS) {
    if (TEAM_OF[c] !== botTeam) continue;
    for (let i = 0; i < 4; i++) {
      const pos = after.pawns[c][i];
      if (pos === -1 || pos >= 1000) continue;
      // penalità già contata da botEvaluateBoard (solo avversari, 1-10 passi)
      let baseline = 0;
      for (const oc of COLORS) {
        if (TEAM_OF[oc] === botTeam) continue;
        for (let j = 0; j < 4; j++) {
          const opos = after.pawns[oc][j];
          if (opos === -1 || opos >= 1000) continue;
          const d = (pos - opos + 64) % 64;
          if (d >= 1 && d <= 10) baseline += (11 - d) * BOT_WEIGHTS.threatPenalty;
        }
      }
      const p = botPawnEatProbability(state, after.pawns, unseen, seat, c, i);
      const steps = stepsFromOwnBase(c, pos, after.lapped && after.lapped[c] && after.lapped[c][i]) || 0;
      const model = p * (steps + 8) * BOT_WEIGHTS.riskScale;
      delta += baseline - model;
    }
  }
  return delta;
}
function botCardCountAdjustment(state, active, seat, card, move) {
  const botTeam = TEAM_OF[seat];
  const after = botSimulate(state, active, card, move);
  const counts = botUnseenRankCounts(state, seat);
  const rankWeight = (d) => {
    if (d < 2 || d > 10) return null; // nessuna carta numerica copre queste distanze in modo diretto
    return counts[String(d)] / 4; // 1 = nessuna novità rispetto a un mazzo "vergine", 0 = valore già tutto uscito
  };
  let delta = 0;
  for (const c of COLORS) {
    for (let i = 0; i < 4; i++) {
      const pos = after.pawns[c][i];
      if (pos === -1 || pos >= 1000) continue;
      for (const oc of COLORS) {
        if (oc === c) continue;
        for (let j = 0; j < 4; j++) {
          const opos = after.pawns[oc][j];
          if (opos === -1 || opos >= 1000) continue;
          if (TEAM_OF[c] === botTeam && TEAM_OF[oc] !== botTeam) {
            // minaccia verso di noi: ora la calcola botRiskAdjustment (probabilità vera)
          } else if (TEAM_OF[c] !== botTeam && TEAM_OF[oc] === botTeam) {
            // oc (nostra) potrebbe mangiare c (avversaria): quanto dista oc da c
            const w = rankWeight((opos - pos + 64) % 64);
            if (w != null) delta += (w - 0.5) * BOT_WEIGHTS.cardCountThreatFromUs;
          }
        }
      }
    }
  }
  return delta;
}
function botCoordinationAdjustment(state, active, seat, card, move) {
  const partner = PARTNER_OF[seat];
  const after = botSimulate(state, active, card, move);
  let delta = 0;
  for (let i = 0; i < 4; i++) {
    const pos = state.pawns[partner][i];
    if (pos === -1 || pos >= 1000) continue;
    if (!botPawnThreatened(state.pawns, partner, i)) continue;
    if (botPawnThreatened(after.pawns, partner, i)) continue; // non l'ha messa al sicuro
    delta += botSeatCanRescue(state, partner, partner, i) ? BOT_WEIGHTS.partnerRedundantRescue : BOT_WEIGHTS.partnerRescue;
  }
  return delta;
}
function botCandidatesForCard(state, active, card) {
  const options = legalMovesForCard(state, active, card);
  const moves = [];
  for (const opt of options) {
    if (opt.type === "move" || opt.type === "enter") {
      moves.push(opt);
    } else if (opt.type === "jack") {
      const targets = jackableTargets(state);
      for (let i = 0; i < targets.length; i++) {
        for (let j = i + 1; j < targets.length; j++) {
          moves.push({ type: "jack", a: targets[i], b: targets[j] });
        }
      }
    } else if (opt.type === "seven") {
      for (const distribution of botSevenDistributions(state, active)) {
        moves.push({ type: "seven", distribution });
      }
    }
  }
  return moves;
}
function botSevenDistributions(state, color) {
  const inPlay = state.pawns[color].map((p, i) => i).filter((i) => state.pawns[color][i] !== -1);
  const results = [];
  if (inPlay.length > 0) {
    for (const idx of inPlay) {
      const dist = [{ pawnIndex: idx, steps: 7 }];
      if (sevenValidateDistribution(state, color, dist)) results.push(dist);
    }
    function tryAmounts(pawnIndices, remaining, idx, acc) {
      if (idx === pawnIndices.length - 1) {
        if (remaining <= 0) return;
        const dist = acc.concat([{ pawnIndex: pawnIndices[idx], steps: remaining }]);
        if (sevenValidateDistribution(state, color, dist)) results.push(dist);
        return;
      }
      for (let s = 1; s < remaining; s++) {
        tryAmounts(pawnIndices, remaining - s, idx + 1, acc.concat([{ pawnIndex: pawnIndices[idx], steps: s }]));
      }
    }
    for (let size = 2; size <= inPlay.length; size++) {
      for (const combo of kSubsets(inPlay, size)) tryAmounts(combo, 7, 0, []);
    }
  }
  // Distribuzioni "estese": una parte manda tutte le proprie pedine a casa,
  // il resto prosegue su quelle del compagno (vedi sevenValidateDistribution
  // / sevenHasAnyLeftoverToPartner) — esplorate solo quando è davvero
  // possibile, per non pagare questo costo combinatorio extra sulla
  // stragrande maggioranza dei turni.
  if (sevenHasAnyLeftoverToPartner(state, color)) {
    results.push(...botExtendedSevenDistributions(state, color));
  }
  return results;
}
function botExtendedSevenDistributions(state, color) {
  const partner = PARTNER_OF[color];
  const ownInPlay = state.pawns[color].map((p, i) => i).filter((i) => state.pawns[color][i] !== -1);
  const partnerInPlay = state.pawns[partner].map((p, i) => i).filter((i) => state.pawns[partner][i] !== -1);
  const results = [];
  if (ownInPlay.length === 0 || partnerInPlay.length === 0) return results;
  for (let ownTotal = 1; ownTotal <= 6; ownTotal++) {
    const leftover = 7 - ownTotal;
    for (const ownDist of sevenAllSplitsOfTotal(ownInPlay, ownTotal)) {
      const ownResult = sevenValidateOwnPortions(state, color, ownDist);
      if (!ownResult || !ownResult.allHome) continue;
      for (const partnerDist of sevenAllSplitsOfTotal(partnerInPlay, leftover)) {
        const full = ownDist.concat(partnerDist.map((d) => ({ pawnIndex: d.pawnIndex, steps: d.steps, forPartner: true })));
        if (sevenValidateDistribution(state, color, full)) results.push(full);
      }
    }
  }
  return results;
}
function botSimulate(state, active, card, move) {
  const clone = {
    pawns: clonePawns(state.pawns),
    lapped: state.lapped ? JSON.parse(JSON.stringify(state.lapped)) : {},
    turnColor: state.turnColor,
    hands: { red: [], green: [], yellow: [], blue: [] },
    log: [],
    lastSwap: null,
    lastCapture: null,
    phase: "playing",
    winnerTeam: null,
  };
  if (move.type === "jack") applyJackSwap(clone, move.a, move.b, active);
  else if (move.type === "seven") applySevenDistribution(clone, active, move.distribution);
  else applyMove(clone, active, card, move);
  return clone;
}
function botScoreMove(state, active, card, move, botTeam) {
  const after = botSimulate(state, active, card, move);
  let score = botEvaluateBoard(after.pawns, after.lapped, botTeam);
  if (after.winnerTeam === botTeam) score += 100000;
  return score;
}
var BOT_BELIEF_SAMPLES = 3; // quante distribuzioni ipotetiche delle carte altrui per ogni decisione
const BOT_LOOKAHEAD_PLIES = 4; // 1 = solo la mossa propria (comportamento precedente)
const BOT_LOOKAHEAD_BEAM = 5;  // quante mosse "papabili" esplorare per ogni turno successivo
function botCloneStateForSearch(state) {
  return {
    pawns: clonePawns(state.pawns),
    lapped: state.lapped ? JSON.parse(JSON.stringify(state.lapped)) : {},
    hands: {
      red: state.hands.red.slice(),
      green: state.hands.green.slice(),
      yellow: state.hands.yellow.slice(),
      blue: state.hands.blue.slice(),
    },
    turnColor: state.turnColor,
    log: [],
    lastSwap: null,
    lastCapture: null,
    phase: "playing",
    winnerTeam: null,
  };
}
function botRankedCandidates(state, active, seat, forTeam, seatLevels) {
  const hand = state.hands[seat];
  // Un bot facile NOTO (seatLevels[seat] === "easy") non trattiene mai
  // Jack/7 — vedi botChooseCardAndMoveEasy, che non applica mai
  // BOT_HOLD_PENALTY. Prevederlo qui come se trattenesse le carte farebbe
  // credere al bot difficile che una minaccia resti "innescata" più a lungo
  // di quanto un avversario facile la lascerebbe davvero. Per un umano o un
  // bot difficile (seatLevels[seat] è "hard" o null/sconosciuto) resta
  // l'assunzione precedente, più prudente.
  const predictHold = !(seatLevels && seatLevels[seat] === "easy");
  const out = [];
  for (const card of hand) {
    for (const move of botCandidatesForCard(state, active, card)) {
      let score = botScoreMove(state, active, card, move, forTeam);
      if (predictHold) {
        const holdPenalty = botHoldPenaltyFor(card);
        if (holdPenalty && !botMoveIsTactical(state, active, card, move)) score -= holdPenalty;
      }
      out.push({ card, move, score });
    }
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}
function botLeafValue(clone, botTeam) {
  const base = botEvaluateBoard(clone.pawns, clone.lapped, botTeam);
  if (clone.winnerTeam === botTeam) return base + 100000;
  if (clone.winnerTeam) return base - 100000;
  return base;
}
function botLookaheadValue(state, botTeam, plies, seatLevels) {
  if (plies <= 0 || state.phase === "finished") return botLeafValue(state, botTeam);
  const seat = state.turnColor;
  if (!seat || !state.hands[seat]) return botLeafValue(state, botTeam);

  const active = activeColorFor(state, seat);
  if (!active) {
    // La squadra di questo turno è già tutta a casa (partita quasi vinta):
    // il turno passa senza giocare una carta, non conta come una vera mossa
    // ai fini del conteggio dei ply.
    const clone = botCloneStateForSearch(state);
    advanceTurn(clone);
    if (clone.turnColor === seat || COLORS.every((c) => clone.hands[c].length === 0)) {
      return botLeafValue(state, botTeam);
    }
    return botLookaheadValue(clone, botTeam, plies - 1, seatLevels);
  }

  const seatTeam = TEAM_OF[seat];
  const ranked = botRankedCandidates(state, active, seat, seatTeam, seatLevels);
  if (ranked.length === 0) {
    // Nessuna mossa legale per nessuna carta: si brucia la meno utile e si
    // passa, senza spendere un ply "vero" di ricerca.
    const clone = botCloneStateForSearch(state);
    burnOneCard(clone, seat, botCardToGiveAway(state, seat));
    if (COLORS.every((c) => clone.hands[c].length === 0)) return botLeafValue(state, botTeam);
    advanceTurn(clone);
    return botLookaheadValue(clone, botTeam, plies - 1, seatLevels);
  }

  const beam = ranked.slice(0, BOT_LOOKAHEAD_BEAM);
  const maximizing = seatTeam === botTeam; // il proprio turno (o del compagno): massimizza; l'avversario minimizza
  let bestValue = maximizing ? -Infinity : Infinity;
  for (const cand of beam) {
    const clone = botCloneStateForSearch(state);
    applyMove(clone, active, cand.card, cand.move);
    checkWin(clone);
    let value;
    if (clone.phase === "finished" || COLORS.every((c) => clone.hands[c].length === 0)) {
      value = botLeafValue(clone, botTeam);
    } else {
      advanceTurn(clone);
      value = botLookaheadValue(clone, botTeam, plies - 1, seatLevels);
    }
    if (maximizing ? value > bestValue : value < bestValue) bestValue = value;
  }
  return bestValue;
}
function botScoreMoveDeep(state, active, card, move, botTeam, seatLevels) {
  const clone = botCloneStateForSearch(state);
  applyMove(clone, active, card, move);
  checkWin(clone);
  if (clone.phase === "finished") return botLeafValue(clone, botTeam);
  if (COLORS.every((c) => clone.hands[c].length === 0)) return botLeafValue(clone, botTeam);
  advanceTurn(clone);
  return botLookaheadValue(clone, botTeam, BOT_LOOKAHEAD_PLIES - 1, seatLevels);
}
function botBlockingTerm(pawns, lapped, forTeam) {
  const occ = new Array(64).fill(null);
  for (const c of COLORS) for (let i = 0; i < 4; i++) {
    const p = pawns[c][i];
    if (p >= 0 && p < 1000) occ[p] = c;
  }
  const rel = (teamSeeker, teamBlocker, w) => {
    if (teamSeeker !== teamBlocker) return teamBlocker === forTeam ? w : (teamSeeker === forTeam ? -w : 0);
    return forTeam === teamSeeker ? -w : w;
  };
  let score = 0;
  for (const c of COLORS) {
    const base = BOARD.baseIndex[c];
    for (let i = 0; i < 4; i++) {
      const pos = pawns[c][i];
      if (pos < 0 || pos >= 1000) continue;
      const wasLapped = !!(lapped && lapped[c] && lapped[c][i]);
      const steps = stepsFromOwnBase(c, pos, wasLapped);
      const tS = TEAM_OF[c];
      // (1) pedina in vista della propria casa: bloccata da chi ha davanti?
      if (steps >= 44) {
        const remaining = 64 - steps; // caselle fino alla propria base compresa
        const reach = Math.min(remaining, 13);
        for (let d = 1; d <= reach; d++) {
          const bc = occ[(pos + d) % 64];
          if (bc) { score += rel(tS, TEAM_OF[bc], BOT_WEIGHTS.blockSeeker); break; }
        }
      }
      // (2) pedina ferma sulla propria base, non ancora "girata": 4 indietro + casa
      if (pos === base && !wasLapped) {
        for (let d = 1; d <= 3; d++) {
          const bc = occ[(base - d + 64) % 64];
          if (bc) { score += rel(tS, TEAM_OF[bc], BOT_WEIGHTS.blockBack); break; }
        }
        // (3) posto di blocco: chi le sta arrivando dietro (entro 12 caselle)
        for (let d = 1; d <= 12; d++) {
          const bc = occ[(base - d + 64) % 64];
          if (!bc) continue;
          const w = BOT_WEIGHTS.parkBase * (1 - (d - 1) / 13);
          // bc è "bloccato" dalla pedina ferma: vantaggio per la squadra della ferma se bc è avversario, danno se è compagno
          score += TEAM_OF[bc] === tS ? (forTeam === tS ? -w : w) : (forTeam === tS ? w : -w);
        }
      }
    }
  }
  return score;
}
function botEvaluateBoard(pawns, lapped, forTeam) {
  let score = 0;
  for (const c of COLORS) {
    const sign = TEAM_OF[c] === forTeam ? 1 : -1;
    for (let i = 0; i < 4; i++) {
      const pos = pawns[c][i];
      let val;
      if (pos === -1) val = BOT_WEIGHTS.evalBase; // in base: meglio essere in gioco
      else if (pos >= 1000) val = BOT_WEIGHTS.evalHomeBase + (pos - 1000) * BOT_WEIGHTS.evalHomeStep; // in casa: sempre molto meglio
      else {
        val = stepsFromOwnBase(c, pos, lapped && lapped[c] && lapped[c][i]);
        // Ferma esattamente sulla propria casella-base e non ancora girata:
        // è protetta (isPawnProtected) — non mangiabile, non selezionabile
        // dal Jack. Un piccolo bonus dà al bot un motivo per non spostarla
        // via da lì senza un reale vantaggio, invece di trattarla come una
        // pedina in gioco qualunque.
        if (pos === BOARD.baseIndex[c] && !(lapped && lapped[c] && lapped[c][i])) {
          val += BOT_WEIGHTS.evalProtectedBase;
        }
      }
      score += sign * val;
    }
  }
  for (const c of COLORS) {
    if (TEAM_OF[c] !== forTeam) continue;
    for (let i = 0; i < 4; i++) {
      const pos = pawns[c][i];
      if (pos === -1 || pos >= 1000) continue;
      for (const oc of COLORS) {
        // Solo pedine AVVERSARIE: prima si saltava solo il proprio colore, quindi
        // anche le pedine del COMPAGNO contavano come minaccia (penalità) e come
        // bersaglio (bonus "le tengo sotto tiro") — il bot era premiato per
        // restare dietro al compagno, che è una delle cause di "mangia troppo il
        // compagno".
        if (TEAM_OF[oc] === forTeam) continue;
        for (let j = 0; j < 4; j++) {
          const opos = pawns[oc][j];
          if (opos === -1 || opos >= 1000) continue;
          const dist = (pos - opos + 64) % 64; // passi che servirebbero all'avversario per arrivarci
          if (dist >= 1 && dist <= 10) score -= (11 - dist) * BOT_WEIGHTS.threatPenalty;
          // Simmetrico: quanti passi servirebbero A NOI per raggiungere
          // QUESTO avversario. Prima non c'era nessun premio per restare in
          // posizione di minaccia (solo una penalità per essere minacciati),
          // quindi il bot correva sempre subito in casa appena poteva. Un
          // piccolo bonus qui gli dà un motivo reale per restare fuori un
          // altro giro quando può tenere sotto tiro una pedina avversaria.
          const distToThem = (opos - pos + 64) % 64;
          if (distToThem >= 1 && distToThem <= 10) score += (11 - distToThem) * BOT_WEIGHTS.threatBonus;
        }
      }
    }
  }
  score += botBlockingTerm(pawns, lapped, forTeam);
  return score;
}
return { BOARD, COLORS, TEAM_OF, PARTNER_OF, NEXT_COLOR, newGameId, newGameState, normalizeState, dealNewHand,
  submitExchangeCard, postChatMessage, legalMovesForCard, jackableTargets, sevenValidateDistribution, anyLegalMove,
  applyMove, checkWin, resetForNewGame, burnOneCard, advanceTurn, activeColorFor, compareAppVersions,
  botChooseCardAndMove, botChooseCardAndMoveEasy, dealAndRevealDealer, botTakeTurn, botCardToGiveAway };
})();
module.exports = motore;
