# Come mettere Tock negli store — guida passo passo

Tock resta un sito (la PWA). Per gli store lo si mette dentro una "scatola", cioè un'app vera
che apre il sito a tutto schermo. Quando il sito si aggiorna (nuova versione su `main`),
si aggiorna anche l'app: non serve ripubblicarla a ogni versione.

Prima di tutto, una volta sola:

1. **Indirizzo del sito:** https://giulianomig-cloud.github.io/TockV6/
2. **Email di contatto:** miroga.dream@gmail.com (già scritta in `privacy.html`; usala anche in Play Console).
3. **Pagina Privacy** online: `https://giulianomig-cloud.github.io/TockV6/privacy.html` (c'è già, arriva con questa versione).

---

## A · Google Play (Android) — consigliato per primo

Costo: **25 $ una volta sola**. Non serve un computer particolare.

### 1. Account sviluppatore
- Vai su <https://play.google.com/console/signup> con il tuo account Google e paga i 25 $.
- Google chiede un documento d'identità (verifica, qualche giorno).
- **Account personali nuovi:** prima di poter pubblicare a tutti bisogna fare un "test chiuso"
  con **almeno 12 persone per 14 giorni** (amici e familiari con Android: basta che installino
  l'app dal link di prova e la tengano). Conviene trovare le 12 persone subito.

### 2. Creare il pacchetto dell'app con PWABuilder
- Vai su <https://www.pwabuilder.com>, scrivi l'indirizzo del sito e premi **Start**.
- Deve dare il verde a manifest e service worker (ci sono già).
- **Package for stores → Android → Generate package**. Nelle opzioni:
  - Package ID: `com.mig.tock` (o simile, poi non si può più cambiare)
  - App name: `Tock` · Launcher name: `Tock`
  - Version (codice interno): il numero del gioco tutto attaccato, es. v6.12 → `612`
  - Version name: il numero del gioco senza "v", es. `6.12` (vedi "Numeri di versione" in fondo)
  - Signing key: **"Create new"** (PWABuilder crea la chiave di firma)
- Scarichi uno ZIP. Dentro ci sono:
  - il file `.aab` da caricare su Google Play;
  - il file `signing.keystore` + le password in `signing-key-info.txt` → **salvali in un posto sicuro**
    (Google Drive privato). Senza, non si possono pubblicare aggiornamenti dell'app;
  - il file `assetlinks.json`.

### 3. Il "certificato" assetlinks.json (toglie la barra del browser)
Senza questo file l'app si apre con una barra in alto come un browser.
- Il file va messo nel sito in **`/.well-known/assetlinks.json`**, alla **radice** del dominio
  (es. `https://tock.esempio.it/.well-known/assetlinks.json`).
- Mandalo a Claude: lo mette nel repository nella posizione giusta.
- **Attenzione GitHub Pages:** se il sito è `https://giulianomig-cloud.github.io/TockV5/`, la radice è
  `giulianomig-cloud.github.io` e non `.../TockV5`. In quel caso servono due cose: un repository
  in più chiamato `giulianomig-cloud.github.io` con dentro solo `.well-known/assetlinks.json`
  e un file vuoto `.nojekyll`. Oppure un dominio tuo (es. `tockgame.it`, circa 10 €/anno), che è la
  soluzione più pulita.
- Dopo che Google Play ha preso in carico l'app, in Play Console → *Configurazione → Integrità dell'app*
  c'è una seconda impronta (SHA-256) "chiave di firma dell'app": va aggiunta anche quella in
  `assetlinks.json` (Claude lo sistema se gliela mandi).

### 4. Scheda dello store
In Play Console → *Crea app*:
- Lingua predefinita: Italiano · Nome: dal file `scheda-store.md` · Tipo: Gioco · Gratuito.
- *Scheda dello store principale*: testi da `scheda-store.md`, icona `icon-v6b-512.png`,
  immagine in evidenza `store/banner-1024x500.png` (inglese: `banner-en-1024x500.png`), screenshot da `store/google-play/it/` (inglese: `store/google-play/en/`).
- *Contenuti dell'app*: Privacy (link a `privacy.html`), Annunci = No, Accesso all'app = tutto
  accessibile senza account, Classificazione (questionario: risposte in `scheda-store.md`),
  Sicurezza dei dati (risposte in `scheda-store.md`), Pubblico di destinazione (13+ consigliato
  per via della chat).

### 5. Test chiuso → produzione
- *Test → Test chiuso → Crea release* → carica il `.aab` → aggiungi gli indirizzi email dei 12 tester.
- Dopo 14 giorni: *Richiedi accesso alla produzione*, poi *Produzione → Crea release* con lo stesso `.aab`.
- Revisione di Google: di solito da qualche ora a qualche giorno.

---

## B · App Store (iPhone) — dopo

Costo: **99 $ all'anno**. Serve un **Mac** con Xcode (oppure un servizio di compilazione online
a pagamento, es. Codemagic o Ionic Appflow).

1. Iscrizione: <https://developer.apple.com/programs/> (Apple ID con verifica in due passaggi).
2. PWABuilder → *Package for stores → iOS* → scarichi un progetto Xcode.
3. Sul Mac: apri il progetto in Xcode, scegli il tuo team, *Product → Archive → Distribute App*.
4. In App Store Connect: crea l'app, testi da `scheda-store.md`, screenshot (Apple chiede misure
   precise per iPhone 6,7": Claude può rigenerarli), privacy, invio in revisione.

**Rischio da sapere:** Apple a volte rifiuta le app che sembrano "solo un sito" (regola 4.2).
Tock ha multigiocatore, suoni, vibrazione e lezioni, quindi ha buone possibilità, ma non è garantito.
Se la rifiutano, si possono aggiungere funzioni da app vera (es. notifiche "tocca a te").

---

## Cosa è già pronto in questa versione (v6.00)

- `privacy.html` — pagina Privacy (italiano + riassunto in inglese).
- `manifest.json` — completato per PWABuilder (id, lingua, categoria, scorciatoia "Gioca subito").
- `store/scheda-store.md` — tutti i testi della scheda.
- `store/banner-1024x500.png`, `store/google-play/` e `store/apple/` — immagini per le schede (italiano e inglese)
  (`store/banner.html` serve solo a rigenerare il banner).
- Chat "a frasi pronte" nelle partite con sconosciuti: è quello che chiedono gli store per le chat fra estranei.

---

## Numeri di versione

| Cosa | Dove si vede | Esempio |
|---|---|---|
| Versione del gioco | in fondo alla home | v6.12 |
| Versione store (Google "Version name", Apple "Version") | scheda dello store | 6.12 |
| Codice interno (Google "Version code", Apple "Build") | solo nelle console | 612 |

- La versione store è sempre il numero del gioco nel momento in cui si pubblica.
- Il codice interno deve sempre salire (Tock Plus: v7.00 → 7.00 → 700).
- Si ripubblica negli store solo se cambia la "scatola" (icona, nome, permessi): il gioco si aggiorna da solo dal sito.
