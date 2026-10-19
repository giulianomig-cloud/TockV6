# Collaudo della v6.22 — piano (NIENTE eseguito in produzione)

Candidato al rilascio: branch `claude/rilascio-v622` = catena #19-#26 (v6.17 → v6.22 + automazione) allineata al
main attuale (controlli #27 e verifica del sito #28). Si pubblica con UNA sola PR verso main, mai la catena una PR alla
volta (ogni unione in main ripubblica il sito: passerebbero sul sito v6.17, v6.18… una dopo l'altra).

## Ordine obbligatorio
1. **Fase 1 — accesso anonimo** (console, la fa l'utente: `FASI-1-2.md`). Da sola non cambia nulla per la v6.16.
2. **Fase 2 — regole di transizione** (console oppure workflow "Rilascio" in PROVA e poi vero). Compatibili con la
   v6.16 (provato). Senza di esse la v6.22 gioca ma NON registra la classifica, non salva profili né codici di rientro.
3. **Fase 3 — gioco v6.22**: unione della PR del candidato → "Verifica del sito" deve dire "trovata v6.22".
4. **Fase 4 — attesa** che tutti i telefoni siano sulla v6.22 (presenze in `presence/` senza `v6.16`).
5. **Fase 5 — regole definitive** (la v6.16 smette di funzionare: solo dopo la Fase 4).

## Collaudo dopo ogni fase

| Fase | Prova | Atteso | Come si torna indietro |
|---|---|---|---|
| 1 | 2 telefoni col sito di oggi (v6.16): stanza con amici, mosse, chat, Gioca subito coi computer | tutto come prima | disattivare "Anonimo" |
| 2 | simulatore regole: lettura `/profiles/x` senza login | Negato | incollare il backup delle regole (Fase 0) |
| 2 | simulatore: scrittura `/games/PROVA` senza login | Consentito (come oggi) | — |
| 2 | 2 telefoni v6.16: stanza, mosse, "Sono io", classifica a fine partita | tutto come prima | — |
| 2 | nuovo export → `node fase0/verifica.js` | voci vecchie ancora vittorie 3 · partite 5 · vinte 3 (salvo partite nuove) | — |
| 3 | home | mostra **v6.22**; "Verifica del sito" verde con "trovata v6.22" | pubblicare `claude/ripristino-v621` (v6.23 = gioco v6.16) |
| 3 | telefono A (v6.22) e telefono B rimasto su v6.16 nella stessa stanza | B vede l'avviso "aggiorna", non cancella l'uid di A | — |
| 3 | partita coi computer fino alla fine | nuova voce `leaderboard/<uid>`, voci vecchie invariate | — |
| 3 | ⚙️ → 🔑 codice; dal secondo telefono "Sono io" | chiede il codice; giusto = rientra, sbagliato = no | — |
| 5 | simulatore: `/games/PROVA/turnColor` senza login | Negato | incollare `regole/transizione.json` |

Già provato sull'emulatore (test automatici, a ogni PR): `e2e-versioni-transizione` / `-definitive` (v6.16 con la
nuova), `e2e-regole-*` (gioco vero in Chromium), `posti`, `classifica`, `profili`, `fase12-*`, `e2e-riprova`,
`rilascio` (backup cifrato, PROVA, guasto → ripristino, idempotenza).

## Ancora NON protetto (serve il server: Cloud Functions, piano Blaze)
- **Carte in mano e mazzo**: leggibili da chiunque conosca il codice della stanza (stanno nello stesso nodo della
  partita). Serve: mani in `hands/<stanza>/<uid>` leggibili solo dal titolare, mazzo solo sul server, distribuzione
  e pesca fatte da una funzione.
- **Stato della partita**: lo scrivono i telefoni. Serve: mosse inviate a una funzione che le controlla col motore
  del gioco (le stesse funzioni dei test `tests/`) e scrive lo stato; regole che vietano la scrittura diretta.
- **Classifica**: la vittoria la dichiarano i telefoni. Serve: solo la funzione scrive `leaderboard/` a fine partita
  (una volta per `gameId`). Finché non c'è, la classifica NON va considerata sicura.
- Altro: chat delle stanze AUTO scrivibile via codice con testo libero, versione dichiarata in `presence/` falsificabile.
- Costi: piano Blaze a consumo (con pochi giocatori pochi centesimi o zero), con avviso di spesa. NON attivato.
