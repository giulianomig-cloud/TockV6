// Banco di prova "dal vivo": il gioco vero (index.html) in Chromium con più "telefoni"
// (contesti separati = memorie separate), collegato all'EMULATORE (index.html?emu=1 su
// localhost), mai al Firebase vero. preparaBanco(fileRegole) carica le regole indicate
// sul database dell'emulatore e registra gli hook before/after del file di test.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { execSync } = require("node:child_process");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (e) {
  ({ chromium } = require(execSync("npm root -g").toString().trim() + "/playwright"));
}

const ROOT = path.resolve(__dirname, "../..");
const NS = "tock-v6-default-rtdb"; // nome del database preso da databaseURL in index.html
const DB = "http://127.0.0.1:9000";
const OWNER = { Authorization: "Bearer owner" }; // credenziale fittizia dell'emulatore
const FB = path.resolve(__dirname, "../node_modules/firebase");
const CHROME = fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;
const LIMITE = { timeout: 180000 };

// Versione del gioco che si sta provando (index.html di questo branch). Nel branch di RIPRISTINO il gioco
// è la v6.16 (numerata v6.23): le prove delle funzioni nate dopo la v6.16 (login, profili, posti protetti,
// stanze bloccate, nuovo tentativo) non hanno niente da provare e vengono SALTATE con il motivo scritto.
// Le prove delle regole e quelle di compatibilità della v6.16 girano sempre. Il ripristino si riconosce
// dal codice (identico alla v6.16 salvo il numero): un numero alto da solo non basta (vedi codiceV616).
const HTML_ATTUALE = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const numero = (v) => { const [a, b] = String(v).replace(/^v/, "").split(".").map(Number); return a * 100 + b; };
const GIOCO_V616 = (() => {
  const vecchio = execSync(`git -C "${ROOT}" show c89c66d:index.html`, { maxBuffer: 64 * 1024 * 1024 }).toString();
  const senzaNumero = (h) => h.replace(/const APP_VERSION = "[^"]+"/, "");
  return senzaNumero(vecchio) === senzaNumero(HTML_ATTUALE);
})();
// Uso: test("…", richiede("v6.20"), async () => {…}) al posto di LIMITE.
function richiede(minima) {
  if (!GIOCO_V616) return LIMITE;
  return { ...LIMITE, skip: `funzione nata nella ${minima}: il gioco di questo branch è la v6.16 ripristinata` };
}

const leggi = async (p) => (await fetch(`${DB}/${p}.json?ns=${NS}`, { headers: OWNER })).json();
const scrivi = (p, v) => fetch(`${DB}/${p}.json?ns=${NS}`, { method: "PUT", headers: OWNER, body: JSON.stringify(v) });
const aspetta = (ms) => new Promise((r) => setTimeout(r, ms));
async function finché(cond, ms = 20000, passo = 250) {
  const fine = Date.now() + ms;
  while (Date.now() < fine) {
    const v = await cond();
    if (v) return v;
    await aspetta(passo);
  }
  throw new Error("tempo scaduto in attesa della condizione");
}

// Versione VECCHIA del gioco (v6.16, commit del checkpoint): non conosce l'emulatore, quindi
// il suo index.html viene servito con databaseURL sostituito da quello dell'emulatore.
const COMMIT_V616 = "c89c66d";
const URL_VERO = 'databaseURL: "https://tock-v6-default-rtdb.europe-west1.firebasedatabase.app"';
const URL_EMU = `databaseURL: "http://127.0.0.1:9000?ns=${NS}"`;
function indexVecchio() {
  const html = execSync(`git -C "${ROOT}" show ${COMMIT_V616}:index.html`, { maxBuffer: 64 * 1024 * 1024 }).toString();
  assert.equal(html.split(URL_VERO).length, 2, "indirizzo del database vero non trovato una sola volta");
  const out = html.replace(URL_VERO, URL_EMU);
  assert.ok(!/firebasedatabase\.app|firebaseio\.com/.test(out), "nella pagina vecchia è rimasto un indirizzo del database vero");
  assert.match(out, /const APP_VERSION = "v6\.16"/);
  return out;
}

