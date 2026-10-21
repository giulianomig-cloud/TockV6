# Fase 5: sicurezza definitiva (PREPARATA, nulla pubblicato)

Tutto è nel repository e provato sull'emulatore. In produzione non è stato fatto niente:
- nessuna regola pubblicata;
- niente piano Blaze;
- nessuna funzione pubblicata;
- nessun dato toccato.

I passi che costano o che cambiano la produzione sono segnati con 🔶 e li decide l'utente.

## In breve

| Cosa | Con le sole regole (gratis, piano Spark) | Con l'arbitro sul server (Cloud Functions, piano Blaze) |
|---|---|---|
| Posti al tavolo protetti, "Sono io" col codice | ✅ Fase 5A | ✅ |
| Classifica: ognuno scrive solo la propria voce, +1 per partita, una volta | ✅ Fase 5A | ✅ |
| Classifica: vittoria **decisa dal server** | ❌ (la dichiarano i telefoni) | ✅ Fase 5B |
| Carte in mano e mazzo **segreti** | ❌ (stanno nella stanza, leggibile) | ✅ Fase 5B |
| Mosse controllate (turno, carta in mano, mossa legale) | ❌ | ✅ Fase 5B |
| `stats/` solo +1, `codes/` non sovrascrivibili, `presence/` solo del proprio posto | ✅ Fase 5A | ✅ |
| Partite finite contate solo dal server | ❌ | ✅ Fase 5B |

Perché le sole regole non bastano: le regole di Firebase controllano chi scrive e la forma dei dati. Non possono
mescolare un mazzo, tenerlo nascosto e distribuirlo, né far girare il motore del gioco per capire se una mossa è
legale. Serve un programma sul server, l'**arbitro**.

## Come funziona l'arbitro (v6.23)

- **`functions/`** contiene la Cloud Function `arbitro` (europe-west1, come il database).
  - Il motore del gioco e i computer **non sono copiati a mano**: `functions/genera-motore.js` li prende da
    `index.html` e scrive `motore-generato.js`. Il controllo `--check` blocca la PR se non è allineato.
  - `functions/arbitro.js` contiene la logica pura (controlli e divisione pubblico/privato); `index.js` collega la
    funzione al database.
- **Dove stanno i dati di una stanza con l'arbitro**:
  - `games/<stanza>` sono i dati dei telefoni: posti, sala d'attesa, chat, `arbitro: true`, `sessione`.
    Il server ci copia `phase`, `turnStartedAt`, `gameId` e `winnerTeam`, che servono a "Gioca subito".
  - `arbitro/<stanza>/stato` è lo stato completo, compresi mazzo e mani: **nessun telefono lo legge**.
  - `arbitro/<stanza>/pub` è la parte pubblica: pedine, turno, registro, **quante** carte ha ognuno.
  - `arbitro/<stanza>/mani/<uid>` sono le carte di quel giocatore, leggibili **solo** da lui.
- **Il telefono** manda le intenzioni con `chiamaArbitro`: avvia, scambio, mossa, brucia, bot, rivincita,
  estrazioneVista, aggiorna. Il server controlla:
  - posto (uid);
  - turno;
  - carta davvero in mano;
  - mossa fra quelle legali del motore. Per Jack e 7 controlla bersagli e distribuzione.

  Poi applica la mossa in **una transazione** e pubblica.
- **I computer**:
  - le mosse le calcola il server con la stessa intelligenza di sempre;
  - i telefoni dicono solo "tocca a un computer";
  - i commenti dei computer finiscono nella chat della stanza.
- **La classifica** la scrive solo il server, a fine partita, una volta per `gameId`:
  - `credited/<stanza>/<gameId>/<uid>` più `leaderboard/<uid>`, con la stessa forma di oggi;
  - `stats/gamesFinished` +1.

  Le voci vecchie non si toccano.
- **Acceso o spento**:
  - le stanze **nuove** usano l'arbitro solo se in Firebase c'è `config/arbitro = true`;
  - senza quel valore la v6.23 gioca esattamente come la v6.22;
  - una stanza resta come è nata: quelle "di prima" finiscono senza arbitro.

## Compatibilità

