// Fase 5 — controllo "si può fare il passo successivo?" su dati FINTI (solo lettura, niente emulatore).
const test = require("node:test");
const assert = require("node:assert/strict");
const { analizza } = require("../fase5/controlla-pronti");

const ORA = 1_800_000_000_000;
const base = () => ({
  games: {
    AMICI1: { phase: "playing", turnStartedAt: ORA - 60000 },
    AMICI2: { phase: "finished", turnStartedAt: ORA - 60000 },
    AUTO1: { arbitro: true, sessione: "s", phase: "exchanging" },
    VECCHIA: { phase: "playing", turnStartedAt: ORA - 3 * 24 * 3600000 },
  },
  presence: { AMICI1: { red: { c1: "v6.22", c2: "v6.23" }, green: { c3: true } } },
  leaderboard: { a: {}, b: {} },
});

test("conta versioni collegate e partite di prima in corso, senza nomi", () => {
  const r = analizza(base(), ORA);
  assert.equal(r.collegati, 3);
  assert.equal(r.sottoV622, 1, "true = versione vecchia senza numero");
  assert.equal(r.sottoV623, 2);
  assert.equal(r.stanzeConArbitro, 1);
  assert.equal(r.partiteDiPrimaInCorso, 1, "finita e ferma da giorni non contano");
  assert.equal(r.pronto5A, false);
  assert.equal(r.pronto5B, false);
});

test("pronto per 5A e 5B solo quando tutti hanno aggiornato e non ci sono partite di prima in corso", () => {
  const d = base();
  d.presence = { AUTO1: { red: { c1: "v6.23" } } };
  assert.equal(analizza(d, ORA).pronto5A, true);
  assert.equal(analizza(d, ORA).pronto5B, false, "arbitro spento e una partita di prima in corso");
  d.config = { arbitro: true };
  assert.equal(analizza(d, ORA).pronto5B, false, "partita di prima ancora in corso");
  d.games.AMICI1.phase = "finished";
  assert.equal(analizza(d, ORA).pronto5B, true);
  d.presence.AUTO1.red.c2 = "v6.22";
  assert.equal(analizza(d, ORA).pronto5B, false);
});
