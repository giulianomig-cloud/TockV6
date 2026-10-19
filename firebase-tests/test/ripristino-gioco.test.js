// Branch di RIPRISTINO: il gioco deve essere ESATTAMENTE la v6.16 (commit c89c66d), cambiano solo i numeri di
// versione (più alti di ogni versione pubblicata). Sul gioco normale questa prova non si applica.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");
const { GIOCO_V616 } = require("./e2e-banco");

const ROOT = path.resolve(__dirname, "../..");
const vecchio = (f) => execSync(`git -C "${ROOT}" show c89c66d:${f}`, { maxBuffer: 64 * 1024 * 1024 }).toString();
const attuale = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const versione = (h) => (h.match(/const APP_VERSION = "(v\d+\.\d+)"/) || [])[1];

test("ripristino: index.html e sw.js sono quelli della v6.16, salvo i numeri di versione", { skip: !GIOCO_V616 && "non è il branch di ripristino" }, () => {
  const togli = (s) => s.replace(/const APP_VERSION = "[^"]+"/, "").replace(/const CACHE_VERSION = "[^"]+"/, "");
  assert.equal(togli(attuale("index.html")), togli(vecchio("index.html")));
  assert.equal(togli(attuale("sw.js")), togli(vecchio("sw.js")));
  const v = versione(attuale("index.html"));
  assert.ok(v && v !== "v6.16", "il numero deve essere più alto di ogni versione pubblicata, mai v6.16");
  assert.ok(attuale("sw.js").includes(`"${v.replace(".", "-")}"`), "CACHE_VERSION allineata");
});