| Gioco \ Regole | transizione (oggi) | 5A `proposte.json` | 5B `arbitro.json` |
|---|---|---|---|
| v6.16 | ✅ | ❌ scritture rifiutate | ❌ |
| v6.22 | ✅ | ✅ | ❌ non crea stanze (servono `arbitro`+`sessione`) |
| v6.23, arbitro spento | ✅ | ✅ | ❌ (come la v6.22) |
| v6.23, arbitro acceso | ✅ (in lettura servono i percorsi di 5A: arbitro di fatto spento) | ✅ | ⚠️ le stanze AUTO "di prima" in attesa con un nome fantasma restano bloccate |
| v6.24 | come la v6.23 | ✅ | ✅ (recupera da sola le stanze AUTO "di prima" in attesa) |

Con le regole di transizione `config/` non è leggibile, quindi la v6.23 resta con l'arbitro spento.
Per questo l'arbitro si accende **dopo** le regole 5A.

## Procedura di rilascio (in ordine; ogni passo ha la prova e il ritorno indietro)

Esito di R1 e piano aggiornato: `fase5/R1.md` (criteri per ciò che non si può verificare, partite interrotte,
problema delle stanze AUTO "di prima" in attesa con le regole 5B).


| # | Passo | Chi | Prova prima di andare avanti | Ritorno indietro |
|---|---|---|---|---|
| R0 | Unire la PR della v6.23 (arbitro spento) | utente/Claude su ok | "Verifica del sito" = v6.23; 2 telefoni giocano come prima | ripristino v6.24 = gioco v6.22 (branch `claude/ripristino-v624`, vedi sotto) |
| R1 | Attesa: nessun telefono collegato più vecchio della v6.22 | — | export → `node fase5/controlla-pronti.js export.json` → "Pronto per 5A: SÌ" (ripetere in orari diversi) | — |
| R2 | Pubblicare `regole/proposte.json` (5A) | utente in console | simulatore: lettura `/profiles/x` senza login = Negato, `/config/arbitro` = Consentito; 2 telefoni: stanza, mosse, classifica, "Sono io" col codice | incollare `regole/transizione.json` |
| R3 🔶 | Piano **Blaze** + **avviso di spesa** (es. 5 €) | utente | — | tornare a Spark (prima eliminare la funzione) |
| R4 🔶 | Pubblicare la funzione (passi precisi in `fase5/R3-R4.md`): `cd firebase-tests && npx firebase login` poi `npx firebase deploy --only functions:arbitro --project tock-v6` (prima del caricamento girano `--check` e i test) | utente (o Claude con una credenziale data apposta) | console Functions: `arbitro` attiva in europe-west1. L'arbitro è ancora spento: nessun effetto | `npx firebase functions:delete arbitro --region europe-west1 --project tock-v6` |
| R5 | Accendere: Dati → aggiungere `config` → `arbitro` = `true` | utente | 2 telefoni con la v6.23, stanza nuova con gli amici: carte ok, mosse, fine partita → nuova voce in classifica; "Gioca subito" coi computer | `config/arbitro` = `false`: le stanze nuove tornano "di prima" (quelle già avviate continuano col server) |
| R6 | Attesa: tutti sulla v6.23 e nessuna partita "di prima" in corso | — | `controlla-pronti.js` → "Pronto per 5B: SÌ" | — |
| R7 | Pubblicare `regole/arbitro.json` (5B) | utente | simulatore: scrittura `/leaderboard/x` = Negato, lettura `/arbitro/A/stato` = Negato; 2 telefoni come in R5 | incollare `regole/proposte.json` |

Prima di R2, R5 e R7 serve un export e la copia delle regole del momento, conservati con la data, come nelle Fasi
0-2. Vanno controllati con `fase0/verifica.js` e `fase2/controlla-dopo.js`.

## Ripristino del gioco (solo emergenza)
Gioco attuale: **v6.24**. Ripristino: branch `claude/ripristino-v625` = `index.html` e `sw.js` della **v6.23** (commit
82e2958) col numero **v6.25**. La v6.23 sa già gestire l'arbitro, quindi il ripristino funziona anche dopo R5.
Non si torna mai a un numero già usato: i telefoni già aggiornati vedrebbero gli altri come vecchi, e il controllo
"la versione deve salire" lo blocca. Le regole e i dati NON si toccano.
1. aprire (o aggiornare con "Update branch") la PR di `claude/ripristino-v625` verso `main`;
2. aspettare "Tutti i controlli" verde. Le prove del recupero delle AUTO "di prima" (v6.24) risultano SALTATE col
   motivo, e solo se `index.html` è identico alla v6.23 salvo il numero; tutto il resto deve essere verde;
3. unire → "Verifica del sito" deve dire "trovata v6.25".

