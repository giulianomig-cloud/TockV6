// Dove scrivono gli strumenti di rilascio. Due soli bersagli, riconosciuti senza ambiguità:
// - "emulatore": solo 127.0.0.1/localhost, credenziale fittizia dell'emulatore;
// - "produzione": SOLO se TUTTE le condizioni coincidono (progetto tock-v6, indirizzo esatto del database,
//   lo stesso indirizzo scritto in index.html, chiave di servizio dello stesso progetto, conferma esplicita).
// Qualsiasi altra combinazione = errore, nessun collegamento.
const fs = require("node:fs");
const path = require("node:path");

const PRODUZIONE = Object.freeze({
  progetto: "tock-v6",
  url: "https://tock-v6-default-rtdb.europe-west1.firebasedatabase.app",
});
const REPO = path.resolve(__dirname, "../..");

function urlNelGioco() {
  const m = fs.readFileSync(path.join(REPO, "index.html"), "utf8").match(/databaseURL:\s*"([^"]+)"/);
  return m && m[1];
}

function emulatore(ns, base = "http://127.0.0.1:9000") {
  const u = new URL(base);
  if (!["127.0.0.1", "localhost"].includes(u.hostname)) throw new Error("emulatore: ammesso solo 127.0.0.1/localhost, non " + u.hostname);
  if (!/^[a-z0-9-]+$/.test(ns || "")) throw new Error("emulatore: nome del database non valido");
  if (ns.startsWith(PRODUZIONE.progetto + "-default")) throw new Error("emulatore: nome uguale a quello di produzione, scegline un altro");
  return {
    tipo: "emulatore",
    descrizione: `emulatore ${u.host} (database ${ns})`,
    indirizzo: (p) => `${base}/${p}.json?ns=${ns}`,
    regole: () => `${base}/.settings/rules.json?ns=${ns}`,
    intestazioni: async () => ({ Authorization: "Bearer owner" }),
  };
}

// env: variabili d'ambiente (in GitHub arrivano SOLO nell'environment "production").
async function produzione(env = process.env) {
  const errori = [];
  if (env.TOCK_BERSAGLIO !== "produzione") errori.push("TOCK_BERSAGLIO deve essere 'produzione'");
  if (env.TOCK_PROGETTO !== PRODUZIONE.progetto) errori.push(`TOCK_PROGETTO deve essere '${PRODUZIONE.progetto}'`);
  if (env.TOCK_DB_URL !== PRODUZIONE.url) errori.push(`TOCK_DB_URL deve essere '${PRODUZIONE.url}'`);
  if (urlNelGioco() !== PRODUZIONE.url) errori.push("index.html punta a un database diverso: " + urlNelGioco());
  let chiave = null;
  try { chiave = JSON.parse(fs.readFileSync(env.GOOGLE_APPLICATION_CREDENTIALS || "", "utf8")); } catch { errori.push("chiave di servizio mancante o illeggibile (GOOGLE_APPLICATION_CREDENTIALS)"); }
  if (chiave && chiave.project_id !== PRODUZIONE.progetto) errori.push("la chiave di servizio è di un altro progetto");
  if (chiave && chiave.type !== "service_account") errori.push("la chiave non è una chiave di servizio");
  if (errori.length) throw new Error("Bersaglio di produzione NON confermato:\n- " + errori.join("\n- "));

  const { GoogleAuth } = require("google-auth-library");
  const auth = new GoogleAuth({
    keyFile: env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/firebase.database", "https://www.googleapis.com/auth/userinfo.email"],
  });
  return {
    tipo: "produzione",
    descrizione: `PRODUZIONE ${PRODUZIONE.progetto}`,
    indirizzo: (p) => `${PRODUZIONE.url}/${p}.json`,
    regole: () => `${PRODUZIONE.url}/.settings/rules.json`,
    intestazioni: async () => ({ Authorization: "Bearer " + (await auth.getAccessToken()) }),
  };
}

module.exports = { emulatore, produzione, PRODUZIONE, urlNelGioco };
