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

test("5B: una stanza AUTO di prima in sala d'attesa blocca il passo (con 5B non si userebbe né riciclerebbe)", () => {
  const d = { config: { arbitro: true }, presence: {}, games: {
    "AUTO-1": { roomMode: "draw", phase: "lobby", draft: { players: { t: "x" } } },
    "AUTO-2": { arbitro: true, sessione: "s", phase: "lobby" },
    PRIVATA: { phase: "playing", turnStartedAt: ORA - 5 * 24 * 3600000, players: { red: { name: "a", token: "t" } } },
  } };
  const r = analizza(d, ORA);
  assert.equal(r.autoDiPrimaInAttesa, 1);
  assert.equal(r.postiSenzaUidInPartite, 1);
  assert.equal(r.pronto5B, false);
  delete d.games["AUTO-1"];
  assert.equal(analizza(d, ORA).pronto5B, true);
});
