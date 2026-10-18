# Test di sicurezza Firebase (solo locale)

Questa cartella **non fa parte del gioco**: il gioco (`index.html`, `sw.js`) non la usa e GitHub Pages
la ignora. Contiene i controlli delle regole del database, che girano **solo sull'emulatore locale** di
Firebase con un progetto finto (`demo-tock`): un progetto che inizia con `demo-` non può collegarsi
al Firebase vero, quindi questi test non leggono e non scrivono mai i dati reali.

## Come si lanciano

```
cd firebase-tests
npm install        # una volta sola (installa gli strumenti SOLO qui dentro)
npm test           # avvia l'emulatore, esegue i test, lo spegne
```

Serve Java (11 o più recente) per l'emulatore.

### Il sito non pubblica questa cartella
`_config.yml` (nella radice) dice a GitHub Pages di escludere `firebase-tests/`. Per verificarlo si
costruisce il sito in locale con Jekyll (installato solo in `firebase-tests/.gems`):

```
gem install --no-document --install-dir .gems jekyll:3.10.0 kramdown-parser-gfm webrick   # una volta
npm run controlla-sito
```

## Cosa c'è

- `test/vulnerabilita-regole-attuali.test.js` — dimostra le falle delle regole attuali
  (`../database.rules.json`). Ogni test PASSA quando la falla esiste.
- `test/migrazione.test.js` — controlla lo script di analisi della classifica su dati finti.
- `regole/proposte.json` — regole NUOVE proposte (NON pubblicate). `../database.rules.json` resta quello di oggi.
- `regole/transizione.json` — regole di PASSAGGIO: quelle di oggi + i percorsi nuovi (`profiles/`, `credited/`…),
  così la versione vecchia e quella nuova del gioco funzionano insieme finché tutti non hanno aggiornato.
- `test/profili.test.js` — regole proposte per i profili `profiles/<uid>`.
- `test/classifica.test.js` — classifica "ognuno registra il proprio risultato, una volta per partita".
- `test/posti.test.js` — posti protetti e codice di rientro: un altro utente che conosce solo il codice della stanza
  non può prendersi un posto (in nessun modo provato), mentre gioco, computer, Gioca subito e riciclo funzionano.
- `test/vulnerabilita-regole-proposte.test.js` — le falle di partenza ripetute con le regole proposte
  (CHIUSA / RIDOTTA / RESTA).
- `test/e2e-regole-transizione.test.js` — il gioco vero con le regole di transizione.
- `test/e2e-versioni-transizione.test.js` / `test/e2e-versioni-definitive.test.js` — la versione VECCHIA (v6.16,
  servita col database dell'emulatore al posto di quello vero) con le regole di transizione e definitive, anche in
  stanza con la v6.20.
- `test/vulnerabilita-regole-transizione.test.js` — gli attacchi con le regole di transizione (cosa RESTA aperto).
- `DISTRIBUZIONE.md` — procedura di distribuzione, verifiche e ripristino, con la tabella di cosa può fare ogni versione.
- `test/e2e-regole-attuali.test.js` e `test/e2e-regole-proposte.test.js` — il gioco vero in Chromium con più
  "telefoni", collegato all'emulatore (`index.html?emu=1`, funziona solo su localhost), con le regole di oggi e con
  quelle proposte. Usano Playwright e Chromium già presenti sul computer (`test/e2e-banco.js`).
- `migrazione/analizza-classifica.js` — legge un export JSON della console e stampa un resoconto
  (solo lettura, nessun collegamento a Firebase).

## Proposta di migrazione della classifica (da approvare, NON eseguita)

Obiettivo: **non perdere nulla** e non dover spostare dati.

1. **Nessun dato si sposta né si cancella.** Le voci attuali di `leaderboard/` hanno chiavi della
   rubrica (iniziano con `-`); le nuove voci useranno l'`uid` del login anonimo (28 caratteri, mai `-`
   all'inizio): non possono sovrapporsi.
2. Con le regole nuove ognuno potrà scrivere solo `leaderboard/<proprio uid>`: le voci vecchie
   diventano automaticamente **di sola lettura** (congelate), quindi restano com'erano.
3. **Rivendicazione facoltativa** (passo successivo, se lo vuoi): `legacyClaims/<vecchioId> = uid`,
   scrivibile UNA volta sola. La classifica mostra vecchio + nuovo sommati. Chi rivendica per sbaglio il
   nome di un altro si corregge a mano dalla console (fra amici è un caso raro).
4. **Verifica**: prima e dopo, esporti il JSON dalla console e lanci
   `node migrazione/analizza-classifica.js export.json`. I **totali** (vittorie, partite, vinte) delle
   voci vecchie devono restare identici.

## Classifica: cosa protegge e cosa NO (passo 4, v6.19)

Ora (regole proposte):
- ognuno scrive SOLO `leaderboard/<proprio uid>`, +1 partita per volta, +1 vittoria solo se la sua squadra
  risulta vincitrice nella stanza;
- ogni partita ha un `gameId` nuovo (anche la rivincita) e si registra UNA volta: `credited/<stanza>/<gameId>/<uid>`;
- bisogna essere stati seduti in quella stanza, con la partita finita e con lo stesso `gameId`;
- le voci vecchie (chiavi che iniziano con `-`) restano intatte e diventano di sola lettura.

LIMITE NOTO (dimostrato dal test "LIMITE NOTO"): lo stato della partita lo scrivono i telefoni dei giocatori.
Chi è seduto può dichiarare vinta una partita (anche contro i computer, in una stanza tutta sua) e registrarsela.
Per una classifica a prova di imbroglio serve un "arbitro" sul server, prima del lancio pubblico:
1. Cloud Function che riceve le mosse e le applica col motore del gioco (le stesse funzioni dei test);
2. solo il server scrive lo stato della partita, le mani (private) e la vittoria;
3. solo il server scrive `leaderboard/` a fine partita (una volta per `gameId`);
4. eventuale peso diverso per le partite contro i computer.
Richiede il piano Blaze (a consumo: con pochi giocatori pochi centesimi o zero) e un avviso di spesa.
