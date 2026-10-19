// Letture e scritture REST sul database scelto con bersaglio.js. Nessuna altra via di accesso.
const { togliCommenti } = require("../fase0/regole-util");

async function richiesta(b, url, opzioni = {}) {
  const r = await fetch(url, { ...opzioni, headers: { ...(await b.intestazioni()), ...(opzioni.headers || {}) } });
  const testo = await r.text();
  if (!r.ok) throw new Error(`${opzioni.method || "GET"} ${url.replace(/\?.*$/, "")}: ${r.status} ${testo.slice(0, 200)}`);
  return { testo, etag: r.headers.get("etag") };
}

module.exports = {
  leggiRegoleTesto: async (b) => (await richiesta(b, b.regole())).testo,
  leggiRegole: async (b) => JSON.parse(togliCommenti((await richiesta(b, b.regole())).testo)),
  pubblicaRegole: (b, testo) => richiesta(b, b.regole(), { method: "PUT", body: testo }),
  leggi: async (b, p = "") => JSON.parse((await richiesta(b, b.indirizzo(p))).testo),
  // Lettura con ETag (impronta del valore): serve per scrivere solo se nel frattempo nessuno l'ha cambiato.
  leggiConEtag: async (b, p) => {
    const r = await richiesta(b, b.indirizzo(p), { headers: { "X-Firebase-ETag": "true" } });
    return { valore: JSON.parse(r.testo), etag: r.etag };
  },
  scriviSeUguale: (b, p, valore, etag) =>
    richiesta(b, b.indirizzo(p), { method: "PUT", body: JSON.stringify(valore), headers: { "if-match": etag } }),
  // Solo per l'emulatore (prove): la produzione non ha scritture "libere" negli strumenti di rilascio.
  scriviEmulatore: (b, p, valore) => {
    if (b.tipo !== "emulatore") throw new Error("scrittura libera ammessa solo sull'emulatore");
    return richiesta(b, b.indirizzo(p), { method: "PUT", body: JSON.stringify(valore) });
  },
};
