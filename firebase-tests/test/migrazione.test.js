// Controlla lo script di analisi della classifica su un export FINTO (nessun dato vero).
const test = require("node:test");
const assert = require("node:assert/strict");
const { analizza } = require("../migrazione/analizza-classifica");

const exportFinto = {
  players: {
    "-a1": { nome: "Anna", creatoIl: 1 },
    "-b1": { nome: "Bruno", creatoIl: 2 },
    "-b2": { nome: " bruno ", creatoIl: 3 },
  },
  leaderboard: {
    "-a1": { nome: "Anna", vittorie: 10, partite: 15, vinte: 9 },
    "-b1": { nome: "Bruno", vittorie: 2, partite: 4, vinte: 2 },
    "-x9": { nome: "Fantasma", vittorie: 1, partite: 1, vinte: 3 },
  },
};

test("migrazione: conta voci e totali", () => {
  const r = analizza(exportFinto);
  assert.equal(r.numeroVoci, 3);
  assert.equal(r.numeroRubrica, 3);
  assert.deepEqual(r.totali, { vittorie: 13, partite: 20, vinte: 14 });
});

test("migrazione: trova nomi doppi, voci senza rubrica e numeri impossibili", () => {
  const r = analizza(exportFinto);
  assert.deepEqual(r.nomiDoppi, [{ nome: "bruno", ids: ["-b1", "-b2"] }]);
  assert.deepEqual(r.senzaRubrica, ["-x9"]);
  assert.deepEqual(r.anomalie, ["-x9"]);
});

test("migrazione: export vuoto non si rompe", () => {
  const r = analizza({});
  assert.equal(r.numeroVoci, 0);
  assert.deepEqual(r.totali, { vittorie: 0, partite: 0, vinte: 0 });
});
