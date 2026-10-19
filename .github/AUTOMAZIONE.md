# Automazione di sviluppo e rilascio — Tock V6

Stato: **preparata**. I controlli automatici funzionano. Il rilascio in produzione è scritto e provato
sull'emulatore, ma è **spento**: non esistono né la variabile `PRODUZIONE_ATTIVA` né i segreti.
Nessuna operazione è stata fatta su Firebase vero, su `main` o sulle PR esistenti.

## 0. Situazione di partenza (verificata il 19/10/2026)

- `main` = v6.16 (commit c89c66d), pubblicato su GitHub Pages ("Deploy from branch") da main. Repository **pubblico**.
- 7 PR in bozza **a catena**, nessuna unita: #19 → #20 → #21 → #22 → #23 → #24 → #25 (fino a v6.21).
  Poi `claude/riprova` (v6.22, senza PR) e la PR #26 (automazione completa), che parte da `claude/riprova`.
- PR **#27** (`claude/ci-main` → `main`): SOLO i controlli e i documenti, nessun file del gioco. Serve a
  portare "Tutti i controlli" su main SENZA pubblicare la v6.22 (vedi punto 2.0).
- Prima c'era un solo workflow (`controlli.yml`): eseguiva i test del gioco a ogni push, senza permessi
  espliciti. I test Firebase giravano solo in locale.
- Protezione di `main`: **non verificabile da qui** (gli strumenti di Claude non leggono le impostazioni del
  repository). Va controllata a mano (punto 2).

## 1. Fase A — Controlli automatici

Workflow `Controlli` (`.github/workflows/controlli.yml`). Parte a ogni PR, a ogni aggiornamento di una PR, a
ogni push su `main` e quando lo richiama il rilascio. È lo STESSO file in #26 e #27.

