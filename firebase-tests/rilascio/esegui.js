// FASE E — rilascio selettivo di regole e (facoltativa) migrazione, con arresto e ripristino automatici.
// Ordine fisso: bersaglio certo → regole pubblicate = quelle attese → backup verificato → regole → migrazione
// → verifica finale. Al primo errore DOPO una scrittura: si annullano le scritture della migrazione e si
// ripubblicano le regole del backup. Con "prova: true" non scrive NIENTE (dice solo cosa farebbe).
// I DATI non si ripristinano mai in automatico (cancellerebbero le partite giocate nel frattempo):
// per quello c'è il backup cifrato e la procedura a mano in AUTOMAZIONE.md.
const fs = require("node:fs");
const path = require("node:path");
const rtdb = require("./rtdb");
const { faiBackup, verificaBackup, leggiBackup } = require("./backup");
const { leggiRegole, differenze, togliCommenti } = require("../fase0/regole-util");
const migr = require("./migrazione-legacy");

const BASE = path.resolve(__dirname, "..");
// Solo questi file di regole possono andare in produzione: sono quelli provati dai controlli obbligatori.
const REGOLE_AMMESSE = ["../database.rules.json", "regole/transizione.json", "regole/proposte.json"].map((f) => path.resolve(BASE, f));

async function rilascia(o) {
  const b = o.bersaglio, passi = [], log = o.log || (() => {});
  const passo = (nome, esito, dettagli) => { passi.push({ nome, esito, dettagli }); log(`${esito === "ok" ? "✓" : esito === "saltato" ? "·" : "✗"} ${nome}${dettagli ? ": " + dettagli : ""}`); };
  const guasto = (dove) => { if (o.guasto === dove) throw new Error(`guasto simulato (${dove})`); };
  let regoleBackup = null, migrazioneFatta = [], scritto = false;

  try {
    passo("bersaglio", "ok", b.descrizione);

    const nuove = o.regoleNuove ? path.resolve(o.regoleNuove) : null;
    if (nuove && !REGOLE_AMMESSE.includes(nuove)) throw new Error("file di regole non ammesso: " + nuove);
    const attese = leggiRegole(path.resolve(o.regoleAttese));
    const pubblicate = await rtdb.leggiRegole(b);
    const diverse = differenze(pubblicate, attese);
    const giaNuove = nuove && differenze(pubblicate, leggiRegole(nuove)).length === 0;
    if (diverse.length && !giaNuove) {
      throw new Error(`le regole pubblicate NON sono quelle attese (${diverse.length} differenze, es. ${diverse[0].percorso}): qualcuno le ha cambiate dalla console, mi fermo`);
    }
    passo("regole pubblicate = attese", "ok", giaNuove ? "sono già quelle nuove" : "identiche");

    const m = await faiBackup(b, o.cartellaBackup, { passphrase: o.passphrase });
    await verificaBackup(o.cartellaBackup, { passphrase: o.passphrase, emulatore: o.emulatoreVerifica });
    const backup = leggiBackup(o.cartellaBackup, { passphrase: o.passphrase });
    regoleBackup = backup.regole;
    const t = m.conteggi.classifica.totaliVecchie;
    passo("backup verificato", "ok", `classifica ${m.conteggi.classifica.voci} voci (vecchie: vittorie ${t.vittorie} · partite ${t.partite} · vinte ${t.vinte})${o.emulatoreVerifica ? ", ricaricato e riletto uguale nell'emulatore" : ""}`);

    if (!nuove || giaNuove) passo("regole", "saltato", nuove ? "già pubblicate" : "nessun cambio richiesto");
    else if (o.prova) passo("regole", "saltato", "PROVA: verrebbe pubblicato " + path.relative(BASE, nuove));
    else {
      scritto = true;
      await rtdb.pubblicaRegole(b, fs.readFileSync(nuove, "utf8"));
      guasto("dopo-regole");
      const d = differenze(await rtdb.leggiRegole(b), leggiRegole(nuove));
      if (d.length) throw new Error("le regole rilette sono diverse da quelle pubblicate");
      passo("regole", "ok", "pubblicato " + path.relative(BASE, nuove));
    }

    if (o.migrazione) {
      const piano = migr.pianifica(o.migrazione, backup.dati);
      if (piano.rifiutate.length) throw new Error("migrazione rifiutata: " + piano.rifiutate.map((r) => `${r.vecchio} (${r.motivo})`).join("; "));
      if (o.prova) passo("migrazione", "saltato", `PROVA: ${piano.scritture.length} collegamenti da scrivere, ${piano.invariate.length} già fatti`);
      else {
        scritto = true;
        migrazioneFatta = await migr.applica(b, piano);
        guasto("dopo-migrazione");
        passo("migrazione", "ok", `${migrazioneFatta.length} collegamenti scritti, ${piano.invariate.length + piano.scritture.length - migrazioneFatta.length} già presenti`);
      }
    } else passo("migrazione", "saltato", "nessuna richiesta");

    const ora = (await rtdb.leggi(b, "")) || {};
    const perdite = migr.confronta(backup.dati, ora);
    if (perdite.length) throw new Error("verifica finale: " + perdite.join(", "));
    if (nuove && !o.prova && differenze(await rtdb.leggiRegole(b), leggiRegole(nuove)).length) throw new Error("verifica finale: regole diverse");
    passo("verifica finale", "ok", "niente perso, regole come previsto");
    return { esito: "ok", passi };
  } catch (e) {
    passo("errore", "fallito", e.message);
    let ripristino = "non serviva (nessuna scrittura)";
    if (scritto) {
      try {
        await migr.annulla(b, migrazioneFatta);
        await rtdb.pubblicaRegole(b, regoleBackup);
        if (differenze(await rtdb.leggiRegole(b), JSON.parse(togliCommenti(regoleBackup))).length) throw new Error("regole rilette diverse dal backup");
        ripristino = `fatto: ${migrazioneFatta.length} collegamenti annullati, regole del backup ripubblicate e verificate`;
      } catch (e2) {
        ripristino = "NON RIUSCITO: " + e2.message + " → seguire la procedura a mano (AUTOMAZIONE.md)";
      }
      passo("ripristino automatico", ripristino.startsWith("fatto") ? "ok" : "fallito", ripristino);
    }
    return { esito: "fallito", errore: e.message, ripristino, passi };
  }
}

