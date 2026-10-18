// FASE 0 — il backup delle regole è davvero utilizzabile per tornare indietro? Solo emulatore.
// BACKUP_REGOLE=<file> (default: database.rules.json del repository, come prova dello strumento)
// BACKUP_DATI=<export.json> facoltativo: i dati vengono caricati SOLO nell'emulatore.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { leggiRegole, differenze, togliCommenti } = require("./regole-util");
const { contaDati } = require("./verifica");

const REPO = path.resolve(__dirname, "../..");
const FILE = process.env.BACKUP_REGOLE || path.join(REPO, "database.rules.json");
const DATI = process.env.BACKUP_DATI || null;
const TRANS = path.join(__dirname, "../regole/transizione.json");
const DB = "http://127.0.0.1:9000";
const NS = "fase0-ripristino";
const OWNER = { Authorization: "Bearer owner" };
const u = (p) => `${DB}/${p}.json?ns=${NS}`;

const pubblica = async (testo) => fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: "PUT", headers: OWNER, body: testo });
const pubblicate = async () => JSON.parse(togliCommenti(await (await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { headers: OWNER })).text()));
// scrittura SENZA login, come fa la v6.16
const anonimo = (metodo, p, v) => fetch(u(p), { method: metodo, body: JSON.stringify(v) });

test("il backup è un file di regole valido e l'emulatore lo accetta così com'è", async () => {
  const r = await pubblica(fs.readFileSync(FILE, "utf8"));
  assert.equal(r.status, 200, await r.text());
  assert.deepEqual(differenze(await pubblicate(), leggiRegole(FILE)), []);
});

test("andata e ritorno: backup → transizione → backup restituisce esattamente le regole di partenza", async () => {
  assert.equal((await pubblica(fs.readFileSync(FILE, "utf8"))).status, 200);
  assert.equal((await pubblica(fs.readFileSync(TRANS, "utf8"))).status, 200);
  assert.ok(differenze(await pubblicate(), leggiRegole(FILE)).length > 0, "la transizione deve essere diversa dal backup");
  assert.equal((await pubblica(fs.readFileSync(FILE, "utf8"))).status, 200);
  assert.deepEqual(differenze(await pubblicate(), leggiRegole(FILE)), []);
});

test("con il backup ripristinato la v6.16 fa tutto quello che fa oggi", async () => {
  await fetch(u(""), { method: "PUT", headers: OWNER, body: "null" });
  assert.equal((await pubblica(fs.readFileSync(FILE, "utf8"))).status, 200);
  const prove = {
    "crea una stanza": () => anonimo("PUT", "games/PROVA1", { phase: "lobby", roomMode: "manual" }),
    "fa una mossa": () => anonimo("PATCH", "games/PROVA1", { turnColor: "green" }),
    "segna la presenza": () => anonimo("PUT", "presence/PROVA1/red/c1", "v6.16"),
    "toglie la presenza": () => anonimo("DELETE", "presence/PROVA1/red/c1"),
    "registra la classifica come oggi": () => anonimo("PATCH", "", { "games/PROVA1/leaderboardClaimed": true, "leaderboard/-pX/partite": 1, "leaderboard/-pX/nome": "X" }),
    "crea un nome in rubrica": () => anonimo("PUT", "players/-pNuovo", { nome: "Nuovo", creatoIl: 1 }),
    "conta le stanze": () => anonimo("PUT", "stats/roomsCreated", 1),
    "scrive l'indice dei codici": () => anonimo("PUT", "codes/PROVA1", "room"),
  };
  const esiti = {};
  for (const [nome, f] of Object.entries(prove)) esiti[nome] = (await f()).status;
  const negate = Object.entries(esiti).filter(([, s]) => s !== 200).map(([n, s]) => `${n} (${s})`);
  assert.deepEqual(negate, [], "operazioni della v6.16 rifiutate dal backup: " + negate.join(", "));
});

test("i dati esportati si possono ricaricare e si rileggono uguali (solo emulatore)", { skip: !DATI && "nessun BACKUP_DATI indicato" }, async () => {
  const dati = JSON.parse(fs.readFileSync(DATI, "utf8").replace(/^﻿/, ""));
  const r = await fetch(u(""), { method: "PUT", headers: OWNER, body: JSON.stringify(dati) });
  assert.equal(r.status, 200);
  const riletti = await (await fetch(u(""), { headers: OWNER })).json();
  assert.deepEqual(contaDati(riletti), contaDati(dati));
  await fetch(u(""), { method: "PUT", headers: OWNER, body: "null" });
});
