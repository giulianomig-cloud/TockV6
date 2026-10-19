---
name: steward
description: Ciclo di correzione delle pull request di Tock V6 (controlli rossi, commenti di revisione). Da seguire su ogni evento di CI o revisione di una PR aperta o guidata da Claude.
---

# Ciclo di correzione (Fase B) — Tock V6

Vale per le PR che Claude ha aperto o che l'utente gli ha chiesto di portare a termine.
Controllo obbligatorio: **"Tutti i controlli"** (workflow `Controlli`), che raccoglie:
`Regole del gioco` · `Workflow sicuri` · `Il sito non pubblica i test` · `Sicurezza Firebase (emulatore)`.

## A ogni evento (CI rossa, commento, conflitto)

1. **Leggi** il controllo fallito: log del job (`get_job_logs` con `failed_only`), nome del test, messaggio.
2. **Classifica** il fallimento:
   - *difetto del codice della PR* → si corregge;
   - *test che ha trovato un difetto vero già presente* → si corregge nel gioco solo se piccolo e nel tema della PR,
     altrimenti si segnala (vedi "Arresto");
   - *rosso anche sulla base* (stesso test rosso sul branch di base) → non è della PR: commento unico sulla PR;
   - *infrastruttura* (installazione, download dell'emulatore, runner perso, prima che parta un test) → UN solo
     nuovo lancio.
3. **Riproduci in locale** prima di toccare il codice:
   - gioco: `node --test tests/*.test.js`;
   - Firebase: `cd firebase-tests && npm test` (emulatore; mai il Firebase vero);
   - un file solo: `npx firebase emulators:exec --only database,auth --project demo-tock "node --test --test-force-exit test/<file>.test.js"`.
4. **Correggi il minimo** che serve. Poi rilancia in locale TUTTI i controlli toccati e
   `node .github/scripts/controlla-workflow.js` se hai cambiato un workflow.
5. **Rileggi il diff** pensando a cosa potrebbe rompere. Poi un solo push (con aumento della versione se cambia
   il gioco: `APP_VERSION` in index.html e `CACHE_VERSION` in sw.js).
6. Aggiorna la descrizione della PR (riga di stato) solo se cambia qualcosa di importante.

## Vietato (sempre)

- Cambiare le **regole del gioco** o i **valori attesi** di un test per farlo passare. Un test si cambia solo se la
  regola è stata cambiata APPOSTA su richiesta dell'utente (e va detto nella PR).
- Saltare, disattivare, mettere in quarantena o rendere "facoltativo" un test; allungare i tempi solo per
  nascondere un problema; `continue-on-error`.
- Indebolire `controlla-workflow.js`, i permessi dei workflow, le regole in `firebase-tests/regole/` o i controlli
  di `rilascio/bersaglio.js` per far passare un controllo.
- Commit vuoti, chiudere e riaprire la PR, riscrivere la storia di branch non propri, unire PR, toccare `main`.
- Qualsiasi operazione sulla produzione (Firebase vero, console, workflow "Rilascio" non in prova).

## Limiti e arresto

- Al massimo **3 tentativi di correzione per lo stesso controllo** (stesso test che fallisce per lo stesso motivo).
- Al massimo **6 push di correzione per PR** fra un messaggio dell'utente e il successivo.
- Al massimo **1 nuovo lancio** per presunta instabilità; se fallisce ancora, il fallimento è vero.
- Ci si **ferma subito** (senza tentativi) se la correzione richiederebbe una delle cose vietate, se tocca le
  regole del database in modo non richiesto, o se serve una decisione dell'utente (grafica, regole del gioco).

Quando si raggiunge un limite o una condizione di arresto: **niente altri push**. Un solo commento sulla PR
(e messaggio all'utente in chat) con questo modulo:

```
⛔ Mi fermo: <motivo (limite raggiunto / serve una decisione / non è di questa PR)>
Controllo: <nome del job> — <test che fallisce>
Errore: <messaggio essenziale>
Tentativi fatti: <n> — <cosa ho provato, commit>
Cosa resta da decidere: <domanda precisa, o correzione proposta come patch>
```

## Quando è finita

La PR è pronta quando "Tutti i controlli" è verde sull'ultimo commit, non ci sono conflitti e nessun commento
di revisione aspetta risposta. Resta comunque in **bozza** finché l'utente non dice di toglierla:
l'unione la fa l'utente (o l'auto-merge, solo dopo che l'ha attivato — vedi `.github/AUTOMAZIONE.md`).
