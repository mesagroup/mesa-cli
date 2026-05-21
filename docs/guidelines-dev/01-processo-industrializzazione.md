# Processo di industrializzazione

Stato: bozza v0.4. Audience: dev di ingegnerizzazione, dev di prototipazione,
AF, Tester funzionale e AET.

## Obiettivo

Questa guida descrive come prendere in carico un prototipo generato con
`mesa-cli` e trasformarlo in un prodotto industrializzabile standalone. Il
prototipo serve a validare il comportamento; l'industrializzazione rende quel
comportamento manutenibile, testabile, sicuro e rilasciabile, e fa convergere
il prodotto verso il **target architetturale di riferimento** descritto nelle
sezioni successive.

Quando il prodotto embedda librerie o componenti di altri sistemi del
portfolio (es. SEASYDE), quei pezzi sono integrazioni di contesti esterni: si
trattano come ACL o Published Language al confine, non come parte interna del
dominio del prodotto. Il target architetturale si applica al codice del
prodotto, non ai pezzi embedded.

## Input atteso

Prima di iniziare, il dev deve ricevere dall'AF:

- repo del prototipo;
- issue funzionali con Acceptance Criteria e casi di test;
- product brief e decisioni PO rilevanti;
- elenco debito tecnico e funzionale noto;
- env richiesti, senza segreti reali;
- esito di demo o validazione PO;
- eventuali decisioni AET gia' prese e ADR aperti.

Se questi elementi mancano, non si blocca tutto per formalismo: si apre una
issue di completamento contesto e si chiarisce con AF cosa serve prima delle
scelte irreversibili.

## Review iniziale

Nelle prime 24-48 ore il dev fa una review tecnica esplicita:

1. esegue install, build e test disponibili;
2. esegue `mesa verify --cwd <repo>` dove applicabile;
3. legge `.cursor/rules`, `.claude/skills`, `README.md` e `.env.example`;
4. classifica il codice in quattro categorie: tenere, rifattorizzare,
   sostituire, eliminare;
5. confronta lo stato del prototipo con il target ADR (vedi sezione
   successiva) e annota il delta su ogni traccia;
6. identifica decisioni strutturali da portare ad AET;
7. apre o aggiorna ADR per le decisioni non banali e per le eventuali
   deroghe al target;
8. verifica presenza e coerenza di `docs/adr/`, `turbo.json` e layout
   monorepo `apps/` + `packages/`.

La review produce una lista breve di issue tecniche prioritarie, non una
riscrittura preventiva del prototipo. Il passo successivo pianificato e' la
mappatura entity (agent) e, in parallelo o subito dopo, la discovery dominio se
non ancora fatta.

## Stato di partenza dal prototipo

`mesa prototype` genera uno stack pensato per validare velocemente:

- frontend Next.js 15 App Router;
- API Hono montata dentro Next.js (Route Handlers `/api/*`);
- database Neon Postgres;
- ORM Drizzle;
- storage Vercel Blob;
- auth username/password con hash bcryptjs e JWT firmato con `jose`;
- deploy Vercel via GitHub Actions manuale (`workflow_dispatch`);
- ambienti preview e production separati.

Questo e' uno **stato di partenza**, non l'architettura finale. Le scelte
"da prototipo" (Hono mounted-in-Next, Neon, Vercel Blob, bcryptjs+jose,
deploy Vercel) restano accettabili fino alla validazione PO;
l'industrializzazione le riconsidera contro il target di piattaforma.

## Target di industrializzazione

Il prodotto industrializzato converge verso il seguente target architetturale
di riferimento:

- runtime Node.js LTS (>= 22), TypeScript strict, ESM nativo;
- frontend Next.js (App Router) + React 19 in ruolo di BFF;
- API host **Hono come processo separato** dal frontend, composto da
  moduli business in stile Vertical Slices con mediator custom
  (`Result<T>` + Problem Details RFC 9457, Zod nel pipeline);
- architettura interna dei moduli: Hexagonal (Ports & Adapters), regole
  intra-modulo verificate da `dependency-cruiser`;
- Postgres >= 16 (in produzione Azure Database for PostgreSQL Flexible
  Server), Drizzle ORM, schema-per-modulo, migrazioni con `drizzle-kit`;
- auth: Auth.js v5 multi-provider nel BFF Next.js, sessione server-side
  (Redis primario, Postgres fallback), httpOnly cookie nativo, JWT
  server-to-server (short-lived, audience-scoped) verso l'API Hono;