Il ripristino tiene il numero sopra quello pubblicato. Se dopo la v6.24 escono altre versioni va rifatto con lo stesso
metodo: superati `claude/ripristino-v624`, che riportava alla v6.22, e la PR #31.

Limiti:
- con le regole 5B (R7) la v6.23 non recupera le AUTO "di prima" in attesa. È un problema solo se ce ne sono ancora;
  in caso, prima si torna alle regole 5A;
- se l'arbitro è acceso e serve tornare alla v6.22 (gioco senza arbitro), prima va messo `config/arbitro` = false.

## Dati esistenti (migrazione)

Nessuno spostamento e nessuna cancellazione:
- **Stanze di prima**: restano senza arbitro e finiscono come sempre. Con le regole 5B diventano di sola lettura,
  per questo R7 si fa quando non ce ne sono più in corso.
- **Stanze "Gioca subito"** (AUTO-…): quando sono finite o abbandonate si riciclano. Il telefono le ricrea già con
  l'arbitro (sessione nuova), e la partita vecchia del server viene ignorata e poi sostituita.
- **Classifica**: le voci restano com'erano.
  - Con 5B nessun telefono può più scriverle: diventano di sola lettura e le nuove le scrive solo il server.
  - L'azzeramento prima degli store, già deciso, è a parte: si fa in console con un export prima.
- **Nuovi percorsi**: `config/` e `arbitro/`. Si possono cancellare in console senza effetti sulle stanze di prima.

## Rischi che restano (anche con 5B)

- **Più account anonimi**: chiunque può creare più uid e giocare contro i propri computer. La classifica conta
  partite **vere** (decise dal server), ma anche quelle "1 persona + 3 computer".
  Decisione 🔶: contarle meno o non contarle (oggi contano come prima).
- **Accordi fra giocatori**: due persone d'accordo possono far vincere una delle due. Nessun server lo impedisce.
- **Chat**: nelle stanze AUTO il testo libero resta scrivibile da chi usa il database direttamente, non dall'app.
  Si può chiudere con regole su una lista di frasi: lavoro a parte.
- **Versione dichiarata in `presence/`**: falsificabile, serve solo per l'avviso "aggiorna".
- **Abuso della funzione** (tante chiamate da script):
  - c'è un tetto di 10 istanze;
  - si mitiga con **App Check** (Play Integrity sull'app Android, App Attest su iPhone) e con l'avviso di spesa.
  - Decisione 🔶 per dopo la pubblicazione sugli store.
- **Costi**: a consumo. Con pochi giocatori sono pochi centesimi o zero: Cloud Functions ha una quota gratuita
  mensile. Serve comunque la carta di credito sul piano Blaze.

## Decisioni e costi per l'utente (🔶)

1. **Piano Blaze** con avviso di spesa: obbligatorio per pubblicare la funzione. Senza Blaze si può arrivare solo
   alla 5A.
2. **Pubblicazione della funzione** (R4): dal computer con `npx firebase login`, oppure dando a Claude una
   credenziale dedicata (account di servizio con il solo ruolo per le funzioni) da mettere nell'environment
   `production`. Oggi nessuna delle due esiste.
3. Partite contro i computer in classifica: contano (come oggi), contano meno o no.
4. **App Check**: dopo gli store.

## Prove automatiche

| Cosa | Dove | Come |
|---|---|---|
| Logica dell'arbitro: partite intere coi computer, Jack/7 inventati, fuori turno, carte non possedute, parte pubblica senza carte | `functions/test/arbitro.test.js` | `cd functions && npm test` |
| Regole 5B: mani private, stato segreto, classifica/partite finite solo dal server, stanze solo con arbitro, riciclo | `test/arbitro-regole.test.js` | `npm test` |
| Due telefoni veri (Chromium) + funzione nell'emulatore: carte segrete, imbrogli rifiutati, partita, fine partita con classifica, rivincita, "Sono io" col codice, Gioca subito, passaggio dalla 5A con stanze di prima | `arbitro-e2e/` | `npm run test-arbitro` |
| Motore del server e regole generate allineati | — | `node ../functions/genera-motore.js --check`, `node regole/genera-arbitro.js --check` |
| Pronti per il passo dopo (da un export) | `test/fase5-pronti.test.js` | `npm test` |

Tutto gira anche su GitHub a ogni PR, nel job "Arbitro sul server (emulatore)" dentro "Tutti i controlli".
