# Proposte sui dati reali (dalla Fase 0) — NESSUNA modifica fatta

## 1. Yaymaris: in classifica ma non nella rubrica

**Fatti (export della Fase 0):**
- `leaderboard/-P2YuxqdWtNfrvDXn-2b` = Yaymaris, partite 3, vinte 3, vittorie 3;
- quell'id NON c'è in `players/` (la rubrica ha solo Giuliano);
- lo stesso id è nei posti di AUTO-2 e AUTO-4 e in `draft.playerIds`: è l'id che il telefono di Yaymaris usa.

**Causa probabile (DA CONFERMARE):** TockV5 (`…github.io/TockV5`) e TockV6 (`…github.io/TockV6`) sono sullo
STESSO sito, quindi il browser dà loro la stessa memoria (`localStorage`). La V6 legge `tock-player` = {id, nome}
salvato dalla V5 e lo riusa senza crearlo nella rubrica della V6 (il progetto Firebase è diverso).
**Verifica di sola lettura (manuale):** nella console del progetto della **V5** → Realtime Database → Dati →
`players/-P2YuxqdWtNfrvDXn-2b`: se esiste con nome Yaymaris, la causa è confermata.

**Effetti oggi:** nessuno sul gioco. La classifica mostra il nome salvato nella voce (`nome: "Yaymaris"`).
Dalla v6.19 i risultati nuovi vanno sull'uid del login: l'id della V5 non riceve più accrediti.

**Proposta (nessun dato toccato ora):**
1. La voce resta com'è; con le regole definitive diventa di sola lettura (congelata).
2. **Migrazione controllata, più avanti e con approvazione a parte**, senza cercare per nome in rubrica:
   - Yaymaris gioca almeno una partita con la v6.21 → compare il suo `profiles/<uid>`;
   - prova che quell'uid è suo: durante una partita legge il **🔑 codice di rientro** (lo vede SOLO lei) e lo
     dice a te; Claude controlla nell'export che quel codice appartenga a quell'uid (`seatKeys/…`);
   - Claude prepara un file `legacyClaims.json` = { "-P2YuxqdWtNfrvDXn-2b": "<uid di Yaymaris>" } e lo controlla
     sull'emulatore; tu lo importi in console SOLO in `legacyClaims/`; la classifica mostrerà vecchio + nuovo
     sommati; verifica: i totali delle voci vecchie restano **3 · 5 · 3**.
   - Stesso procedimento per Giuliano (`-P4-YBOrP5xdDbKasYBk`).
3. NON consigliato: ricreare a mano la voce in `players/` (scrittura in produzione senza benefici: la rubrica
   non serve più per la classifica).
4. Per evitare altri casi: col sito su un dominio tutto suo (Cloudflare Pages, già deciso) la memoria non è più
   condivisa con la V5. In alternativa (da proporre con anteprima) le chiavi della V6 si possono rinominare.

## 2. AUTO-1 bloccata

**Fatti (export):** fase "lobby", coppie già sorteggiate, `order` con lo stesso telefono due volte,
`pairDraw` con quel telefono in TUTTE e due le coppie, solo 2 colori scelti su 4, nessun posto al tavolo
(`players` assente), ultimo segno di vita il 15/10. Nessun punteggio dentro.

**Causa (riprodotta sull'emulatore con la v6.16, `e2e-fase12.test.js`):** quando chi aspetta perde la
connessione, Firebase lo toglie da `draft.players` (onDisconnect) ma NON da `draft.order`; al rientro viene
aggiunto una seconda volta. Il sorteggio prende i primi 4 di `order` (lui due volte, un computer escluso), i colori
non arrivano mai a 4 e la stanza resta "in attesa" per sempre. Il Gioca subito della v6.16 non la usa né la ricicla.

**Proposta consigliata (A) — correzione nel gioco, v6.21 (branch `claude/auto-bloccate`, NON pubblicata):**
- l'elenco d'ordine non ha mai doppioni; il sorteggio usa sempre 4 telefoni diversi;
- alla disconnessione si toglie anche l'uid del posto in attesa;
- una stanza "in attesa" con coppie sorteggiate, **senza posti al tavolo** e **senza segni di vita da 10 minuti**
  si ricicla come una partita abbandonata.
- Effetto su AUTO-1: alla prima ricerca di Gioca subito con la v6.21 viene rimessa a nuovo. Si perde solo
  l'attesa bloccata (niente punteggi, niente partita). Nessun intervento manuale in console.
- Provato sull'emulatore: v6.21 ricicla AUTO-1, non tocca la partita in corso (AUTO-2) né la classifica; caduta +
  rientro non creano più doppioni e la partita parte con 4 posti diversi. Le regole definitive lo permettono
  (nessun posto da proteggere) e impediscono di riciclare una partita con qualcuno collegato.

**Alternative:** (B) cancellare `games/AUTO-1` a mano in console: sconsigliato (scrittura manuale in produzione,
nessun vantaggio rispetto ad A). (C) Non fare niente: AUTO-1 resta occupata, il Gioca subito usa le altre stanze.

## 3. Difetto trovato durante le prove: "La mossa non è stata salvata… Riprova" (già nella v6.16)

**Cosa succede:** quando la partita parte (passaggio dall'attesa al tabellone) il gioco stacca e riattacca
l'ascolto della stanza (`roomRef(...).off("value")` + `watchRoom`). Per un attimo Firebase non ha la stanza in
memoria: un'azione fatta proprio in quell'istante (o subito dopo l'ingresso nella stanza) parte con una stanza
"vuota", `updateState` la annulla e compare il messaggio "La mossa non è stata salvata (transazione non
completata). Riprova". Riprovando funziona. Nelle prove sull'emulatore succedeva circa 2 volte su 3 quando
l'azione era immediata; una persona di solito tocca un attimo dopo, quindi capita di rado.

**Proposta (NON fatta, da approvare):** in `updateState`, se il primo tentativo trova la stanza "vuota" ma la
stanza esiste, rileggerla e riprovare UNA volta da solo (invece di mostrare subito "Riprova"). Piccola modifica,
nessun cambio di regole o di dati; andrebbe con un controllo automatico che riproduce il caso.
Per ora le prove fanno come una persona (riprovano, `conRiprova`) e premono i pulsanti veri.
