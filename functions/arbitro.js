// Arbitro di Tock: la logica PURA (niente database) che il server usa per ogni azione di una partita.
// - Lo stato completo della partita (mazzo e mani compresi) lo conosce solo il server.
// - I telefoni mandano un'intenzione ("gioco questa carta con questa mossa"): l'arbitro controlla che sia il
//   turno giusto, che la carta sia davvero in mano e che la mossa sia legale, poi la applica col motore del
//   gioco (lo stesso codice dei telefoni, generato da index.html in motore-generato.js).
// - Pubblico (arbitro/<stanza>/pub): pedine, turno, registro, quante carte ha ognuno, MAI quali.
// - Privato (arbitro/<stanza>/mani/<uid>): le carte di quel giocatore, leggibili solo da lui.
const M = require("./motore-generato");

const { COLORS, TEAM_OF } = M;

// Campi della stanza che scrivono i telefoni (sala d'attesa, posti, chat): non fanno parte della partita.
const CAMPI_STANZA = ["players", "roomMode", "draft", "pending", "chat", "chatBotRepliedToId", "arbitro", "sessione",
  "leaderboardClaimed", "stats", "creata"];
// Campi segreti: restano solo nello stato del server.
const CAMPI_SEGRETI = ["deck", "hands", "pendingExchange", "exchangeDebug", "lastReceivedCard"];
// Campi della partita che il server copia anche nella stanza (servono a "Gioca subito" per riconoscere le stanze
// in corso, finite o abbandonate, senza leggere la partita).
const CAMPI_SPECCHIO = ["phase", "turnStartedAt", "gameId", "winnerTeam"];

const AZIONI = ["avvia", "scambio", "mossa", "brucia", "bot", "rivincita", "estrazioneVista", "aggiorna"];

class ErroreArbitro extends Error {
  constructor(codice, messaggio) {
    super(messaggio);
    this.codice = codice;
  }
}
const rifiuta = (codice, messaggio) => { throw new ErroreArbitro(codice, messaggio); };

const copia = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));

// Il database non conserva liste vuote né valori null: lo stato riletto va "rimesso in forma".
function inForma(stato) {
  const s = M.normalizeState(copia(stato));
  for (const c of COLORS) {
    if (!s.pendingExchange || typeof s.pendingExchange !== "object") s.pendingExchange = {};
  }
  return s;
}

function postoDi(players, uid) {
  if (!uid) return null;
  return COLORS.find((c) => players && players[c] && !players[c].isBot && players[c].uid === uid) || null;
}

const stessaMossa = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Una mossa è accettata solo se il motore la considera legale per quella carta, in quello stato.
function controllaMossa(stato, attivo, carta, mossa) {
  if (!mossa || typeof mossa !== "object" || typeof mossa.type !== "string") rifiuta("mossa-non-valida", "Mossa non valida.");
  const opzioni = M.legalMovesForCard(stato, attivo, carta);
  if (mossa.type === "enter" || mossa.type === "move") {
    // Si applica la mossa calcolata dal motore del server, non quella arrivata dal telefono.
    const scelta = opzioni.find((o) => o.type === mossa.type && o.pawnIndex === mossa.pawnIndex &&
      (o.type === "enter" || stessaMossa(o.path, mossa.path)));
    if (!scelta) rifiuta("mossa-illegale", "Questa mossa non è permessa.");
    return copia(scelta);
  }
  if (mossa.type === "jack") {
    if (!opzioni.some((o) => o.type === "jack")) rifiuta("mossa-illegale", "Il Jack ora non si può giocare.");
    const bersagli = M.jackableTargets(stato);
    const trova = (p) => p && bersagli.find((b) => b.color === p.color && b.pawnIndex === p.pawnIndex);
    const a = trova(mossa.a), b = trova(mossa.b);
    if (!a || !b || (a.color === b.color && a.pawnIndex === b.pawnIndex)) rifiuta("mossa-illegale", "Scambio del Jack non permesso.");
    return { type: "jack", a: { color: a.color, pawnIndex: a.pawnIndex }, b: { color: b.color, pawnIndex: b.pawnIndex } };
  }
  if (mossa.type === "seven") {
    if (!opzioni.some((o) => o.type === "seven")) rifiuta("mossa-illegale", "Il 7 ora non si può giocare.");
    if (!Array.isArray(mossa.distribution)) rifiuta("mossa-non-valida", "Distribuzione del 7 mancante.");
    const distribuzione = mossa.distribution.map((d) => ({
      pawnIndex: Number(d.pawnIndex), steps: Number(d.steps), ...(d.forPartner ? { forPartner: true } : {}),
    }));
    if (!M.sevenValidateDistribution(stato, attivo, distribuzione)) rifiuta("mossa-illegale", "Distribuzione del 7 non permessa.");
    return { type: "seven", distribution: distribuzione };
  }
  rifiuta("mossa-non-valida", "Tipo di mossa sconosciuto.");
}

