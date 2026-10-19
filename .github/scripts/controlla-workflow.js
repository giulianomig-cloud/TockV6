// Controlla che i workflow di GitHub Actions non possano essere usati da codice non attendibile
// per scrivere nel repository o leggere i segreti di produzione. Gira fra i controlli obbligatori.
// Uso: node .github/scripts/controlla-workflow.js [cartella dei workflow]
const fs = require("node:fs");
const path = require("node:path");

// Gli UNICI workflow che possono vedere segreti o avere permessi di scrittura. Devono partire solo a
// mano (workflow_dispatch) e usare un "environment" protetto per ogni job con segreti.
const CON_SEGRETI = new Set(["rilascio.yml", "produzione-lettura.yml"]);
const EVENTI_VIETATI = ["pull_request_target", "workflow_run", "issue_comment", "pull_request_review_comment", "discussion_comment"];
// Testi che, dentro ${{ }}, possono contenere testo scelto da chiunque apra una PR (titolo, branch…).
const ESPRESSIONI_VIETATE = [/\$\{\{[^}]*github\.event\./, /\$\{\{[^}]*github\.head_ref/];

function controlla(file, testo) {
  const nome = path.basename(file);
  const errori = [];
  const righe = testo.split("\n");
  const senzaCommenti = righe.map((r) => r.replace(/(^|\s)#.*$/, "")).join("\n");

  for (const ev of EVENTI_VIETATI) if (new RegExp(`(^|[\\s\\[,])${ev}\\s*[:,\\]]?`, "m").test(senzaCommenti)) errori.push(`evento vietato: ${ev}`);
  if (!/^permissions:/m.test(senzaCommenti)) errori.push("manca 'permissions:' in cima (deve essere il minimo indispensabile)");
  if (/write-all|read-all/.test(senzaCommenti)) errori.push("permessi indiscriminati (write-all/read-all)");
  for (const re of ESPRESSIONI_VIETATE) if (re.test(senzaCommenti)) errori.push(`espressione con testo non attendibile: ${re}`);
  // Gli input del lancio a mano vanno passati come variabili d'ambiente, mai dentro uno script "run".
  righe.forEach((r, i) => {
    if (/^\s*(-\s*)?run:/.test(r) && /\$\{\{/.test(r)) errori.push(`riga ${i + 1}: espressione \${{ }} dentro 'run' (usare env:)`);
  });
  let dentroRun = false, rientroRun = 0;
  righe.forEach((r, i) => {
    const rientro = r.search(/\S/);
    if (/^\s*(-\s*)?run:\s*[|>]/.test(r)) { dentroRun = true; rientroRun = rientro; return; }
    if (dentroRun && rientro !== -1 && rientro <= rientroRun) dentroRun = false;
    if (dentroRun && /\$\{\{/.test(r)) errori.push(`riga ${i + 1}: espressione \${{ }} dentro uno script 'run' (usare env:)`);
  });

  // Ogni checkout senza credenziali salvate.
  righe.forEach((r, i) => {
    if (/uses:\s*actions\/checkout@/.test(r)) {
      const blocco = righe.slice(i + 1, i + 6).join("\n");
      if (!/persist-credentials:\s*false/.test(blocco)) errori.push(`riga ${i + 1}: checkout senza 'persist-credentials: false'`);
    }
  });
  // Azioni di terzi solo se fissate a un commit preciso (40 caratteri); quelle di GitHub (actions/*) per versione.
  for (const m of senzaCommenti.matchAll(/uses:\s*([^\s@]+)@(\S+)/g)) {
    const [, azione, ver] = m;
    if (azione.startsWith("./")) continue;
    if (!azione.startsWith("actions/") && !/^[0-9a-f]{40}$/.test(ver)) errori.push(`azione di terzi non fissata a un commit: ${azione}@${ver}`);
  }

  const usaSegreti = /\bsecrets\./.test(senzaCommenti);
  const scrive = /:\s*write\b/.test(senzaCommenti);
  if (!CON_SEGRETI.has(nome)) {
    if (usaSegreti) errori.push("usa segreti ma non è un workflow di produzione");
    if (scrive) errori.push("chiede permessi di scrittura ma non è un workflow di produzione");
  } else {
    // Solo lancio a mano (o richiamato da un altro workflow): niente pull_request, push, schedule.
    const on = senzaCommenti.match(/^on:\s*\n((?:[ \t]+.*\n?)*)/m);
    const eventi = on ? [...on[1].matchAll(/^  ([a-z_]+):/gm)].map((x) => x[1]) : [];
    for (const ev of eventi) if (ev !== "workflow_dispatch") errori.push(`workflow di produzione avviabile da '${ev}' (ammesso solo workflow_dispatch)`);
    if (!eventi.length) errori.push("workflow di produzione senza 'on: workflow_dispatch'");
    // Ogni job che usa segreti deve avere un environment (protetto in GitHub) e il blocco di attivazione.
    const jobs = senzaCommenti.split(/\n(?=  [A-Za-z0-9_-]+:\s*\n)/).slice(1);
    for (const j of jobs) {
      const id = j.match(/^  ([A-Za-z0-9_-]+):/)[1];
      if (/\bsecrets\./.test(j)) {
        if (!/^    environment:/m.test(j)) errori.push(`job '${id}': usa segreti senza 'environment:'`);
        if (!/vars\.PRODUZIONE_ATTIVA == 'si'/.test(j)) errori.push(`job '${id}': usa segreti senza il blocco 'vars.PRODUZIONE_ATTIVA == 'si''`);
      }
    }
  }
  return errori;
}

module.exports = { controlla };

if (require.main === module) {
  const dir = process.argv[2] || path.join(__dirname, "../workflows");
  let totale = 0;
  for (const f of fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort()) {
    const errori = controlla(f, fs.readFileSync(path.join(dir, f), "utf8"));
    totale += errori.length;
    console.log(errori.length ? `✗ ${f}\n  - ${errori.join("\n  - ")}` : `✓ ${f}`);
  }
  if (totale) { console.error(`\n${totale} problemi nei workflow`); process.exit(1); }
  console.log("\nWorkflow sicuri: nessun problema trovato");
}
