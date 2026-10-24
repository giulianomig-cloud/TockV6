// Verifica di R4 (sola lettura, nessun login, nessuna scrittura): la funzione "arbitro" è pubblicata e risponde,
// e l'arbitro è ancora SPENTO (config/arbitro assente o false).
//   node fase5/verifica-r4.js           → dopo il caricamento (si aspetta la funzione presente)
//   node fase5/verifica-r4.js --prima   → prima del caricamento (si aspetta la funzione assente)
// La chiamata senza login non arriva al database: la funzione la rifiuta subito ("Serve il login").
const FUNZIONE = "https://europe-west1-tock-v6.cloudfunctions.net/arbitro";
const DB = "https://tock-v6-default-rtdb.europe-west1.firebasedatabase.app";

async function verifica({ prima = false, fetchFn = fetch } = {}) {
  const righe = [];
  let ok = true;
  const esito = (bene, testo) => { righe.push((bene ? "✓ " : "✗ ") + testo); if (!bene) ok = false; };

  let stato = 0;
  let corpo = null;
  try {
    const r = await fetchFn(FUNZIONE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: {} }) });
    stato = r.status;
    corpo = await r.json().catch(() => null);
  } catch (e) {
    esito(false, "funzione: nessuna risposta (" + (e.message || e) + ")");
  }
  if (stato) {
    const nonAutenticata = stato === 401 && corpo && corpo.error && corpo.error.status === "UNAUTHENTICATED";
    if (prima) esito(stato === 404, `funzione: ${stato === 404 ? "non ancora pubblicata (come atteso)" : "risponde già (" + stato + ")"}`);
    else esito(nonAutenticata, `funzione: ${nonAutenticata ? "pubblicata in europe-west1, rifiuta chi non ha fatto il login" : "risposta inattesa " + stato}`);
  }

  try {
    const r = await fetchFn(DB + "/config/arbitro.json");
    const v = r.ok ? await r.json() : undefined;
    esito(r.ok && (v === null || v === false), `arbitro: ${v === true ? "ACCESO (non doveva esserlo)" : r.ok ? "spento (config/arbitro = " + v + ")" : "non leggibile (" + r.status + ")"}`);
  } catch (e) {
    esito(false, "database: nessuna risposta (" + (e.message || e) + ")");
  }
  return { ok, righe };
}

if (require.main === module) {
  verifica({ prima: process.argv.includes("--prima") }).then(({ ok, righe }) => {
    console.log(righe.join("\n"));
    console.log(ok ? "ESITO: OK" : "ESITO: DA CONTROLLARE");
    process.exitCode = ok ? 0 : 1;
  });
}

module.exports = { verifica, FUNZIONE, DB };
