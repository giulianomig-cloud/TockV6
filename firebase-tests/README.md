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

## Cosa c'è

- `test/vulnerabilita-regole-attuali.test.js` — dimostra le falle delle regole attuali
  (`../database.rules.json`). Ogni test PASSA quando la falla esiste.
- `test/migrazione.test.js` — controlla lo script di analisi della classifica su dati finti.
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
