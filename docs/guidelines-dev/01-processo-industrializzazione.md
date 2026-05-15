# Processo di industrializzazione

Stato: bozza v0.3. Audience: dev di ingegnerizzazione, dev di prototipazione,
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
   deroghe al target.

La review produce una lista breve di issue tecniche prioritarie, non una
riscrittura preventiva del prototipo.

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

- Vitest come test framework unico per unit e integration, backend e
  frontend.
- Playwright per E2E, accessibility (axe), visual regression e perf sui
  journey critici.
- Testcontainers (Postgres, Redis, eventuale emulator Service Bus) come
  base per gli integration test che toccano infrastruttura reale.
- `dependency-cruiser` come architecture test, eseguito in CI come
  quality gate (regole esagonali intra-modulo e inter-package).
- Coverage minima da pretendere su ogni issue:
  - unit per le regole di business pure;
  - integration per ogni route principale (happy path, validazione,
    autorizzazione, errore di dominio, errore tecnico);
  - E2E o manuale tracciato sui journey critici.
- Nessuna issue passa a done se gli Acceptance Criteria non hanno
  evidenza di test, anche manuale.

### Operabilita'

- Health endpoint sempre presente; readiness/liveness separate per i
  container in Azure Container Apps.
- Logging strutturato (JSON) senza token, password o PII; correlation ID
  propagato attraverso il mediator e nei log dei worker.
- Observability via OpenTelemetry Node SDK (log, metriche, tracing) come
  default piattaforma; export configurato per ambiente (es. App Insights,
  collector OTLP).
- Runbook minimo per: avvio locale (con `.NET Aspire` se usato come
  orchestratore di sviluppo), deploy, rollback, debug env, rotazione
  segreti, ripristino DB.
- Errori ricorrenti e debito operativo trasformati in issue, con priorita'
  e owner. Niente knowledge solo orale.

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
  evidenza;
- build, lint, test e `dependency-cruiser` passano;
- `mesa verify` passa o le eccezioni sono motivate;
- env e segreti sono documentati correttamente (con scoping per ambiente
  e riferimento al secret store target);
- migrazioni `drizzle-kit` sono versionate, provate su preview e descritte
  nel runbook;
- README, runbook e manuale funzionale sono aggiornati;
- gli ADR sono aggiornati per ogni deviazione dal target architetturale di riferimento;
- debito residuo e' scritto in issue, con priorita' e owner.

## Anti-pattern

- Riscrivere tutto prima di aver misurato il debito reale.
- Accettare scelte del prototipo come architettura di produzione senza
  ADR di deroga (auth `bcryptjs+jose`, Hono in Next.js, Vercel Blob,
  deploy Vercel).
- Mettere logica business negli endpoint Hono o nei Route Handler
  Next.js invece che in `application/`.
- Accedere al client Drizzle dagli handler invece che attraverso il
  repository di dominio.
- Aprire PR grandi che mischiano refactor, feature e migrazioni.
- Usare AET come code review ordinaria.
- Mettere deploy, env o segreti "a mano" senza documentazione ne'
  rotazione.
- Chiudere una issue funzionale senza coinvolgere il tester quando
  previsto.
- Introdurre uno strato strutturale nuovo (auth, messaging, persistence,
  deploy) senza ADR e senza confronto con il target architetturale di riferimento.

