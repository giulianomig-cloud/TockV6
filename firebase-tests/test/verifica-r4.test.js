// Prove dello script di verifica di R4 con risposte finte (nessuna rete).
const test = require("node:test");
const assert = require("node:assert/strict");
const { verifica, FUNZIONE } = require("../fase5/verifica-r4");

const finto = (funzione, arbitro) => async (url) => {
  if (url === FUNZIONE) return { status: funzione.status, json: async () => funzione.corpo };
  return { ok: arbitro.status === 200, status: arbitro.status, json: async () => arbitro.valore };
};
const NON_AUT = { status: 401, corpo: { error: { status: "UNAUTHENTICATED", message: "Serve il login." } } };

test("dopo R4: funzione presente e arbitro spento = OK", async () => {
  assert.equal((await verifica({ fetchFn: finto(NON_AUT, { status: 200, valore: null }) })).ok, true);
  assert.equal((await verifica({ fetchFn: finto(NON_AUT, { status: 200, valore: false }) })).ok, true);
});

test("dopo R4: funzione assente, arbitro acceso o database illeggibile = da controllare", async () => {
  assert.equal((await verifica({ fetchFn: finto({ status: 404, corpo: null }, { status: 200, valore: null }) })).ok, false);
  assert.equal((await verifica({ fetchFn: finto(NON_AUT, { status: 200, valore: true }) })).ok, false);
  assert.equal((await verifica({ fetchFn: finto(NON_AUT, { status: 401, valore: null }) })).ok, false);
});

test("prima di R4: si aspetta la funzione assente", async () => {
  assert.equal((await verifica({ prima: true, fetchFn: finto({ status: 404, corpo: null }, { status: 200, valore: null }) })).ok, true);
  assert.equal((await verifica({ prima: true, fetchFn: finto(NON_AUT, { status: 200, valore: null }) })).ok, false);
});
