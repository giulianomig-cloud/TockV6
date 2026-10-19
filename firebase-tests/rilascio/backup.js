// Backup di regole e dati PRIMA di qualsiasi scrittura, e sua verifica.
// I file vanno sempre FUORI dal repository. Con una passphrase i dati si salvano solo cifrati
// (AES-256-GCM): così il backup può stare fra gli "artifact" di GitHub senza mostrare dati a nessuno.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const rtdb = require("./rtdb");
const { contaDati } = require("../fase0/verifica");
const { togliCommenti } = require("../fase0/regole-util");

const REPO = path.resolve(__dirname, "../..");
const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

function fuoriDalRepo(cartella) {
  const assoluta = path.resolve(cartella);
  if ((assoluta + path.sep).startsWith(REPO + path.sep)) throw new Error("il backup non va dentro il repository: " + assoluta);
  return assoluta;
}

function cifra(testo, passphrase) {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const chiave = crypto.scryptSync(passphrase, salt, 32);
  const c = crypto.createCipheriv("aes-256-gcm", chiave, iv);
  const dati = Buffer.concat([c.update(testo, "utf8"), c.final()]);
  return JSON.stringify({ v: 1, salt: salt.toString("base64"), iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64"), dati: dati.toString("base64") });
}
function decifra(contenuto, passphrase) {
  const o = JSON.parse(contenuto);
  const chiave = crypto.scryptSync(passphrase, Buffer.from(o.salt, "base64"), 32);
  const d = crypto.createDecipheriv("aes-256-gcm", chiave, Buffer.from(o.iv, "base64"));
  d.setAuthTag(Buffer.from(o.tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(o.dati, "base64")), d.final()]).toString("utf8");
}

// Scrive regole.json e dati.json (o dati.json.enc) + manifesto.json con impronte e conteggi.
async function faiBackup(b, cartella, { passphrase } = {}) {
  const dir = fuoriDalRepo(cartella);
  fs.mkdirSync(dir, { recursive: true });
  const regole = await rtdb.leggiRegoleTesto(b);
  const datiTesto = JSON.stringify((await rtdb.leggi(b, "")) || {});
  fs.writeFileSync(path.join(dir, "regole.json"), regole);
  const fileDati = passphrase ? "dati.json.enc" : "dati.json";
  fs.writeFileSync(path.join(dir, fileDati), passphrase ? cifra(datiTesto, passphrase) : datiTesto);
  const manifesto = {
    creato: new Date().toISOString(),
    bersaglio: b.descrizione,
    regole: { file: "regole.json", sha256: sha(regole) },
    dati: { file: fileDati, cifrato: !!passphrase, sha256: sha(datiTesto) },
    conteggi: contaDati(JSON.parse(datiTesto)),
  };
  fs.writeFileSync(path.join(dir, "manifesto.json"), JSON.stringify(manifesto, null, 2));
  return manifesto;
}

function leggiBackup(cartella, { passphrase } = {}) {
  const dir = path.resolve(cartella);
  const m = JSON.parse(fs.readFileSync(path.join(dir, "manifesto.json"), "utf8"));
  const regole = fs.readFileSync(path.join(dir, m.regole.file), "utf8");
  const grezzo = fs.readFileSync(path.join(dir, m.dati.file), "utf8");
  const datiTesto = m.dati.cifrato ? decifra(grezzo, passphrase) : grezzo;
  return { manifesto: m, regole, datiTesto, dati: JSON.parse(datiTesto) };
}

// Verifica: impronte giuste, regole leggibili, conteggi uguali e — se c'è un emulatore — il backup si
// ricarica davvero e si rilegge identico (prova di ripristino SENZA toccare il database vero).
async function verificaBackup(cartella, { passphrase, emulatore } = {}) {
  const { manifesto: m, regole, datiTesto, dati } = leggiBackup(cartella, { passphrase });
  assert.equal(sha(regole), m.regole.sha256, "impronta delle regole diversa");
  assert.equal(sha(datiTesto), m.dati.sha256, "impronta dei dati diversa");
  JSON.parse(togliCommenti(regole));
  assert.deepEqual(contaDati(dati), m.conteggi, "conteggi diversi da quelli del manifesto");
  if (emulatore) {
    if (emulatore.tipo !== "emulatore") throw new Error("la prova di ripristino si fa solo sull'emulatore");
    await rtdb.pubblicaRegole(emulatore, regole);
    await rtdb.scriviEmulatore(emulatore, "", dati);
    assert.deepEqual((await rtdb.leggi(emulatore, "")) || {}, dati, "il backup ricaricato nell'emulatore non si rilegge uguale");
    assert.deepEqual(await rtdb.leggiRegole(emulatore), JSON.parse(togliCommenti(regole)), "le regole ricaricate nell'emulatore sono diverse");
  }
  return m;
}

module.exports = { faiBackup, leggiBackup, verificaBackup, cifra, decifra, sha };

// Uso a mano per il ripristino: decifra un backup scaricato da GitHub in una cartella FUORI dal repository.
// TOCK_BACKUP_PASSPHRASE=… node rilascio/backup.js decifra <cartella-backup> <cartella-uscita>
if (require.main === module) {
  const [cmd, da, a] = process.argv.slice(2);
  if (cmd !== "decifra" || !da || !a) { console.error("Uso: node rilascio/backup.js decifra <cartella-backup> <cartella-uscita>"); process.exit(2); }
  const out = fuoriDalRepo(a);
  const b = leggiBackup(da, { passphrase: process.env.TOCK_BACKUP_PASSPHRASE });
  if (sha(b.datiTesto) !== b.manifesto.dati.sha256) { console.error("✗ impronta dei dati diversa: backup danneggiato"); process.exit(1); }
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "regole.json"), b.regole);
  fs.writeFileSync(path.join(out, "dati.json"), b.datiTesto);
  console.log(`✓ decifrato in ${out} (regole.json da incollare in console; dati.json da importare SOLO con decisione esplicita)`);
}
