# Skills e documentazione da inserire negli scaffold

Stato: bozza v0.1. Audience: owner CLI, AET, AF, dev e tester.

## Obiettivo

Ogni scaffold deve nascere con un piccolo knowledge pack: regole per l'AI,
skill operative, documentazione minima e template di lavoro. Questo riduce la
distanza tra prototipazione, sviluppo e test, e rende piu' facile mantenere il
prodotto nel modello SAT.

## Stato attuale nella CLI

Gli scaffold `mesa init` e `mesa prototype` generano gia':

- `.cursor/rules/web-architecture.mdc`;
- `.cursor/rules/security.mdc`;
- `.cursor/rules/testing.mdc`;
- `.claude/skills/architecture-audit.md`;
- `.claude/skills/rest-api-design.md`;
- `.claude/skills/secrets-management.md`.

`mesa prototype` aggiunge anche:

- `.claude/skills/vercel-neon-deployment.md`.

Questi file sono definiti in `src/templates/shared/` e replicati nella root del
repo per uso diretto su `mesa-cli`.

## Skill target

### Skill obbligatorie per tutti gli scaffold

| Skill | Scopo | Output atteso |
| --- | --- | --- |
| `architecture-audit` | Eseguire e interpretare `mesa verify` | Esito check, failure, azioni correttive |
| `rest-api-design` | Disegnare o revisionare endpoint REST | Contratto endpoint, status code, error shape |
| `secrets-management` | Gestire env e segreti | Env documentati, nessun segreto in repo |
| `backlog-governance` | Governare issue, triage, AC, casi di test | Issue riscritte e pronte per dev/test |
| `functional-testing` | Supportare tester nel ciclo ready-to-test/in-test/to-fix | Evidenza test e rollback mirati |
| `handover-to-industrialization` | Preparare passaggio prototipo-dev | Checklist debito, ADR, env, rischi |

### Skill aggiuntive per `mesa prototype`

| Skill | Scopo |
| --- | --- |
| `vercel-neon-deployment` | Setup Vercel, Neon, env preview/production, deploy manuale |
| `drizzle-data-modeling` | Evolvere schema Drizzle e migrazioni |
| `vercel-blob-storage` | Gestire upload, token e lifecycle storage |

### Skill aggiuntive per plugin on-prem

| Skill | Scopo |
| --- | --- |
| `mesappa-plugin-architecture` | Vincoli plugin, auth host, integrazione MESAPPA |
| `aspire-local-development` | Avvio e debug con Aspire |
| `sqlserver-data-access` | Connessioni, query parametrizzate, migrazioni/manualita' DB |

### Skill aggiuntive per plugin SaaS

| Skill | Scopo |
| --- | --- |
| `azure-functions-delivery` | Funzioni HTTP, local.settings, deploy Azure |
| `azure-sql-data-access` | Accesso dati Azure SQL e segreti |
| `azure-ci-cd` | GitHub Actions, ambienti e rollback |

## Template skill

Ogni skill dovrebbe usare un frontmatter coerente:

```markdown
---
name: backlog-governance
description: Governa issue, triage, Acceptance Criteria e casi di test nel modello SAT.
when_to_use:
  - triage di una segnalazione
  - apertura di una issue funzionale
  - preparazione di una release
inputs:
  - issue o richiesta iniziale
  - contesto prodotto fornito dall'AF
outputs:
  - body issue strutturato
  - Acceptance Criteria
  - casi di test
guardrails:
  - Claude propone, AF decide
  - nessuna chiusura issue senza commento
  - nessuna modifica fuori scope senza conferma
---
```

La sezione `guardrails` e' importante: rende esplicito cosa l'AI non puo'
decidere da sola.

## Documentazione minima generata

Ogni scaffold dovrebbe generare almeno:

| File | Owner primario | Scopo |
| --- | --- | --- |
| `README.md` | Dev | Avvio, build, test, deploy sintetico |
| `docs/product-brief.md` | AF | Obiettivo, utenti, scope, non-scope, PO, SAT |
| `docs/functional-manual.md` | AF/Tester | Comportamenti utente e regole funzionali |
| `docs/architecture.md` | Dev/AET | Stack, moduli, decisioni, confini |
| `docs/env-vars.md` | Dev | Variabili per dev/preview/production |
| `docs/testing-strategy.md` | Dev/Tester | Unit, integration, E2E/manuale |
| `docs/release-checklist.md` | AF/Dev | Passi go/no-go e verifiche pre-release |
| `docs/handover-to-industrialization.md` | AF/Dev | Stato prototipo, debito, rischi, decisioni |
| `docs/adr/0001-initial-architecture.md` | Dev/AET | Prima decisione architetturale |
| `.github/ISSUE_TEMPLATE/functional-issue.md` | AF | Issue lavorabile da dev/test |
| `.github/ISSUE_TEMPLATE/bug-report.md` | Tester/PO | Segnalazione completa e senza PII |

I file generati possono essere brevi, ma non devono essere placeholder vuoti:
devono contenere istruzioni su cosa compilare e cosa non inserire.

## Matrice per scaffold

| Contenuto | prototype | standalone | onprem | saas |
| --- | --- | --- | --- | --- |
| Product brief | Si | Si | Si | Si |
| Functional manual | Si | Si | Si | Si |
| Architecture doc | Si | Si | Si | Si |
| ADR iniziale | Si | Si | Si | Si |
| Handover prototype -> industrialization | Si | Opzionale | No | No |
| Vercel/Neon deployment skill | Si | Solo se Vercel/Postgres | No | No |
| MESAPPA plugin skill | No | No | Si | Si |
| Azure delivery skill | No | Se deploy Azure | No | Si |
| Aspire local dev skill | No | Se Aspire | Si | No |

## Regole di manutenzione

- `src/templates/shared/` resta la fonte di verita' per skill e Cursor rules
  condivise.
- Le copie nella root `.claude/skills` e `.cursor/rules` devono restare
  allineate ai template.
- Ogni nuova skill deve avere test di generazione scaffold.
- Ogni documento generato deve comparire nei test dei manifest.
- Ogni modifica al lock o alle skill condivise deve aggiornare README e
  documentazione SAT.

## Backlog consigliato

1. Aggiungere `backlog-governance`.
2. Aggiungere `functional-testing`.
3. Aggiungere `handover-to-industrialization`.
4. Aggiungere template docs condivisi.
5. Aggiungere issue template GitHub.
6. Estendere `mesa verify` per controllare presenza di docs, skills e rules.
7. Aggiornare i messaggi post-scaffold con i nuovi prossimi passi per AF e dev.

