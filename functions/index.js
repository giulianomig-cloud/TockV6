// Cloud Function "arbitro" di Tock (europe-west1, come il database).
// Ogni azione di una partita con l'arbitro passa da qui: il telefono manda { stanza, azione, carta?, mossa? },
// la funzione controlla chi è (login anonimo), applica l'azione con arbitro.js e scrive, in un'unica transazione:
//   arbitro/<stanza>/stato   stato completo (mazzo e mani): NESSUN telefono può leggerlo
//   arbitro/<stanza>/pub     parte pubblica (pedine, turno, registro, quante carte ha ognuno)
//   arbitro/<stanza>/mani/<uid>   le carte di quel giocatore, leggibili solo da lui
// Poi copia fase/turno nella stanza (per "Gioca subito"), aggiunge i commenti dei computer alla chat e, a fine
// partita, aggiorna la classifica UNA volta per partita (solo il server può scriverla, con le regole dell'arbitro).
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getDatabase, ServerValue } = require("firebase-admin/database");
const A = require("./arbitro");

// In produzione il database è quello del progetto. Solo nell'emulatore (progetto finto demo-tock) si usa quello
// del gioco in prova (functions/.env.demo-tock).
initializeApp(process.env.TOCK_DATABASE_URL ? { databaseURL: process.env.TOCK_DATABASE_URL } : undefined);

const NOME_STANZA = /^[A-Za-z0-9-]{1,40}$/;

const CODICI_HTTP = {
  "non-seduto": "permission-denied",
  "stanza-senza-arbitro": "failed-precondition",
  "non-avviata": "failed-precondition",
  "mancano-giocatori": "failed-precondition",
  "partita-finita": "failed-precondition",
  "non-finita": "failed-precondition",
  "non-si-gioca": "failed-precondition",
  "non-tocca-a-te": "failed-precondition",
};

async function eseguiAzione(db, uid, richiesta) {
  const stanzaId = richiesta && richiesta.stanza;
  const azione = richiesta && richiesta.azione;
  if (typeof stanzaId !== "string" || !NOME_STANZA.test(stanzaId)) throw new HttpsError("invalid-argument", "Stanza non valida.");
  if (!A.AZIONI.includes(azione)) throw new HttpsError("invalid-argument", "Azione sconosciuta.");
  const dati = { carta: richiesta.carta, mossa: richiesta.mossa };

  const stanza = (await db.ref("games/" + stanzaId).get()).val();
  if (!stanza) throw new HttpsError("not-found", "La stanza non esiste.");

  let esito = null;
  let errore = null;
  const ref = db.ref("arbitro/" + stanzaId);
  const res = await ref.transaction((cur) => {
    errore = null;
    esito = null;
    try {
      esito = A.esegui(cur && cur.stato ? cur.stato : null, stanza, azione, { uid }, dati);
    } catch (e) {
      errore = e;
      return cur; // nessun cambiamento: la decisione è confermata solo se presa sui dati veri del server
    }
    if (!esito.cambiato) return cur;
    const rev = ((cur && cur.stato && cur.stato.rev) || 0) + 1;
    const stato = A.statoServer(esito.stato);
    stato.rev = rev;
    const pub = A.pubblica(esito.stato);
    pub.rev = rev;
    return { stato, pub, mani: A.maniPrivate(esito.stato) };
  });
  if (errore) {
    if (errore instanceof A.ErroreArbitro) throw new HttpsError(CODICI_HTTP[errore.codice] || "invalid-argument", errore.message, { codice: errore.codice });
    throw errore;
  }
  if (!res.committed || !esito || !esito.cambiato) return { ok: true, cambiato: false };

  const s = esito.stato;
  const lavori = [db.ref("games/" + stanzaId).update(A.specchio(s))];
  if (esito.chatBot && esito.chatBot.length) {
    lavori.push(db.ref("games/" + stanzaId + "/chat").transaction((chat) => {
      const lista = Array.isArray(chat) ? chat : chat ? Object.values(chat) : [];
      for (const m of esito.chatBot) {
        const ultimo = lista.length ? lista[lista.length - 1].id || 0 : 0;
        lista.push({ id: ultimo + 1, color: m.color, text: String(m.text).slice(0, 200), ts: Date.now() });
      }
      return lista.slice(-100);
    }));
  }
  if (esito.finita) lavori.push(registraRisultato(db, stanzaId, s));
  await Promise.all(lavori);
  return { ok: true, cambiato: true, rev: res.snapshot.child("stato/rev").val() };
}

// Classifica: una sola volta per partita (credited/<stanza>/<gameId>/<uid>), solo coi risultati del server.
async function registraRisultato(db, stanzaId, s) {
  const ris = A.risultati(s);
  if (!s.gameId || !ris.length) return;
  let nuovi = [];
  await db.ref("credited/" + stanzaId + "/" + s.gameId).transaction((cur) => {
    const segnati = cur || {};
    nuovi = ris.filter((r) => !segnati[r.uid]);
    if (!nuovi.length) return; // già registrata
    const out = { ...segnati };
    for (const r of nuovi) out[r.uid] = true;
    return out;
  });
  if (!nuovi.length) return;
  const upd = { "stats/gamesFinished": ServerValue.increment(1) };
  for (const r of nuovi) {
    upd["leaderboard/" + r.uid + "/nome"] = r.nome;
    upd["leaderboard/" + r.uid + "/partite"] = ServerValue.increment(1);
    upd["leaderboard/" + r.uid + "/vinte"] = ServerValue.increment(r.vinta ? 1 : 0);
    upd["leaderboard/" + r.uid + "/vittorie"] = ServerValue.increment(r.vinta ? 1 : 0);
    upd["leaderboard/" + r.uid + "/ultimaStanza"] = stanzaId;
    upd["leaderboard/" + r.uid + "/ultimaPartita"] = s.gameId;
  }
  await db.ref().update(upd);
}

exports.arbitro = onCall({ region: "europe-west1", maxInstances: 10, memory: "256MiB", timeoutSeconds: 30 }, async (req) => {
  if (!req.auth || !req.auth.uid) throw new HttpsError("unauthenticated", "Serve il login.");
  return eseguiAzione(getDatabase(), req.auth.uid, req.data || {});
});

exports._perTest = { eseguiAzione, registraRisultato };