module.exports = { rilascia, REGOLE_AMMESSE };

// Uso dal workflow di rilascio (variabili d'ambiente, mai argomenti con dati):
// TOCK_BERSAGLIO=produzione|emulatore  TOCK_REGOLE_ATTESE=<file>  TOCK_REGOLE_NUOVE=<file|vuoto>
// TOCK_MIGRAZIONE=<file json|vuoto>  TOCK_PROVA=si|no  TOCK_BACKUP_DIR=<cartella fuori dal repo>
// TOCK_BACKUP_PASSPHRASE=<segreto>  TOCK_EMULATORE_VERIFICA=<ns dell'emulatore per provare il backup>
if (require.main === module) {
  (async () => {
    const { produzione, emulatore } = require("./bersaglio");
    const env = process.env;
    const bersaglio = env.TOCK_BERSAGLIO === "produzione" ? await produzione(env) : emulatore(env.TOCK_EMULATORE_NS || "rilascio-locale");
    if (bersaglio.tipo === "produzione" && !env.TOCK_BACKUP_PASSPHRASE) throw new Error("in produzione il backup deve essere cifrato (TOCK_BACKUP_PASSPHRASE)");
    const r = await rilascia({
      bersaglio,
      regoleAttese: env.TOCK_REGOLE_ATTESE || path.resolve(BASE, "../database.rules.json"),
      regoleNuove: env.TOCK_REGOLE_NUOVE || null,
      migrazione: env.TOCK_MIGRAZIONE ? JSON.parse(fs.readFileSync(env.TOCK_MIGRAZIONE, "utf8")) : null,
      prova: env.TOCK_PROVA !== "no",
      cartellaBackup: env.TOCK_BACKUP_DIR,
      passphrase: env.TOCK_BACKUP_PASSPHRASE || undefined,
      emulatoreVerifica: env.TOCK_EMULATORE_VERIFICA ? emulatore(env.TOCK_EMULATORE_VERIFICA) : undefined,
      log: (s) => console.log(s),
    });
    // Rapporto SENZA dati (solo passi ed esiti): può stare nel riepilogo del workflow.
    if (env.TOCK_RAPPORTO) fs.writeFileSync(env.TOCK_RAPPORTO, JSON.stringify(r, null, 2));
    if (r.esito !== "ok") process.exit(1);
  })().catch((e) => { console.error("✗ " + e.message); process.exit(1); });
}
