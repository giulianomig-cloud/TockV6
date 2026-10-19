// Il controllo dei workflow riconosce davvero i casi pericolosi? (node --test .github/scripts/)
const test = require("node:test");
const assert = require("node:assert/strict");
const { controlla } = require("./controlla-workflow");

const BASE = `name: X
on:
  pull_request:
permissions:
  contents: read
jobs:
  a:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - run: echo ok
`;
const PROD = `name: Rilascio
on:
  workflow_dispatch:
permissions:
  contents: read
jobs:
  prod:
    if: vars.PRODUZIONE_ATTIVA == 'si'
    environment: production
    runs-on: ubuntu-latest
    steps:
      - env:
          CHIAVE: \${{ secrets.CHIAVE }}
        run: echo fatto
`;
const trova = (errori, testo) => assert.ok(errori.some((e) => e.includes(testo)), `atteso "${testo}" in: ${errori.join(" | ")}`);

test("un workflow di prova corretto passa", () => assert.deepEqual(controlla("controlli.yml", BASE), []));
test("un workflow di produzione corretto passa", () => assert.deepEqual(controlla("rilascio.yml", PROD), []));
test("pull_request_target è vietato", () => trova(controlla("x.yml", BASE.replace("pull_request:", "pull_request_target:")), "pull_request_target"));
test("workflow_run è vietato", () => trova(controlla("x.yml", BASE.replace("pull_request:", "workflow_run:")), "workflow_run"));
test("senza permissions non passa", () => trova(controlla("x.yml", BASE.replace("permissions:\n  contents: read\n", "")), "permissions"));
test("write-all non passa", () => trova(controlla("x.yml", BASE.replace("contents: read", "write-all")), "indiscriminati"));
test("permessi di scrittura in un workflow di prova non passano", () => trova(controlla("x.yml", BASE.replace("contents: read", "contents: write")), "scrittura"));
test("segreti in un workflow di prova non passano", () => trova(controlla("x.yml", BASE.replace("echo ok", "echo ${{ secrets.X }}")), "segreti"));
test("checkout che salva le credenziali non passa", () => trova(controlla("x.yml", BASE.replace("persist-credentials: false", "fetch-depth: 1")), "persist-credentials"));
test("titolo della PR dentro uno script non passa", () => trova(controlla("x.yml", BASE.replace("echo ok", 'echo "${{ github.event.pull_request.title }}"')), "non attendibile"));
test("nome del branch dentro uno script non passa", () => trova(controlla("x.yml", BASE.replace("echo ok", "echo ${{ github.head_ref }}")), "non attendibile"));
test("espressione dentro uno script a più righe non passa", () =>
  trova(controlla("x.yml", BASE.replace("- run: echo ok", "- run: |\n          echo ${{ inputs.x }}")), "dentro uno script"));
test("azione di terzi non fissata a un commit non passa", () =>
  trova(controlla("x.yml", BASE.replace("actions/checkout@v4\n        with:\n          persist-credentials: false", "qualcuno/azione@v1")), "terzi"));
test("azione di terzi fissata a un commit passa", () =>
  assert.deepEqual(controlla("x.yml", BASE.replace("- run: echo ok", "- uses: qualcuno/azione@" + "a".repeat(40))), []));
test("produzione avviabile da una pull request non passa", () => trova(controlla("rilascio.yml", PROD.replace("workflow_dispatch:", "workflow_dispatch:\n  pull_request:")), "pull_request"));
test("produzione avviabile da push non passa", () => trova(controlla("rilascio.yml", PROD.replace("workflow_dispatch:", "push:")), "push"));
test("segreti senza environment non passano", () => trova(controlla("rilascio.yml", PROD.replace("    environment: production\n", "")), "environment"));
test("segreti senza il blocco di attivazione non passano", () => trova(controlla("rilascio.yml", PROD.replace("    if: vars.PRODUZIONE_ATTIVA == 'si'\n", "")), "PRODUZIONE_ATTIVA"));
