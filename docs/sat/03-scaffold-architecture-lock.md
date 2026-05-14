# Ridefinizione scaffold e architecture lock

Stato: bozza v0.1. Audience: owner della CLI, AET, dev, AF responsabili di
nuovi prodotti.

## Obiettivo

Questo documento definisce una prima proposta di lock architetturale e
infrastrutturale per gli scaffold di `mesa-cli`. Il lock non serve a bloccare
l'evoluzione tecnica: serve a ridurre il drift tra prodotti, rendere verificabile
il rispetto degli standard e proteggere il carico cognitivo dei SAT.

Le linee guida codice/infra definitive sono ancora da integrare. Le regole qui
sotto derivano dallo stato attuale della CLI e dai materiali organizzativi SAT.

## Inventario scaffold attuale

| Comando | Target | Stack principale | Note |
| --- | --- | --- | --- |
| `mesa prototype` | Nuovo prodotto prototipale greenfield | Next.js, Hono, Neon Postgres, Drizzle, Vercel Blob, JWT | Default proposto per prototipazione prodotto |
| `mesa init --type onprem` | Plugin MESAPPA on-prem | Express, Angular 16, SQL Server, Aspire | Docker opzionale per sviluppo generato |
| `mesa init --type saas` | Plugin MESAPPA SaaS | Azure Functions, Angular 16, Azure SQL, GitHub Actions | Deploy Azure |
| `mesa init --type standalone` | PoC configurabile | Next.js full-stack oppure Express + Angular/React, DB configurabile | Da usare quando serve deviare dal prototype |

Gli scaffold gia' iniettano:

- `.cursor/rules/web-architecture.mdc`;
- `.cursor/rules/security.mdc`;
- `.cursor/rules/testing.mdc`;
- `.claude/skills/architecture-audit.md`;
- `.claude/skills/rest-api-design.md`;
- `.claude/skills/secrets-management.md`;
- `.claude/skills/vercel-neon-deployment.md` solo per `mesa prototype`.

## Livelli di lock

### L0 - Vincoli hard

Questi vincoli devono essere verificabili dalla CLI o da CI:

- no SQLite per nuovi prodotti;
- API REST come default;
- auth username/password con hash sicuro quando lo scaffold prevede auth locale;
- nessun segreto tracciato;
- `.env.example` presente e aggiornato;
- ambienti preview e production distinti per deploy web;
- deploy production manuale o approvato, non automatico su ogni push;
- regole Cursor e skill Claude presenti;
- documentazione minima generata con lo scaffold.

### L1 - Default architetturali

Questi sono default da mantenere salvo ADR e review AET:

- `mesa prototype`: Next.js + Hono + Neon + Drizzle + Vercel Blob + Vercel;
- route sottili, business logic in service, accesso dati isolato;
- Zod o validazione equivalente su input/env;
- GitHub Actions per build/test e deploy manuale;
- ADR per scelte strutturali;
- issue funzionali con Acceptance Criteria e casi di test.

### L2 - Estensioni ammesse

Deviazioni ammesse se motivate:

- provider Postgres diverso da Neon;
- storage diverso da Vercel Blob;
- deploy target diverso da Vercel;
- integrazioni legacy o customer-specific;
- framework frontend diverso dallo scaffold default;
- modello auth diverso per integrazione enterprise.

Ogni estensione L2 richiede ADR e, se impatta altri SAT o la security posture,
review AET.

## Ridefinizione proposta degli scaffold

### 1. `mesa prototype` come default prodotto greenfield

`mesa prototype` dovrebbe diventare lo scaffold consigliato per AF e SAT quando
si parte da un nuovo prodotto web. Dovrebbe generare anche il pacchetto
documentale e operativo:

- `docs/product-brief.md`;
- `docs/functional-manual.md`;
- `docs/architecture.md`;
- `docs/adr/0001-initial-architecture.md`;
- `docs/handover-to-industrialization.md`;
- `docs/release-checklist.md`;
- issue template per segnalazione e issue funzionale;
- skill backlog/prototyping oltre alle skill tecniche.

### 2. `mesa init --type standalone` come scaffold eccezione consapevole

Lo standalone configurabile resta utile, ma va presentato come scelta quando il
prodotto richiede una deviazione chiara dal default prototype. La CLI dovrebbe
chiedere o documentare il motivo della deviazione quando si sceglie uno stack
non standard.

### 3. `mesa init --type onprem` e `saas` come scaffold plugin

Gli scaffold plugin restano separati perche' rispondono a vincoli MESAPPA,
customer infrastructure e Azure. Anche qui va generato il pacchetto minimo di
documentazione, adattato al contesto plugin.

### 4. Manifest di lock

Proposta: ogni scaffold genera un file machine-readable, ad esempio:

```yaml
# .mesa/architecture-lock.yml
scaffold: prototype
version: 1
stack:
  frontend: nextjs
  backend: hono
  database: postgres
  orm: drizzle
  storage: vercel-blob
  deploy: vercel
requiredEnvironments:
  - preview
  - production
forbidden:
  dependencies:
    - sqlite3
    - better-sqlite3
    - "@libsql/client"
requiredDocs:
  - docs/product-brief.md
  - docs/architecture.md
  - docs/handover-to-industrialization.md
requiredSkills:
  - architecture-audit
  - rest-api-design
  - secrets-management
  - backlog-governance
```

`mesa verify` potrebbe leggere questo file e applicare controlli specifici per
tipo scaffold, invece di basarsi solo su euristiche generiche.

## Backlog di implementazione CLI

- Aggiungere template docs condivisi.
- Aggiungere skill backlog-governance e handover-to-industrialization.
- Generare `.mesa/architecture-lock.yml`.
- Estendere `mesa verify` con controlli su docs, skills, rules e lock manifest.
- Aggiungere test per ogni nuovo file generato dagli scaffold.
- Aggiornare README e messaggi post-scaffold.
- Rendere esplicito quando `standalone` e' una deviazione dal default prototype.

## Criteri di accettazione del lock

Il lock e' efficace quando:

- un nuovo repo contiene gia' le istruzioni operative minime;
- AF e dev trovano lo stesso vocabolario in issue, docs e skill;
- `mesa verify` intercetta drift comuni prima della PR;
- AET vede subito quali scelte sono standard e quali sono eccezioni;
- il passaggio prototipo-industrializzazione non dipende da memoria orale.

