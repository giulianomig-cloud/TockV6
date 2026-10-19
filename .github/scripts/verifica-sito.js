// Verifica dopo una pubblicazione su GitHub Pages ("Deploy from branch").
// 1) Aspetta la pubblicazione (deployment "github-pages") di QUESTO commit e che finisca con successo.
//    Fallita, superata da un commit più recente o mai partita entro il limite = ERRORE.
// 2) Solo dopo controlla il sito: index.html, sw.js e manifest.json devono avere la versione del commit.
//    Se il sito mostra ancora la versione precedente fino al limite = ERRORE (mai un successo "a vuoto").
// Ogni tentativo scrive nel log: versione attesa, versione trovata, esito. Limite massimo: LIMITE_MS.
const fs = require("node:fs");
const path = require("node:path");

const STATI_FINALI_KO = ["failure", "error"];

function versioneAttesa(root) {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const m = html.match(/APP_VERSION\s*=\s*"([^"]+)"/);
  if (!m) throw new Error("APP_VERSION non trovata in index.html");
  return m[1];
}
const versioneNelSito = (html) => (String(html).match(/APP_VERSION\s*=\s*"([^"]+)"/) || [])[1] || "(nessuna)";

// o: { repo, sha, sito, atteso, token, api, limiteMs, intervalloMs, fetch, ora, dormi, log }
async function verifica(o) {
  const fetch_ = o.fetch || fetch;
  const ora = o.ora || (() => Date.now());
  const dormi = o.dormi || ((ms) => new Promise((r) => setTimeout(r, ms)));
  const log = o.log || ((s) => console.log(s));
  const api = (o.api || "https://api.github.com").replace(/\/$/, "");
  const fine = ora() + o.limiteMs;
  const intestazioni = { Accept: "application/vnd.github+json", ...(o.token ? { Authorization: "Bearer " + o.token } : {}) };
  const json = async (url) => {
    const r = await fetch_(url, { headers: intestazioni });
    if (!r.ok) throw new Error(`API ${r.status} su ${url.replace(api, "")}`);
    return r.json();
  };
  const esito = (ok, motivo, extra = {}) => ({ ok, motivo, atteso: o.atteso, ...extra });
  const corto = o.sha.slice(0, 7);
  log(`Commit ${corto} · versione attesa ${o.atteso} · limite ${o.limiteMs >= 120000 ? Math.round(o.limiteMs / 60000) + " min" : Math.round(o.limiteMs / 1000) + " s"}`);

  // 1) Pubblicazione di questo commit
  let deployment = null, ultimoStato = "non ancora creata";
  for (;;) {
    try {
      if (!deployment) {
        const lista = await json(`${api}/repos/${o.repo}/deployments?environment=github-pages&sha=${o.sha}&per_page=5`);
        deployment = lista[0] || null;
      }
      if (deployment) {
        const stati = await json(`${api}/repos/${o.repo}/deployments/${deployment.id}/statuses?per_page=1`);
        ultimoStato = (stati[0] && stati[0].state) || "in attesa";
        if (ultimoStato === "success") { log(`✓ pubblicazione ${corto}: success`); break; }
        if (STATI_FINALI_KO.includes(ultimoStato)) {
          log(`✗ pubblicazione ${corto}: ${ultimoStato}${stati[0].log_url ? " — " + stati[0].log_url : ""}`);
          return esito(false, `pubblicazione fallita (${ultimoStato})`);
        }
        if (ultimoStato === "inactive") {
          log(`✗ pubblicazione ${corto}: inactive (sostituita da una pubblicazione più recente)`);
          return esito(false, "pubblicazione superata da un commit più recente: il sito NON mostra questo commit");
        }
      }
      // Un commit più recente su main rende inutile aspettare questo: lo verificherà il suo giro.
      const testa = await json(`${api}/repos/${o.repo}/commits/main`);
      if (testa.sha && testa.sha !== o.sha && !deployment) {
        log(`✗ main è già a ${testa.sha.slice(0, 7)}: questo commit non verrà pubblicato da solo`);
        return esito(false, "superato da un commit più recente prima della pubblicazione");
      }
    } catch (e) {
      log(`… errore temporaneo: ${e.message}`);
    }
    if (ora() >= fine) {
      log(`✗ tempo scaduto aspettando la pubblicazione (ultimo stato: ${ultimoStato})`);
      return esito(false, `pubblicazione non completata entro il limite (ultimo stato: ${ultimoStato})`);
    }
    log(`… pubblicazione ${corto}: ${ultimoStato}`);
    await dormi(o.intervalloMs);
  }

  // 2) Il sito deve servire la versione del commit (la cache può impiegare un po')
  const testo = async (f) => {
    const r = await fetch_(o.sito + f + (f.includes("?") ? "&" : "?") + "nocache=" + ora(), { headers: { "Cache-Control": "no-cache" } });
    if (!r.ok) throw new Error(`${f || "index.html"}: HTTP ${r.status}`);
    return r.text();
  };
  let trovata = "(non letta)";
  for (;;) {
    let problema = null;
    try {
      trovata = versioneNelSito(await testo(""));
      if (trovata !== o.atteso) problema = `il sito mostra ${trovata}`;
      else {
        const sw = await testo("sw.js");
        if (!sw.includes(`"${o.atteso.replace(".", "-")}"`)) problema = "sw.js del sito ha un'altra versione";
        else JSON.parse(await testo("manifest.json"));
      }
    } catch (e) {
      problema = e.message;
    }
    log(`versione attesa ${o.atteso} · trovata ${trovata} · ${problema ? "NON ANCORA (" + problema + ")" : "OK"}`);
    if (!problema) return esito(true, "il sito pubblica la versione del commit", { trovata });
    if (ora() >= fine) return esito(false, `dopo la pubblicazione il sito non mostra ${o.atteso} entro il limite (${problema})`, { trovata });
    await dormi(o.intervalloMs);
  }
}

module.exports = { verifica, versioneAttesa, versioneNelSito };

if (require.main === module) {
  const env = process.env;
  const root = path.resolve(__dirname, "../..");
  const o = {
    repo: env.GITHUB_REPOSITORY,
    sha: env.SHA_DA_VERIFICARE || env.GITHUB_SHA,
    sito: env.SITO || "https://giulianomig-cloud.github.io/TockV6/",
    atteso: versioneAttesa(root),
    token: env.GITHUB_TOKEN,
    api: env.GITHUB_API_URL,
    limiteMs: Number(env.LIMITE_MS || 20 * 60 * 1000),
    intervalloMs: Number(env.INTERVALLO_MS || 15000),
  };
  if (!o.repo || !o.sha) { console.error("✗ servono GITHUB_REPOSITORY e GITHUB_SHA"); process.exit(2); }
  verifica(o).then((r) => {
    const riga = `${r.ok ? "✓" : "✗"} Verifica del sito: ${r.motivo} · attesa ${r.atteso} · trovata ${r.trovata || "-"}`;
    console.log(riga);
    if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `## Verifica del sito\n\n| Commit | Attesa | Trovata | Esito |\n|---|---|---|---|\n| ${o.sha.slice(0, 7)} | ${r.atteso} | ${r.trovata || "-"} | ${r.ok ? "✓" : "✗"} ${r.motivo} |\n`);
    if (!r.ok) process.exit(1);
  }).catch((e) => { console.error("✗ " + e.message); process.exit(1); });
}