- autorizzazione RBAC permission-based, workspace scoping opt-in;
- storage Azure Blob, secrets Azure Key Vault in produzione;
- deploy: Docker image per servizio (web BFF, API host, worker)
  su Azure Container Apps, GitHub Actions con deploy manuale per ambiente;
- testing: Vitest (unit + integration) + Playwright (E2E, a11y, visual,
  perf) + Testcontainers per integration test con Postgres/Redis;
- messaging cross-modulo (quando serve): Azure Service Bus con pattern
  Outbox/Inbox e principio di eventual consistency.

Restare sullo stack del prototipo (Vercel + Neon + Vercel Blob +
bcryptjs/jose + Hono in Next.js) e' una **deviazione consapevole**: deve
essere giustificata in un ADR firmato dall'AET, con motivazione (es.
prodotto isolato, vita corta, vincolo cliente) e con elenco esplicito dei
controlli compensativi (segreti, observability, rollback).

Il lock architetturale di scaffold (livelli L0/L1/L2) e' descritto in
`docs/sat/03-scaffold-architecture-lock.md`. Questa guida lo applica al
passaggio prototipo -> prodotto.

## Metodologie: dal prototipo al repository

Il passaggio prototipo -> repo industrializzato non e' un solo refactor: e' una
sequenza di fasi con artefatti e gate espliciti. Le metodologie dettagliate
(perimetro repo, branch strategy, migrazione env, handover AF->dev) saranno
approfondite in un documento dedicato; qui si fissa il perimetro minimo che ogni
prodotto deve rispettare.

