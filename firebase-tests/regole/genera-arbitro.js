// Costruisce le regole della Fase 5 a partire da proposte.json (Fase 5A, solo regole):
//   proposte.json  + percorsi in sola lettura dell'arbitro (config/, arbitro/<stanza>/pub, mani/<uid>)
//   arbitro.json   = Fase 5B (con il server): stanze SOLO con arbitro, partita/classifica scritte SOLO dal server.
//   node regole/genera-arbitro.js          → riscrive i due file
//   node regole/genera-arbitro.js --check  → errore se non corrispondono (usato dai controlli)
const fs = require("node:fs");
const path = require("node:path");

const DIR = __dirname;
const leggi = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
const scrivi = (o) => JSON.stringify(o, null, 2) + "\n";

// Percorsi dell'arbitro che i telefoni possono LEGGERE (scrivere mai: lo fa solo il server).
const LETTURA_ARBITRO = {
  config: { ".read": true },
  arbitro: {
    $room: {
      pub: { ".read": true },
      mani: { $uid: { ".read": "auth != null && auth.uid === $uid" } },
    },
  },
};

// "(R) || (S)" → [R, S], con R e S fra parentesi bilanciate.
function dividi(expr) {
  if (expr[0] !== "(") throw new Error("forma inattesa della regola delle stanze");
  let prof = 0;
  for (let i = 0; i < expr.length; i++) {
    if (expr[i] === "(") prof++;
    else if (expr[i] === ")") prof--;
    if (prof === 0) {
      const resto = expr.slice(i + 1);
      if (!resto.startsWith(" || ")) throw new Error("forma inattesa della regola delle stanze");
      return [expr.slice(1, i), resto.slice(4)];
    }
  }
  throw new Error("parentesi non bilanciate");
}

const n = (k) => `newData.child('${k}')`;
const d = (k) => `data.child('${k}')`;
const uguale = (k) => `${n(k)}.val() === ${d(k)}.val()`;

function genera() {
  const base = leggi("proposte.json");
  const proposte = JSON.parse(JSON.stringify(base));
  Object.assign(proposte.rules, JSON.parse(JSON.stringify(LETTURA_ARBITRO)));

  const arb = JSON.parse(JSON.stringify(proposte));
  const stanza = arb.rules.games.$room;
  const [riciclo, posti] = dividi(base.rules.games.$room[".validate"]);
  const conArbitro = `${n("arbitro")}.val() === true && ${n("sessione")}.isString() && ${n("sessione")}.val().length <= 40`;
  // Creazione: stanza nuova in sala d'attesa. Dopo: fase, partita, vincitore, turno e sessione li cambia SOLO il server.
  const creaOConserva = `((!data.exists() && ${n("phase")}.val() === 'lobby' && !${n("winnerTeam")}.exists()) || (` +
    ["sessione", "arbitro", "phase", "gameId", "winnerTeam", "turnStartedAt"].map(uguale).join(" && ") + "))";
  // Riciclo delle stanze "Gioca subito" (finite o ferme da 10 minuti, nessuno collegato): nuova sessione, sala d'attesa.
  const riciclata = `${n("sessione")}.val() !== ${d("sessione")}.val() && ${n("phase")}.val() === 'lobby' && !${n("winnerTeam")}.exists()`;
  // Recupero (R7): una stanza AUTO "di prima" (senza arbitro) rimasta in sala d'attesa e SENZA nessuno seduto diventa una
  // stanza con l'arbitro, in sala d'attesa. Non vale per stanze con posti occupati, partite iniziate o stanze private.
  const recupero = `$room.beginsWith('AUTO-') && data.exists() && ${d("arbitro")}.val() !== true && ` +
    `(!${d("phase")}.exists() || ${d("phase")}.val() === 'lobby') && !${d("players")}.exists() && ` +
    `${n("phase")}.val() === 'lobby' && !${n("winnerTeam")}.exists()`;
  // Ordine: prima posti/creazione/recupero, poi il riciclo. La regola del riciclo fa un conto con turnStartedAt: in una
  // stanza che non lo ha va in errore, e un errore NEGA tutta la regola (anche le parti già vere dopo di lui).
  stanza[".validate"] = `(${conArbitro}) && (((${posti}) && (${creaOConserva} || (${recupero}))) || ((${riciclo}) && ${riciclata}))`;

  // Classifica e "partita già contata": solo il server.
  arb.rules.leaderboard = { ".read": true };
  arb.rules.credited = { $room: { $game: { $uid: { ".read": "auth != null && auth.uid === $uid" } } } };
  // Le partite finite le conta solo il server.
  arb.rules.stats.$name[".write"] = "auth != null && $name !== 'gamesFinished'";
  return { "proposte.json": scrivi(proposte), "arbitro.json": scrivi(arb) };
}

if (require.main === module) {
  const file = genera();
  let diversi = 0;
  for (const [nome, testo] of Object.entries(file)) {
    const p = path.join(DIR, nome);
    const attuale = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
    if (process.argv.includes("--check")) {
      if (attuale !== testo) { console.error(nome + " NON corrisponde: lancia `node regole/genera-arbitro.js`"); diversi++; }
    } else if (attuale !== testo) {
      fs.writeFileSync(p, testo);
      console.log("scritto regole/" + nome);
    }
  }
  if (diversi) process.exit(1);
}
module.exports = { genera, dividi };