| Controllo | Cosa fa | Tempo |
|---|---|---|
| Regole del gioco | `node --test tests/*.test.js`. Controlla anche APP_VERSION = CACHE_VERSION. Verso main, se cambia il gioco, la versione deve salire | ~10 s |
| Workflow sicuri | `controlla-workflow.js` + i suoi 18 test, e `actionlint` (sintassi dei workflow, versione fissa) | ~40 s |
| Il sito non pubblica i test | Jekyll 3.10 come GitHub Pages: `firebase-tests/`, `.github/`, `.claude/` non devono finire sul sito | ~30 s |
| Sicurezza Firebase (emulatore) | `npm test` in `firebase-tests` (regole, attacchi, posti, classifica, migrazione, rilascio, gioco vero in Chromium con più "telefoni", v6.16 insieme alla nuova) + `fase0-prova` (andata e ritorno delle regole). Sui branch che non hanno ancora `firebase-tests/` (main di oggi, #19) dice "niente da provare"; se la cartella c'era ed è stata TOLTA, diventa rosso | ~5 min |
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

Attenzione: questo controllo protegge dagli ERRORI, non da chi vuole aggirarlo. Una PR potrebbe modificare lo
script stesso. La vera barriera per i segreti è che stiano SOLO nell'environment `production` limitato a
`main` (punto 6): una PR non gira su `main`, quindi non li riceve.

Le PR da un fork girano con il token in sola lettura e senza segreti: è il comportamento standard di GitHub
per `pull_request`.

## 2. Configurazioni GitHub da fare A MANO (Claude non può farle)

**2.0 Ordine giusto (importante).**
Un controllo obbligatorio che su main NON esiste blocca TUTTE le unioni: GitHub resta in "Expected — Waiting
for status to be reported". Quindi:
1. prima si unisce la **#27** (solo controlli: il sito resta v6.16, identico);
2. si aspetta che su main giri "Controlli" e che "Verifica del sito" sia verde (Actions);
3. solo dopo si crea la regola qui sotto.

NON unire la #26 per questo scopo: porterebbe su main anche la v6.17-v6.22 = pubblicazione del gioco nuovo
(che richiede prima le regole di transizione).

**A. Proteggere main e rendere obbligatorio "Tutti i controlli"** (dopo il passo 2.0).
Percorso: GitHub → repository TockV6 → **Settings** → menu a sinistra **Rules** → **Rulesets** →
**New ruleset** → **New branch ruleset**.
1. Ruleset name: `Protezione main`. Enforcement status: **Active**.
2. Bypass list: **lasciarla vuota** (così la regola vale anche per te e per Claude).
3. Target branches → **Add target** → **Include default branch** (= `main`).
4. Branch rules:
   - ✅ **Restrict deletions**;
   - ✅ **Block force pushes**;
   - ✅ **Require a pull request before merging** → Required approvals: **0**. Con 0 puoi unire tu dal
     telefono e, in futuro, l'auto-merge può procedere da solo. Lascia spente le altre opzioni;
   - ✅ **Require status checks to pass** → ✅ "Require branches to be up to date before merging" →
     **Add checks** → scrivere `Tutti i controlli` → sceglierlo. Se chiede la fonte, scegliere
     **GitHub Actions** (così un'altra app non può fingere il controllo).
5. **Create**.

Controllo che funzioni: apri una PR qualsiasi verso main (es. #19). In fondo deve comparire "Tutti i controlli —
Required"; il pulsante di unione resta grigio finché non diventa verde.
Per tornare indietro: Settings → Rules → Rulesets → `Protezione main` → Enforcement **Disabled** (o Delete).
Non tocca né codice né sito.

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
PR → "Tutti i controlli" verde → unione in `main` → GitHub Pages pubblica → workflow **"Verifica del sito"**
(`.github/scripts/verifica-sito.js`, solo lettura):
1. aspetta che la pubblicazione Pages (deployment `github-pages`) di QUEL commit finisca: waiting → queued →
   in_progress → **success**. Prima di questa correzione partiva subito dopo l'unione e controllava il sito vecchio;
2. solo dopo controlla il sito: `index.html`, `sw.js` e `manifest.json` devono avere la versione del commit
   (riprova ogni 15 s, perché la cache del sito può impiegare un po');
3. ogni tentativo scrive nel log "versione attesa · trovata · esito"; il riepilogo finale va nella pagina del giro.

Diventa ROSSO (e GitHub ti manda un'email) se:
- la pubblicazione fallisce (`failure`/`error`) o viene sostituita da una più recente (`inactive`);
- main va avanti prima che questo commit venga pubblicato (lo verificherà il giro del commit nuovo);
- la pubblicazione non finisce entro 20 minuti;
- dopo la pubblicazione il sito mostra ancora la versione precedente entro 20 minuti.
Due unioni ravvicinate: il giro vecchio viene ANNULLATO (non dichiarato riuscito), resta quello nuovo.
- Ripristino del gioco: PR #31 (`claude/ripristino-v623`), gioco della v6.16 con numero v6.23, costruita sopra la v6.22
  così passa "Tutti i controlli" (le prove delle funzioni v6.17-v6.22 risultano saltate col motivo). Passi in
  `firebase-tests/COLLAUDO-V622.md`. Il vecchio `claude/ripristino-v621` non va più usato.
- Mai un "Revert" verso un numero più basso.

**Compatibilità con GitHub Pages ("Deploy from branch").** OGNI unione in `main` ripubblica il sito in 1-2
minuti, qualunque file cambi. Quindi:
- **#27** (solo controlli): il sito resta identico (v6.16). `.github/` e `.claude/` iniziano col punto e Jekyll
  non li pubblica (verificato dal controllo "Il sito non pubblica i test");
- **catena #19-#26**: unirle UNA ALLA VOLTA in main pubblicherebbe di seguito v6.16 → v6.17 → … → v6.22 (versioni
  intermedie sul sito per qualche minuto, ognuna con l'avviso "aggiorna" agli altri). Consigliato invece, al
  momento del rilascio (dopo le Fasi 1-2):
  1. una sola PR `claude/ci-automatica` → `main` (contiene tutta la catena, v6.22 + automazione);
  2. "Tutti i controlli" verde su quella PR (è il controllo completo, gioco vero compreso);
  3. unione → una sola pubblicazione della v6.22 → "Verifica del sito";
  4. chiusura di #19-#26 come "incluse" (il loro contenuto è già in main).
- Le PR #20-#25 hanno come base un altro branch, non main: su di loro gira ancora il vecchio "Controlli regole"
  (solo il gioco). Il controllo completo gira solo verso main e su #26.

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