| Fase | Obiettivo | Output minimo |
| --- | --- | --- |
| **Presa in carico** | Validare che il prototipo e' industrializzabile | `docs/industrialization-review.md`, backlog P0/P1/P2 |
| **Discovery dominio** | Stabilire confini prima del codice di produzione | `docs/domain-map.md` |
| **Mappatura tecnica** | Tradurre dominio e codice esistente in entity, dipendenze, superfici UI/API | `docs/entity-map.md`, `docs/dependency-map.md` (vedi sezione attivita' pratiche) |
| **Convergenza architetturale** | Allineare repo al target (monorepo, moduli, ORM, observability) | PR incrementali per traccia, ADR per deviazioni |
| **Hardening qualita'** | Test, architettura verificabile, operabilita' | coverage su AC, `dependency-cruiser` verde, trace su App Insights |
| **Rilascio** | Prodotto rilasciabile e documentato | DoD industrializzazione, changelog, runbook |

Principi trasversali:

- **Incrementale**: niente big-bang; ogni PR ha uno scopo (un modulo, una traccia,
  un package).
- **Documentato prima di strutturare**: entity map e dependency map precedono
  estrazioni di moduli e split di package.
- **Tracciato**: ogni deviazione dal target produce o aggiorna un ADR; ogni
  decisione strutturale cross-SAT passa da AET.

## Organizzazione del repository (monorepo + Turborepo)

Il prodotto industrializzato e' un **monorepo pnpm** orchestrato da
**Turborepo**. Il prototipo `mesa prototype` gia' nasce con `apps/` e
`packages/`; l'industrializzazione consolida questa forma e aggiunge pipeline,
cache e task graph espliciti.

Layout di riferimento:

```
<repo>/
  apps/
    web/          # Next.js BFF (Auth.js, proxy verso API)
    api/          # Hono API host (moduli business)
    worker/       # (opzionale) consumer Outbox/Inbox, job async
  packages/
    db/           # Drizzle schema, client, migrazioni
    shared-<ctx>/ # Shared Kernel: solo tipi/VO, mai logica business
    platform/     # (opzionale) auth helpers, telemetry, error mapping
  docs/
    adr/
    domain-map.md
    entity-map.md
    dependency-map.md
  turbo.json
  pnpm-workspace.yaml
```

Regole monorepo:

- **Confini tra package**: un modulo business vive in `apps/api/src/modules/<ctx>/`;
  i package in `packages/` espongono contratti stabili (DB, tipi condivisi,
  adapter platform). Niente import circolari tra `apps/*`.
- **Turborepo**: `turbo.json` definisce `build`, `lint`, `test`, `typecheck` con
  `dependsOn: ["^build"]` dove serve; la CI invoca `turbo run <task> --filter=...`
  per evitare build inutili su PR mirate.
- **Workspace pnpm**: dipendenze interne con `workspace:*`; versioni esterne
  allineate dalla root (`pnpm.overrides` solo se motivato in ADR).
- **Evoluzione dal prototipo**: Hono montato in Next.js (`apps/web/.../api/`)
  va estratto verso `apps/api` come processo separato; fino al completamento
  l'estrazione resta tracciata nel backlog e negli ADR.

## Documentazione e ADR

Oltre al codice, il repo industrializzato mantiene documentazione viva e
decisioni architetturali strutturate.

### Struttura documentale minima

| Percorso | Contenuto | Chi aggiorna |
| --- | --- | --- |
| `README.md` | Avvio locale, comandi turbo/pnpm, env | Dev |
| `docs/product-brief.md` | Visione prodotto, scope | AF / PO |
| `docs/architecture.md` | Vista corrente (moduli, deploy, integrazioni) | Dev |
| `docs/domain-map.md` | Bounded context, ubiquitous language, context map | Dev + AF |
| `docs/entity-map.md` | Entity aggregate, mapping FE/BE | Dev (con agent) |
| `docs/dependency-map.md` | Grafo dipendenze da entity map | Dev |
| `docs/functional-manual.md` | Manuale funzionale per tester | AF |
| `docs/handover-to-industrialization.md` | Debito, rischi, env | AF → dev |
| `docs/industrialization-review.md` | Review 24-48h | Dev |
| `docs/runbook.md` | Deploy, rollback, segreti, debug | Dev |
| `docs/adr/` | Architecture Decision Records | Dev + AET |

### Formato ADR

Ogni ADR in `docs/adr/NNNN-titolo-kebab-case.md` segue il template:

```markdown
# NNNN — Titolo decisione

Stato: proposta | accettata | deprecata | sostituita da ADR-XXXX
Data: YYYY-MM-DD
Decisori: dev, AET (se applicabile)

## Contesto
Cosa obbliga la decisione.

## Decisione
Cosa si fa.

## Conseguenze
Positive, negative, controlli compensativi.

## Alternative considerate
Breve elenco con motivo dello scarto.
```

Regole ADR:

- **0001** resta la decisione architetturale iniziale (scaffold / target);
- ogni deviazione dal target (Vercel, auth prototipo, storage, deploy) richiede
  ADR **accettata** da AET prima del merge in produzione;
- ADR deprecati restano in repo con stato `deprecata` e link alla sostituta;
- riferimenti incrociati in issue e PR (`ADR-0003` nel titolo o body).

## Analisi del dominio

Prima di applicare le tracce di industrializzazione, il dev deve sapere **dove mettere i confini dei moduli**. Il prototipo non risponde a questa domanda: nasce per validare comportamento, non per modellare domini. Usare la struttura del prototipo come proxy dei moduli significa industrializzare un modello sbagliato.

La discovery dei bounded context e' il passo che colma questo gap. Produce tre artefatti:

1. **Mappa dei contesti** — elenco dei bounded context con nome, responsabilita' e owner nel SAT;
2. **Ubiquitous language** — glossario per contesto: i termini che devono comparire nel codice, negli schema DB, nei test e nelle issue;
3. **Context map** — relazioni tra contesti (Shared Kernel, ACL, Published Language) e regole di comunicazione cross-context.

Questi artefatti guidano direttamente le scelte strutturali delle tracce successive:

- ogni bounded context diventa un **modulo Hono** (Vertical Slice esternamente, Hexagonal internamente);
- ogni contesto ha il suo **schema Postgres** (schema-per-modulo);
- le relazioni cross-context si traducono in **integration event** via Service Bus + Outbox/Inbox, oppure in un **Anti-Corruption Layer** nell'`infrastructure/` del modulo consumatore;
- l'ubiquitous language e' il naming del `domain/`, non un'approssimazione tratta dal codice del prototipo.

### Quando farla

La discovery avviene **dopo la review iniziale** (il dev ha letto il prototipo) e **prima della prima PR strutturale** (i confini sono stabili prima di iniziare a scrivere codice di produzione).

Se il prototipo copre 2-3 use case lineari con un solo dominio evidente, la sessione puo' essere breve (30-60 minuti) o saltata con una nota in ADR che spiega perche' il modulo e' unico. Il punto non e' il formalismo: e' avere una decisione consapevole, non un confine ereditato per inerzia.

### Chi partecipa

AF (porta il contesto funzionale), dev che prende in carico (porta la lettura del prototipo), opzionalmente PO o domain expert per i punti ambigui. AET entra se emergono decisioni cross-SAT o integrazioni con altri bounded context del portfolio.

### Output atteso

Un documento `docs/domain-map.md` nel repo del prodotto con:

- elenco bounded context con nome e responsabilita';
- ubiquitous language (almeno i termini core per contesto);
- context map con tipo di relazione per ogni coppia che si integra;
- mapping contesto → modulo Hono e contesto → schema Postgres;
- decisioni aperte da portare ad AET.

Il documento e' un artefatto vivo: si aggiorna quando i confini cambiano e produce un ADR se il cambio e' strutturale.

La guida completa alla sessione di discovery e le skill di facilitazione sono
in `02-analisi-dominio-bounded-context.md` e in `skills/`.

## Tracce di industrializzazione

### Architettura applicativa

- API host Hono separato dal frontend. La Route Handler Next.js resta solo
  per la sessione (Auth.js) e per il proxy server-to-server verso Hono.
- Endpoints sottilissimi (driving adapter): parsing input, invio
  command/query al mediator, mappa `Result<T>` su risposta HTTP/Problem
  Details. Niente logica business nelle route.
- Application layer in `application/<use-case>/`: ogni use case e' una
  slice (`Command`/`Query` + handler + schema Zod).
- Domain layer in `domain/`: entita', aggregati, value objects, domain
  events e Port (interfacce repository, gateway). Zero dipendenze esterne.
- Infrastructure layer in `infrastructure/`: adapter Drizzle, client
  esterni, implementazioni dei Port.
- Repository pattern obbligatorio: il client Drizzle non viene mai usato
  dagli handler in `application/`. L'accesso passa sempre da un Port di
  dominio.
- Cross-cutting concerns (logging, validation, authorization, audit,
  error handling) come pipeline behavior nel mediator, non duplicati nei
  singoli handler.
- REST come stile API: risorse al plurale, metodi HTTP coerenti, errori
  come Problem Details. Niente GraphQL o alternative strutturali senza
  ADR + review AET.
- Per moduli CRUD semplici e' ammesso un layout piu' piatto (handler
  diretto senza CQRS), ma restano repository pattern e isolamento del DB.
- `dependency-cruiser` come architecture test: regole intra-modulo
  (Domain non dipende da Infrastructure/Endpoints, Application non
  dipende da Infrastructure, ecc.) e regole inter-package.

### Dati e migrazioni

- Niente SQLite per nuovi prodotti.
- Postgres >= 16. Neon resta accettabile per prototipi e prodotti che
  giustificano il deploy Vercel; Azure Database for PostgreSQL Flexible
  Server e' il target piattaforma.
- Drizzle ORM come default. Schema definiti in TypeScript, query
  tipizzate, niente client generato.
- Schema-per-modulo: ogni dominio espone le proprie tabelle in uno schema
  Postgres dedicato (`orders`, `inventory`, ...); le entita' framework
  vivono nello schema `platform`. Niente join cross-schema; il dato di un
  altro modulo si ottiene via API interna o integration event.
- Migrazioni gestite da `drizzle-kit generate` (file SQL versionati) e
  applicate al deploy via `drizzle-kit migrate` (init container o
  entrypoint). Niente auto-migrate silenziosi a runtime.
- Connessione tramite env var `DATABASE_URL`, mai hardcodata. In dev
  l'orchestratore inietta la stringa; in produzione la variabile arriva
  dal secret store.
- Dati reali e PII restano fuori dal repo; i dataset di test sono fittizi
  o anonimizzati.

### Sicurezza

Confine non negoziabile, indipendente dallo stack:

- nessun segreto in source; `.env.example` documenta le variabili, non i
  valori;
- `.env` validato a startup con schema Zod, fail-fast se manca una chiave;
- input esterno validato con Zod nel pipeline del mediator;
- password sempre hashate (bcrypt/argon2);
- JWT validato server-side su ogni endpoint protetto, mai esposto al
  browser;
- errori al client senza stack trace ne' dettagli interni (formato
  Problem Details);
