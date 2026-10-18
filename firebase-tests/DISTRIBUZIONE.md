# Distribuzione della versione sicura (v6.20 → v6.21) — procedura e ripristino

> Il gioco da pubblicare è la **v6.22** = v6.20 + correzione delle stanze bloccate (v6.21) + nuovo tentativo
> automatico "Riprova" (v6.22). La tabella vale uguale per v6.20-v6.22. Il ripristino usa il numero **v6.23**.

Niente di questo è stato fatto. Ogni fase si fa **solo con l'ok esplicito** dell'utente.
Le operazioni in console Firebase le fa l'utente; Claude prepara, controlla e verifica.

## Cosa può fare ogni versione con ogni insieme di regole (verificato sull'emulatore)

| Operazione | Regole di oggi | Regole di transizione | Regole definitive |
|---|---|---|---|
| **v6.16** — giocare (stanze, mosse, computer, rivincita) | sì | sì | **no**: non può scrivere nulla |
| **v6.16** — classifica (come oggi, voce della rubrica) | sì | sì | no |
| **v6.16** — "Sono io" da un altro telefono (come oggi, senza codice) | sì | sì | no |
| **v6.16** — stanza insieme a una v6.20 | — | sì: vede l'avviso "aggiorna", non cancella gli uid | no |
| **v6.20** — giocare (stanze, mosse, computer, rivincita, Gioca subito) | sì | sì | sì (serve il login anonimo attivo) |
| **v6.20** — profilo `profiles/<uid>` | no (in silenzio) | sì | sì |
| **v6.20** — classifica (propria voce, una volta per partita) | **no: non registra** | sì | sì, con i controlli |
| **v6.20** — codice di rientro e "Sono io" da altro telefono | **no** | sì, col codice | sì, col codice |
| **v6.20** — posti protetti DAL DATABASE | no | **no** (solo il gioco chiede il codice) | sì |
| **v6.20** senza login (accesso anonimo spento) | gioca, senza uid | gioca, ma niente profilo/classifica/codice | **no** |

Attacchi (chi conosce solo il codice della stanza), stesso elenco nei tre file `vulnerabilita-regole-*.test.js`:

| Attacco | Oggi | Transizione | Definitive |
|---|---|---|---|
| Leggere le carte in mano e il mazzo | possibile | possibile | **possibile** (serve il server) |
| Modificare lo stato della partita | possibile (anche senza login) | possibile (anche senza login) | possibile solo con login (serve il server) |
| Dichiarare vinta una partita e registrarsela | possibile | possibile | possibile solo per sé e solo se seduti (serve il server) |
| Prendersi il posto di un altro | possibile | possibile con scrittura diretta | **impossibile** (17 tentativi diversi) |
| Cancellare una stanza | possibile | possibile | impossibile |
| Modificare/cancellare la classifica di altri | possibile | possibile | impossibile |
| Registrare due volte la stessa partita | possibile | possibile (vecchio sistema) | impossibile |

**La transizione NON protegge più di oggi** stanze e classifica: serve solo a non bloccare la v6.16 mentre
gli amici aggiornano. Va tenuta il meno possibile.

## Fase 0 — Preparazione (nessuna modifica)

1. **Backup delle regole.** Console → Realtime Database → Regole: selezionare TUTTO il testo, copiarlo e
   salvarlo in un file (es. `regole-backup-2026-10-18.json`) su Drive o sul computer, e mandarlo a Claude.
   Non contare sulla cronologia della console: il ripristino si fa incollando questo file.
2. **Confronto.** Claude confronta il backup con `database.rules.json` del repository. Se sono diversi
   **ci si ferma**: le regole di transizione vanno rifatte partendo da quelle vere e riprovate.
3. **Backup dei dati.** Console → Realtime Database → Dati → ⋮ → Esporta JSON. Claude esegue
   `node migrazione/analizza-classifica.js export.json` e annota numero di voci e totali
   (vittorie, partite, vinte): sono i numeri di controllo per tutte le fasi.

## Fase 1 — Accesso anonimo (console → Authentication)

