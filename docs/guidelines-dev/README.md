# Guidelines dev

Stato: bozza v0.3, 2026-05-21. Audience: dev di ingegnerizzazione, AET.

Linee guida operative per il dev che prende in carico un prototipo `mesa
prototype` e lo trasforma in prodotto industrializzato standalone.

Se ti hanno appena passato un prototipo, **parti da qui**. Questo README e' il
punto di ingresso: dice cosa leggere, in che ordine e quando usare le skill.

## Da dove iniziare

Hai ricevuto un prototipo da industrializzare. Leggi nei prossimi 30 minuti, in
quest'ordine:

1. **[Processo di industrializzazione](./01-processo-industrializzazione.md)** —
   Il flusso completo: input atteso, review iniziale 24-48h, metodologie
   prototipo->repo, monorepo Turborepo, documentazione/ADR, analisi del dominio,
   attivita' pratiche (entity map, dependency map, ORM, test), tracce
   (architettura, dati, sicurezza, deploy, test, App Insights), Definition of
   Done, anti-pattern. **Tienilo aperto come riferimento durante tutto il
   lavoro.**

2. **[Analisi del dominio e bounded context](./02-analisi-dominio-bounded-context.md)**
   — Come decidere dove mettere i confini dei moduli. Da leggere prima della
   prima PR strutturale, non dopo. Spiega come usare il prototipo come
   preparazione (non come conclusione) e come condurre la sessione di
   discovery con AF.

3. **[Rami, versioning e release](./release/rami-versioning-release.md)** —
   Strategia di branching (main + tag, no release branch), SemVer,
   compatibilita' host per plugin MESAPPA, flusso di chiusura versione fino
   al push immagine su GHCR. Da consultare quando chiudi una versione, non
   prima.

## Flusso operativo tipico

Per un nuovo prototipo da industrializzare, la sequenza e':

```
1. Leggi 01-processo-industrializzazione.md per orientarti.
2. Esegui la review iniziale 24-48h con la skill industrialization-kickoff.
   → output: docs/industrialization-review.md (delta, decisioni AET, backlog).
3. Risolvi i blocchi AET aperti dalla review.
4. Leggi 02-analisi-dominio-bounded-context.md.
5. (Opzionale) Prepara discovery-prep.md leggendo il prototipo.
6. Conduci la sessione bounded-context-discovery con AF (eventuale PO/domain expert).
   → output: docs/domain-map.md (bounded context, ubiquitous language, context map).
6b. (In parallelo o subito dopo) Agent pass su codebase -> docs/entity-map.md (FE+BE),
    poi docs/dependency-map.md e piano di separazione dipendenze.
7. Apri le PR seguendo il backlog tecnico, modulo per modulo, secondo domain-map
   e dependency-map; test unit/integration/E2E estesi per entity e AC.
8. Quando chiudi una versione: leggi release/rami-versioning-release.md.
9. Pre-tag: AF lancia la skill changelog-generation, dev rivede tecnicamente.
   → output: CHANGELOG.md aggiornato + docs/release-notes/<versione>.md.
10. Tag SemVer, push, GitHub Release: la pipeline GHCR pubblica l'immagine.
```

## Quale skill usare e quando

Le skill sono file di istruzioni per Claude/Cursor. Attivano un comportamento
guidato per compiti specifici. Le copi in `.claude/skills/` del repo target,
oppure le citi in un prompt di avvio sessione.

| Quando | Skill | Cosa produce |
| --- | --- | --- |
| Hai appena preso in carico il prototipo, devi fare la review 24-48h | [industrialization-kickoff](./skills/industrialization-kickoff.md) | `docs/industrialization-review.md` con classificazione del codice, delta verso il target, decisioni AET, backlog prioritario P0/P1/P2 |
| Hai chiuso la review e i blocchi AET, ora devi decidere i confini dei moduli | [bounded-context-discovery](./skills/bounded-context-discovery.md) | `docs/domain-map.md` con bounded context, ubiquitous language, context map, mapping a moduli Hono e schemi Postgres |
| Stai chiudendo una versione e devi scrivere il changelog pre-tag | [changelog-generation](./skills/changelog-generation.md) | `CHANGELOG.md` aggiornato (bilingue IT+EN) + `docs/release-notes/<versione>.md` per il body GitHub Release, revisionato da AF (tono) e dev (accuratezza) |