- rate limiting, CSP, CORS, anti-CSRF e security headers come middleware
  Hono di default.

Pattern auth target:

- Auth.js v5 nel BFF Next.js, multi-provider dal giorno 1 (Credentials,
  Entra ID, Azure AD B2C, Google, SAML2, Teams, Power BI);
- sessione server-side, Redis primario e Postgres fallback, httpOnly
  secure cookie nativo;
- JWT server-to-server emesso dal BFF verso l'API Hono: short-lived,
  audience `api`, firmato con chiave del framework, mai esposto al
  browser;
- autorizzazione RBAC permission-based; workspace scoping opt-in per
  moduli che ne hanno bisogno (filtro applicativo nel repository +
  Postgres RLS come secondo livello).

Il `bcryptjs + jose` del prototipo resta accettabile come scelta
provvisoria: e' un'auth a singolo provider sufficiente per validare. Va
sostituita con Auth.js + BFF al primo giro di industrializzazione, salvo
deroga AET motivata in ADR (es. prodotto interno isolato senza esigenze
multi-provider).

### Deploy e ambienti

- Target piattaforma: build -> Docker image per servizio (web BFF, API
  Hono, worker) -> Azure Container Apps. Database e cache restano esterni
  ai container.
- GitHub Actions per build/test (push, PR) e per il deploy, con trigger
  manuale (`workflow_dispatch`) o approvato. Niente deploy automatico in
  produzione su push.
