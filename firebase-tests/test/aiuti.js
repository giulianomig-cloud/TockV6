// Ambiente di prova comune: emulatore locale, progetto finto "demo-tock".
// Un progetto che inizia con "demo-" NON può mai collegarsi a Firebase vero.
const fs = require("node:fs");
const path = require("node:path");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");

const PROJECT_ID = "demo-tock";

async function creaAmbiente(fileRegole) {
  const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
  const [h, p] = host.split(":");
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    database: { rules: fs.readFileSync(path.resolve(__dirname, fileRegole), "utf8"), host: h, port: Number(p) },
  });
}

// Una partita già in corso, con mani e mazzo, come la scrive il gioco.
function partitaDiProva() {
  return {
    phase: "playing",
    roomMode: "manual",
    turnColor: "red",
    players: {
      red: { name: "Anna", token: "tok-anna", playerId: "p-anna" },
      green: { name: "Bruno", token: "tok-bruno", playerId: "p-bruno" },
      yellow: { name: "Carla", token: "tok-carla", playerId: "p-carla" },
      blue: { name: "Dario", token: "tok-dario", playerId: "p-dario" },
    },
    hands: { red: ["7-hearts", "K-spades"], green: ["A-clubs"], yellow: ["4-hearts"], blue: ["J-diamonds"] },
    deck: ["2-clubs", "3-clubs", "5-clubs"],
    pawns: { red: [-1, -1, -1, -1], green: [-1, -1, -1, -1], yellow: [-1, -1, -1, -1], blue: [-1, -1, -1, -1] },
    chat: [{ id: 1, color: "red", text: "Ciao a tutti! 👋" }],
    log: ["Partita iniziata."],
  };
}

module.exports = { creaAmbiente, partitaDiProva, PROJECT_ID };
