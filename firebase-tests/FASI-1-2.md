# Fasi 1 e 2 — passi manuali in console

Le operazioni in console le fa SOLO l'utente. Claude prepara, controlla i file e verifica: non si collega mai al
Firebase vero e non ha credenziali.

## Fase 1 — Accesso anonimo · FATTA (19/10/2026, dall'utente)

Provider "Anonimo" attivato in Authentication. Verifica dell'utente: la v6.16 su 2 telefoni funziona come prima.
È atteso, perché la v6.16 non carica nemmeno il login.
- **Ripristino:** Authentication → Metodo di accesso → Anonimo → Disattiva → Salva. Nessun effetto sulla v6.16.
- **Da verificare in Fase 3:** il primo login vero lo farà la v6.22 dal sito. Se dà `auth/unauthorized-domain`
  oppure `auth/requests-from-referer-...-are-blocked`, vanno controllati:
  - Authentication → Impostazioni → Domini autorizzati (aggiungere `giulianomig-cloud.github.io`);
  - in Google Cloud, le eventuali restrizioni della chiave API.
  Se il login non riesce, la v6.22 gioca lo stesso, ma senza profilo, classifica nuova e codice di rientro.

## Fase 2 — Regole di transizione · FATTA (19/10/2026, pubblicata dall'utente)

Esito: regole copiate dalla console = `regole/transizione.json`; `controlla-dopo.js` "✓ Fase 2 confermata" (nessuna voce
sparita o scesa); prove del simulatore 4/4 rifatte sull'emulatore con le regole copiate; `fase2-prova` 7/7 coi dati di dopo.
Impronta delle regole prima: `0b0dd43b…707edd5b` (= `database.rules.json`, è anche il backup per il ritorno).

Cosa cambia: alle regole di oggi si AGGIUNGONO solo `profiles`, `credited`, `seatKeys`, `seatClaims`. Nessuna regola
di oggi viene modificata (controllato da `fase12-regole.test.js`). Pubblicare regole non modifica i dati.

### A. Prima: copie aggiornate (l'utente, ~5 minuti)
1. Console → Realtime Database → **Dati** → ⋮ (in alto a destra) → **Esporta JSON**. Salvare il file con la data,
   es. `tock-2026-10-20.export.json`. NON sovrascrivere né cancellare `tock.export.json` della Fase 0.
2. Console → Realtime Database → **Regole**: selezionare tutto, copiare e salvare come
   `regole-pubblicate-2026-10-20.json`. Anche questo non sostituisce quello della Fase 0.
3. Conservare i due file sul computer o su Drive e mandarli a Claude.

### B. Prima: controlli di Claude sui file nuovi (solo lettura ed emulatore)
```
node fase0/verifica.js regole-pubblicate-AAAA-MM-GG.json tock-AAAA-MM-GG.export.json <cartella-fuori-dal-repo>
BACKUP_REGOLE=regole-pubblicate-AAAA-MM-GG.json BACKUP_DATI=tock-AAAA-MM-GG.export.json npm run fase0-prova
BACKUP_REGOLE=regole-pubblicate-AAAA-MM-GG.json BACKUP_DATI=tock-AAAA-MM-GG.export.json npm run fase2-prova
```
Si va avanti SOLO se:
- "Regole reali = repository: SÌ" e "Transizione costruita sulle regole reali: SÌ";
- `fase0-prova` 4/4: il backup si carica e si rilegge identico nell'emulatore;
- `fase2-prova` 7/7:
  - transizione pubblicata e riletta;
  - dati identici bit per bit;
  - la v6.16 senza login fa tutto come oggi;
  - i percorsi nuovi sono chiusi senza login;
  - il ritorno al backup è esatto.
- Claude annota impronte SHA-256 e conteggi: classifica (voci, vittorie, partite, vinte), stanze, rubrica, profili.

Se le regole pubblicate NON sono quelle del repository → STOP: la transizione va rifatta partendo da quelle vere.

### C. Pubblicazione (l'utente, ~2 minuti)
1. Console → Realtime Database → **Regole** → selezionare tutto → incollare il contenuto ESATTO di
   `firebase-tests/regole/transizione.json` (Claude lo fornisce da copiare) → **Pubblica**.
2. Non toccare nient'altro (Dati, Authentication, piano).

### D. Subito dopo: controlli (entro 10 minuti)
1. **Simulatore** (scheda Regole → "Rules Playground"). Il simulatore non scrive nulla.

   | # | Tipo | Percorso | Autenticato | Atteso |
   |---|---|---|---|---|
   | 1 | lettura | `/profiles/x` | no | **Negato** |
   | 2 | scrittura `{"phase":"lobby"}` | `/games/PROVA` | no | **Consentito** (come oggi) |
   | 3 | scrittura `{"nome":"Io"}` | `/profiles/u1` | sì, uid `u1` (Anonimo) | **Consentito** |
   | 4 | scrittura `true` | `/credited/AUTO-1/g/u1` | no | **Negato** |

2. **2 telefoni con il sito di oggi (v6.16)**:
   - stanza con gli amici, qualche mossa, chat;
   - Gioca subito coi computer;
   - "Sono io".
   Tutto deve funzionare come prima.
3. **Nuovo export + copia delle regole** (come al punto A, con nomi nuovi, es. `...-dopo.json`) → Claude esegue:
   ```
   node fase2/controlla-dopo.js regole-dopo.json tock-AAAA-MM-GG.export.json tock-dopo.export.json
   ```
   Deve dire "Regole pubblicate = transizione: SÌ", "Voci sparite o scese: nessuna" e "✓ Fase 2 confermata".
   Le partite giocate nel frattempo possono AGGIUNGERE voci o farle salire, mai toglierle.

### E. Ritorno indietro (se un controllo di D fallisce)
1. Regole → incollare il file `regole-pubblicate-AAAA-MM-GG.json` del punto A → **Pubblica**.
2. Simulatore: la prova 3 (`/profiles/u1` autenticato) ora deve dare **Negato**: sono tornate le regole di prima.
3. 2 telefoni v6.16: come prima.
4. I dati non vanno toccati: le regole non li hanno cambiati. Eventuali `profiles/`… scritti nel frattempo restano,
   ma con le regole di oggi nessuno li legge né li scrive.
Il ritorno è stato provato sull'emulatore con una copia dei dati veri: `fase0-prova` e `fase2-prova`, punto 6.

### F. Cosa NON fa la Fase 2
- Non cambia il gioco sul sito (resta la v6.16 fino all'unione della PR #29, Fase 3).
- Non sposta, non cancella e non migra dati.
- Non attiva servizi a pagamento.
- Non protegge ancora stanze e classifica: la transizione è aperta come oggi (vedi `DISTRIBUZIONE.md`).
