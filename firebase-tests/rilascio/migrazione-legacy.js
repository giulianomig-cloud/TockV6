// FASE D — collegare una voce VECCHIA della classifica (chiave della rubrica, "-…") al nuovo uid.
// Unica scrittura: legacyClaims/<vecchioId> = <uid>. La classifica, la rubrica e tutto il resto NON si toccano.
// MAI per nome: ogni richiesta deve avere la prova del CODICE DI RIENTRO (seatKeys/<stanza>/<colore>),
// che vede solo il titolare dell'uid e che la persona comunica di persona.
// Idempotente: rieseguita, non riscrive niente; se trova un collegamento DIVERSO si ferma.
const rtdb = require("./rtdb");

// richieste: { "<vecchioId>": { uid, stanza, colore, codice } }
// dati: copia completa del database (backup appena fatto).
function pianifica(richieste, dati) {
  const lb = dati.leaderboard || {}, prof = dati.profiles || {}, chiavi = dati.seatKeys || {}, gia = dati.legacyClaims || {};
  const scritture = [], invariate = [], rifiutate = [];
  const uidUsati = new Map(Object.entries(gia).map(([k, v]) => [v, k]));
  for (const [vecchio, r] of Object.entries(richieste || {})) {
    const no = (motivo) => rifiutate.push({ vecchio, motivo });
    if (!r || typeof r !== "object") { no("richiesta non valida"); continue; }
    if (!vecchio.startsWith("-")) { no("non è una voce vecchia (le vecchie iniziano con '-')"); continue; }
    if (!lb[vecchio]) { no("voce non presente in classifica"); continue; }
    if (!r.uid || r.uid.startsWith("-")) { no("uid mancante o non valido"); continue; }
    if (!prof[r.uid]) { no("l'uid non ha un profilo: deve aver giocato con la versione nuova"); continue; }
    const k = ((chiavi[r.stanza] || {})[r.colore]) || null;
    if (!r.codice || !k) { no("manca la prova del codice di rientro (stanza/colore/codice)"); continue; }
    if (k.uid !== r.uid || String(k.key).toUpperCase() !== String(r.codice).trim().toUpperCase()) { no("il codice di rientro non corrisponde a quell'uid"); continue; }
    if (gia[vecchio] !== undefined) {
      if (gia[vecchio] === r.uid) invariate.push(vecchio);
      else no("voce già collegata a un ALTRO uid: serve una decisione a mano");
      continue;
    }
    if (uidUsati.has(r.uid) && uidUsati.get(r.uid) !== vecchio) { no("questo uid è già collegato a un'altra voce vecchia"); continue; }
    uidUsati.set(r.uid, vecchio);
    scritture.push({ percorso: `legacyClaims/${vecchio}`, valore: r.uid });
  }
  return { scritture, invariate, rifiutate };
}

// Applica il piano: ogni scrittura SOLO se il valore è ancora assente (ETag). Restituisce le scritture
// fatte, così chi chiama può annullarle esattamente in caso di errore (annulla()).
async function applica(b, piano) {
  const fatte = [];
  for (const s of piano.scritture) {
    const { valore, etag } = await rtdb.leggiConEtag(b, s.percorso);
    if (valore === s.valore) continue;
    if (valore !== null) throw new Error(`${s.percorso} è cambiato nel frattempo: mi fermo`);
    await rtdb.scriviSeUguale(b, s.percorso, s.valore, etag);
    fatte.push(s);
  }
  return fatte;
}
async function annulla(b, fatte) {
  for (const s of [...fatte].reverse()) {
    const { valore, etag } = await rtdb.leggiConEtag(b, s.percorso);
    if (valore === s.valore) await rtdb.scriviSeUguale(b, s.percorso, null, etag);
  }
}

// Dopo: NIENTE perso. Mentre si migra la gente può giocare (nuovi profili, partite registrate), quindi non
// si pretende l'uguaglianza: ogni voce che c'era prima deve esserci ancora, le voci vecchie della classifica
// non possono scendere, e i collegamenti già presenti non possono cambiare.
function confronta(prima, dopo) {
  prima = prima || {}; dopo = dopo || {};
  const perdite = [];
  for (const ramo of ["players", "profiles", "seatKeys", "leaderboard", "legacyClaims"]) {
    for (const id of Object.keys(prima[ramo] || {})) if (!(dopo[ramo] || {})[id]) perdite.push(`${ramo}/${id} sparita`);
  }
  for (const [id, v] of Object.entries(prima.leaderboard || {})) {
    if (!id.startsWith("-")) continue;
    const d = (dopo.leaderboard || {})[id] || {};
    for (const campo of ["vittorie", "partite", "vinte"]) {
      if (Number(d[campo] || 0) < Number(v[campo] || 0)) perdite.push(`leaderboard/${id}/${campo} sceso`);
    }
  }
  for (const [id, uid] of Object.entries(prima.legacyClaims || {})) {
    if ((dopo.legacyClaims || {})[id] !== uid) perdite.push(`legacyClaims/${id} cambiato`);
  }
  return perdite;
}

module.exports = { pianifica, applica, annulla, confronta };