- Preview e production sempre ambienti distinti, con env, segreti e log
  scopati per ambiente.
- Vercel + Neon resta lo stack del prototipo. Per produzione industriale
  e' una deviazione consapevole: richiede ADR con motivazione, perimetro
  e controlli compensativi (es. rotazione segreti documentata, runbook
  rollback, observability minima).
- Segreti gestiti per ambiente, mai duplicati nel codice:
  - dev locale: `.env` non versionato;
  - prototipo / deviazione Vercel: env Vercel + GitHub Secrets;
  - target piattaforma: Azure Key Vault primario; env var solo per
    esecuzioni non-Azure (CI esterna, debug) con riferimento alla chiave
    Key Vault corrispondente.
- Il go/no-go di release resta governato dal SAT; AET valida solo i
  passaggi strutturali (cambio target deploy, introduzione di un nuovo
  provider auth, migrazioni invasive).

### Test

L'industrializzazione richiede una **valangata di test** il piu' esaustiva
possibile rispetto agli Acceptance Criteria e alla entity map: non solo happy
path, ma varianti, errori, autorizzazione e regressioni sui flussi critici.

- Vitest come test framework unico per unit e integration, backend e
  frontend.
- Playwright per E2E, accessibility (axe), visual regression e perf sui
  journey critici.
- Testcontainers (Postgres, Redis, eventuale emulator Service Bus) come
  base per gli integration test che toccano infrastruttura reale.
- `dependency-cruiser` come architecture test, eseguito in CI come
  quality gate (regole esagonali intra-modulo e inter-package).
- Priorita' di copertura (in ordine):
  1. **Unit** — regole di dominio pure, value object, policy, mapper senza I/O;
  2. **Integration** — ogni route/command principale: happy path, validazione
     input, 401/403, errore dominio (`Result` -> Problem Details), errore
     tecnico, idempotenza dove prevista;
  3. **E2E** — journey end-to-end da entity map + AC (creazione, modifica,
     errore utente, permessi insufficienti, flussi multi-step);
  4. **Architettura** — `dependency-cruiser` + eventuali contract test tra
     moduli (OpenAPI / event schema).
- Ogni entity identificata in `docs/entity-map.md` deve avere almeno un test
  unit o integration che ne esercita il comportamento core; ogni pagina o
  componente FE mappato deve comparire in almeno uno scenario Playwright se
  espone comportamento utente rilevante.
- Nessuna issue passa a done se gli Acceptance Criteria non hanno
  evidenza di test, anche manuale.

### Operabilita' e tracing (Application Insights)

- Health endpoint sempre presente; readiness/liveness separate per i
  container in Azure Container Apps.
- Logging strutturato (JSON) senza token, password o PII; correlation ID
  propagato attraverso il mediator e nei log dei worker.
- Observability via **OpenTelemetry Node SDK** (log, metriche, tracing) come
  default piattaforma; export verso **Azure Application Insights** in
  preview e production (collector OTLP in dev locale se utile).
