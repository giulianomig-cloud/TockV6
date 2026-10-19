// Verifica del sito dopo GitHub Pages: tempi, pubblicazioni fallite, concorrenti e cache, con API e sito finti.
const test = require("node:test");
const assert = require("node:assert/strict");
const { verifica, versioneNelSito } = require("./verifica-sito");

const SHA = "a".repeat(40), ALTRO = "b".repeat(40);
const API = "https://api.example";
const SITO = "https://sito.example/TockV6/";
const pagina = (v) => `<script>const APP_VERSION = "${v}";</script>`;

// Mondo finto: il tempo avanza solo con dormi(); ogni "passo" dice cosa vede l'API e cosa serve il sito.
function mondo(passi, { limiteMs = 60000, intervalloMs = 10000, atteso = "v6.23" } = {}) {
  let t = 0;
  const righe = [];
  const adesso = () => passi[Math.min(Math.floor(t / intervalloMs), passi.length - 1)];
  const risposta = (status, corpo) => ({ ok: status >= 200 && status < 300, status, json: async () => corpo, text: async () => corpo });
  const fetch = async (url) => {
    const p = adesso();
    if (url.startsWith(API)) {
      if (p.apiGiu) return risposta(503, "giù");
      if (url.includes("/statuses")) return risposta(200, p.stato ? [{ state: p.stato, log_url: "https://log" }] : []);
      if (url.includes("/deployments?")) return risposta(200, p.deployment ? [{ id: 7 }] : []);
      if (url.includes("/commits/main")) return risposta(200, { sha: p.testa || SHA });
    }
    if (url.startsWith(SITO + "sw.js")) return risposta(200, `const CACHE_VERSION = "${(p.sito || "v6.22").replace(".", "-")}";`);
    if (url.startsWith(SITO + "manifest.json")) return risposta(200, p.manifestRotto ? "{rotto" : "{}");
    if (url.startsWith(SITO)) return p.sitoGiu ? risposta(404, "") : risposta(200, pagina(p.sito || "v6.22"));
    throw new Error("url inatteso " + url);
  };
  return {
    righe,
    esegui: () => verifica({
      repo: "u/r", sha: SHA, sito: SITO, atteso, api: API, limiteMs, intervalloMs,
      fetch, ora: () => t, dormi: async (ms) => { t += ms; }, log: (s) => righe.push(s),
    }),
  };
}

test("aspetta la FINE della pubblicazione: col sito ancora vecchio non dichiara successo, poi sì", async () => {
  const m = mondo([
    { deployment: false },
    { deployment: true, stato: "queued" },
    { deployment: true, stato: "in_progress" },
    { deployment: true, stato: "success", sito: "v6.22" }, // pubblicato ma la cache serve ancora il vecchio
    { deployment: true, stato: "success", sito: "v6.23" },
  ]);
  const r = await m.esegui();
  assert.equal(r.ok, true, r.motivo);
  assert.equal(r.trovata, "v6.23");
  assert.ok(m.righe.some((s) => s.includes("versione attesa v6.23 · trovata v6.22 · NON ANCORA")), "deve registrare il tentativo col sito vecchio");
  assert.ok(m.righe.some((s) => s.includes("pubblicazione aaaaaaa: in_progress")));
});

test("subito dopo il merge il sito ha già la versione giusta (stessa versione di prima) → aspetta comunque la pubblicazione", async () => {
  let vistoSito = false;
  const m = mondo([
    { deployment: false, sito: "v6.23" },
    { deployment: true, stato: "in_progress", sito: "v6.23" },
    { deployment: true, stato: "success", sito: "v6.23" },
  ]);
  const r = await m.esegui();
  assert.equal(r.ok, true);
  const iPub = m.righe.findIndex((s) => s.includes(": success"));
  const iSito = m.righe.findIndex((s) => s.startsWith("versione attesa"));
  vistoSito = iSito > iPub;
  assert.ok(vistoSito, "il sito si controlla solo DOPO la pubblicazione riuscita");
});

test("pubblicazione fallita → errore, senza guardare il sito", async () => {
  const r = await mondo([{ deployment: true, stato: "in_progress" }, { deployment: true, stato: "failure", sito: "v6.23" }]).esegui();
  assert.equal(r.ok, false);
  assert.match(r.motivo, /fallita \(failure\)/);
});

test("pubblicazione in errore → errore", async () => {
  const r = await mondo([{ deployment: true, stato: "error" }]).esegui();
  assert.equal(r.ok, false);
  assert.match(r.motivo, /fallita \(error\)/);
});

test("pubblicazione sostituita da una più recente (inactive) → errore, anche se il sito mostra la versione attesa", async () => {
  const r = await mondo([{ deployment: true, stato: "inactive", sito: "v6.23" }]).esegui();
  assert.equal(r.ok, false);
  assert.match(r.motivo, /superata/);
});

test("pubblicazioni concorrenti: main è già andato avanti prima che questo commit fosse pubblicato → errore", async () => {
  const r = await mondo([{ deployment: false, testa: ALTRO, sito: "v6.23" }]).esegui();
  assert.equal(r.ok, false);
  assert.match(r.motivo, /superato da un commit più recente/);
});

test("la pubblicazione non parte mai → errore allo scadere del limite", async () => {
  const m = mondo([{ deployment: false }], { limiteMs: 30000 });
  const r = await m.esegui();
  assert.equal(r.ok, false);
  assert.match(r.motivo, /non completata entro il limite \(ultimo stato: non ancora creata\)/);
});

test("pubblicazione ferma in coda → errore allo scadere del limite, con l'ultimo stato", async () => {
  const r = await mondo([{ deployment: true, stato: "queued" }], { limiteMs: 30000 }).esegui();
  assert.equal(r.ok, false);
  assert.match(r.motivo, /ultimo stato: queued/);
});

test("pubblicazione riuscita ma il sito resta alla versione precedente → errore (mai successo a vuoto)", async () => {
  const m = mondo([{ deployment: true, stato: "success", sito: "v6.22" }], { limiteMs: 30000 });
  const r = await m.esegui();
  assert.equal(r.ok, false);
  assert.equal(r.trovata, "v6.22");
  assert.match(r.motivo, /non mostra v6.23/);
  assert.ok(m.righe.filter((s) => s.startsWith("versione attesa v6.23 · trovata v6.22")).length >= 2, "registra ogni tentativo");
});

test("errori temporanei dell'API e del sito: riprova e poi riesce", async () => {
  const r = await mondo([
    { apiGiu: true },
    { deployment: true, stato: "success", sitoGiu: true },
    { deployment: true, stato: "success", sito: "v6.23" },
  ]).esegui();
  assert.equal(r.ok, true, r.motivo);
});

test("sw.js o manifest non coerenti → non è un successo", async () => {
  const r = await mondo([{ deployment: true, stato: "success", sito: "v6.23", manifestRotto: true }], { limiteMs: 20000 }).esegui();
  assert.equal(r.ok, false);
});

test("il limite massimo è rispettato (nessuna attesa infinita)", async () => {
  const m = mondo([{ deployment: true, stato: "in_progress" }], { limiteMs: 120000, intervalloMs: 15000 });
  const r = await m.esegui();
  assert.equal(r.ok, false);
  assert.ok(m.righe.filter((s) => s.startsWith("…")).length <= 120000 / 15000 + 1);
});

test("lettura della versione dalla pagina", () => {
  assert.equal(versioneNelSito(pagina("v6.16")), "v6.16");
  assert.equal(versioneNelSito("<html></html>"), "(nessuna)");
});