### Come si attiva una skill

Tre modi, dal piu' veloce al piu' integrato:

1. **Citazione in prompt** — apri Claude Code nel repo del prodotto e scrivi:
   "Usa la skill `docs/guidelines-dev/skills/industrialization-kickoff.md` per
   strutturare la review iniziale di questo prototipo."

2. **Copia nel repo target** — copia il file in
   `.claude/skills/<nome-skill>.md` del repo del prodotto. Diventa disponibile
   stabilmente per tutte le sessioni Claude/Cursor in quel repo.

3. **Iniezione via scaffold** (futuro) — le skill stabili verranno aggiunte ai
   template `mesa prototype` / `mesa init` e iniettate automaticamente nei
   nuovi repo. Stato attuale: backlog CLI (vedi
   `docs/sat/04-skills-documentazione-scaffold.md`).

### Formato delle skill

Ogni skill segue questo frontmatter:

```markdown
---
name: ...
description: ...
when_to_use: [...]
inputs: [...]
outputs: [...]
guardrails: [...]
---

<istruzioni operative per Claude>
```

I `guardrails` sono espliciti per ogni skill: dicono cosa Claude **non puo'**
decidere da solo. Leggi sempre quella sezione prima di affidargli un task.

## Cosa devi tenere a mente sempre

- **Il dev porta il codice, il dominio lo porta l'AF.** L'analisi del dominio
  e' un lavoro congiunto, non un'analisi solitaria sul repo.
- **I confini dei moduli emergono dal dominio, non dalla struttura del
  prototipo.** Il codice del prototipo e' evidenza utile in preparazione, non
  fonte di conclusioni.
- **Ubiquitous language e' il contratto.** Se il codice usa nomi diversi dai
  termini concordati in discovery, e' un segnale di deriva — apri issue,
  rinomina, aggiorna `domain-map.md`.
- **Le decisioni strutturali vanno ad AET.** Cambio stack, deviazioni dal
  target, nuovi pattern condivisi: ADR esplicito, non scelta silenziosa.
- **Il prodotto e' standalone.** Se embedda librerie di portfolio (es. SEASYDE),
  quelle sono integrazioni esterne al confine — ACL o Published Language, non
  parte interna del dominio.

## Cosa NON e' in questa cartella

- Linee guida AF per prototipazione → `docs/sat/01-linea-guida-af-prototipazione.md`.
- Architecture lock dello scaffold CLI → `docs/sat/03-scaffold-architecture-lock.md`.
- Skill da iniettare negli scaffold → `docs/sat/04-skills-documentazione-scaffold.md`.

## Backlog di evoluzione

Skill candidate da aggiungere (non ancora scritte):

- `module-extraction` — come estrarre un modulo dai Route Handler verso
  `application/` + Hexagonal.
- `integration-event-design` — come disegnare un evento Outbox/Inbox tra due
  bounded context.
- `acl-design` — come scrivere un Anti-Corruption Layer per integrare un
  sistema esterno o una libreria di portfolio embedded.
- `aet-escalation` — come preparare un'escalation strutturata verso AET con
  contesto, alternative e raccomandazione.

Documenti da scrivere in giri successivi:

- `03-metodologie-prototipo-repo.md` — approfondimento fasi handover, branch,
  migrazione env e checklist operative prototipo → repo industrializzato.
- `release/deploy-clienti.md` — gestione consegna immagini al cliente (con IT).
- `release/distribuzione-plugin.md` — formati e flussi specifici per plugin
  MESAPPA, con esempio da plugin esistente.
