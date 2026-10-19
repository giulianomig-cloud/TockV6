// PROPOSTA DI MIGRAZIONE DELLA CLASSIFICA — SOLO LETTURA.
// Legge un file JSON esportato dalla console Firebase (Realtime Database → ⋮ → Esporta JSON)
// e stampa un resoconto. NON si collega a Firebase e NON scrive nulla da nessuna parte.
//
// Uso:  node migrazione/analizza-classifica.js percorso/export.json
const fs = require("node:fs");

const norm = (s) => String(s || "").trim().replace(/\s+/g, " ").toLowerCase();

function analizza(dump) {
  const lb = (dump && dump.leaderboard) || {};
  const rubrica = (dump && dump.players) || {};
  const voci = Object.entries(lb).map(([id, v]) => ({
    id,
    nome: (v && v.nome) || "?",
    vittorie: Number((v && v.vittorie) || 0),
    partite: Number((v && v.partite) || 0),
    vinte: Number((v && v.vinte) || 0),
  }));
  const totali = voci.reduce(
    (t, v) => ({ vittorie: t.vittorie + v.vittorie, partite: t.partite + v.partite, vinte: t.vinte + v.vinte }),
    { vittorie: 0, partite: 0, vinte: 0 }
  );
  // Nomi usati da più voci della rubrica (persone diverse già "fuse" o doppioni).
  const perNome = {};
  for (const [id, p] of Object.entries(rubrica)) {
    const k = norm(p && p.nome);
    if (!k) continue;
    (perNome[k] = perNome[k] || []).push(id);
  }
  const nomiDoppi = Object.entries(perNome).filter(([, ids]) => ids.length > 1).map(([nome, ids]) => ({ nome, ids }));
  const senzaRubrica = voci.filter((v) => !rubrica[v.id]).map((v) => v.id);
  const anomalie = voci.filter((v) => v.vinte > v.partite || v.vittorie < 0 || v.partite < 0 || v.vinte < 0).map((v) => v.id);
  return { numeroVoci: voci.length, numeroRubrica: Object.keys(rubrica).length, totali, nomiDoppi, senzaRubrica, anomalie, voci };
}

module.exports = { analizza };

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error("Uso: node migrazione/analizza-classifica.js export.json");
    process.exit(1);
  }
  const r = analizza(JSON.parse(fs.readFileSync(file, "utf8")));
  console.log(`Voci in classifica: ${r.numeroVoci} · voci in rubrica: ${r.numeroRubrica}`);
  console.log(`Totali (devono restare UGUALI dopo qualsiasi migrazione): vittorie ${r.totali.vittorie}, partite ${r.totali.partite}, vinte ${r.totali.vinte}`);
  console.log(`Nomi usati da più voci della rubrica: ${r.nomiDoppi.length ? r.nomiDoppi.map((d) => d.nome + " (" + d.ids.length + ")").join(", ") : "nessuno"}`);
  console.log(`Voci di classifica senza rubrica: ${r.senzaRubrica.length}`);
  console.log(`Voci con numeri impossibili (vinte > partite o negativi): ${r.anomalie.length ? r.anomalie.join(", ") : "nessuna"}`);
}