- Le **trace** su App Insights vanno gestite come requisito di prodotto, non
  come optional post-rilascio:
  - instrumentazione OTel su `apps/web`, `apps/api` e `apps/worker` con
    resource attributes coerenti (`service.name`, `deployment.environment`);
  - propagazione del **trace context** (W3C `traceparent`) dal BFF alle
    chiamate server-to-server verso Hono;
  - span per use case nel mediator (nome = comando/query), span per
    chiamate DB e integrazioni esterne;
  - **correlation ID** allineato tra log strutturati e trace (stesso ID in
    entrambi i canali);
  - sampling configurato per ambiente (100% in preview, campionamento in
    prod se il volume lo richiede — decisione in ADR);
  - dashboard o workbook minimo: latenza p95 per route critiche, error rate,
    dipendenze esterne; alert su SLO concordati con AF.
- Runbook minimo per: avvio locale (con `.NET Aspire` se usato come
  orchestratore di sviluppo), deploy, rollback, debug env, rotazione
  segreti, ripristino DB, **verifica trace** (come trovare una richiesta per
  correlation ID in App Insights).
- Errori ricorrenti e debito operativo trasformati in issue, con priorita'
  e owner. Niente knowledge solo orale.

## Attivita' pratiche di ingegnerizzazione

Questa sezione traduce il processo in lavoro operativo sul repo. L'ordine e'
vincolante: la mappatura tecnica precede refactor strutturali; l'analisi delle
dipendenze precede split di package e moduli.

### 1. Prima spazzolata: analisi codebase con agent

Prima di toccare l'architettura target, eseguire una **passata guidata da agent**
(Cursor/Claude) sulla codebase e sulla documentazione gia' presente (brief,
issue, `domain-map.md` se esiste).

**Backend** — produrre `docs/entity-map.md` (sezione BE):

- entita' e aggregati impliciti nel codice (modelli, tabelle, DTO, servizi);
- use case / endpoint che le manipolano;
- servizi, controller/route, accesso dati attuale (query inline vs repository);
- debito: SQL nel service, logica nei route handler, accoppiamenti cross-layer.

**Frontend** — produrre la stessa sezione in `docs/entity-map.md` (FE):

- entita' di dominio come compaiono in UI (stato, form, liste);
- **mapping entity -> pagine** (`apps/web/src/app/...`) e **entity -> componenti**
  riusabili;
- chiamate API per entity (quali route, quali payload);
- stato locale vs server state; permessi UI se visibili.

**Merge** — unire FE e BE in un unico `docs/entity-map.md` con tabella di
allineamento:

| Entity (ubiquitous language) | Modulo / schema BE | Route API | Pagina / componente FE | Note |
| --- | --- | --- | --- | --- |

Disallineamenti di naming (es. `Order` in BE, `Purchase` in FE) diventano
issue o aggiornamento del glossario in `domain-map.md`.

### 2. Analisi interdipendenze

Da `entity-map.md` derivare `docs/dependency-map.md`:

- grafo **modulo → modulo** e **package → package** (import, chiamate HTTP,
  condivisione tabelle o tipi);
- dipendenze **FE -> API** per flusso;
- dipendenze **vietate** rispetto al target (es. `domain/` che importa
  `infrastructure/`, join cross-schema, shared package con logica business).

Output: elenco dipendenze da **rompere**, **invertire** (port/adapter) o
**formalizzare** (Published Language, ACL, integration event).

### 3. Separazione delle dipendenze

Sulla base di `dependency-map.md` e del `domain-map.md`:

1. identificare **cicli** e accoppiamenti forti tra contesti;
2. proporre confini package (`apps/api/src/modules/<ctx>/`, `packages/db`
   per schema, `packages/shared-*` solo per tipi);
3. pianificare PR che introducono Port, ACL o eventi senza big-bang;
4. aggiornare `dependency-cruiser` con regole che rendono le violazioni
   build-breaking.

### 4. Backend: servizi, controlli e ORM

Per ogni bounded context nel BE:

