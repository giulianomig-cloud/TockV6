// Prova "dal vivo" del login anonimo (v6.17): il gioco vero (index.html) gira in
// Chromium con più "telefoni" (contesti separati = memorie separate), collegato
// all'EMULATORE (index.html?emu=1 su localhost), mai al Firebase vero.
// Sul database dell'emulatore valgono le regole ATTUALI (database.rules.json):
// il login anonimo deve funzionare senza cambiare le regole.
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

let server, base, browser;
const errori = [];
const aperti = []; // telefoni aperti nella prova in corso: si chiudono sempre, anche se la prova fallisce
const LIMITE = { timeout: 150000 };

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
  // Regole ATTUALI del repository sul database dell'emulatore.
  const regole = fs.readFileSync(path.join(ROOT, "database.rules.json"), "utf8");
  const r = await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: "PUT", headers: OWNER, body: regole });
  assert.equal(r.status, 200, "regole non caricate sull'emulatore");
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

test("Gioca subito con 4 persone: ogni posto ha l'uid del proprio telefono", LIMITE, async () => {
  const nomi = ["Anna", "Bruno", "Carla", "Dario"];
  const tel = [];
  for (const [i, n] of nomi.entries()) {
    tel.push(await telefono(n, { giocatore: { id: "p-" + n.toLowerCase(), nome: n } }));
    await tel[i].page.evaluate(() => startMatchmaking());
    await aspetta(400);
  }
  const uids = [];
  for (const t of tel) uids.push(await finché(() => t.page.evaluate(() => myUid)));
  assert.equal(new Set(uids).size, 4, "ogni telefono deve avere un uid diverso");

  const stanza = await finché(async () => {
    const g = (await leggi("games")) || {};
    return Object.values(g).find((s) => s.players && Object.keys(s.players).length === 4);
  });
  const posti = Object.values(stanza.players);
  for (const [i, n] of nomi.entries()) {
    const p = posti.find((x) => x.name === n);
    assert.ok(p, `${n} deve essere seduto`);
    assert.equal(p.uid, uids[i], `il posto di ${n} deve avere l'uid del suo telefono`);
    assert.equal(p.playerId, "p-" + n.toLowerCase(), "il playerId della rubrica resta com'era");
  }
  assert.notEqual(stanza.phase, "lobby");
  assert.deepEqual(errori, []);
  for (const t of tel) await t.ctx.close();
});

test("Gioca subito con i computer: i bot giocano, la rivincita riparte, la classifica conta", LIMITE, async () => {
  const t = await telefono("Elena", { giocatore: { id: "p-elena", nome: "Elena" } });
  await t.page.evaluate(() => startMatchmaking());
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId));
  await t.page.evaluate(() => mmFillWithBots("easy", null));
  const uid = await t.page.evaluate(() => myUid);
  assert.ok(uid);

  // Partita avviata, con l'uid sul posto della persona
  const st0 = await finché(async () => {
    const s = await leggi(`games/${roomId}`);
    return s && s.players && Object.keys(s.players).length === 4 && s.phase !== "lobby" ? s : null;
  });
  const mio = Object.values(st0.players).find((p) => !p.isBot);
  assert.equal(mio.uid, uid);
  assert.equal(Object.values(st0.players).filter((p) => p.isBot).length, 3);

  // La persona gioca da sola come farebbe un bot (scambio e mosse), i bot fanno il resto.
  await t.page.evaluate(() => {
    window.__autoGioca = setInterval(() => {
      const st = currentState;
      if (!st || moveInFlight) return;
      if (st.phase === "exchanging" && st.pendingExchange && !st.pendingExchange[myColor] && st.hands[myColor].length) {
        updateState(myRoomId, (s) => { if (s.phase === "exchanging" && !s.pendingExchange[myColor]) submitExchangeCard(s, myColor, s.hands[myColor][0]); }).catch(() => {});
        return;
      }
      if (st.phase === "playing" && st.turnColor === myColor) {
        const a = activeColorFor(st, myColor);
        const c = a ? botChooseCardAndMove(st, a, myColor) : null;
        if (!c) return;
        if (c.burn) updateState(myRoomId, (s) => { if (s.turnColor === myColor) { burnOneCard(s, myColor, c.card); advanceTurn(s); } }).catch(() => {});
        else playMove(a, c.card, c.move);
      }
    }, 500);
  });
  const mosse = await finché(async () => {
    const s = await leggi(`games/${roomId}`);
    const n = (s.log || []).filter((r) => / muove con | gioca il 7| entra in gioco | gioca un Jack/.test(r)).length;
    return n >= 8 ? n : null;
  }, 90000, 1000);
  assert.ok(mosse >= 8, "la partita deve andare avanti");

  // Fine partita simulata (solo nell'emulatore), poi rivincita come col pulsante.
  await t.page.evaluate(() => clearInterval(window.__autoGioca));
  await aspetta(1500);
  await t.page.evaluate(() => updateState(myRoomId, (s) => { s.phase = "finished"; s.winnerTeam = TEAM_OF[myColor]; }));
  const lb = await finché(async () => {
    const v = await leggi("leaderboard/p-elena");
    return v && v.partite ? v : null;
  });
  assert.equal(lb.partite, 1);
  assert.equal(lb.vinte, 1);

  await t.page.evaluate(() => startNewGame(document.createElement("button")));
  const dopo = await finché(async () => {
    const s = await leggi(`games/${roomId}`);
    return s && s.phase !== "finished" ? s : null;
  });
  assert.equal(Object.values(dopo.players).find((p) => !p.isBot).uid, uid, "dopo la rivincita il posto tiene l'uid");
  assert.equal(dopo.leaderboardClaimed || null, null, "il segno dell'accredito si azzera per la nuova partita");
  assert.deepEqual(errori, []);
  await t.ctx.close();
});

