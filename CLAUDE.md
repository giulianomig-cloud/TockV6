# Tock V6 — istruzioni per Claude

> Questo è il repository **TockV6** (versione per gli store, con "Gioca subito" e senza tornei).
> È nato come copia di TockV5 alla v5.82 + v6.00. **TockV5 è un progetto separato** che continua per conto suo:
> le modifiche fatte qui NON vanno portate in TockV5 e viceversa, salvo richiesta esplicita dell'utente.
> Dalla v6.01 la V6 ha un database Firebase TUTTO SUO (progetto `tock-v6`, Realtime Database in europe-west1):
> classifica e rubrica dei nomi separate dalla V5. Le regole del database sono in `database.rules.json`
> (vanno incollate a mano in console Firebase → Realtime Database → Regole → Pubblica).
> Analytics NON è usato (niente measurementId nel codice: la pagina Privacy dice che non tracciamo).

## Lingua
- Rispondi sempre in **italiano**, con spiegazioni semplici: l'utente non è un programmatore.
- Spiega i passaggi GitHub (branch, pull request, merge) in parole semplici quando servono.

## Il progetto
- Tock: gioco da tavolo multigiocatore come web app (PWA) installabile sul telefono.
- Tutto il gioco è in un solo file: `index.html` (HTML + CSS + JavaScript).
- Multigiocatore online tramite Firebase Realtime Database (script caricati da gstatic in `index.html`).
- Grafiche disponibili (skin, `html[data-skin=...]`): `wood`, `bright`, `night`, `arcade`.
- Altri file: `sw.js` (service worker / cache offline), `manifest.json` (icone e nome app),
  icone `icon-v6-*.png`, loghi `logo.png` e `logo-dark.png`, caratteri in `fonts/` (Plus Jakarta Sans
  500-800 + Permanent Marker, con licenze), suoni registrati in `sounds/` (es. `burn.mp3`). I font mancavano fino alla v5.78: senza di loro `sw.js` non salvava
  NIENTE per l'offline (cache.addAll fallisce se manca anche un solo file). Ogni file elencato in APP_SHELL deve esistere.

## Versione
- Versione attuale: **v6.03** (la v6 è la versione per gli store: Google Play e poi App Store).
- La numerazione è **ripartita** a un certo punto: le etichette più alte nei commenti
  (es. "v5.175" sulla skin Arcade retro) sono della vecchia numerazione e vanno ignorate.
- A **ogni** aggiornamento pubblicato, aumenta la versione in entrambi i file, sempre allineati:
  - `APP_VERSION` in `index.html` (es. `"v5.30"`) — è il numero mostrato nella lobby;
  - `CACHE_VERSION` in `sw.js` (es. `"v5-30"`) — serve a scartare le cache vecchie sui telefoni.

## Regole da ricordare
- Tutte le pedine (proprie, del compagno, avversarie) si mangiano con le stesse regole:
  con una carta normale arrivandoci sopra (senza scavalcare nessuno), col 7 anche a metà strada.
  Se si mangia una pedina del proprio colore l'app chiede conferma.
- Le pedine protette (appena entrate sulla propria base) non si mangiano né si scavalcano.
- Foglio del 7 (v5.66): mostra SOLO le pedine che possono ricevere almeno un passo in una distribuzione
  valida (`sevenMovableOwnPawns`), anche quando i passi avanzati possono andare al compagno; le righe del
  compagno solo per le sue pedine che possono ricevere i passi avanzati (`sevenMovablePartnerPawns`).

