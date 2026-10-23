/* O plugin é só JSON e markdown; o teste confere o que o Claude lê para carregar. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RAIZ = join(import.meta.dirname, "..");
const json = (p) => JSON.parse(readFileSync(join(RAIZ, p), "utf8"));
const front = (p) => {
  const m = /^---\n([\s\S]+?)\n---\n/.exec(readFileSync(p, "utf8"));
  assert.ok(m, `${p} sem frontmatter`);
  return Object.fromEntries(m[1].split("\n").map((l) => [l.slice(0, l.indexOf(":")), l.slice(l.indexOf(":") + 1).trim()]));
};

test("manifesto, marketplace e conector: nome fixo, mesma versão, URL do conector sem barra final", () => {
  const p = json(".claude-plugin/plugin.json");
  const m = json(".claude-plugin/marketplace.json");
  assert.equal(p.name, "november24");
  assert.equal(m.plugins[0].name, p.name);
  assert.equal(m.plugins[0].description, p.description);
  assert.ok(p.license && p.version);
  const c = json(".mcp.json").mcpServers.november24;
  assert.equal(c.type, "http");
  assert.equal(c.url, "https://mcp.november24.com.br/mcp");
});

test("skills: pasta = name; description até 1024 caracteres, com as palavras que a aluna usaria", () => {
  const skills = readdirSync(join(RAIZ, "skills"));
  assert.deepEqual(skills.sort(), ["mentoria-socratica", "visor-november24"]);
  for (const s of skills) {
    const f = front(join(RAIZ, "skills", s, "SKILL.md"));
    assert.equal(f.name, s);
    assert.ok(f.description.length <= 1024, `${s}: description com ${f.description.length} caracteres`);
  }
  const m = front(join(RAIZ, "skills", "mentoria-socratica", "SKILL.md")).description;
  for (const w of ["resumo", "plano", "governança", "piloto", "outra pessoa", "C5"]) assert.match(m, new RegExp(w));
  const v = front(join(RAIZ, "skills", "visor-november24", "SKILL.md")).description;
  for (const w of ["visor", "tabela", "checklist", "`mostrar`"]) assert.match(v, new RegExp(w.replace(/[`]/g, "\\`")));
});

test("a skill entrega no primeiro turno e não pede esqueleto prévio; o visor manda usar mostrar e proíbe widget", () => {
  const m = readFileSync(join(RAIZ, "skills", "mentoria-socratica", "SKILL.md"), "utf8");
  assert.match(m, /Entregue já no primeiro turno/);
  assert.match(m, /Uma só pergunta no fim/);
  assert.doesNotMatch(m, /primeiro (me )?mostre o esqueleto/);
  const v = readFileSync(join(RAIZ, "skills", "visor-november24", "SKILL.md"), "utf8");
  assert.match(v, /Chame `mostrar` no mesmo turno/);
  assert.match(v, /Nunca crie widget, artefato, HTML ou canvas próprio/);
});

test("README com o mínimo do diretório: 40 palavras fora de código, o que faz, como usar, que dado envia", () => {
  const r = readFileSync(join(RAIZ, "README.md"), "utf8").replace(/```[\s\S]*?```/g, "");
  assert.ok((r.match(/\S+/g) || []).length >= 40);
  assert.match(r, /## Como usar/);
  assert.match(r, /## Que dado o plugin envia/);
});
