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

function preparaBanco(fileRegole) {
  let server, base, browser;
  const errori = [];
  const aperti = []; // telefoni aperti nella prova in corso: si chiudono sempre, anche se la prova fallisce

  async function telefono(nome, { senzaLogin = false, giocatore = null } = {}) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", locale: "it-IT" });
    // Gli script Firebase arrivano dal pacchetto locale (stessa versione 10.12.2), non da internet.
    await ctx.route(/gstatic\.com\/firebasejs\/[^/]+\/(firebase-[a-z]+-compat\.js)/, (r) => {
      const file = r.request().url().match(/(firebase-[a-z]+-compat\.js)/)[1];
      r.fulfill({ path: path.join(FB, file), contentType: "application/javascript" });
    });
    await ctx.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.abort());
    if (senzaLogin) await ctx.route(/127\.0\.0\.1:9099/, (r) => r.abort());
    const init = [`localStorage.setItem("tock-hide-a2hs","1");`];
    if (giocatore) init.push(`localStorage.setItem("tock-player", ${JSON.stringify(JSON.stringify(giocatore))});`);
    await ctx.addInitScript(init.join(""));
    aperti.push(ctx);
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errori.push(`[${nome}] ${e.message}`));
    await page.goto(`${base}/index.html?emu=1`);
    await page.waitForFunction(() => typeof db !== "undefined" && db);
    return { ctx, page };
  }

  test.before(async () => {
    server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split("?")[0]);
      const file = path.join(ROOT, url === "/" ? "index.html" : url);
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

module.exports = { preparaBanco, leggi, scrivi, aspetta, finché, LIMITE };