## Tornei
- TOLTI nella v6 (richiesto dall'utente per semplificare): niente più schermate, link `?torneo=`, linguetta
  "Tornei" in classifica, tavoli di soli bot. Su Firebase restano i vecchi dati `tournaments/`, `tournamentWins/`
  e l'indice `codes/` (ancora scritto con "room" quando si entra in una stanza). Non riproporre i tornei.

## Gioca subito (accoppiamento automatico, v6)
- In home il pulsante principale è "🎲 Gioca subito" (`startMatchmaking`); sotto "👥 Con gli amici" con le
  caselle del codice (stanze private come prima). Se manca il nome si chiede prima (`renderMatchNameScreen`).
- Usa stanze pubbliche con codici fissi `AUTO-1`, `AUTO-2`, … (`MM_PREFIX`, `isMatchRoom`) in modalità
  "estrazione" (`roomMode: "draw"`): NESSUN percorso nuovo su Firebase.
- Ricerca (`mmFindRoom`, a gruppi di 6 fino a 60): prima la stanza con più persone in attesa, poi la prima vuota,
  mai usata o ABBANDONATA (`mmIsAbandoned`: partita iniziata, nessuno in `presence/` e finita o ferma da 10 minuti),
  che viene riusata da zero.
- Chi aspetta e chiude l'app viene tolto dal server (`onDisconnect` su `draft/players/<token>`); se la
  connessione torna si risiede da solo (`mmRejoin`). Nomi uguali diventano "Marco 2".
- Al 4° giocatore `mmAutoTeams` decide coppie e colori a caso e distribuisce NELLA STESSA transazione: niente
  schermate di estrazione, si va dritti al tabellone. "🤖 Normale / Difficile" completa i posti liberi col computer.
- Schermata d'attesa `renderMatchWaiting` (radar col 🎲, 4 posti, tempo, "Annulla"). In home "▶︎ Torna alla partita
  in corso" (`fillResumeMatch`, chiave `tock-last-match`). Scorciatoia dell'icona: `index.html?gioca=1`.
- Nelle stanze `AUTO-` la chat ha SOLO frasi pronte (`QUICK_CHAT_PHRASES`), niente testo libero: è la condizione
  degli store per le chat fra sconosciuti. Con gli amici la chat resta libera.

## Store (v6)
- Cartella `store/`: `GUIDA-PUBBLICAZIONE.md` (passi per Google Play con PWABuilder e per l'App Store),
  `scheda-store.md` (testi, risposte ai questionari), `banner-1024x500.png` (rigenerabile da `banner.html`),
  `screenshots/` (1080x1920).
- `privacy.html` (linkata in fondo alla home): email di contatto miroga.dream@gmail.com (scelta dall'utente). È in APP_SHELL di `sw.js`.
- Per togliere la barra del browser nell'app Android serve `/.well-known/assetlinks.json` alla RADICE del dominio
  (con GitHub Pages su `utente.github.io/TockV5` va in un repository `utente.github.io` + `.nojekyll`).
- Sito della V6: https://giulianomig-cloud.github.io/TockV6/ (GitHub Pages da main).
- Ancora da sapere dall'utente: impronte SHA-256 della chiave di firma (dopo PWABuilder / Play Console).

## Controlli automatici
- In `tests/` ci sono i controlli delle regole del gioco (mazzo, scambio, movimenti, casa,
  Jack, 7, turni, vittoria). Leggono il motore direttamente da `index.html`.
- Si lanciano con `node --test tests/*.test.js` (girano anche su GitHub a ogni aggiornamento).
- Lanciali prima di ogni push; se cambi una regola apposta, aggiorna anche il controllo.

## Scelta del colore nella stanza
- Toccando un colore si scrive una prenotazione in `games/<stanza>/pending/<colore>` (`token`, `ts`)
  con una transazione: vince il primo, l'altro telefono perde la scelta e vede "In scelta…".
  Gli orari usano l'ora del server (`serverNow`), la prenotazione dura 45 s e si rinnova
  da sola mentre si resta sulla schermata. Anche "Entra nella stanza" la rispetta.

## Bot e versioni in stanza
- Jack dei bot (v5.67): un Jack che manda INDIETRO una pedina del compagno costa nel punteggio del bot
  (`botJackPartnerDamage`: 2 per passo perso + 25 se era in vista di casa), tranne quando lo scambio la
  salva da una minaccia. Prima i bot a volte rispedivano indietro il compagno per colpire un avversario.
- Dalla v5.30 ogni telefono scrive la propria `APP_VERSION` nella presenza
  (`presence/<stanza>/<colore>/<connessione>`). Chi ha una versione più vecchia di un altro
  giocatore vede un avviso non chiudibile e non fa muovere i bot.

## Come lavorare
- **Non fare modifiche che l'utente non ha chiesto.** Per le proposte (soprattutto grafiche)
  prepara prima delle anteprime "prima/dopo" (screenshot) e aspetta il suo ok.
- Scelte grafiche già decise: le carte in mano restano come sono; i numeri accanto alle
  pedine solo nello stile Arcade; Rilievo 3D senza tabellone in prospettiva (deciso);
  verso di marcia = righe con freccia nella cornice del tabellone, che non toccano caselle né bordi
  (le freccette sulle basi sono state scartate);
  icone dell'interfaccia: restano le EMOJI. Provate e scartate sia le icone a linea oro sia
  quelle nei quadratini colorati (v5.36, tolte nella v5.37): non riproporle.
  Emoji scelte: tutte "oggetti colorati", niente simboli piatti e niente doppioni (Impostazioni:
  ☀️ 🌙 🧊 · 🃏 Classico, 🪵 Legno, 🎰 Notte, 💎 Luminoso, 🕹️ Arcade · 🔊 📳 · 📜 🎓 · 📤 · 👀 🏷️).
- Animazioni (v5.41): la pedina cammina con un saltello morbido fra le caselle (se non piace
  si torna allo scatto di prima); la pedina mangiata atterra senza schiacciarsi (le pedine restano
  sempre tonde); a fine partita le pedine vincenti saltano "a onda" e poi arriva il banner.
  Scartato: ridurre le pulsazioni quando tocca a te (restano come sono). Scartati anche gli effetti
  3D tipo video (pedine di vetro, logo lucido con Three.js): non riproporli.
- Estrazione del mazziere (v5.42-43): mazzetto coperto al centro grande come le carte (64x90), ogni carta vola e si gira, suono a
  ogni carta e "ding" all'Asso, scritta finale con il nome. Scartati: accelerare/rallentare il ritmo,
  bordo che gira a chi tocca pescare, effetto speciale sull'Asso.
  Dalla v5.44 la carta arriva già scoperta (niente giro: quello "piatto" non piaceva, scartati anche
  il giro 3D e "coperta poi si gira"); suono della carta (`cardFlick`) = "scivola e si appoggia".
- Classifica generale (v5.45): tre linguette (Vittorie · Media · Tornei), ogni elenco in un unico
  riquadro con righe divise da una linea, barretta sotto il nome nella Media. Nella Media entra in
  classifica solo chi ha almeno 5 partite (`LB_MIN_PARTITE_MEDIA`); gli altri sotto, in grigio.
- Home (v5.46, scelta "A · Tessere" fra 3 proposte, con i tornei in elenco come la "B"): codice +
  "Gioca ›" sulla stessa riga, suggerimento "Es. TORVA1…" sotto, tessere Classifica / Impara a
  giocare, "Organizza un torneo", tornei in un unico riquadro a righe (concluso in fondo, sbiadito),
  tastini in basso con il nome sotto. Il logo scende se il telefono non riserva spazio all'ora
  (sotto l'ora l'iPhone lo sfocava). Scartate: "B · Elenco" e "C · Copertina".
- Schermata della stanza (v5.47, scelta "C · Squadre" fra 3 proposte): due riquadri, uno per squadra
  ("Squadra 1 · Rosso + Giallo" VS "Squadra 2 · Verde + Blu"), una riga per colore con pallino, nome
  e a destra "Siediti" + 🤖 (il 🤖 apre nella riga la scelta Normale / Difficile / ✕) oppure "Libera"
  per il computer. Qui NON esiste `#picker-wrap`: niente openPicker in questa schermata.
  Scartate: "A · Compatta" (riquadri 2x2) e "B · Tavolo" (posti intorno a un tavolino).
- Pagina del torneo (v5.48): etichette di stato in alto (formato, stato, 👑 Organizzatore), azione
  principale, tavoli/spareggio/classifica in riquadri a righe ("Come si contano i punti" a scomparsa),
  iscritti in un unico elenco (tondino 🤖 o iniziale colorata, ✕ uguale per tutti, pallini 8 posti),
  "Aggiungi bot" solo con posti liberi; in fondo "Gestione": Condividi, Passa l'organizzazione,
  Elimina torneo (scritta rossa, non più pulsante grande in alto).
- Rientro in una partita già in corso (v5.49): elenco di chi è seduto nella stanza, si tocca
  "Sono io ›" sul proprio nome (niente più nome da riscrivere). Il rientro tiene tutti i campi del
  posto, `playerId` compreso (prima si perdeva e le partite dopo il rientro non contavano in classifica).
  Dalla v5.64 la schermata di rientro compare solo se è seduta almeno una PERSONA (o la partita è già
  cominciata): con soli computer in stanza si va dritti alla scelta del colore. Nota: si risulta seduti
  solo dopo "Entra nella stanza" ("Siediti" prenota e basta).
- "Impara a giocare" (v5.50): barra "Il tuo percorso · X di 9 lezioni", lezioni numerate in un unico
  riquadro a righe, ✓ verde sulle fatte e "Inizia ›" sulla prima ancora da fare.
- Schermate secondarie (v5.51, l'utente ha lasciato decidere a Claude): scelta modalità della stanza,
  estrazione a sorte (nome), Organizza torneo, Iscriviti al torneo usano `smallScreenHeader` (logo
  piccolo + etichetta STANZA/TORNEO) al posto della scritta "Tock"; logo delle testate ridotto a 104px.
  Iscriviti al torneo mostra chi è già iscritto. L'attesa dei giocatori sotto il tabellone usa lo stile
  "Squadre" della stanza (righe per colore, 🤖 Normale/Difficile sui posti liberi).
- Stile "Bento" (v5.53, scelto fra 3 impaginazioni: Bento / Editoriale / Vetro): home con riquadro
  grande a sfumatura nei 4 colori ("Pronto per una partita?" + codice + "Gioca"), riquadri di misure
  diverse (podio classifica top 3, anello lezioni X/9, "+ Organizza un torneo"), tornei come schede
  che scorrono di lato, tastini 🔊 🌙 🧊 in alto a destra. Tutte le pagine prima della partita: fondo
  `--bx-bg`, riquadri bianchi senza bordo con ombra morbida, pulsanti principali neri (crema nel tema
  scuro). Dalla v5.54 i pulsanti principali e "+ Organizza un torneo" sono ORO (`--bx-btn-bg`, sfumatura
  dorata con scritta scura) al posto del nero; scartati 4 colori, verde tavolo, terracotta. Token `--bx-*` in `:root` e `:root[data-theme="dark"]`. Scartati "Editoriale" e "Vetro" e i
  soli cambi di colore (Blu notte, Bianco e blu, Terracotta).
- Schermata di gioco in stile Bento (v5.55, solo stile Classico): fondo `--bx-bg`, pulsanti in alto,
  riquadri giocatori, chat e "Sollecita" bianchi senza bordo con ombra; riga "Tocca a te" e pulsante
  chat ORO; tabellone con angoli più tondi e ombra morbida. Carte e tabellone invariati; Legno, Notte,
  Luminoso e Arcade non cambiano.
- Schermata di gioco "come la home" (v5.73, scelta "B · Tessere" fra A riquadro a sfumatura / B tessere;
  dalla v5.74 tutti gli stili tranne Arcade): stanza e squadra in due tessere bianche con etichetta "🚪 STANZA" / "🤝 SQUADRA"
  (resta lo stemma tondo diviso nei due colori), giocatori + tabellone in un unico riquadro bianco (`.gx-card`,
  negli altri stili `display: contents`), "💬 CHAT" come etichetta sopra l'anteprima della chat, angoli più tondi.
  La barra in alto (⚙️ ≡ ‹ › 🏠) resta com'era (scartato metterci pillola/🔊/🧊).
  Dalla v5.74 la stessa disposizione anche in Legno, Notte e Luminoso (NON in Arcade): tessere e riquadro con
  i colori di ogni stile (legno scuro bordo oro / vetro scuro bordo oro / bianco semitrasparente).
  Dalla v5.75 il bordo scuro interno del tabellone ha gli spigoli DRITTI in tutti gli stili, come nel Classico
  (prima Legno/Notte/Luminoso li avevano arrotondati e tagliavano l'angolo delle basi).
- Stile Legno (v5.76, scelta "B · Noce scuro intarsiato" + panno verde della "C · Tavolo da gioco"; scartate
  "A · Noce lucido" e il tavolo con tabellone chiaro): sfondo di panno verde, riquadri e cornice in noce con
  venature (`--wood-grain`, `--felt` = piccole immagini SVG) e filetti dorati, tabellone di noce scuro con caselle
  avorio e linee dorate (`BOARD_PALETTES.walnut`, usata sempre con data-skin="wood", anche col tema scuro).
- Estrazione del mazziere in stile Bento (v5.56, solo stile Classico): un riquadro bianco per giocatore
  (solo nome col pallino), mazzetto al centro; animazione "A · Lancio": la carta si stacca dal mazzetto,
  fa una curva girando e si posa un po' storta sul mucchietto (restano le ultime 4); chi vince ha bordo
  oro + etichetta "👑 Mazziere", gli altri riquadri si attenuano. Scartate: "B · Ventaglio" e
  "C · Sollevata". Negli altri stili l'estrazione resta com'era.
  Dalla v5.81 (scelta "B · mazzo piccolo e leggero", scartata "A · senza mazzo"): mazzetto piccolo crema con bordo oro
  (40x56), la carta scivola dritta senza giravolte; suono `dealerCard` = fruscio morbido (in tutti gli stili, al posto
  di `cardFlick` che resta per le carte in partita); il posto della carta (`.dealer-pile`) è riservato da subito, così
  i riquadri non si allargano alla prima carta.
- Animazioni "Glassy OTP" (v5.57, da un video TikTok dell'utente): in home il codice stanza si scrive in
  caselle (una per lettera, input vero invisibile sopra; casella attiva oro che "respira", lettera con
  saltello). Dopo "Gioca": rotellina "Cerco la stanza…", le caselle si mettono in cerchio, girano e si
  fondono in una (mentre si cerca su Firebase), poi l'esito: verde con cerchi e ✓ "Stanza trovata!" /
  "Torneo trovato!" / "Stanza nuova!" (dalla v5.58 la stanza nuova ha la STESSA animazione verde,
  non più oro con il +), rosso che trema "Nessuna connessione".
  Le caselle hanno sopra un input invisibile: dalla v5.73 con `autocorrect="off"` e `text-indent` fuori schermo
  (su iPhone scrivendo compariva un riquadro grigio a sinistra).
  Pulsanti "con esito" (`fbBusy` / `fbOk` / `fbFail`): rotellina → verde ✓ / rosso che trema e poi torna
  com'era. Usati su: Siediti (aspetta la prenotazione del colore: "Già preso" se un altro telefono è
  arrivato prima), Iscriviti, Crea torneo, Sono io, Diventa/Passa organizzatore, Condividi l'invito.
  Il cerchio verde con ✓ solo per i momenti importanti: codice in home, "Crea torneo" (dalla v5.58 il
  codice del torneo si scrive a caselle con la stessa animazione, "🏆 Torneo creato!"; se il codice è già
  usato le caselle tornano com'erano) e "Iscriviti" al torneo (solo cerchi e ✓, "Sei iscritto!").
  Suoni (v5.59, ricreati da un secondo video dell'utente; ricette in `SOUND_RECIPES` + versione 8 bit):
  `cfKey` "tic" a ogni lettera, `cfWhoosh` fruscio che sale quando partono le caselle, `cfTick` 4 colpetti
  durante l'attesa, `cfSuccess` arpeggio a campanella Do-Mi-Sol-Do con i cerchi verdi, `fbOk` due note
  quando un pulsante diventa verde (anche "Siediti" riuscito), `fbFail` due note che scendono sul rosso.
- Reazioni in partita (v5.60): oltre all'emoji grande con il nome, ne salgono altre 7 più piccole che
  ondeggiano e svaniscono ("come i cuori nelle dirette", `reactionBurst`). Non per il 👋 della Sveglia.
- Passaggi tra schermate (v5.61, scelta "A · Elemento che vola" fra A / B scorrimento laterale / C
  dissolvenza): View Transitions del browser (`vtGo(fromEl, toSel, render)`): la casella verde del codice
  vola fino all'etichetta "STANZA …" della schermata dopo; la scheda di un torneo in home si allarga nella
  pagina del torneo; il podio della home diventa la classifica (e torna indietro con "Torna alla home").
  Il resto sfuma. Dove il browser non lo supporta (o "riduci movimento") si cambia schermata come prima.
  Dalla v5.62 su tutti i passaggi prima della partita: l'etichetta STANZA/TORNEO e il logo "volano" fra le
  due schermate (`VT_AUTO`); "+ Organizza un torneo" si allarga nella pagina (Annulla la richiude);
  "Impara" diventa la barra del percorso (✕ la richiude); "Cambia stanza"/"Torna alla home" riportano
  l'etichetta dentro le caselle del codice (`vtHome`); entrata al tavolo con l'etichetta che va in alto.
  ATTENZIONE: con `vtGo` la schermata nuova si disegna un attimo dopo: tutto ciò che va fatto dopo il
  disegno (es. `watchRoom` dopo `renderGameShell`) va messo DENTRO la funzione passata a `vtGo`.
- Interruttore del tema a pillola (v5.68, da un video dell'utente): in home in alto a destra, al posto
  del tastino 🌙 (nelle Impostazioni resta com'era). Dalla v5.70 c'è l'OMINO del video (non più la pedina,
  `stickman` / `STICK_POSES` con pose stand/walkA/walkB/jump): verso lo scuro esce dal ☀️, cammina, si apre un
  buco nero, salta e ci cade dentro (suono `captureBonk`), la pillola diventa blu notte con 🌙; al contrario
  il buco è BIANCO e luminoso (v5.69), l'omino (chiaro) salta fuori (`pawnOut`) e torna camminando al pomello.
  Dalla v5.71 l'omino è più piccolo e parte
  ACCANTO al pomello (lo tocca, non ci va sopra); pillola larga 92px. `themePill` / `animateThemePill`. Gli altri tastini in home (🔊 🧊) dalla v5.70 sono ROTONDI nello stesso
  stile (fondo bianco, pomello crema al centro; blu notte nel tema scuro).
  Animati dalla v5.72: 🔊 ("Prova il suono", NON spegne l'audio) a ogni nota batte, onda dorata e nota ♪ ♫ ♪
  che vola (`soundTestButton` / `soundBtnFx`); 🧊 spento = tastino schiacciato e cubetto grigio, acceso = capriola
  del cubetto e tastino in rilievo (`animateFx3dBtn`, classi `ic-on` / `ic-off`), suoni `pawnOut` / `captureBonk`.
- Impostazioni in partita (v5.77, stile home a tessere): titolo grande + ✕ in tastino rotondo; tessere "Tema"
  (stessa pillola con l'omino della home) e "Rilievo 3D" (stesso 🧊 animato); "Stile grafico" = 5 tessere coi
  colori di ogni stile (oro + ✓ su quella scelta); Suoni a righe in una tessera; Regolamento / Impara / Condividi
  come 3 tessere; Sviluppo a righe. Classi `sx-*`; in Arcade tessere scure. Tolte le righe Modalità chiara/scura.
- Menu/foglietti in partita (v5.78): `openPickerFrom`, `closePickerAnimated` e il banner della vittoria usano
  `vtGo(..., { noAuto: true })`, così la tessera STANZA non vola da sola e non resta un attimo sopra il menu.
- Uscita dalla partita (v5.79): il tasto 🏠 apre un foglio dell'app "🏠 Tornare alla home?" con "Resta" (bianco) /
  "Esci" (oro) al posto della domanda grigia del telefono (`leaveGameToHome`).
- Codici stanza lunghi in partita (v5.79): la scritta nella tessera STANZA rimpicciolisce (`roomCodeFit`).
- Col Rilievo 3D acceso il 🔊 in home non ha più il bordo spesso sotto (v5.79); il 🧊 resta in rilievo quando è acceso.
- DA FARE PIÙ AVANTI (chiesto dall'utente): compattare la partita sui telefoni bassi (iPhone SE: carte che escono
  dallo schermo, "Dai una carta a Mar…" tagliato).
- Tasto 🏠 in partita (v5.77): dopo la conferma la tessera STANZA vola dentro le caselle del codice in home (`vtGo`).
- Suono della carta bruciata (v5.80): file `sounds/burn.mp3` mandato dall'utente (`SOUND_SAMPLES` + `playSample`,
  si carica allo sblocco dell'audio; se non è pronto suona la vecchia ricetta sintetica). Vale in tutti gli stili.
- Carta bruciata (v5.82, "via di mezzo fra A · Brace e B · Cenere"; scartate le emoji 🔥 grandi, B da sola, C fiammella):
  in mano la carta si consuma dal basso con una riga di brace che sale e si alza ingiallendo (`card-burning`, `--burn`,
  0,65 s; anche nel tutorial); al centro bordo appena incandescente che respira, fondo bruciacchiato, 8 faville ben
  visibili ("qualche favilla falla intendere") e un filo di fumo.
- Notte da casinò: proposte A velluto bordeaux / B art déco nero e oro / C luci di Las Vegas SCARTATE (resta com'è).
- Icona dell'app (v6.03, immagine mandata dall'utente): 4 tappi lucidi (rosso 1 pallino, verde 2, blu 3, giallo 4)
  in un riquadro blu notte col BORDINO BLU LUMINOSO, SENZA il fondo marrone dell'immagine originale (richiesto
  dall'utente; scartate: versione senza bordino a tutto campo, versione col marrone). `icon-v6-192/512.png` = riquadro
  col bagliore su fondo TRASPARENTE; `icon-v6-180.png` (iPhone, che non accetta trasparenza) e
  `icon-v6-512-maskable.png` (Android tondo, riquadro al 78%) su blu quasi nero #060B1F. Proposte scartate in passato: logo su
  crema, pedine sul tabellone di legno, carta + pedine, pedine su crema. Non riproporle.
- Animazioni dei menu portate nel GIOCO (v5.65, scelti i gruppi 1 e 2 dai video di prova):
  1) Elemento che vola: ⚙️ Impostazioni, ≡ Registro, 💬 chat (anteprima o pulsante) e "📜 Regolamento" si
  aprono uscendo dal pulsante toccato (`openPickerFrom`) e ci rientrano con ✕ / Chiudi / tocco fuori
  (`closePickerAnimated`; il trascinamento in giù chiude come prima); il banner della vittoria nasce dalla
  riga di un giocatore della squadra vincente. 2) Pulsanti con esito: "Sveglia" → "✓ Sveglia inviata a …"
  (niente più avviso scritto), scambio carta → riga "Mando la carta…" poi verde "✓ Carta data a …",
  carta senza mosse → trema rossa prima della domanda "la bruci?", "Rivincita" → "Preparo la rivincita…".
  IDEE ANCORA IN ATTESA (gruppi 3-4-5 dei video): cerchi verdi + ✓ su pedina in casa (oggi già scintille +
  anello oro) e su carta ricevuta dal compagno; a fine mano carte che volano al centro nel mazzetto prima
  della nuova distribuzione; suoni tic (scelta carta), fruscio (carta al centro), campanella sui cerchi.
- Le modifiche vanno su un branch e arrivano su `main` tramite pull request,
  che l'utente unisce da GitHub (anche dall'app sul telefono).
- Alcuni giocatori usano l'app con il **traduttore di Chrome** (es. in spagnolo): avvolge i testi
  in `<font>` e traduce anche lettere e codici (v5.63: le caselle del codice mostravano "B EL A norte do O"
  per BLANCO). Codici di stanza/torneo e caselle hanno `translate="no"` + classe `notranslate`: farlo
  anche per ogni nuovo testo che non va tradotto (codici, sigle).
  Regole CSS tipo `.qualcosa * { color: ... }` colpiscono anche quei `<font>`:
  se un elemento interno ha un colore diverso, dagli la regola anche per i suoi figli (`.x, .x *`).
- Prima di eliminare un file, controlla che non sia usato in `index.html`, `sw.js` o `manifest.json`.
- Le conversazioni non si salvano tra una sessione e l'altra: le informazioni importanti
  da ricordare vanno scritte in questo file.