- **Struttura target**: `endpoints/` (adapter driving) → `application/` (use
  case) → `domain/` (entita', Port) → `infrastructure/` (adapter Drizzle);
- **Servizi prototipo**: classificare in tenere / rifattorizzare / spezzare in
  command-handler; niente logica nuova nei "service" monolitici;
- **ORM (Drizzle)**: tutte le query escono dagli handler e dai service verso
  **repository** che implementano i Port di dominio; il client Drizzle non e'
  importato in `application/` ne' in `endpoints/`;
- migrazioni per schema del modulo in `packages/db` o sotto-cartella dedicata,
  allineate a schema-per-modulo.

### 5. Regola bounded context vs codice trasversale

- **Dentro il bounded context**: codice di dominio, use case, adapter verso il
  DB del modulo, endpoint del modulo. E' il posto giusto per la logica business.
- **Fuori dal modulo, in servizi gestiti (platform)**: auth, telemetry,
  correlation, audit, rate limit, mapping errori globali, client verso Key
  Vault/Blob/Service Bus generici. Vivono in `packages/platform/` o middleware
  condivisi, **non** duplicati in ogni modulo.
- **Fuori dal dominio del prodotto**: integrazioni portfolio (es. SEASYDE) solo
  tramite ACL in `infrastructure/` del modulo consumatore.

Violazioni tipiche da correggere in industrializzazione: query SQL nel service
del prototipo, helper "utils" condivisi che contengono regole di business,
componenti FE che chiamano API di altri contesti senza passare dal BFF/contratto.

### 6. Test esaustivi (esecuzione)

Dopo entity map e dependency map:

- generare/estendere test unit per ogni regola di dominio emersa;
- integration per ogni endpoint mappato;
- E2E Playwright per ogni journey critico dalla tabella entity (FE+BE);
- tracciare gap di copertura in issue collegate agli AC.

## Collaborazione nel SAT

- AF: chiarisce comportamento, priorita', out of scope e criteri di
  rilascio.
- Dev: decide implementazione ordinaria, test tecnici e qualita'
  production-ready, mantiene la convergenza con l'ADR.
- Tester: verifica end-to-end rispetto agli Acceptance Criteria.
- AET: entra su scelte strutturali (cambio stack, deviazioni dal target,
  nuovi pattern cross-SAT), blocchi tecnici non sciolti in circa due
  giorni e review greenfield.
- PO: decide priorita' strategiche e casi limite di business.

Le code review ordinarie restano nel SAT. Le decisioni che cambiano stack,
deployment, dati, sicurezza, auth o pattern condivisi vanno ad AET e
producono un ADR.

## Definition of Done per industrializzazione

Una feature o un incremento e' industrializzato quando:

- gli Acceptance Criteria sono soddisfatti;
- test automatici (Vitest/Playwright) o manuali sono tracciati con
  evidenza; copertura allineata a `entity-map.md` per le entity toccate;
- build, lint, test (`turbo run`) e `dependency-cruiser` passano;
- `mesa verify` passa o le eccezioni sono motivate;
- env e segreti sono documentati correttamente (con scoping per ambiente
  e riferimento al secret store target);
- migrazioni `drizzle-kit` sono versionate, provate su preview e descritte
  nel runbook;
- trace visibili in Application Insights per i flussi modificati (span con
  correlation ID verificabile);
- README, runbook, `entity-map.md` / `dependency-map.md` (se impattati) e
  manuale funzionale sono aggiornati;
- gli ADR sono aggiornati per ogni deviazione dal target architetturale di riferimento;
- debito residuo e' scritto in issue, con priorita' e owner.

## Anti-pattern

- Riscrivere tutto prima di aver misurato il debito reale.
- Saltare entity map / dependency map e rifattorizzare "a istinto" i package.
- Accettare scelte del prototipo come architettura di produzione senza
  ADR di deroga (auth `bcryptjs+jose`, Hono in Next.js, Vercel Blob,
  deploy Vercel).
- Mettere logica business negli endpoint Hono, nei Route Handler Next.js o
  in `packages/platform/` invece che nel modulo del bounded context.
- Accedere al client Drizzle o SQL raw dai service/handler invece che
  attraverso repository su Port di dominio.
- Duplicare middleware di tracing o auth in ogni modulo invece di usare
  servizi platform condivisi.
- Rilasciare in production senza trace OTel -> App Insights sui flussi critici.
- Aprire PR grandi che mischiano refactor, feature e migrazioni.
- Usare AET come code review ordinaria.
- Mettere deploy, env o segreti "a mano" senza documentazione ne'
  rotazione.
- Chiudere una issue funzionale senza coinvolgere il tester quando
  previsto.
- Introdurre uno strato strutturale nuovo (auth, messaging, persistence,
  deploy) senza ADR e senza confronto con il target architetturale di riferimento.
- ADR solo in chat o in issue senza file in `docs/adr/`.