test("Con gli amici: il posto ha l'uid; 'Sono io' da un altro telefono lo passa al nuovo uid (comportamento di oggi)", LIMITE, async () => {
  const a = await telefono("Fabio");
  await a.page.evaluate(async () => {
    document.body.insertAdjacentHTML("beforeend", '<input id="name-input" value="Fabio">');
    myColor = "red";
    await claimRoomMode("AMICI1", "manual");
    await joinManualRoom("AMICI1");
  });
  const uidA = await a.page.evaluate(() => myUid);
  const s1 = await finché(async () => {
    const s = await leggi("games/AMICI1");
    return s && s.players && s.players.red ? s : null;
  });
  assert.equal(s1.players.red.uid, uidA);
  assert.equal(s1.players.red.name, "Fabio");

  const b = await telefono("Fabio-2");
  await b.page.evaluate(() => recoverByName("AMICI1", "Fabio", null));
  const uidB = await b.page.evaluate(() => myUid);
  assert.notEqual(uidA, uidB);
  const s2 = await finché(async () => {
    const s = await leggi("games/AMICI1");
    return s.players.red.uid === uidB ? s : null;
  });
  // Oggi chiunque può farlo: sarà il passo 5 a permetterlo solo se il titolare è offline.
  assert.equal(s2.players.red.name, "Fabio");
  assert.deepEqual(errori, []);
  await a.ctx.close();
  await b.ctx.close();
});

test("Se il login non è disponibile si gioca come prima (posto senza uid)", LIMITE, async () => {
  const t = await telefono("Gina", { senzaLogin: true, giocatore: { id: "p-gina", nome: "Gina" } });
  const prima = Date.now();
  await t.page.evaluate(() => startMatchmaking());
  const roomId = await finché(() => t.page.evaluate(() => mm && mm.roomId));
  assert.ok(Date.now() - prima < 8000, "l'attesa del login non deve bloccare l'ingresso");
  await t.page.evaluate(() => mmFillWithBots("hard", null));
  const s = await finché(async () => {
    const st = await leggi(`games/${roomId}`);
    return st && st.players && Object.keys(st.players).length === 4 ? st : null;
  });
  const mio = Object.values(s.players).find((p) => !p.isBot);
  assert.equal(mio.name, "Gina");
  assert.equal(mio.uid || null, null);
  assert.equal(await t.page.evaluate(() => myUid), null);
  assert.deepEqual(errori, []);
  await t.ctx.close();
});