- **Cosa:** Authentication → Inizia → Metodo di accesso → **Anonimo** → Attiva → Salva. Gratis.
- **Verifica:** la v6.16 (sul sito oggi) continua a funzionare: non usa il login.
- **Ripristino:** disattivare "Anonimo". Nessun effetto sulla v6.16.

## Fase 2 — Regole di transizione (prima di pubblicare il gioco nuovo)

- **Cosa:** incollare `regole/transizione.json` al posto delle regole attuali → Pubblica.
- **Verifica (10 minuti):**
  - 2 telefoni con la v6.16: stanza con gli amici, qualche mossa, chat, computer, "Sono io" → tutto come prima;
  - simulatore delle regole in console ("Rules Playground"): lettura di `/profiles/x` senza login → **negata**;
    scrittura su `/games/PROVA` senza login → **permessa** (come oggi).
- **Ripristino:** incollare il file di backup della fase 0 → Pubblica → ripetere la verifica.
  I percorsi nuovi eventualmente scritti (`profiles/`, `credited/`, `seatKeys/`, `seatClaims/`) restano nel
  database ma con le regole di oggi nessuno li legge né li scrive: non danno fastidio e non serve cancellarli.

## Fase 3 — Gioco v6.22 sul sito

- **Cosa:** unire le pull request **in ordine** (1 → 6). GitHub Pages pubblica in qualche minuto.
- **Verifica:**
  - in home compare **v6.22**;
  - stanza con gli amici: ⚙️ Impostazioni mostra il 🔑 codice; dal secondo telefono "Sono io" chiede il codice;
    con quello giusto si rientra, con uno sbagliato no;
  - una partita coi computer fino alla fine (o fino alla prima vittoria): compare una voce nuova in classifica;
  - nuovo export JSON + `analizza-classifica.js`: le voci VECCHIE hanno ancora gli stessi totali.
- **Ripristino:** pubblicare il branch **`claude/ripristino-v621`** (gioco della v6.16 con numero **v6.23**:
  il numero deve essere più alto di qualunque versione già pubblicata).
  NON usare "Revert" verso la v6.16: i telefoni già su v6.20 vedrebbero gli altri come "vecchi" e tutti
  riceverebbero l'avviso "aggiorna" senza fine. Le regole restano quelle di transizione (la v6.23 di ripristino = v6.16 ci
  funziona: provato). I dati scritti dalla v6.20/21 (uid nei posti, `gameId`, voci nuove) non danno problemi
  alla v6.16/v6.23 (provato: la v6.16 legge la classifica mista e gioca nelle stanze con gli uid).

## Fase 4 — Attesa che tutti aggiornino

- La v6.16 vede l'avviso "aggiorna" appena entra in una stanza con una v6.20.
- **Verifica:** console → Dati → `presence/`: i valori sono le versioni dei telefoni collegati; nessuno deve
  avere `v6.16` (né `true`, scritto da versioni molto vecchie). Meglio chiedere anche agli amici di aprire l'app.

## Fase 5 — Regole definitive

- **Cosa:** incollare `regole/proposte.json` → Pubblica.
- **Verifica:**
  - 2 telefoni v6.20: Gioca subito coi computer, stanza con gli amici, "Sono io" col codice, classifica;
  - simulatore: scrittura su `/games/PROVA/turnColor` **senza login → negata**; con login (simulatore
    "autenticato", uid qualsiasi) su `/leaderboard/<uid diverso>` → **negata**.
- **Ripristino:** incollare `regole/transizione.json` (NON il backup di oggi: alla v6.20 servono i percorsi nuovi)
  → Pubblica. Con la transizione funzionano sia la v6.20 sia un'eventuale v6.16 rimasta indietro.

## Cosa non si può annullare

Niente viene cancellato in nessuna fase. Le uniche scritture "irreversibili" sono i dati nuovi creati giocando
(profili, voci nuove, segni delle partite): restano, ma non toccano i dati vecchi.


Passi manuali dettagliati delle Fasi 1 e 2: vedi `FASI-1-2.md`. Proposte sui dati (Yaymaris, AUTO-1): `PROPOSTE-DATI.md`.
