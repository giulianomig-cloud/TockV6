# Automazione di sviluppo e rilascio — Tock V6

Stato: **preparata**. I controlli automatici funzionano. Il rilascio in produzione è scritto e provato
sull'emulatore, ma è **spento**: non esistono né la variabile `PRODUZIONE_ATTIVA` né i segreti.
Nessuna operazione è stata fatta su Firebase vero, su `main` o sulle PR esistenti.

## 0. Situazione di partenza (18/10/2026)

- `main` = v6.16 (commit c89c66d), pubblicato su GitHub Pages da main. Repository **pubblico**.
- 7 PR in bozza **a catena**, nessuna unita: #19 → #20 → #21 → #22 → #23 → #24 → #25 (fino a v6.21).
  Poi `claude/riprova` (v6.22, senza PR) e questa PR (#26), che parte da `claude/riprova`.
- Prima di #26 c'era un solo workflow (`controlli.yml`): eseguiva i 39-40 test del gioco a ogni push, senza
  permessi espliciti. I test Firebase giravano solo in locale.
- Protezione di `main`: **non verificabile da qui** (gli strumenti di Claude non leggono le impostazioni del
  repository). Va controllata a mano (punto 2).

## 1. Fase A — Controlli automatici (ATTIVA con questa PR)

Workflow `Controlli` (`.github/workflows/controlli.yml`). Parte a ogni PR, a ogni aggiornamento di una PR, a
ogni push su `main` e quando lo richiama il rilascio.

| Controllo | Cosa fa | Tempo |
|---|---|---|
| Regole del gioco | `node --test tests/*.test.js`. Controlla anche APP_VERSION = CACHE_VERSION. Verso main, se cambia il gioco, la versione deve salire | ~10 s |
| Workflow sicuri | `controlla-workflow.js` + i suoi 18 test (vedi sotto) | ~10 s |
| Il sito non pubblica i test | Jekyll 3.10 come GitHub Pages: `firebase-tests/` non deve finire sul sito | ~30 s |
| Sicurezza Firebase (emulatore) | `npm test` in `firebase-tests` (regole, attacchi, posti, classifica, migrazione, rilascio, gioco vero in Chromium con più "telefoni", v6.16 insieme alla nuova) + `fase0-prova` (andata e ritorno delle regole) | ~5 min |
| **Tutti i controlli** | Verde solo se TUTTI i precedenti sono verdi. **È questo che va reso obbligatorio** | pochi s |

Sicurezza dei workflow, controllata a ogni PR da `.github/scripts/controlla-workflow.js`:
- permessi `contents: read` dichiarati in ogni file; niente `write-all`;
- nessun segreto e nessun permesso di scrittura, tranne nei due workflow di produzione;
- vietati `pull_request_target`, `workflow_run` e `issue_comment`: sono gli eventi che fanno girare codice di
  una PR con permessi o segreti;
- `persist-credentials: false` su ogni checkout: il token non resta sul disco;
- nessun `${{ }}` dentro gli script (`run`): i valori passano da `env:`. Niente titolo o branch della PR dentro i
  comandi, così non si può "iniettare" codice;
- azioni di terzi solo se fissate a un commit preciso (oggi si usano solo azioni ufficiali `actions/*`);
- i workflow di produzione partono SOLO a mano (`workflow_dispatch`). Ogni job con segreti ha un `environment`
  e il blocco `vars.PRODUZIONE_ATTIVA == 'si'`.

Le PR da un fork girano con il token in sola lettura e senza segreti: è il comportamento standard di GitHub
per `pull_request`.

## 2. Configurazioni GitHub da fare A MANO (Claude non può farle)

**A. Rendere obbligatori i controlli (dopo l'unione di questa PR in main).**
Percorso: Settings → Rules → Rulesets → New branch ruleset (oppure Settings → Branches → Add rule).
- Bersaglio: `main`. Enforcement: **Active**.
- ✅ Require a pull request before merging. Approvazioni richieste: 0, se vuoi che l'auto-merge proceda da solo.
- ✅ Require status checks to pass → aggiungere **"Tutti i controlli"**. Il nome compare nell'elenco solo dopo
  che il controllo è girato almeno una volta. Consigliato anche ✅ "Require branches to be up to date".
- ✅ Block force pushes · ✅ Restrict deletions.

**B. Permessi di GitHub Actions** (Settings → Actions → General):
- Fork pull request workflows: "Require approval for all outside collaborators";
- Workflow permissions: **Read repository contents and packages permissions**;
- ❌ "Allow GitHub Actions to create and approve pull requests".

**C. Auto-merge, solo quando vorrai i rilasci automatici del gioco** (Settings → General → ✅ Allow auto-merge).

**D. Produzione (solo quando decidi di attivare la Fase E):** vedi punto 6.

## 3. Fase B — Ciclo di correzione

Procedura completa: `.claude/skills/steward/SKILL.md`. Claude la legge a ogni evento delle PR.
1. Legge il log del controllo rosso.
2. Capisce di chi è il problema.
3. Lo riproduce in locale.
4. Corregge il minimo e rilancia in locale i controlli.
5. Fa un solo push.

Limiti:
- 3 tentativi per lo stesso errore;
- 6 push di correzione fra un tuo messaggio e il successivo;
- 1 solo nuovo lancio per presunta instabilità.

Poi si **ferma** e scrive un rapporto fisso: controllo, errore, tentativi fatti, decisione richiesta.

Vietato:
- cambiare regole del gioco o valori attesi dei test;
- saltare test;
- indebolire i controlli o le regole del database;
- unire PR o toccare `main` o la produzione.

## 4. Fase C — Sicurezza Firebase

Tutti i test girano **solo sull'emulatore**, con il progetto finto `demo-tock`: un progetto `demo-` non può
collegarsi al Firebase vero. Il gioco usa l'emulatore solo su localhost con `?emu=1`.

| Area | Verificato da | Esito con le regole definitive |
|---|---|---|
| Autenticazione | `profili`, `e2e-regole-proposte`, `fase12-regole` | senza login non si scrive nulla |
| Accesso alle partite | `vulnerabilita-regole-proposte` | si scrive solo con il login; chi conosce il codice può ancora cambiare lo stato (**RESTA**, serve il server) |
| Carte nascoste | `vulnerabilita-regole-*` | **NON nascoste**: mani e mazzo restano leggibili a chi conosce il codice (serve il server) |
| Posti dei giocatori | `posti` (29 test, 17 modi di attacco) | il posto di un altro uid non si prende |
| Classifica | `classifica` + test "LIMITE NOTO" | ognuno scrive solo la propria voce, una volta per partita, ma **la vittoria la dichiarano i telefoni: la classifica NON è sicura** finché non c'è un controllo sul server (Cloud Functions, piano Blaze) |

Regole pubblicate e regole del repository:
- **a mano** (già fatto in Fase 0): `node fase0/verifica.js regole-pubblicate.json export.json <cartella fuori dal repo>`;
- **automatico** (dopo la configurazione del punto 6): workflow "Regole pubblicate (sola lettura)". Legge e
  confronta senza scrivere nulla e dice se le regole pubblicate sono le attuali, la transizione o le definitive
  (strumento: `firebase-tests/rilascio/confronta-pubblicate.js`).

## 5. Fase D — Migrazione protetta (strumenti pronti, NIENTE eseguito)

Cosa fa: collega una voce VECCHIA della classifica (`-…`) al nuovo uid. Scrive SOLO
`legacyClaims/<vecchioId> = uid`. Classifica, rubrica e stanze non si toccano.

Procedura:
1. **Backup** (`rilascio/backup.js`): regole e dati completi. Il file dei dati è cifrato (AES-256-GCM) e c'è un
   manifesto con impronte e conteggi. Mai dentro il repository.
2. **Verifica del backup**:
   - impronte e conteggi;
   - il backup viene **ricaricato in un emulatore e riletto identico** (prova di ripristino senza toccare il
     database vero).
3. **Simulazione** (`TOCK_PROVA=si`): dice cosa scriverebbe e non scrive niente.
4. **Controllo della richiesta (`pianifica`)** — mai per nome. Ogni collegamento deve avere:
   - l'uid con un profilo;
   - il **codice di rientro** (`seatKeys/<stanza>/<colore>`) uguale a quello che la persona ti comunica.
   Rifiutati: richiesta col solo nome, codice di un altro, codice sbagliato, uid senza profilo, voce nuova, voce
   inesistente, voce già collegata a un altro uid. In tutti questi casi non scrive nulla.
5. **Migrazione idempotente**:
   - ogni scrittura parte solo se il valore è ancora vuoto (ETag);
   - rieseguita, scrive 0 collegamenti.
6. **Confronto**: nessuna voce sparita (rubrica, profili, codici, classifica, collegamenti). Le voci vecchie
   non scendono. I collegamenti già presenti non cambiano.
7. **Ripristino**: in caso di errore i collegamenti scritti si annullano uno per uno e le regole tornano quelle
   del backup.

Provato in `firebase-tests/test/rilascio.test.js` (27 test, dati finti).

Prima di usarla serve ancora:
- la tua approvazione;
- un gioco che **legga** `legacyClaims` per sommare le voci (oggi non lo fa);
- la regola che lo renda leggibile.

## 6. Fase E — Rilascio automatico

### Gioco (index.html, sw.js…)
PR → "Tutti i controlli" verde → unione in `main` → GitHub Pages pubblica → workflow **"Verifica del sito"**:
per 15 minuti controlla che il sito mostri la stessa versione di main, con `sw.js` e `manifest.json` validi.
Se non ci riesce diventa rosso e GitHub ti manda un'email.
- Ripristino del gioco: si pubblica `claude/ripristino-v621` (gioco della v6.16 con un numero più alto).
- Mai un "Revert" verso un numero più basso.

### Regole del database (+ eventuale migrazione)
Workflow **"Rilascio (produzione)"** (`.github/workflows/rilascio.yml`): solo a mano, solo da `main`, in
**PROVA** per default. Passi, in ordine; si ferma al primo errore:
1. tutti i controlli rilanciati sul commit da pubblicare;
2. **bersaglio certo** (`rilascio/bersaglio.js`). Devono coincidere tutte e cinque le condizioni:
   - `TOCK_BERSAGLIO=produzione`;
   - progetto `tock-v6`;
   - indirizzo esatto del database;
   - lo stesso indirizzo scritto in `index.html`;
   - chiave di servizio dello stesso progetto.
   Altrimenti non si collega (6 casi provati);
3. le regole pubblicate devono essere quelle **attese**. Se qualcuno le ha cambiate dalla console, si ferma
   prima di scrivere;
4. backup cifrato e verificato (ricaricato in un emulatore). Viene conservato 30 giorni come artifact
   cifrato: il repository è pubblico, quindi senza la passphrase non si legge;
5. pubblicazione delle regole (solo uno dei tre file provati dai controlli) e rilettura;
6. migrazione (se richiesta), poi verifica finale "niente perso";
7. **errore dopo una scrittura → ripristino automatico**: annulla i collegamenti e ripubblica le regole del
   backup (provato con guasti simulati). I DATI non si ripristinano mai in automatico: si perderebbero le
   partite giocate nel frattempo.

Ripristino a mano, se anche quello automatico fallisse:
1. scaricare l'artifact del backup;
2. `TOCK_BACKUP_PASSPHRASE=… node rilascio/backup.js decifra <cartella> <cartella-fuori-dal-repo>`;
3. incollare `regole.json` in console → Pubblica.
`dati.json` si importa SOLO con decisione esplicita.

### Da configurare per accendere la Fase E
Settings → Environments:
- **`production`**:
  - Deployment branches: solo `main`;
  - Required reviewers: tu, almeno all'inizio;
  - segreti:
    - `FIREBASE_SERVICE_ACCOUNT`: chiave JSON di un account di servizio del progetto **tock-v6** con il ruolo
      "Firebase Realtime Database Admin". Si crea in Google Cloud Console → IAM → Account di servizio, gratis.
      Chi ha la chiave può cambiare tutto il database: va SOLO in questo segreto;
    - `BACKUP_PASSPHRASE`: frase lunga, da conservare anche fuori da GitHub, altrimenti i backup non si leggono;
    - `MIGRAZIONE_JSON`: solo quando serve una migrazione.
- **`produzione-lettura`**:
  - segreto `FIREBASE_LETTURA`: account con il ruolo "Firebase Realtime Database Viewer".
  - Da verificare al primo lancio se basta per leggere le regole. Se non basta, il confronto si fa con
    l'environment `production`.

**Importante — dove stanno i segreti.** I segreti di produzione vanno SOLO negli environment, con il
deployment branch limitato a `main`, e MAI fra i "Repository secrets". Il motivo: una PR aperta da un branch
dello stesso repository riceve i repository secrets e potrebbe leggerli modificando un workflow; gli
environment secrets limitati a main no.
Con il repository **privato** sul piano gratuito, GitHub NON offre gli environment (né segreti né approvazioni).
Prima di rendere privato il repository con la Fase E accesa serve **GitHub Pro** (circa 4 $/mese) oppure si
tengono i rilasci delle regole a mano.

Settings → Secrets and variables → Actions → **Variables**:
- `TOCK_PROGETTO` = `tock-v6`;
- `TOCK_DB_URL` = `https://tock-v6-default-rtdb.europe-west1.firebasedatabase.app`;
- per ultima, `PRODUZIONE_ATTIVA` = `si`.

### Condizioni per i rilasci SENZA approvazioni manuali
1. Configurazioni del punto 2 fatte e "Tutti i controlli" obbligatorio su main.
2. Un primo rilascio in **PROVA** riuscito in produzione (backup scaricato e decifrato da te).
3. Un primo rilascio vero con **Required reviewers** attivo, riuscito, con "Verifica del sito" verde.
4. Una prova di ripristino delle regole fatta davvero (es. transizione → backup), con il controllo nel simulatore.
5. Solo dopo:
   - auto-merge acceso;
   - Required reviewers tolto da `production` per le attività normali (gioco e regole già provate);
   - le migrazioni restano sempre con approvazione.

Claude potrà allora:
1. aprire la PR;
2. correggerla finché è verde;
3. attivarle l'auto-merge.

La pubblicazione del gioco e la verifica del sito avvengono da sole.

## 7. Costi

- GitHub Actions: **gratis** finché il repository è pubblico (minuti illimitati sui runner standard).
  - Con il repository **privato** (piano deciso): 2.000 minuti/mese gratis. Un giro completo costa circa 6-7
    minuti (circa 300 giri al mese). Oltre quella soglia GitHub ferma i lavori, a meno che tu non imposti un
    budget di spesa: per default il budget è 0 €, quindi niente addebiti a sorpresa (da controllare in Settings → Billing).
  - Gli artifact privati hanno 500 MB di spazio gratis.
- Environment, segreti degli environment e approvazioni su repository **privato**: servono GitHub Pro (~4 $/mese).
- Firebase: emulatore gratis e locale. Account di servizio e login anonimo gratis sul piano Spark. Backup e
  rilascio fanno poche letture al mese.
- Classifica davvero sicura (vittoria verificata dal server): richiede Cloud Functions, cioè il **piano Blaze**
  a consumo (con pochi giocatori pochi centesimi o zero). Va attivato con un avviso di spesa. NON fatto.

## 8. Cosa NON è automatico (di proposito)

- Unire le PR #19-#26: lo decidi tu.
- Regole di transizione/definitive in produzione: solo col workflow, solo dopo la configurazione e il tuo ok.
- Migrazioni dei dati reali, ripristino dei dati, qualsiasi cosa in console.