// telefono(nome, { vecchia: true }) apre il gioco v6.16 (servito come /index-v616.html).
function preparaBanco(fileRegole) {
  let server, base, browser;
  const htmlVecchio = indexVecchio();
  const errori = [];
  const aperti = []; // telefoni aperti nella prova in corso: si chiudono sempre, anche se la prova fallisce

  async function telefono(nome, { senzaLogin = false, giocatore = null, vecchia = false } = {}) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", locale: "it-IT" });
    // Gli script Firebase arrivano dal pacchetto locale (stessa versione 10.12.2), non da internet.
    await ctx.route(/gstatic\.com\/firebasejs\/[^/]+\/(firebase-[a-z]+-compat\.js)/, (r) => {
      const file = r.request().url().match(/(firebase-[a-z]+-compat\.js)/)[1];
      r.fulfill({ path: path.join(FB, file), contentType: "application/javascript" });
    });
    await ctx.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.abort());
    // Rete di sicurezza: NIENTE può raggiungere il database o il login veri.
    // (si guarda il NOME DEL SERVER: il login dell'emulatore ha "identitytoolkit" solo nel percorso)
    const vero = (u) => /(^|\.)(firebasedatabase\.app|firebaseio\.com)$|^(identitytoolkit|securetoken)\.googleapis\.com$/.test(u.hostname);
    await ctx.route(vero, (r) => r.abort());
    await ctx.routeWebSocket(vero, (ws) => ws.close());
    if (senzaLogin) await ctx.route(/127\.0\.0\.1:9099/, (r) => r.abort());
    const init = [`localStorage.setItem("tock-hide-a2hs","1");`];
    if (giocatore) init.push(`localStorage.setItem("tock-player", ${JSON.stringify(JSON.stringify(giocatore))});`);
    await ctx.addInitScript(init.join(""));
    aperti.push(ctx);
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errori.push(`[${nome}] ${e.message}`));
    if (process.env.DEBUG_E2E) page.on("console", (m) => console.log(`[${nome}] ${m.type()}: ${m.text().slice(0, 300)}`));
    await page.goto(vecchia ? `${base}/index-v616.html` : `${base}/index.html?emu=1`);
    await page.waitForFunction(() => typeof db !== "undefined" && db);
    const versione = await page.evaluate(() => APP_VERSION);
    if (vecchia) assert.equal(versione, "v6.16");
    else assert.notEqual(versione, "v6.16");
    // la pagina deve parlare con l'emulatore, mai col database vero
    const dove = await page.evaluate(() => (db && db.app && db.app.options && db.app.options.databaseURL) || "");
    const emu = await page.evaluate(() => typeof FIREBASE_EMULATOR !== "undefined" && FIREBASE_EMULATOR);
    assert.ok(emu || dove.startsWith("http://127.0.0.1:9000"), "pagina non collegata all'emulatore: " + dove);
    return { ctx, page };
  }

  test.before(async () => {
    server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split("?")[0]);
      if (url === "/index-v616.html") {
        res.writeHead(200, { "Content-Type": "text/html" });
        return res.end(htmlVecchio);
      }
      const file = path.join(ROOT, url === "/" ? "index.html" : url);
      if (file === path.join(ROOT, "index.html")) {
        // Un index.html senza supporto all'emulatore (es. il ripristino v6.21) verrebbe collegato al
        // database VERO: in quel caso si sostituisce l'indirizzo come per la v6.16.
        let html = fs.readFileSync(file, "utf8");
        if (!html.includes("FIREBASE_EMULATOR")) {
          assert.equal(html.split(URL_VERO).length, 2, "indirizzo del database vero non trovato una sola volta");
          html = html.replace(URL_VERO, URL_EMU);
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        return res.end(html);
      }
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      const tipi = { ".html": "text/html", ".js": "application/javascript", ".json": "application/json", ".png": "image/png" };
      res.writeHead(200, { "Content-Type": tipi[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://localhost:${server.address().port}`;
    const regole = fs.readFileSync(path.resolve(__dirname, fileRegole), "utf8");
    const r = await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: "PUT", headers: OWNER, body: regole });
    assert.equal(r.status, 200, "regole non caricate sull'emulatore: " + (await r.text()));
    browser = await chromium.launch({ executablePath: CHROME });
  });

  test.afterEach(async () => {
    while (aperti.length) await aperti.pop().close().catch(() => {});
  });

  test.after(async () => {
    if (browser) await browser.close();
    if (server) {
      server.closeAllConnections();
      server.close();
    }
  });

  test.beforeEach(async () => {
    await scrivi("", null);
    errori.length = 0;
  });

  return { telefono, errori };
}

module.exports = { preparaBanco, leggi, scrivi, aspetta, finché, LIMITE, richiede, GIOCO_V616 };
