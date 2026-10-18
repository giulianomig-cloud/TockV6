// Lettura e confronto di regole Firebase (Realtime Database). Le regole incollate dalla console
// possono contenere commenti // o /* */: si tolgono prima di leggerle come JSON.
const fs = require("node:fs");

function togliCommenti(testo) {
  let out = "", i = 0, inStr = false, q = "";
  while (i < testo.length) {
    const c = testo[i], d = testo[i + 1];
    if (inStr) {
      out += c;
      if (c === "\\") { out += d; i += 2; continue; }
      if (c === q) inStr = false;
      i++;
    } else if (c === '"' || c === "'") { inStr = true; q = c; out += c; i++; }
    else if (c === "/" && d === "/") { while (i < testo.length && testo[i] !== "\n") i++; }
    else if (c === "/" && d === "*") { i += 2; while (i < testo.length && !(testo[i] === "*" && testo[i + 1] === "/")) i++; i += 2; }
    else { out += c; i++; }
  }
  return out;
}
function leggiRegole(file) {
  const testo = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  return JSON.parse(togliCommenti(testo));
}
// Differenze fra due alberi di regole: elenco di { percorso, a, b } (a/b = valore o "(assente)").
function differenze(a, b, percorso = "") {
  const out = [];
  const oggetto = (x) => x && typeof x === "object" && !Array.isArray(x);
  if (oggetto(a) && oggetto(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out.push(...differenze(a[k], b[k], percorso + "/" + k));
    return out;
  }
  const norm = (v) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : v);
  if (JSON.stringify(norm(a)) !== JSON.stringify(norm(b))) {
    out.push({ percorso: percorso || "/", a: a === undefined ? "(assente)" : a, b: b === undefined ? "(assente)" : b });
  }
  return out;
}
module.exports = { togliCommenti, leggiRegole, differenze };
