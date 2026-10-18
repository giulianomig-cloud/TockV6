# Fasi 1 e 2 — passi manuali in console (PREPARATI, NON eseguiti)

Da fare **solo con l'ok esplicito**. Prima della Fase 1 serve il backup della Fase 0 (fatto):
`regole-pubblicate.json` (SHA-256 `0b0dd43b…707edd5b`, identico a `database.rules.json`) e l'export dei dati
(numeri di controllo: classifica **2 voci**, **vittorie 3 · partite 5 · vinte 3**; rubrica 1; profili 0).

## Fase 1 — Accesso anonimo (gratis, piano Spark)

1. Console Firebase → progetto **tock-v6** → menu a sinistra **Authentication** (Autenticazione).
   Se compare **Inizia / Get started**, premerlo (attiva il servizio, gratis).
2. Scheda **Metodo di accesso / Sign-in method** → **Anonimo / Anonymous** → interruttore **Attiva** → **Salva**.
3. NON premere eventuali proposte di "upgrade" (Identity Platform): non servono.
4. Nient'altro: niente regole, niente dati.

**Verifica:** il sito di oggi (v6.16) funziona come prima su 2 telefoni (stanza, mossa, chat). È atteso: la v6.16
non carica nemmeno il login (provato sull'emulatore: `e2e-versioni-transizione`, `e2e-fase12`).

**Ripristino:** stesso percorso → Anonimo → **Disattiva** → Salva. Nessun effetto sulla v6.16.

**Da sapere:** il login anonimo lo usa solo la v6.17 e successive (Fase 3). Se in Fase 3 il login desse errore
`auth/unauthorized-domain`, andrà aggiunto `giulianomig-cloud.github.io` in Authentication → Impostazioni →
Domini autorizzati (per il login anonimo di solito non serve; lo si verifica in Fase 3).

## Fase 2 — Regole di transizione

1. Avere a portata il backup (`regole-pubblicate.json` della Fase 0).
2. Console → **Realtime Database** → scheda **Regole** → selezionare tutto → incollare il contenuto di
   `firebase-tests/regole/transizione.json` → **Pubblica**.
3. **Simulatore** (pulsante "Rules Playground" / "Simulatore regole" nella scheda Regole). Quattro prove,
   con il risultato atteso (già verificato sull'emulatore, `fase12-regole.test.js`):

   | # | Tipo | Percorso | Autenticato | Risultato atteso |
   |---|---|---|---|---|
   | 1 | lettura (read) | `/profiles/x` | no | **Negato** |
   | 2 | scrittura (set) `{"phase":"lobby"}` | `/games/PROVA` | no | **Consentito** (come oggi) |
   | 3 | scrittura (set) `{"nome":"Io"}` | `/profiles/u1` | sì, uid `u1` (Anonimo) | **Consentito** |
   | 4 | scrittura (set) `true` | `/credited/AUTO-1/g/u1` | no | **Negato** |

   Il simulatore NON scrive nel database: prova soltanto.
4. **Prova reale:** 2 telefoni col sito di oggi (v6.16): stanza con gli amici, qualche mossa, Gioca subito coi
   computer. Tutto come prima.
5. **Controllo dati:** nuovo "Esporta JSON" → Claude lancia `fase0/verifica.js`: le voci vecchie della classifica
   devono avere ancora **vittorie 3 · partite 5 · vinte 3** (salvo partite giocate nel frattempo, che si vedono).

**Ripristino:** Regole → incollare il backup della Fase 0 → Pubblica. Controllo: nel simulatore la prova 3
(`/profiles/u1` autenticato) diventa **Negato** = sono tornate le regole di prima. Provato sull'emulatore che il
backup torna identico (`fase0/prova-ripristino.test.js`, andata e ritorno).

## Cosa NON fanno le Fasi 1-2

- Non cambiano il gioco sul sito (resta la v6.16).
- Non spostano, non cancellano e non migrano dati (classifica, rubrica, stanze restano come sono).
- Non attivano servizi a pagamento.
- Non proteggono ancora stanze e classifica: la transizione è aperta come oggi (vedi `DISTRIBUZIONE.md`).
