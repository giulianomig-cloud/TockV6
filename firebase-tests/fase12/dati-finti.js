// Dati FINTI con la stessa forma di quelli di produzione (export della Fase 0), ma nomi, id e
// token inventati. Servono a provare le Fasi 1-2 sull'emulatore senza usare i dati veri.
// Gli orari sono relativi a "adesso" (come nell'export: AUTO-1 e AUTO-3 ferme da giorni).
const GIORNO = 24 * 3600 * 1000;
const vuote = () => ({ red: [-1, -1, -1, -1], green: [-1, -1, -1, -1], yellow: [-1, -1, -1, -1], blue: [-1, -1, -1, -1] });

function datiFinti(adesso = Date.now()) {
  const PINO = "tok-pino-finto", LIA = "tok-lia-finto";
  return {
    codes: { "AUTO-1": "room" },
    games: {
      // come AUTO-1 vera: attesa bloccata, stesso telefono due volte e in tutte e due le coppie
      "AUTO-1": {
        dealerColor: "red", roomMode: "draw", phase: "lobby", firstHandOfCycle: true, hasDealtBefore: false,
        pawns: vuote(), roomStats: { wins: { A: 0, B: 0 } },
        draft: {
          botTokens: { "bot-f1": "hard", "bot-f2": "hard", "bot-f3": "hard" },
          colorPicks: { "bot-f2": "red", [PINO]: "yellow" },
          order: [PINO, PINO, "bot-f2", "bot-f3", "bot-f1"],
          pairChoice: { pick: "RY", pickIndex: 0 },
          pairDraw: { pairs: [[PINO, "bot-f2"], ["bot-f3", PINO]] },
          playerIds: { [PINO]: "-FINTOpino" },
          players: { "bot-f1": "Bea", "bot-f2": "Chicca", "bot-f3": "Lollo", [PINO]: "Pino" },
          seen: { [PINO]: adesso - 3 * GIORNO },
        },
      },
      // come AUTO-2 vera: partita in corso (v6.16), una persona collegata e tre computer
      "AUTO-2": {
        dealerColor: "yellow", roomMode: "draw", phase: "playing", turnColor: "green", turnStartedAt: adesso - 20000,
        hasDealtBefore: true, firstHandOfCycle: false, roomStats: { wins: { A: 0, B: 0 } },
        deck: ["9-hearts", "4-diamonds", "3-clubs", "4-clubs", "A-clubs", "8-clubs", "8-spades", "10-hearts", "Q-diamonds", "5-clubs", "A-hearts", "5-hearts", "7-spades", "K-spades", "4-hearts", "K-clubs"],
        hands: { blue: ["8-diamonds", "9-clubs"], green: ["7-clubs", "A-spades", "K-hearts"], red: ["6-spades", "2-hearts"], yellow: ["9-spades", "2-diamonds"] },
        pawns: { blue: [1003, 1001, -1, -1], green: [-1, 1002, 17, -1], red: [1003, 57, -1, -1], yellow: [1003, 1002, -1, 3] },
        log: ["Scambio completato, si comincia a giocare."],
        draft: {
          botTokens: { "bot-g1": "easy", "bot-g2": "easy", "bot-g3": "easy" },
          colorPicks: { "bot-g1": "red", "bot-g2": "blue", "bot-g3": "yellow", [LIA]: "green" },
          order: [LIA, "bot-g2", "bot-g3", "bot-g1"],
          pairDraw: { pairs: [["bot-g2", LIA], ["bot-g3", "bot-g1"]] },
          playerIds: { [LIA]: "-FINTOlia" },
          players: { "bot-g1": "Fede", "bot-g2": "Lollo", "bot-g3": "Aury", [LIA]: "Lia" },
          seen: { [LIA]: adesso - 60000 },
        },
        players: {
          blue: { botLevel: "easy", isBot: true, name: "Lollo", token: "bot-g2" },
          green: { name: "Lia", playerId: "-FINTOlia", token: LIA },
          red: { botLevel: "easy", isBot: true, name: "Fede", token: "bot-g1" },
          yellow: { botLevel: "easy", isBot: true, name: "Aury", token: "bot-g3" },
        },
      },
      // come AUTO-3 vera: abbandonata durante lo scambio, nessuno collegato (con il vecchio campo avatars)
      "AUTO-3": {
        dealerColor: "blue", roomMode: "draw", phase: "exchanging", turnColor: "red", turnStartedAt: adesso - 3 * GIORNO,
        hasDealtBefore: true, pawns: vuote(), hands: { red: ["8-spades"], green: ["8-clubs"], yellow: ["6-clubs"], blue: ["3-hearts"] },
        log: ["Nuova mano distribuita (mazziere: Blu). In attesa dello scambio tra compagni."],
        draft: { avatars: { [PINO]: "🐶" }, order: [PINO], players: { [PINO]: "Pino" }, playerIds: { [PINO]: "-FINTOpino" }, botTokens: {}, colorPicks: {} },
        players: {
          yellow: { name: "Pino", playerId: "-FINTOpino", token: PINO },
          red: { isBot: true, botLevel: "hard", name: "Cami", token: "bot-h1" },
          green: { isBot: true, botLevel: "hard", name: "Leo", token: "bot-h2" },
          blue: { isBot: true, botLevel: "hard", name: "Pippo", token: "bot-h3" },
        },
      },
      // come AUTO-4 vera: finita, vittoria già accreditata col sistema vecchio
      "AUTO-4": {
        roomMode: "draw", phase: "finished", winnerTeam: "A", leaderboardClaimed: true, turnStartedAt: adesso - 2 * GIORNO,
        pawns: vuote(), log: ["La coppia Rosso + Giallo vince la partita!"],
        players: {
          blue: { name: "Pino", playerId: "-FINTOpino", token: PINO },
          red: { name: "Lia", playerId: "-FINTOlia", token: LIA },
          green: { isBot: true, botLevel: "hard", name: "Dado", token: "bot-i1" },
          yellow: { isBot: true, botLevel: "hard", name: "Sofi", token: "bot-i2" },
        },
      },
    },
    // come la classifica vera: Lia (= Yaymaris) NON è nella rubrica
    leaderboard: {
      "-FINTOlia": { nome: "Lia", partite: 3, vinte: 3, vittorie: 3 },
      "-FINTOpino": { nome: "Pino", partite: 2 },
    },
    players: { "-FINTOpino": { creatoIl: adesso - 3 * GIORNO, nome: "Pino" } },
    presence: { "AUTO-2": { green: { "-conn-finta": "v6.16" } } },
    stats: { gamesFinished: 3, matchmaking: 25 },
  };
}
module.exports = { datiFinti, TOKEN_PINO: "tok-pino-finto", TOKEN_LIA: "tok-lia-finto" };