function nuovaPartita(stanza, precedente) {
  const s = M.newGameState(copia(stanza.players), stanza.roomMode || "manual");
  s.gameId = stanza.gameId || s.gameId;
  s.sessione = stanza.sessione;
  if (precedente && precedente.sessione === stanza.sessione && precedente.roomStats) s.roomStats = copia(precedente.roomStats);
  s.log = [];
  s.deck = [];
  s.firstHandOfCycle = true;
  s.playedThisCycle = [];
  M.dealAndRevealDealer(s);
  return s;
}

// Esegue un'azione. stato = stato completo salvato dal server (o null), stanza = games/<stanza> (posti, modalità,
// sessione), chi = { uid }. Restituisce { stato, cambiato, finita, chatBot } oppure lancia ErroreArbitro.
function esegui(stato, stanza, azione, chi, dati) {
  dati = dati || {};
  if (!stanza || stanza.arbitro !== true) rifiuta("stanza-senza-arbitro", "Questa stanza non usa l'arbitro.");
  if (!AZIONI.includes(azione)) rifiuta("azione-sconosciuta", "Azione sconosciuta.");
  const players = stanza.players || {};
  const posto = postoDi(players, chi && chi.uid);
  if (!posto) rifiuta("non-seduto", "Non sei seduto in questa stanza.");

  const valido = stato && stato.sessione && stato.sessione === stanza.sessione;
  if (azione === "avvia") {
    if (valido && stato.phase !== "lobby") return { stato, cambiato: false };
    if (COLORS.some((c) => !players[c])) rifiuta("mancano-giocatori", "Mancano giocatori.");
    const s = nuovaPartita(stanza, stato);
    return { stato: s, cambiato: true, finita: false, chatBot: [] };
  }
  if (!valido) rifiuta("non-avviata", "La partita non è ancora cominciata.");

  const s = inForma(stato);
  s.players = copia(players); // i posti veri sono quelli della stanza (rientri, computer al posto di chi esce)
  const eraFinita = !!s.winnerTeam;
  const chatPrima = (s.chat || []).length ? s.chat[s.chat.length - 1].id || 0 : 0;
  const giaFinita = () => { if (s.phase === "finished") rifiuta("partita-finita", "La partita è già finita."); };

  if (azione === "aggiorna") {
    // Ripubblica le mani coi posti di adesso (es. "Sono io" da un altro telefono: nuovo uid). La partita non cambia.
    const prima = JSON.stringify(maniPrivate({ ...inForma(stato), players: stato.players || {} }));
    if (JSON.stringify(maniPrivate(s)) === prima) return { stato, cambiato: false };
  } else if (azione === "estrazioneVista") {
    if (!s.dealerDraw) return { stato, cambiato: false };
    s.dealerDraw = null;
  } else if (azione === "scambio") {
    giaFinita();
    if (typeof dati.carta !== "string") rifiuta("carta-mancante", "Carta mancante.");
    try { M.submitExchangeCard(s, posto, dati.carta); } catch (e) { rifiuta("scambio-non-valido", e.message); }
  } else if (azione === "mossa" || azione === "brucia") {
    giaFinita();
    if (s.phase !== "playing") rifiuta("non-si-gioca", "Ora non si gioca.");
    if (s.turnColor !== posto) rifiuta("non-tocca-a-te", "Non è il tuo turno.");
    const carta = dati.carta;
    if (typeof carta !== "string" || !(s.hands[posto] || []).includes(carta)) rifiuta("carta-non-in-mano", "Questa carta non è nella tua mano.");
    const attivo = M.activeColorFor(s, posto);
    if (!attivo) rifiuta("nessuna-pedina", "Nessuna pedina da muovere.");
    if (azione === "mossa") {
      const mossa = controllaMossa(s, attivo, carta, dati.mossa);
      M.applyMove(s, attivo, carta, mossa);
    } else {
      if (M.legalMovesForCard(s, attivo, carta).length > 0) rifiuta("carta-giocabile", "Questa carta si può giocare: non si brucia.");
      M.burnOneCard(s, posto, carta);
    }
    if (s.phase !== "finished") M.advanceTurn(s);
  } else if (azione === "bot") {
    giaFinita();
    if (s.phase === "exchanging") {
      let fatto = false;
      for (const c of COLORS) {
        if (!(players[c] && players[c].isBot) || s.pendingExchange[c]) continue;
        M.submitExchangeCard(s, c, M.botCardToGiveAway(s, c));
        fatto = true;
      }
      if (!fatto) return { stato, cambiato: false };
    } else if (s.phase === "playing" && players[s.turnColor] && players[s.turnColor].isBot) {
      M.botTakeTurn(s);
    } else {
      return { stato, cambiato: false };
    }
  } else if (azione === "rivincita") {
    if (s.phase !== "finished") rifiuta("non-finita", "La partita non è finita.");
    M.resetForNewGame(s);
  }
  const chatBot = (s.chat || []).filter((m) => (m.id || 0) > chatPrima).map((m) => ({ color: m.color, text: m.text }));
  return { stato: s, cambiato: true, finita: !eraFinita && !!s.winnerTeam, chatBot };
}

// Stato da salvare sul server: completo, ma senza i campi della stanza (quelli restano in games/<stanza>).
function statoServer(s) {
  const out = copia(s);
  for (const k of CAMPI_STANZA) if (k !== "sessione") delete out[k];
  out.players = copia(s.players);
  return out;
}

// Parte pubblica: tutto tranne i segreti, più quante carte ha ognuno e chi ha già scelto la carta da scambiare.
function pubblica(s) {
  const out = copia(s);
  for (const k of [...CAMPI_STANZA, ...CAMPI_SEGRETI]) if (k !== "sessione") delete out[k];
  out.carteInMano = {};
  out.scambioFatto = {};
  for (const c of COLORS) {
    out.carteInMano[c] = ((s.hands && s.hands[c]) || []).length;
    out.scambioFatto[c] = !!(s.pendingExchange && s.pendingExchange[c]);
  }
  out.carteNelMazzo = (s.deck || []).filter(Boolean).length;
  return out;
}

// Parte privata: per ogni posto umano con uid, le SUE carte (e quella scelta per lo scambio, e quella ricevuta).
function maniPrivate(s) {
  const out = {};
  for (const c of COLORS) {
    const p = s.players && s.players[c];
    if (!p || p.isBot || !p.uid) continue;
    out[p.uid] = {
      colore: c,
      carte: ((s.hands && s.hands[c]) || []).slice(),
      scambio: (s.pendingExchange && s.pendingExchange[c]) || null,
      ricevuta: (s.lastReceivedCard && s.lastReceivedCard[c]) || null,
      gameId: s.gameId || null,
    };
  }
  return out;
}

// Risultato per la classifica, deciso SOLO dallo stato del server. Una riga per persona (uid): chi occupa due posti
// della stessa squadra conta una volta; chi siede in TUTTE e due le squadre non conta (vincerebbe comunque).
function risultati(s) {
  if (!s.winnerTeam) return [];
  const perUid = new Map();
  for (const c of COLORS) {
    const p = s.players[c];
    if (!p || p.isBot || !p.uid) continue;
    const r = perUid.get(p.uid) || { uid: p.uid, nome: String(p.name || "?").slice(0, 60), squadre: new Set() };
    r.squadre.add(TEAM_OF[c]);
    perUid.set(p.uid, r);
  }
  // "Contro persone" se i DUE posti della squadra avversaria sono persone (il compagno può essere un computer).
  const tuttePersone = (squadra) => COLORS.filter((c) => TEAM_OF[c] === squadra)
    .every((c) => s.players[c] && !s.players[c].isBot && s.players[c].uid);
  return [...perUid.values()].filter((r) => r.squadre.size === 1)
    .map((r) => {
      const mia = [...r.squadre][0];
      const avversari = COLORS.map((c) => TEAM_OF[c]).find((t) => t !== mia);
      return { uid: r.uid, nome: r.nome, vinta: r.squadre.has(s.winnerTeam), contro: tuttePersone(avversari) ? "persone" : "computer" };
    });
}

function specchio(s) {
  const out = {};
  for (const k of CAMPI_SPECCHIO) out[k] = s[k] == null ? null : s[k];
  return out;
}

module.exports = { esegui, statoServer, pubblica, maniPrivate, risultati, specchio, ErroreArbitro, AZIONI,
  CAMPI_STANZA, CAMPI_SEGRETI, CAMPI_SPECCHIO, postoDi, inForma };
