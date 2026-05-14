# SEASYDE_AI -- Architecture Decision Book

> Documento architetturale di dettaglio per il framework applicativo aziendale.
> Stato: DRAFT -- in fase di completamento decisioni.
> Ultimo aggiornamento: 2026-05-14 (rilavorazione stack: TypeScript + Next.js + Hono + Postgres + Drizzle + Turborepo; Aspire confermato come orchestratore di sviluppo).

---

## Indice

- [Capitolo 1 -- Executive Summary](#capitolo-1----executive-summary)
- [Capitolo 2 -- Cruscotto Decisioni](#capitolo-2----cruscotto-decisioni)
- [Capitolo 3 -- Stack Tecnologico](#capitolo-3----stack-tecnologico)
- [Capitolo 4 -- Tecnologia UI](#capitolo-4----tecnologia-ui)
- [Capitolo 5 -- Stile API](#capitolo-5----stile-api)
- [Capitolo 6 -- Persistenza e Data Access](#capitolo-6----persistenza-e-data-access)
- [Capitolo 7 -- Identity, Autenticazione e Sicurezza](#capitolo-7----identity-autenticazione-e-sicurezza)
- [Capitolo 8 -- Architettura dei Repository](#capitolo-8----architettura-dei-repository)
- [Capitolo 9 -- Framework Building Blocks](#capitolo-9----framework-building-blocks)
- [Capitolo 10 -- Shared UI](#capitolo-10----shared-ui)
- [Capitolo 11 -- Business Modules e Application Hosts](#capitolo-11----business-modules-e-application-hosts)
- [Capitolo 12 -- Workers e Background Processes](#capitolo-12----workers-e-background-processes)
- [Capitolo 13 -- Testing Strategy](#capitolo-13----testing-strategy)
- [Capitolo 14 -- Migration Strategy](#capitolo-14----migration-strategy)
- [Capitolo 15 -- Backlog Streams](#capitolo-15----backlog-streams)
- [Capitolo 16 -- Rischi e Mitigazioni](#capitolo-16----rischi-e-mitigazioni)
- [Capitolo 17 -- Discovery Results](#capitolo-17----discovery-results)
- [Appendice A -- Glossario](#appendice-a----glossario)

---

## Capitolo 1 -- Executive Summary

### 1.1 Scopo del progetto

SEASYDE_AI non e' il porting di un'applicazione legacy. E' la costruzione di una **application platform interna**: un framework condiviso che funge da base tecnica, architetturale e UI per costruire sopra di essa molteplici applicazioni business indipendenti.

Il framework centralizza:
- standard architetturali e convenzioni
- building blocks tecnici trasversali
- sicurezza, identity, audit, observability
- UI shell, theming e componenti condivisi
- gestione errori, configurazione, background jobs

Le applicazioni business compongono il framework, non lo ereditano rigidamente.

### 1.2 Cosa il framework e' e cosa non e'

| Il framework E' | Il framework NON E' |
|---|---|
| Base tecnica condivisa | Un'applicazione business |
| Building blocks riusabili | Contenitore di use case specifici |
| Shell UI e design system | Repository di pagine di dominio |
| Standard di sicurezza e audit | Logica di workflow di una singola app |
| Convenzioni e guardrail | Scorciatoia per la prima migrazione |
| Pacchetti npm consumati dai prodotti verticali | Monorepo che contiene codice dei prodotti |

### 1.3 Regola del confine

> **Se un componente non e' ragionevolmente riusabile da almeno una seconda applicazione plausibile, non deve stare nel framework.**

Questa regola e' il criterio ultimo per ogni decisione di inclusione/esclusione.

### 1.4 Principi architetturali fondamentali

1. **Separazione framework/app** -- confini forti, dipendenze unidirezionali
2. **Modular monolith** -- moduli isolati composti dagli host, non microservizi frammentati
3. **Worker separati dove serve** -- processi autonomi per responsabilita' che richiedono isolamento
4. **Coerenza imposta, non suggerita** -- il framework definisce regole verificabili, non linee guida opzionali
5. **Composizione sopra ereditarieta'** -- le app compongono building blocks, non estendono classi base rigide
6. **Aggiornabilita' centralizzata** -- un aggiornamento ai pacchetti del framework si propaga a tutte le app che alzano la versione
7. **Niente porting 1:1** -- ogni capability legacy viene classificata, ripensata e ricostruita

### 1.5 Diagrammi architetturali

#### C4 Context -- Vista di sistema

```mermaid
C4Context
    title Seaside Platform -- System Context

    Person(dev, "Team Verticale", "Sviluppa applicazioni business")
    Person(enduser, "Utente Finale", "Usa le applicazioni business")
    Person(fwteam, "Team Framework", "Mantiene la piattaforma")

    System(seaside, "Seaside Platform", "Framework applicativo TypeScript: pacchetti npm @seaside/* (BuildingBlocks + Shared + Shared.UI)")
    System(verticalapp, "Applicazione Verticale", "App business (es. DISCLOSURE 2.0) costruita sul framework")

    System_Ext(aad, "Azure AD / B2C", "Identity provider")
    System_Ext(azuresb, "Azure Service Bus", "Message broker")
    System_Ext(pgsql, "Azure Database for PostgreSQL", "Database per-instance")
    System_Ext(azureblob, "Azure Blob Storage", "File storage")
    System_Ext(keyvault, "Azure Key Vault", "Secrets management")
    System_Ext(redis, "Redis", "Session store + cache distribuita")

    Rel(fwteam, seaside, "Sviluppa, pubblica pacchetti npm")
    Rel(dev, verticalapp, "Sviluppa moduli business")
    Rel(verticalapp, seaside, "Consuma via npm")
    Rel(enduser, verticalapp, "Usa via browser")
    Rel(verticalapp, aad, "Autenticazione")
    Rel(verticalapp, azuresb, "Integration events")
    Rel(verticalapp, pgsql, "Persistenza dati")
    Rel(verticalapp, azureblob, "File upload/download")
    Rel(verticalapp, keyvault, "Secrets")
    Rel(verticalapp, redis, "Sessioni + cache")
```

#### C4 Container -- Struttura di una applicazione verticale

```mermaid
C4Container
    title Applicazione Verticale -- Container Diagram

    Person(user, "Utente", "Browser")

    Container_Boundary(app, "Applicazione Verticale") {
        Container(web, "Next.js Web", "Next.js (React + Node.js)", "Frontend + BFF nello stesso processo: pagine SSR/CSR, Route Handlers /api, Auth.js, httpOnly cookie")
        Container(api, "API Host", "Hono su Node.js", "API HTTP + Mediator. Moduli business composti qui")
        Container(worker, "Worker", "Node.js process (BullMQ opt-in)", "Job schedulati, relay outbox, consumer eventi")
        ContainerDb(db, "PostgreSQL", "Azure DB for PostgreSQL", "Un database per-instance. Schema per modulo")
        Container(cache, "Redis", "Cache + Sessions + Queue", "Sessioni server-side, cache distribuita, BullMQ backend")
    }

    System_Ext(broker, "Azure Service Bus", "Message broker (integration events)")
    System_Ext(blob, "Azure Blob Storage", "File storage")
    System_Ext(idp, "Identity Provider", "AAD / B2C / Google / SAML2")

    Rel(user, web, "HTTPS")
    Rel(web, api, "HTTP interno, JWT server-to-server")
    Rel(api, db, "Drizzle")
    Rel(api, cache, "ICache (Redis adapter)")
    Rel(api, broker, "MessageBus (publish)")
    Rel(api, blob, "FileStorageService")
    Rel(worker, db, "Drizzle (outbox relay)")
    Rel(worker, broker, "MessageBus (consume + publish)")
    Rel(web, idp, "OpenID Connect / SAML2 (via Auth.js)")
    Rel(web, cache, "Sessions (Auth.js adapter)")
```

#### C4 Component -- Building Blocks e dipendenze

```mermaid
graph TD
    subgraph "Building Blocks (pacchetti @seaside/*)"
        ABS["@seaside/abstractions<br/>Entity, CurrentUser, Result, MessageBus"]
        DOM["@seaside/domain<br/>Entity, AggregateRoot, ValueObject, DomainEvent"]
        APP["@seaside/application<br/>Mediator, Pipeline, CQRS types"]
        INF["@seaside/infrastructure<br/>Drizzle base, Repository base, UoW"]
        SEC["@seaside/security<br/>Auth helpers, RBAC, CSP, headers"]
        AUD["@seaside/audit<br/>Audit hook, IAuditLogger"]
        OBS["@seaside/observability<br/>Logging, Metrics, Tracing (OTel)"]
        CFG["@seaside/configuration<br/>ModuleConfiguration, FeatureFlags"]
        BJ["@seaside/background-jobs<br/>BackgroundJob abstraction, BullMQ adapter"]
        HOK["@seaside/hooks<br/>PreSaveHook, PostSaveHook"]
        FS["@seaside/file-storage<br/>FileStorageService, Blob/Local"]
        EH["@seaside/error-handling<br/>Problem Details, error mapping"]
        HE["@seaside/hierarchical-entities<br/>Tree queries (materialized path)"]
        SM["@seaside/state-machine<br/>Transitions, Guards"]
        WS["@seaside/workspace<br/>Scoping, Drizzle query filter"]
        MSG["@seaside/messaging-azure-sb<br/>Outbox/Inbox, Service Bus adapter"]
        DF["@seaside/dynamic-forms<br/>Schema engine + React renderer"]
        IDN["@seaside/identity<br/>Multi-provider login (Auth.js)"]
        USR["@seaside/users<br/>User, Role, Permission"]
    end

    ABS --> DOM
    ABS --> EH
    DOM --> APP
    APP --> HOK
    DOM --> INF
    APP --> INF
    INF --> SEC
    INF --> AUD
    INF --> CFG
    SEC --> IDN
    IDN --> USR
    DOM --> DF
    INF --> DF
    ABS --> MSG

    style ABS fill:#4a90d9,color:#fff
    style DOM fill:#7bc67e,color:#fff
    style APP fill:#7bc67e,color:#fff
    style INF fill:#e8a838,color:#fff
    style SEC fill:#e06666,color:#fff
```

---

## Capitolo 2 -- Cruscotto Decisioni

Questo capitolo e' l'indice centrale di tutte le decisioni architetturali del progetto.

**Legenda stati:**
- **CONFERMATA** -- decisione presa, non modificabile senza ADR
- **DA DECIDERE** -- analisi completa disponibile, serve scelta del committente
- **DA APPROFONDIRE** -- dipende da discovery o informazioni non ancora disponibili
- **RACCOMANDATA** -- proposta con raccomandazione, in attesa di conferma

### 2.1 Decisioni sullo Stack Tecnologico

| ID | Decisione | Stato | Valore / Opzioni | Dettaglio |
|---|---|---|---|---|
| D-01 | Runtime target | CONFERMATA | Node.js LTS (>= 22) con TypeScript strict | [Cap. 3.1](#31-runtime) |
| D-02 | Orchestrazione (sviluppo) | CONFERMATA | .NET Aspire AppHost (orchestratore dev: Postgres, Next.js, API Node, worker). Niente ServiceDefaults .NET: telemetria via OpenTelemetry Node SDK | [Cap. 3.2](#32-orchestrazione-net-aspire) |
| D-03 | Monorepo + package management | CONFERMATA | Turborepo + npm workspaces. Ogni repo (framework e verticali) e' un Turborepo autonomo | [Cap. 3.3](#33-monorepo-turborepo--npm-workspaces) |
| D-04 | Formato progetti | CONFERMATA | TypeScript strict + ESM. `package.json` + `tsconfig.json` per package. Build via tsup/tsc | [Cap. 3.4](#34-formato-progetti) |

### 2.2 Decisioni sulla UI

| ID | Decisione | Stato | Valore / Opzioni | Dettaglio |
|---|---|---|---|---|
| D-10 | Tecnologia frontend | CONFERMATA | Next.js (App Router) + React 19 | [Cap. 4](#capitolo-4----tecnologia-ui) |
| D-11 | Component library | CONFERMATA | Ant Design (React) come baseline dal giorno 1. Componenti framework `<Seaside*>` wrappano AntD dietro API unica. Eventuali librerie advanced (grid enterprise, scheduler) integrate dietro lo stesso wrapper se servira' | [Cap. 10.4](#104-component-library) |
| D-12 | Theming approach | CONFERMATA | Design tokens imposti dal framework (CSS variables + AntD ConfigProvider). Le app personalizzano colori/branding entro vincoli definiti | [Cap. 10.3](#103-theming-e-design-system) |
| D-13 | Dynamic Forms engine | CONFERMATA | Capability PLATFORM. React + `react-hook-form` + `zod` come baseline. Renderer custom schema-driven nel pacchetto `@seaside/dynamic-forms` | [Cap. 9.1](#91-elenco-dei-building-blocks-proposti) |

### 2.3 Decisioni sullo Stile API

| ID | Decisione | Stato | Valore / Opzioni | Dettaglio |
|---|---|---|---|---|
| D-20 | Stile API backend | CONFERMATA | Vertical Slices con Hono + Mediator custom (DDD-aligned) | [Cap. 5](#capitolo-5----stile-api) |
| D-21 | Libreria mediator | CONFERMATA | Custom lightweight nel pacchetto `@seaside/application`. Zero dipendenze esterne, controllo totale, nessun rischio licensing | [Cap. 5.5](#55-scelta-della-libreria-mediator) |
| D-22 | Convenzione Result types | CONFERMATA | `Result<T>` + Zod nel pipeline + Problem Details (RFC 9457). Nessuna eccezione per flow control | [Cap. 5.6](#56-result-types-e-error-handling-pattern) |
| D-23 | Architettura interna moduli | CONFERMATA | Hexagonal Architecture (Ports & Adapters). Regole di dipendenza intra-modulo verificate da architecture tests (`dependency-cruiser`) | [Cap. 5.9](#59-architettura-interna-dei-moduli-hexagonal) |

### 2.4 Decisioni sulla Persistenza

| ID | Decisione | Stato | Valore / Opzioni | Dettaglio |
|---|---|---|---|---|
| D-30 | Database target | CONFERMATA | PostgreSQL (>= 16) -- in produzione Azure Database for PostgreSQL Flexible Server | [Cap. 6.1](#61-database-target) |
| D-31 | ORM / data access | CONFERMATA | Drizzle ORM (type-safe, SQL trasparente, edge-ready, migrations integrate via `drizzle-kit`) | [Cap. 6.2](#62-orm) |
| D-32 | DB schema strategy | CONFERMATA | Schema Postgres per modulo (es. `orders`, `inventory`) + schema di framework (`platform`) per entita' di piattaforma. Un'unica istanza database, isolamento via schema | [Cap. 6.3](#63-dbcontext-strategy) |
| D-33 | Migration strategy | CONFERMATA | `drizzle-kit` per generazione + applicazione migrazioni per schema. Al deploy il container API applica le migrazioni pendenti del proprio modulo | [Cap. 6.4](#64-migration-strategy) |
| D-34 | Repository pattern | CONFERMATA | Si, repository pattern. Il DB e' totalmente mascherato dietro repository (Port), coerente con architettura esagonale (D-23) | [Cap. 6.5](#65-repository-pattern) |
| D-35 | Read/Write separation | CONFERMATA | CQRS leggero come pattern principale, non mandatorio. Ogni modulo sceglie in base alla propria complessita' | [Cap. 6.6](#66-readwrite-separation) |
| D-36 | Strategia SP/Views legacy | CONFERMATA | sAN/vAN -> REWRITE in TypeScript/Drizzle. sEX/vEX -> EVALUATE caso per caso (eventuale view Postgres mantenuta solo se performance-critical). Nessun porting cieco | [Cap. 6.7](#67-strategia-stored-procedure-e-views-legacy) |
| D-37 | Strategia connection string DB | CONFERMATA | Environment variables (`DATABASE_URL` standard Postgres). Nessun hardcoding. Aspire inietta in dev, env var per debug/prod | [Cap. 6.8](#68-strategia-di-connessione-al-database) |

### 2.5 Decisioni su Identity e Sicurezza

| ID | Decisione | Stato | Valore / Opzioni | Dettaglio |
|---|---|---|---|---|
| D-40 | Provider auth supportati | CONFERMATA | Tutti i provider legacy: AAD, AAD B2C, Google, SAML2, custom forms, Teams, PBI | [Cap. 7](#capitolo-7----identity-autenticazione-e-sicurezza) |
| D-41 | Pattern autenticazione | CONFERMATA | Auth.js (NextAuth v5) multi-provider integrato nel BFF Next.js. JWT server-to-server per chiamate Next -> API Hono. Tutti i provider legacy supportati dal giorno 1 | [Cap. 7.2](#72-pattern-di-autenticazione) |
| D-42 | Modello autorizzazione | CONFERMATA | RBAC permission-based + Workspace scoping (opt-in). Permessi granulari per modulo, scoped opzionalmente per workspace | [Cap. 7.3](#73-modello-di-autorizzazione) |
| D-43 | Gestione utenti/ruoli | CONFERMATA | Framework-level. Utenti, ruoli, permessi, gruppi come entita' di piattaforma. Workspace come building block opt-in | [Cap. 7.4](#74-gestione-utentiruoli) |
| D-44 | BFF / token storage | CONFERMATA | Next.js stesso e' il BFF: Route Handlers `/api/*` + Auth.js gestiscono sessione e proxy verso API Hono. httpOnly cookie nativo. JWT mai esposto al browser | [Cap. 7.6](#76-bff-pattern-e-token-management) |
| D-45 | Session management | CONFERMATA | Sessioni server-side (Redis primario, Postgres fallback) via Auth.js adapter. Multi-sessione configurabile. Timeout → popup → redirect logout | [Cap. 7.7](#77-session-management) |
| D-46 | Secrets management | CONFERMATA | Azure Key Vault (primario) + env var (non-Azure / dev). Rotation manuale. Key rotation JWT server-to-server senza downtime | [Cap. 7.8](#78-secrets-management) |
| D-47 | Security hardening | CONFERMATA | CSP, CORS, rate limiting (Hono middleware), CSRF double-submit cookie, DOMPurify per rich text, security headers di default | [Cap. 7.9](#79-security-hardening) |

### 2.6 Decisioni sull'Architettura dei Repository

| ID | Decisione | Stato | Valore / Opzioni | Dettaglio |
|---|---|---|---|---|
| D-50 | Multi-tenancy | CONFERMATA | Non prevista | -- |
| D-51 | Modello repository | CONFERMATA | Multi-repo, ognuno Turborepo: framework pubblica pacchetti npm `@seaside/*` su feed privato, verticali in repo separati che li consumano | [Cap. 8.1](#81-modello-multi-repo) |
| D-52 | Root namespace | CONFERMATA | `@seaside` (npm scope) | [Cap. 8.9](#89-naming-e-namespace) |
| D-53 | Workspace structure | CONFERMATA | Un Turborepo per il framework repo, un Turborepo per ogni vertical repo. `pnpm`/`npm` workspaces dentro ognuno | [Cap. 8.10](#810-solution-structure) |
| D-54 | Nome prima business app | CONFERMATA | DISCLOSURE 2.0 | [Cap. 11.4](#114-primo-host-applicativo) |
| D-55 | CI/CD e deployment model | CONFERMATA | Dev produce artifact (Docker image per servizio), IT deploya su Azure Container Apps. Azure Database for PostgreSQL esterno ai container. Separazione per compliance. | [Cap. 8.11](#811-cicd-e-produzione-artifact) |

### 2.7 Decisioni su Messaging e Comunicazione

| ID | Decisione | Stato | Valore / Opzioni | Dettaglio |
|---|---|---|---|---|
| D-56 | Eventual consistency | CONFERMATA | Principio architetturale mandatorio. I moduli non si aspettano reazioni sincrone dagli altri moduli | [Cap. 8.8](#88-comunicazione-tra-moduli-business) |
| D-57 | Comunicazione cross-modulo | CONFERMATA | Async con buffering queue, mandatorio. Integration Events via message broker | [Cap. 8.8](#88-comunicazione-tra-moduli-business) |
| D-58 | Message broker | CONFERMATA | Azure Service Bus (primario, deploy Azure) + NATS JetStream (futuro, alternativa). Astrazione `MessageBus` dal giorno 1 | [Cap. 8.8.1](#881-message-broker) |
| D-59 | Delivery guarantee | CONFERMATA | Outbox/Inbox pattern. L'evento viene scritto in tabella outbox nella stessa transazione del commit della Unit of Work | [Cap. 8.8.2](#882-outboxinbox-pattern) |

### 2.8 Decisioni sui Building Blocks

| ID | Decisione | Stato | Valore / Opzioni | Dettaglio |
|---|---|---|---|---|
| D-60 | Elenco building blocks | CONFERMATA | Lista confermata nel Cap. 9: Abstractions, Domain, Application, ErrorHandling, Hooks, Infrastructure, Security, Audit, Observability, Configuration, BackgroundJobs, Identity, Users, DynamicForms, HierarchicalEntities, StateMachine, Messaging, Workspace, FileStorage | [Cap. 9](#capitolo-9----framework-building-blocks) |
| D-61 | Granularita' dei progetti | CONFERMATA | Un package npm `@seaside/*` per building block. Ogni consumer prende solo cio' che serve | [Cap. 9.2](#92-granularita-dei-progetti) |
| D-62 | Abstractions strategy | CONFERMATA | Ibrido: `@seaside/abstractions` con nucleo minimo comune + ogni BB espone le proprie interfacce specifiche | [Cap. 9.3](#93-abstractions-strategy) |

### 2.9 Decisioni sui Workers

| ID | Decisione | Stato | Valore / Opzioni | Dettaglio |
|---|---|---|---|---|
| D-70 | Pattern worker standard | CONFERMATA | Processo Node.js dedicato (singolo entrypoint per worker) basato su `@seaside/background-jobs`. BullMQ (Redis) come libreria di queue/scheduling integrata, attivabile dai singoli verticali se serve un dashboard job o cron locali avanzati | [Cap. 12.3](#123-pattern-standard-per-worker) |
| D-71 | Scheduling / queue management | CONFERMATA | Scheduler.Worker separato che pubblica job su `MessageBus` (D-58). Stessa astrazione del messaging: Azure Service Bus primario, NATS JetStream alternativa futura | [Cap. 12.4](#124-scheduling) |

### 2.10 Decisioni su Testing

| ID | Decisione | Stato | Valore / Opzioni | Dettaglio |
|---|---|---|---|---|
| D-80 | Test framework | CONFERMATA | Vitest (unit + integration backend/frontend), Playwright (E2E + a11y + visual + perf) | [Cap. 13.1](#131-test-framework) |
| D-81 | Architecture tests | CONFERMATA | `dependency-cruiser` -- regole inter-package (Cap. 8.7) e regole intra-modulo hexagonal (D-23). Eseguito in CI come quality gate | [Cap. 13.4](#134-architecture-tests) |
| D-82 | Integration test strategy | CONFERMATA | Testcontainers for Node.js (Postgres, Redis, Azure Service Bus emulator) | [Cap. 13.3](#133-integration-tests) |

### 2.11 Riepilogo rapido per stato

| Stato | Conteggio |
|---|---|
| CONFERMATA | 35 |
| DA DECIDERE | 0 |
| **Totale** | **35** |

> Nota: la discovery dei 4 repository legacy e di riferimento e' stata completata.
> I risultati sono documentati nel [Capitolo 17](#capitolo-17----discovery-results).
> Le classificazioni dettagliate sono in `.planning/capability-classification.md`.

---

## Capitolo 3 -- Stack Tecnologico

### 3.1 Runtime

**Decisione D-01: CONFERMATA**

Target: **Node.js LTS (>= 22)** con **TypeScript** in modalita' `strict`. Modulo: ESM nativo (`"type": "module"`).

Implicazioni:
- Stack omogeneo tra frontend (Next.js) e backend (Hono): un solo linguaggio (TypeScript), un solo runtime (Node.js)
- TypeScript strict + `tsconfig` base condiviso dal framework garantiscono coerenza di tipi tra pacchetti
- ESM ovunque: niente CommonJS in nuovo codice. I pacchetti `@seaside/*` espongono ESM (e opzionalmente CJS via tsup) per compatibilita' con tooling legacy
- Performance native sufficienti per i workload target (modular monolith, non low-latency trading)
- Possibilita' futura di migrare singoli worker su runtime alternativi (Bun, Deno) se emerge un bisogno -- l'astrazione dei pacchetti `@seaside/*` lo permette

> **Nota su Node vs Bun/Deno**: Node.js e' la scelta primaria per maturita' ecosistema, compatibilita' con tooling enterprise (Azure SDK, OpenTelemetry, Auth.js, Drizzle), supporto LTS. Bun e Deno restano valutabili per worker performance-critical in futuro, ma non per la baseline.

### 3.2 Orchestrazione (.NET Aspire)

**Decisione D-02: CONFERMATA**

.NET Aspire viene mantenuto come **orchestratore di sviluppo**. Resta valido nonostante il backend non sia piu' .NET, perche' supporta nativamente l'orchestrazione di processi Node.js e di risorse esterne (Postgres, Redis, Azure Service Bus).

**Ruolo nel framework:**

- **AppHost**: progetto Aspire (`.NET 9`) presente in ogni vertical repo. Non contiene business logic. Compone risorse e servizi:
  - Risorse: Postgres, Redis, Azure Service Bus (locale o connection string)
  - Servizi: app Next.js (`AddNpmApp("web", "../apps/web")`), API Hono (`AddNodeApp("api", "../apps/api")`), worker Node (`AddNodeApp("worker", "../apps/worker")`)
  - Relazioni: `WithReference(postgres)`, `WaitFor(postgres)`, propagazione automatica delle env var di connessione
- **ServiceDefaults**: NON adottato in versione .NET. I servizi Node.js implementano gli stessi standard (OpenTelemetry traces/metrics/logs, health endpoint `/health` e `/alive`, retry policy HTTP) tramite un pacchetto interno `@seaside/observability` + `@seaside/http-resilience`. Aspire dashboard riceve telemetria via OTLP HTTP esposto dall'AppHost.

**Cosa Aspire continua a fornire:**

- Orchestrazione locale coerente (F5 / `dotnet run --project AppHost` avvia tutto)
- Service discovery automatico tra container e processi Node
- Dashboard di observability integrata (traces, logs, metrics, env var, console output)
- Gestione risorse dichiarativa con container Docker
- Generazione del manifest `aspire-manifest.json` per il publish (cap. 8.11)

**Esempio AppHost per stack Node:**

```csharp
var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithDataVolume()
    .AddDatabase("appdb");

var redis = builder.AddRedis("cache");

var serviceBus = builder.ExecutionContext.IsPublishMode
    ? builder.AddConnectionString("messaging")
    : builder.AddAzureServiceBus("messaging");

var api = builder.AddNodeApp("api", "../apps/api", "start")
    .WithReference(postgres)
    .WithReference(redis)
    .WithReference(serviceBus)
    .WithHttpEndpoint(port: 7001, env: "PORT")
    .WithOtlpExporter();

var worker = builder.AddNodeApp("worker", "../apps/worker", "start")
    .WithReference(postgres)
    .WithReference(redis)
    .WithReference(serviceBus)
    .WithOtlpExporter();

builder.AddNpmApp("web", "../apps/web", "dev")
    .WithReference(api)
    .WithHttpEndpoint(env: "PORT")
    .WithEnvironment("AUTH_SECRET", builder.AddParameter("auth-secret", secret: true))
    .WithOtlpExporter();

builder.Build().Run();
```

**Vincoli:**

- L'AppHost e' l'unico progetto .NET nei vertical repo. Non contiene logica di business
- Aspire e' uno strumento di sviluppo + un generatore di manifest per il deploy. In produzione i container girano su Azure Container Apps senza Aspire runtime
- In CI/CD non viene mai eseguito l'AppHost: ogni container Node ha il proprio `Dockerfile` e viene buildato/testato indipendentemente

### 3.3 Monorepo: Turborepo + npm workspaces

**Decisione D-03: CONFERMATA**

Ogni repository (framework e verticali) e' un **Turborepo** con `npm workspaces` (o pnpm workspaces, decisione operativa del team).

**Cosa fornisce Turborepo:**

- Task pipeline (`turbo run build`, `turbo run test`, `turbo run lint`) con dipendenze inter-package
- Cache locale e remota (Vercel / self-hosted) dei task per build incrementali rapide
- Esecuzione parallela dei task indipendenti
- Topological awareness: se il package `@seaside/abstractions` cambia, ricompila a cascata
- `turbo.json` come unica fonte di verita' della pipeline

**Struttura tipica del framework repo:**

```
SEASYDE_AI/
├── turbo.json
├── package.json                # root, workspaces: ["packages/*", "tooling/*"]
├── tsconfig.base.json
├── packages/
│   ├── abstractions/           # @seaside/abstractions
│   ├── application/            # @seaside/application
│   ├── domain/                 # @seaside/domain
│   ├── infrastructure/         # @seaside/infrastructure
│   ├── security/               # @seaside/security
│   └── ...                     # un package per building block
└── tooling/
    ├── eslint-config/          # @seaside/eslint-config
    ├── tsconfig/               # @seaside/tsconfig
    └── dependency-cruiser/     # regole architetturali condivise
```

**Vantaggi vs Central Package Management .NET:**

- Versioning centralizzato via root `package.json` + `workspace:*` protocol (Changesets per release)
- Build cache: ricompilare solo cio' che e' cambiato
- Stessa esperienza per framework repo e vertical repo (Turborepo in entrambi)
- Tooling condiviso (eslint, tsconfig, dependency-cruiser rules) esposto come pacchetti interni

**Release dei pacchetti pubblici (framework repo):**

- `Changesets` per gestire bump di versione e changelog per pacchetto
- `npm publish` su feed privato (Azure Artifacts npm o GitHub Packages)
- Versioning unico per tutta la suite (release globale del framework), ma solo i pacchetti modificati vengono ripubblicati (cfr. Cap. 8.5)

### 3.4 Formato progetti

**Decisione D-04: CONFERMATA**

Tutti i pacchetti TypeScript usano lo stesso schema:

- `package.json` con `"type": "module"`, `exports` map, `engines.node >= 22`
- `tsconfig.json` che estende `@seaside/tsconfig/base.json` (strict, target ES2023, moduleResolution `bundler` o `nodenext`)
- Build via `tsup` (esbuild-based) per dual output ESM + dts, oppure `tsc` puro per pacchetti di soli tipi
- `vitest.config.ts` per i test
- `dependency-cruiser` configurato (eredita regole da `@seaside/dependency-cruiser` config) per architecture tests
- Niente formato legacy CommonJS / `tsc` con `outDir` non standard

Le apps Node (API Hono, worker) sono buildate con `tsup` in un singolo bundle eseguibile + sourcemap. L'app Next.js usa il proprio build (`next build`).

> **Sostituisce**: il formato SDK-style .NET descritto nella versione precedente del documento.

---

## Capitolo 4 -- Tecnologia UI

**Decisione D-10: CONFERMATA -- Next.js (App Router) + React 19**

### 4.1 Motivazione della scelta

Next.js (App Router) e' stato scelto come tecnologia frontend per le seguenti ragioni:

1. **Allineamento con il reference UI**: il reference (NewSeasidePerYuri) e' React + Ant Design 5. Adottando Next.js + React + Ant Design il framework converge tecnologicamente sul reference, riducendo l'attrito tra ispirazione UI e implementazione effettiva.
2. **Stack TypeScript end-to-end**: backend (Hono) + frontend (Next.js) condividono linguaggio, runtime, tooling, package manager. Niente "dual stack" C#/TypeScript come nella versione precedente del documento.
3. **BFF integrato**: Next.js fornisce nativamente Route Handlers (`app/api/*`) che sono il punto naturale dove vivono Auth.js e il proxy verso le API Hono. Niente progetto BFF separato (cfr. D-44, Cap. 7.6).
4. **SSR + RSC**: Server Components e SSR per LCP migliore della prima paint, hydration selettiva, niente "white screen" durante il caricamento del bundle JS.
5. **Ecosistema React maturo**: Ant Design, react-hook-form, Zod, TanStack Query, Auth.js sono tutti first-class.
6. **Routing file-based**: convenzione esplicita, nessuna configurazione, lazy loading automatico per route.

### 4.2 Implicazioni architetturali

La scelta Next.js implica:

- **Stack omogeneo TypeScript**: un solo linguaggio per frontend, BFF e backend API. Stesso `tsconfig` base, stesso linter, stesso package manager
- **Framework repo**: contiene esclusivamente pacchetti TypeScript (`@seaside/*`). I pacchetti UI (`@seaside/shell`, `@seaside/components`, `@seaside/theming`, `@seaside/dynamic-forms`) sono React puro, agnostici rispetto a Next.js per restare riutilizzabili anche in app SPA semplici
- **Vertical repo**: contiene un'app Next.js (`apps/web`) + un'app Hono (`apps/api`) + worker (`apps/worker`) + AppHost Aspire. Tutti dentro lo stesso Turborepo
- **Contratti API**: tipi condivisi via pacchetto TypeScript del verticale (es. `@disclosure/contracts`) consumato sia da `apps/api` sia da `apps/web`. Niente OpenAPI generation: i tipi sono nativamente condivisi
- **Build pipeline**: la CI/CD dei vertical repo builda Next.js (`next build`), API Hono e worker producendo 3 Docker image separate (vedi [D-55, Cap. 8.11](#811-cicd-e-produzione-artifact))
- **Aspire**: l'app Next.js viene orchestrata in development tramite `AddNpmApp("web", "../apps/web", "dev")`; le app Node tramite `AddNodeApp`

### 4.3 Contesto dalla discovery

Dalla discovery dei repository:

- **Legacy frontend (ANWebFE)**: Angular 16 con Angular Material, UIRouter, Schema Formly. NON viene adottato. Le capability UX vengono ricostruite in React/Next.js
- **Reference UI (NewSeasidePerYuri)**: costruito in React + Ant Design 5 + Express + Turborepo. E' la baseline visiva, UX e tecnologica del nuovo frontend
- **Component library**: Ant Design 5 (React) confermata come baseline (D-11, Cap. 10.4)

### 4.4 Cosa il framework deve fornire lato frontend

- Shell applicativa comune (layout, navigation, sidebar, header, workspace selector) -- pacchetto npm `@seaside/shell`
- Design system e theming condiviso -- pacchetto npm `@seaside/theming` (CSS variables + `ConfigProvider` di Ant Design)
- Componenti UI riusabili (form, tabelle, feedback, dialog) wrappati sopra Ant Design -- pacchetto npm `@seaside/components`
- Auth.js providers preconfigurati per i 7 provider del legacy -- pacchetto npm `@seaside/identity-web`
- Dynamic Forms engine (`react-hook-form` + `zod` + renderer schema-driven) -- pacchetto npm `@seaside/dynamic-forms`
- Convenzioni UX standard (validazione, empty states, loading spinner, errori, popup sessione scaduta)
- Hook per workspace context, current user, permission check -- esposti dai pacchetti `@seaside/workspace` e `@seaside/security`

### 4.5 Rendering strategy (SSR / RSC / Client Components)

Convenzione adottata in tutte le app verticali:

| Tipo di pagina | Rendering | Motivazione |
|---|---|---|
| Shell, layout, navigation | **Server Components** | Markup statico per la maggior parte, niente interattivita' pesante |
| Pagine "list" (data grid) | Server Component shell + Client Component per il grid interattivo | Initial fetch lato server, interattivita' client |
| Form (create/edit) | **Client Component** | `react-hook-form` richiede client (state, validation runtime) |
| Dashboard widget | Mix: server fetch dei dati + client render per i grafici | Caching SSR per ridurre TTFB |
| Auth pages (login, callback) | Server Component (post handler in Route Handler) | Niente JS bundle iniziale per la pagina di login |

I componenti del framework che richiedono interattivita' (`<SeasideDataGrid>`, `<SeasideForm>`) sono marcati `'use client'`. I componenti puramente strutturali (`<SeasideShell>`, `<SeasidePageHeader>`) sono Server Components dove possibile.

---

## Capitolo 5 -- Stile API

**Decisione D-20: CONFERMATA -- Vertical Slices con Hono + Mediator custom (DDD-aligned)**

Lo stile API definisce come i moduli business espongono le loro operazioni e come il framework inietta i propri standard trasversali (validazione, audit, error handling, authorization).

### 5.1 Opzione A: Framework "full DI" (NestJS)

NestJS con decoratori, DI a controller, validation pipe, guard.

**Pro:**
- Pattern familiare a chi viene da .NET / Angular (decoratori, DI)
- Ecosistema integrato (auth, swagger, ecc.)
- Comunita' ampia, documentazione abbondante

**Contro:**
- Opinato e pesante: assume un suo stile architetturale, va piegato per Hexagonal/CQRS
- Overhead di metadati (reflect-metadata, decoratori)
- "Magia" da decoratori difficile da auditare
- Maggiore dipendenza dall'ecosistema NestJS

### 5.2 Opzione B: Hono "puro"

Hono come web framework leggero (Sinatra-style), senza mediator.

**Pro:**
- Leggerissimo (~30KB), runtime-agnostic (Node, Bun, edge)
- Type-safe end-to-end (RPC client + zod)
- Performance eccellenti
- Senza ceremony

**Contro:**
- Senza convenzione forte i moduli scrivono codice eterogeneo
- Cross-cutting concerns (audit, auth, logging) replicati a mano negli handler
- Niente strato naturale per CQRS / DDD

### 5.3 Opzione C: Vertical Slices con Hono + Mediator custom (scelta)

Hono come driving adapter HTTP. Ogni use case e' una slice autonoma: Request -> Handler -> Response. Un mediator custom dispatcha le richieste. L'endpoint Hono e' solo la porta d'ingresso.

**Come funziona nel framework:**

```
[Hono route handler]
        |
        v
[Mediator Pipeline]
        |
  [LoggingBehavior]          <-- fornito dal framework
  [ValidationBehavior (zod)] <-- fornito dal framework
  [AuthorizationBehavior]    <-- fornito dal framework
  [AuditBehavior]            <-- fornito dal framework
  [ErrorHandlingBehavior]    <-- fornito dal framework
        |
        v
[Business Handler]           <-- scritto dal modulo business
        |
        v
[Result<T>]
        |
        v
[Hono response (200 / 4xx Problem Details)]
```

**Pro:**
- Ogni feature e' autocontenuta e testabile in isolamento
- Il mediator pipeline e' il punto naturale dove il framework inietta standard trasversali
- I moduli business scrivono solo handler puri -- il framework fa il resto
- Allineamento naturale con modular monolith: ogni modulo registra i propri handler
- Separazione netta tra infrastruttura (come arrivo all'handler) e logica (cosa fa l'handler)
- Cross-cutting concerns aggiunti/modificati centralmente nel framework senza toccare i moduli
- Facilita' di testing: handler testabili senza HTTP, pipeline behaviors testabili separatamente
- Hono resta leggero, niente decoratori, niente reflect-metadata

**Contro:**
- Piu' file per singolo use case (Command/Query, Handler, Schema Zod)
- Curva di apprendimento iniziale per chi non conosce il pattern mediator
- Dipendenza da una libreria mediator (qui custom -- punto a favore, vedi D-21)
- Over-engineering per endpoint banali (il framework fornisce shortcut per i pochi casi CRUD puri)

### 5.4 Opzione D: Ibrido (mix Hono puro / mediator)

Mix di handler diretti Hono e handler mediati a discrezione del modulo.

**Pro:** flessibilita' massima.
**Contro:** inconsistenza. In un framework che deve imporre coerenza, l'ibrido e' un anti-pattern. Scartata.

### 5.5 Scelta della libreria mediator

**Decisione D-21: CONFERMATA -- Custom lightweight mediator (`@seaside/application`)**

**Scelta**: mediator custom costruito nel pacchetto `@seaside/application`. Zero dipendenze esterne, controllo totale, nessun rischio licensing.

**Motivazione**: l'ecosistema TypeScript non ha un equivalente diretto di MediatR maturo e neutrale. Le librerie esistenti (`tsyringe`, `inversify` con plugin, NestJS CQRS) portano modelli DI/decoratori invasivi. Per un framework che deve durare anni, la scelta strategica e' possedere l'implementazione.

Il mediator custom e' implementato in `@seaside/application` e fornisce:

**Interfacce in `@seaside/abstractions`:**

```typescript
// CQRS base types
export interface Command<TResponse> { readonly __command: true; readonly __response?: TResponse; }
export interface Query<TResponse>   { readonly __query:   true; readonly __response?: TResponse; }

export interface CommandHandler<TCommand extends Command<TResponse>, TResponse> {
  handle(command: TCommand, ctx: HandlerContext): Promise<Result<TResponse>>;
}

export interface QueryHandler<TQuery extends Query<TResponse>, TResponse> {
  handle(query: TQuery, ctx: HandlerContext): Promise<Result<TResponse>>;
}

// Notifications (domain events, integration events)
export interface Notification { readonly __notification: true; }
export interface NotificationHandler<TNotification extends Notification> {
  handle(notification: TNotification, ctx: HandlerContext): Promise<void>;
}

// Pipeline
export type Next<TResponse> = () => Promise<Result<TResponse>>;

export interface PipelineBehavior<TRequest, TResponse> {
  handle(request: TRequest, ctx: HandlerContext, next: Next<TResponse>): Promise<Result<TResponse>>;
}

// Handler context (injected current user, logger, abort signal)
export interface HandlerContext {
  readonly currentUser: CurrentUser;
  readonly logger: Logger;
  readonly signal: AbortSignal;
  readonly correlationId: string;
}

// Mediator
export interface Mediator {
  send<TResponse>(command: Command<TResponse>): Promise<Result<TResponse>>;
  query<TResponse>(query: Query<TResponse>): Promise<Result<TResponse>>;
  publish<TNotification extends Notification>(notification: TNotification): Promise<void>;
}
```

**Implementazione in `@seaside/application`:**

```typescript
// Core: ~200 righe
// 1. Risolve l'handler dal container DI leggero (Awilix-like, fornito dal framework)
// 2. Wrappa con i pipeline behaviors registrati (in ordine)
// 3. Esegue la pipeline e ritorna Result<T>
export class SeasideMediator implements Mediator {
  constructor(
    private readonly container: Container,
    private readonly behaviors: ReadonlyArray<PipelineBehavior<unknown, unknown>>,
  ) {}

  async send<TResponse>(command: Command<TResponse>): Promise<Result<TResponse>> {
    const handler = this.container.resolveHandler(command);
    const pipeline = buildPipeline(handler, this.behaviors);
    return pipeline(command, this.buildContext());
  }
  // query() e publish() analoghi
}
```

**Pipeline behaviors forniti dal framework:**

| Behavior | Scopo | Ordine |
|---|---|---|
| `LoggingBehavior` | Log strutturato di ogni request/response (con `correlationId`, durata, esito) | 1 |
| `ValidationBehavior` | Esegue lo schema Zod associato al command/query | 2 |
| `AuthorizationBehavior` | Verifica permessi RBAC + workspace | 3 |
| `AuditBehavior` | Audit trail (solo su command) | 4 |
| `ErrorHandlingBehavior` | Cattura eccezioni inattese, produce `Result.failure(...)` con `Error` tipizzato | 5 |

I verticali possono registrare i propri behavior aggiuntivi.

**Registrazione handler (DI leggero):**

```typescript
// @seaside/application espone un helper di module-bootstrap
import { defineModule } from '@seaside/application';
import { CreateOrderCommand, CreateOrderHandler } from './application/create-order';

export const ordersModule = defineModule({
  name: 'orders',
  handlers: [
    [CreateOrderCommand, CreateOrderHandler],
    // ...
  ],
  schemas: {
    CreateOrderCommand: createOrderSchema, // Zod schema
  },
});
```

**Wiring nell'app Hono:**

```typescript
import { Hono } from 'hono';
import { seasideMediator } from '@seaside/application/hono';
import { ordersModule } from '@modulo/orders';

const app = new Hono();
const mediator = seasideMediator({
  modules: [ordersModule, /* ... */],
  behaviors: defaultBehaviors(),
});

app.post('/orders', async (c) => {
  const body = await c.req.json();
  const result = await mediator.send(new CreateOrderCommand(body));
  return c.json(...result.toHttpResponse());
});
```

**Opzioni scartate:**

- `tsyringe` + handler discovery: dipendenza da `reflect-metadata`, decoratori, runtime invasivo
- `inversify`: pesante, troppo enterprise-OO per il nostro stile funzionale TypeScript
- NestJS CQRS: porta con se tutto NestJS
- `node-mediator`, `mediatr-ts`: poco mantenuti, scarsa adozione

### 5.6 Result types e error handling pattern

**Decisione D-22: CONFERMATA -- `Result<T>` + Zod + Problem Details (Opzione A + C)**

**Scelta**: combinazione di `Result<T>` pattern + Problem Details (RFC 9457). `Result<T>` come return type degli handler, con conversione automatica in Problem Details per le risposte HTTP di errore. Zod nel mediator pipeline (ValidationBehavior) per validazione input. Nessuna eccezione per flow control.

**Opzione A -- `Result<T>` pattern (in `@seaside/abstractions`):**

```typescript
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: Error };

export type Error = {
  readonly code: string;          // es. "orders.not-found"
  readonly message: string;
  readonly type: 'validation' | 'not-found' | 'forbidden' | 'conflict' | 'internal';
  readonly details?: Record<string, unknown>;
};

export const Result = {
  ok<T>(value: T): Result<T> { return { ok: true, value }; },
  fail<T>(error: Error): Result<T> { return { ok: false, error }; },
  notFound<T>(message = 'Not found'): Result<T> { /* ... */ },
  // ...
};
```

Ogni handler ritorna un `Result<T>`. Il framework mappa automaticamente:
- `ok` -> HTTP 200 + body `value`
- `error.type === 'validation'` -> HTTP 400 Problem Details
- `'not-found'` -> 404
- `'forbidden'` -> 403
- `'conflict'` -> 409
- `'internal'` -> 500

**Opzione B -- Exception-based (scartata):**

Il framework cattura eccezioni tipizzate e le mappa in risposte HTTP. Scartata: le eccezioni non devono essere usate per flow control, e in TypeScript la tipizzazione delle eccezioni e' debole (any). `Result<T>` rende esplicito nel type system che un handler puo' fallire.

**Opzione C -- Problem Details (RFC 9457):**

Tutte le risposte di errore seguono lo standard Problem Details (`application/problem+json`). Il framework fornisce middleware Hono per la conversione automatica da `Error` a Problem Details.

### 5.7 Valutazione secondo l'approccio DDD

L'architettura del framework ha gia' diversi elementi che si allineano naturalmente con Domain-Driven Design. Questa sezione valuta come i pattern tattici e strategici DDD si integrano con le opzioni di stile API e con le decisioni gia' prese.

#### 5.7.1 DDD strategico: cosa c'e' gia'

| Concetto DDD | Corrispondenza nel framework | Riferimento |
|---|---|---|
| **Bounded Context** | Ogni modulo business e' un bounded context con confini forti (proprio schema Postgres, propri endpoint, proprio dominio) | D-32, Cap. 11 |
| **Context Map** | I moduli comunicano tramite integration events o shared contracts, mai accesso diretto | Cap. 8.8 |
| **Ubiquitous Language** | Ogni modulo usa il linguaggio del proprio dominio nei propri tipi, handler, entita'. Il framework non impone un linguaggio di dominio. | Cap. 11.1 |
| **Anti-Corruption Layer** | Il confine di pacchetto npm tra framework e verticali e' un ACL naturale. Tra moduli, i shared contracts fungono da ACL. | Cap. 8.7 |

Il modular monolith con moduli isolati **e'** DDD strategico applicato. Ogni modulo e' un bounded context con:
- Proprio dominio (entita', value objects, aggregati)
- Propria persistenza (schema Postgres isolato, schema Drizzle nel package del modulo)
- Propri endpoint (route Hono registrate dal modulo)
- Comunicazione esplicita con altri moduli (eventi, contratti)

#### 5.7.2 DDD tattico: come si mappa sulle opzioni API

I pattern tattici DDD definiscono come si organizza la logica **dentro** un bounded context. Il framework fornisce i building blocks per tutti questi pattern nel pacchetto `@seaside/domain`:

| Pattern DDD | Building Block del framework | Ruolo |
|---|---|---|
| **Entity** | `Entity<TId>` (classe base TS) | Oggetto con identita', ciclo di vita, comportamento |
| **Aggregate Root** | `AggregateRoot<TId>` | Radice di consistenza transazionale. Unico punto di accesso per modifiche al cluster di entita' |
| **Value Object** | `ValueObject` (classe base con equals strutturale) | Oggetto immutabile definito dai propri attributi, senza identita' |
| **Domain Event** | `DomainEvent` | Evento che esprime qualcosa di significativo accaduto nel dominio |
| **Domain Service** | Classe TS pura nel layer Domain del modulo | Logica di dominio che non appartiene naturalmente a una singola entita'/aggregato |
| **Repository** | Port `XxxRepository` definito in `Domain/ports`, implementato in `Infrastructure` (Drizzle) -- vedi D-34 | Accesso alla persistenza dell'aggregato |

La domanda chiave e': **dove vive la logica di dominio** e **come ci si arriva dall'API**?

#### 5.7.3 Flusso DDD con Vertical Slices + Mediator

Con l'Opzione C (raccomandata), il flusso di un'operazione di dominio e':

```
[HTTP Request]
     │
     ▼
[Hono Route Handler]                ← porta d'ingresso (infrastruttura)
     │
     ▼
[Mediator Pipeline]
  ├── Validation Behavior           ← zod schema (framework)
  ├── Authorization Behavior        ← verifica permessi (framework)
  ├── Logging Behavior              ← log strutturato (framework)
  ├── Audit Behavior                ← audit trail (framework)
  └── Error Handling Behavior       ← gestione errori (framework)
     │
     ▼
[Application Handler]               ← APPLICATION LAYER (DDD)
     │                                 Orchestrazione: carica aggregato,
     │                                 invoca metodo di dominio,
     │                                 persiste, pubblica eventi
     │
     ▼
[Aggregate Root / Entity]           ← DOMAIN LAYER (DDD)
     │                                 Logica di business pura:
     │                                 invarianti, regole, calcoli,
     │                                 produce Domain Events
     │
     ▼
[Repository (Drizzle adapter)]      ← INFRASTRUCTURE LAYER (DDD)
     │                                 Persistenza dell'aggregato
     │
     ▼
[Domain Events]                      ← Side effects asincroni
                                       Notifica altri moduli,
                                       trigger audit, etc.
```

**Dove vive la logica in questo modello:**

| Tipo di logica | Dove vive | Esempio |
|---|---|---|
| Invarianti di business | Metodi sull'Aggregate Root / Entity | `order.addItem(product, qty)` -- verifica stock, limiti, regole |
| Orchestrazione use case | Application Handler | Carica ordine, chiama `order.addItem()`, salva, pubblica evento |
| Validazione input | Schema Zod registrato per il command | Formato email, campi obbligatori, range |
| Cross-cutting | Pipeline Behaviors del framework | Audit, logging, auth, error handling |
| Reazione a eventi | Event Handler (altro modulo o stesso modulo) | `OrderPlacedEvent` -> aggiorna inventario |

#### 5.7.4 Rich Domain Model vs Anemic Domain Model

Il framework supporta entrambi gli approcci ma **incoraggia il Rich Domain Model**:

**Rich Domain Model (raccomandato per logica complessa):**

```typescript
// Domain Layer -- la logica vive nell'aggregato
export class Order extends AggregateRoot<OrderId> {
  private readonly _lines: OrderLine[] = [];

  addLine(product: Product, quantity: number): Result<void> {
    if (quantity <= 0) return Result.fail({ code: 'order.invalid-quantity', message: 'Quantity must be positive', type: 'validation' });
    if (this._lines.length >= 50) return Result.fail({ code: 'order.line-limit', message: 'Order line limit reached', type: 'validation' });

    const line = new OrderLine(product.id, product.price, quantity);
    this._lines.push(line);

    this.addDomainEvent(new OrderLineAddedEvent(this.id, line.productId, quantity));
    return Result.ok(undefined);
  }
}

// Application Layer -- l'handler orchestra, non contiene logica di business
export class AddOrderLineHandler implements CommandHandler<AddOrderLineCommand, void> {
  constructor(
    private readonly orders: OrderRepository,    // Port iniettato (D-34)
    private readonly productCatalog: ProductCatalog,
    private readonly uow: UnitOfWork,
  ) {}

  async handle(cmd: AddOrderLineCommand, _ctx: HandlerContext): Promise<Result<void>> {
    const order = await this.orders.findById(cmd.orderId);
    if (!order) return Result.notFound('Order not found');

    const product = await this.productCatalog.findById(cmd.productId);
    if (!product) return Result.notFound('Product not found');

    const added = order.addLine(product, cmd.quantity);
    if (!added.ok) return added;

    await this.orders.save(order);
    await this.uow.commit();   // outbox interceptor scrive gli eventi nella stessa transazione
    return Result.ok(undefined);
  }
}
```

**Anemic Domain Model (accettabile per CRUD semplice):**

Per moduli con poca logica di business (es. anagrafica, configurazione), l'handler puo' operare direttamente sui modelli senza aggregati ricchi, scrivendo via repository semplici. Il framework non lo vieta, ma il team deve essere consapevole del trade-off (logica spalmata negli handler invece che incapsulata nei modelli).

**Regola pratica**: se un modulo ha regole di business significative (validazioni cross-campo, invarianti, calcoli, workflow), il dominio deve essere **rich**. Se e' prevalentemente CRUD (lettura/scrittura diretta), un modello anemico e' accettabile e meno cerimonioso.

#### 5.7.5 Domain Events nel modular monolith

I Domain Events sono il meccanismo con cui:
1. Un aggregato **segnala** che qualcosa di significativo e' successo
2. Lo stesso modulo o altri moduli **reagiscono** senza coupling diretto

Il framework fornisce:
- `DomainEvent` come classe base in `@seaside/domain`
- Dispatching automatico dei domain events al commit della Unit of Work tramite hook in `@seaside/infrastructure` (analogo dell'`SaveChangesInterceptor` EF)
- Handler per domain events registrati nel mediator (stesso modulo)
- **Integration Events** per comunicazione cross-modulo (i domain events sono interni al bounded context, gli integration events escono dal confine)

```
Modulo A (bounded context)              Modulo B (bounded context)
┌──────────────────────────┐            ┌──────────────────────────┐
│ Order.AddLine()          │            │                          │
│   └── OrderLineAdded     │            │                          │
│        (Domain Event)    │            │                          │
│           │              │            │                          │
│           ▼              │            │                          │
│  [DomainEventHandler]    │            │                          │
│  Aggiorna totale ordine  │            │                          │
│           │              │            │                          │
│           ▼              │            │                          │
│  Pubblica IntegrationEvent ──────────▶│  [IntegrationEventHandler]│
│  "OrderUpdated"          │            │  Aggiorna dashboard      │
└──────────────────────────┘            └──────────────────────────┘
```

#### 5.7.6 Come le opzioni API si allineano con DDD

| Criterio DDD | NestJS (A) | Hono puro (B) | Vertical Slices + Mediator (C) |
|---|---|---|---|
| Separazione Application/Domain layer | Possibile ma decoratori e DI invasivi sporcano il dominio | Possibile ma serve disciplina | **Naturale**: handler = application service, aggregato = domain logic |
| Aggregate come unita' di consistenza | Non imposto | Non imposto | **Facilitato**: ogni command opera su un aggregato |
| Domain Events | Vanno integrati manualmente | Vanno integrati manualmente | **Pipeline behavior** puo' dispatchare eventi automaticamente al commit |
| CQRS | Pacchetto NestJS CQRS aggiuntivo | Possibile | **Nativo**: `Command<T>` e `Query<T>` sono tipi diversi con pipeline diversi |
| Testing del dominio in isolamento | Mock dei moduli NestJS | Richiede mock dell'endpoint | **Handler e dominio testabili senza HTTP** |
| Bounded context come modulo | Possibile (NestJS modules) | Possibile | **Allineamento diretto**: ogni modulo registra i propri handler, ha il proprio domain layer |

#### 5.7.7 Struttura interna di un modulo DDD

Combinando vertical slices con DDD, la struttura di un modulo business diventa:

```
modules/
  └── orders/                            # package npm @<vertical>/module-orders
      ├── package.json
      ├── tsconfig.json
      ├── src/
      │   ├── domain/                    # DOMAIN LAYER (DDD)
      │   │   ├── entities/
      │   │   │   ├── order.ts           # Aggregate Root
      │   │   │   └── order-line.ts      # Entity (child dell'aggregato)
      │   │   ├── value-objects/
      │   │   │   └── money.ts           # Value Object
      │   │   ├── events/
      │   │   │   ├── order-created.event.ts   # Domain Event
      │   │   │   └── order-line-added.event.ts
      │   │   ├── errors/
      │   │   │   └── order-errors.ts    # Error code tipizzati
      │   │   └── ports/
      │   │       └── order-repository.ts # Port (interface) -- D-34
      │   │
      │   ├── application/               # APPLICATION LAYER (DDD) = vertical slices
      │   │   ├── create-order/
      │   │   │   ├── create-order.command.ts
      │   │   │   ├── create-order.handler.ts
      │   │   │   └── create-order.schema.ts  # zod schema
      │   │   ├── add-order-line/
      │   │   │   ├── add-order-line.command.ts
      │   │   │   ├── add-order-line.handler.ts
      │   │   │   └── add-order-line.schema.ts
      │   │   ├── get-order/
      │   │   │   ├── get-order.query.ts
      │   │   │   ├── get-order.handler.ts
      │   │   │   └── get-order.response.ts
      │   │   └── event-handlers/
      │   │       └── order-created.handler.ts
      │   │
      │   ├── infrastructure/            # INFRASTRUCTURE LAYER (DDD)
      │   │   ├── schema/
      │   │   │   ├── orders.schema.ts   # Drizzle schema (schema postgres "orders")
      │   │   │   └── order-lines.schema.ts
      │   │   ├── repositories/
      │   │   │   └── drizzle-order-repository.ts
      │   │   └── integration-events/
      │   │       └── order-updated.integration-event.ts
      │   │
      │   ├── endpoints/                 # PRESENTATION (driving adapter)
      │   │   └── order-endpoints.ts     # Hono routes, sottilissimi
      │   │
      │   └── index.ts                   # esporta defineModule(...) per il bootstrap
      │
      ├── drizzle/                       # migrations del modulo (drizzle-kit)
      │   └── 0001_init.sql
      └── vitest.config.ts
```

I layer sono **logici** (cartelle), non fisici (pacchetti separati). Questo bilancia la separazione DDD con la praticita' di avere un singolo `package.json` per modulo.

> **Vincolo architetturale**: questa struttura e' formalizzata come **Hexagonal Architecture (Ports & Adapters)** nella decisione D-23 (Cap. 5.9). Le regole di dipendenza tra layer sono vincolanti e verificate da architecture tests (`dependency-cruiser`, Cap. 13.4).

### 5.8 Raccomandazione complessiva

**Vertical Slices con Hono + Mediator TS (Opzione C)** e' la scelta raccomandata.

Motivazione:

1. **Allineamento con il framework**: il mediator pipeline e' il meccanismo naturale attraverso cui il framework inietta i propri standard (validazione, audit, logging, auth, error handling) in modo trasparente. I moduli business scrivono solo handler puri focalizzati sulla logica.

2. **Allineamento con DDD**: gli handler sono application services che orchestrano il dominio. La logica di business vive negli aggregati e nelle entita', non negli handler. I domain events fluiscono naturalmente attraverso il mediator. CQRS e' nativo (command vs query come tipi distinti).

3. **Allineamento con il modular monolith**: ogni modulo e' un bounded context con propri handler, proprio domain layer, proprio DbContext. I confini sono forti e verificabili con architecture tests.

Questo allineamento su tre assi (framework, DDD, modular monolith) e' esattamente cio' che serve a un framework che deve "imporre coerenza senza vincolare".

### 5.9 Architettura interna dei moduli: Hexagonal

**Decisione D-23: CONFERMATA -- Hexagonal Architecture (Ports & Adapters)**

Ogni modulo business adotta l'architettura esagonale (Ports & Adapters, Alistair Cockburn). Questo formalizza e vincola la struttura gia' descritta nel Cap. 5.7.7.

#### 5.9.1 Principio

Il **dominio** e' al centro e non ha dipendenze verso l'esterno. Tutto cio' che il dominio necessita dal mondo esterno (persistenza, servizi esterni, notifiche) e' espresso come **Port** (interfaccia definita nel dominio). Le implementazioni concrete sono **Adapter** che vivono nei layer esterni.

```
                    ┌─────────────────────────────────┐
                    │         DRIVING ADAPTERS          │
                    │      (Endpoints / Hono routes)    │
                    │   Ricevono richieste dall'esterno │
                    └──────────────┬──────────────────┘
                                   │ chiama
                                   ▼
                    ┌─────────────────────────────────┐
                    │       APPLICATION LAYER           │
                    │   (Handlers / Use Cases)          │
                    │   Orchestra il dominio            │
                    └──────────────┬──────────────────┘
                                   │ invoca
                                   ▼
                    ┌─────────────────────────────────┐
                    │         DOMAIN (centro)           │
                    │   Entita', Aggregati, VO,         │
                    │   Domain Events, Ports            │
                    │   ZERO dipendenze esterne         │
                    └──────────────┬──────────────────┘
                                   │ definisce Ports
                                   ▼
                    ┌─────────────────────────────────┐
                    │        DRIVEN ADAPTERS            │
                    │   (Infrastructure)                │
                    │   DbContext, servizi esterni,      │
                    │   implementano i Ports             │
                    └─────────────────────────────────┘
```

#### 5.9.2 Mapping sui layer del modulo

| Concetto esagonale | Layer nel modulo | Esempio |
|---|---|---|
| **Domain (centro)** | `src/domain/` | Entita', aggregati, value objects, domain events, errori di dominio |
| **Ports (driven)** | `src/domain/ports/` | `OrderRepository`, `PaymentGateway` -- interfacce TypeScript definite dal dominio |
| **Application Services** | `src/application/` | Handler CQRS che orchestrano il dominio. Dipendono da Domain, mai da Infrastructure |
| **Driving Adapters** | `src/endpoints/` | Hono routes sottilissime: traducono HTTP in command/query e li inviano al mediator |
| **Driven Adapters** | `src/infrastructure/` | `DrizzleOrderRepository`, `StripePaymentGateway` -- implementano i Ports definiti in Domain |

#### 5.9.3 Regole di dipendenza intra-modulo

Queste regole sono **vincolanti** e verificate da architecture tests (D-81, `dependency-cruiser`):

| Layer sorgente | Puo' dipendere da | NON puo' dipendere da |
|---|---|---|
| `domain/` | Solo `@seaside/domain`, `@seaside/abstractions` | Application, Infrastructure, Endpoints, qualsiasi altro pacchetto |
| `application/` | `domain/`, `@seaside/application`, `@seaside/abstractions` | Infrastructure, Endpoints |
| `infrastructure/` | `domain/`, `application/`, `@seaside/infrastructure`, pacchetti esterni (Drizzle, Azure SDK, ecc.) | Endpoints |
| `endpoints/` | `application/` (via mediator), `@seaside/abstractions` | Domain (non direttamente), Infrastructure |

**Regola fondamentale**: le dipendenze puntano sempre verso l'interno (verso il dominio). Mai verso l'esterno.

**Conseguenze pratiche:**
- Il layer `domain/` non ha `import` da `infrastructure/` o `application/` del proprio modulo
- Un handler in `application/` accede alla persistenza solo tramite un Port definito in `domain/ports/`. L'adapter Drizzle e' iniettato dall'esterno via DI leggero (D-34)
- Gli `endpoints/` non contengono logica: ricevono la richiesta HTTP, la traducono in un command/query, la inviano al mediator, restituiscono la risposta
- Gli adapter in `infrastructure/` sono **sostituibili**: si puo' cambiare implementazione senza toccare Domain ne' Application

#### 5.9.4 Perche' layer logici e non fisici

I layer restano **cartelle** all'interno di un singolo `package.json` per modulo. Non servono pacchetti separati per Domain, Application, Infrastructure perche':
- Il confine e' imposto dagli **architecture tests** (dependency-cruiser), non dal type system
- Un singolo `package.json` per modulo semplifica build, packaging e riferimenti
- La separazione fisica creerebbe 4 pacchetti per modulo (decine di pacchetti in un verticale con molti moduli), senza valore aggiunto reale rispetto ai test architetturali

Le regole di dipendenza sono verificate a ogni build tramite `dependency-cruiser` basato su path/import (Cap. 13.4).

---

## Capitolo 6 -- Persistenza e Data Access

### 6.1 Database target

**Decisione D-30: CONFERMATA** -- **PostgreSQL** (>= 16). In produzione: **Azure Database for PostgreSQL Flexible Server**.

Motivazione:
- Open source, compatibile cloud e on-premise
- Type system ricco (JSONB, array, range, custom types) -- particolarmente adatto a payload dinamici come quelli del building block DynamicForms
- Eccellente supporto a Drizzle (D-31)
- Postgres Logical Replication abilita CDC / streaming verso analytics in futuro senza vincolare il framework
- Azure Database for PostgreSQL Flexible Server: HA built-in, backup automatici, integrazione con Key Vault, point-in-time restore

### 6.2 ORM

**Decisione D-31: CONFERMATA** -- **Drizzle ORM**.

Motivazione:
- **Type-safe by design**: gli schemi sono codice TypeScript, le query restituiscono tipi inferiti. Niente generatore di client separato (come Prisma)
- **SQL trasparente**: il livello di astrazione e' minimo, il codice Drizzle assomiglia a SQL ma in TS tipizzato. Si sa sempre cosa va sul DB
- **Migrations integrate**: `drizzle-kit generate` produce file SQL versionati a partire dai cambiamenti di schema. `drizzle-kit migrate` li applica
- **Edge-ready**: zero overhead di avvio, no client generato pesante, runtime piccolo (compatibile anche con Bun/Deno futuri)
- **Allineamento Hexagonal**: i repository (D-34) sono adapter Drizzle che nascondono completamente l'ORM dietro i Port di dominio

**Opzioni scartate:**
- **Prisma**: schema-first con DSL proprietario, genera client pesante, query meno trasparenti
- **TypeORM**: decoratori, simil EF Core, ma meno attivamente mantenuto e non ESM-first
- **Kysely**: ottimo query builder ma niente migrations integrate; resta valido per query complesse opt-in dentro Drizzle (sono interoperabili)

### 6.3 Schema strategy

**Decisione D-32: CONFERMATA -- Schema Postgres per modulo + schema di framework**

In un modular monolith, l'isolamento dei dati e' un vincolo architetturale. Postgres fornisce gli **schema** come unita' di isolamento all'interno della stessa istanza database.

**Strategia adottata: Opzione A -- uno schema per modulo + uno schema di framework**

Ogni modulo business definisce le proprie tabelle in uno schema dedicato (es. `orders`, `inventory`, `documents`). Il framework definisce le proprie tabelle nello schema `platform`.

```
appdb (database Postgres)
├── schema "platform"          -- entita' framework
│   ├── users
│   ├── roles
│   ├── permissions
│   ├── workspaces
│   ├── audit_log
│   └── outbox_dispatcher       -- coordinamento outbox cross-modulo
├── schema "orders"            -- modulo Orders
│   ├── orders
│   ├── order_lines
│   ├── outbox_messages
│   └── inbox_messages
└── schema "inventory"         -- modulo Inventory
    ├── stock_items
    ├── reservations
    ├── outbox_messages
    └── inbox_messages
```

**Pro:**
- Isolamento forte: ogni modulo gestisce solo il proprio schema
- Le migrazioni sono indipendenti per modulo (drizzle-kit applica per schema)
- Nessun coupling accidentale tra moduli via tabella
- Una sola istanza Postgres (operativamente semplice) ma isolamento logico forte
- Possibilita' futura di estrarre uno schema verso un database dedicato senza riscrivere le query (basta cambiare il connection target del modulo)

**Contro:**
- Le transazioni cross-schema sono possibili ma vietate per convenzione (rispetto del bounded context)
- Gli `outbox_messages` sono per modulo, ma il publisher (`outbox-relay`) e' un servizio framework che legge tutti gli schema -- l'organizzazione e' nel pacchetto `@seaside/messaging-azure-sb`

**Opzione B -- Database fisicamente separati per modulo:** scartata come default. Aggiunge complessita' operativa senza valore aggiunto reale per il modular monolith. Resta possibile come evoluzione futura.

**Opzione C -- Schema unico condiviso:** scartata. Coupling forte tra moduli via tabella, viola il principio di isolamento.

**Accesso a dati cross-modulo e dati framework:**

I moduli business **non accedono mai direttamente** allo schema Drizzle di altri moduli ne' allo schema `platform`. L'accesso avviene sempre **via API o eventi**:

| Dato necessario | Come accederlo |
|---|---|
| Utente corrente (identita', permessi) | `CurrentUser` iniettato dal framework -- read-only, popolato dal middleware auth |
| Dati di un altro modulo | Integration event (asincrono) o API interna (se sincrono indispensabile) |
| Configurazione framework | `ModuleConfiguration` iniettato dal framework |
| Dati utente per join/query | Non fare join cross-schema. Usa `CurrentUser` per il contesto, o denormalizza i dati necessari nel proprio modulo via integration event |

Questa regola mantiene l'isolamento dei moduli e rende possibile la separazione in microservizi futura.

### 6.4 Migration strategy

**Decisione D-33: CONFERMATA -- drizzle-kit per modulo**

**Scelta**: ogni modulo ha la propria cartella `drizzle/` con file SQL versionati generati da `drizzle-kit generate`. Framework e moduli evolvono indipendentemente.

```
modules/orders/
  ├── drizzle.config.ts        -- punta allo schema "orders" e alla cartella migrations
  ├── drizzle/
  │   ├── 0001_init.sql
  │   ├── 0002_add_order_line_currency.sql
  │   └── _meta/
  └── src/infrastructure/schema/...
```

Al deploy di una nuova versione in produzione, il container API esegue `drizzle-kit migrate` per i propri moduli prima di servire traffico (init container o entrypoint script). Ogni modulo applica solo le proprie migration sul proprio schema.

**Coordinamento delle migration tra moduli**: ogni modulo ha la propria `drizzle_migrations` table dentro il proprio schema. Non c'e' lock condiviso: due moduli possono migrare in parallelo senza interferenza (ogni schema e' isolato).

**Opzioni scartate:**
- **Strumento esterno (Liquibase, Flyway)**: scartato, aggiunge complessita' senza valore aggiunto rispetto a drizzle-kit
- **Migrations a runtime senza file versionati**: scartato, niente "auto-migrate" silenziosi -- ogni migration e' un file SQL revisionato

### 6.5 Repository pattern

**Decisione D-34: CONFERMATA -- Si, repository pattern**

**Scelta**: Repository pattern. Ogni modulo definisce i propri repository come **Port** nell'architettura esagonale (D-23). Il database e' totalmente mascherato: nessun handler o servizio applicativo accede direttamente al client Drizzle.

**Motivazione**: il DB deve essere completamente incapsulato all'interno del dominio del singolo modulo. L'handler in `application/` lavora solo con `OrderRepository` (definito in `domain/ports/`), mai con `db` Drizzle direttamente. Questo:
- Rispetta la regola esagonale: Application non dipende da Infrastructure
- Rende il dominio testabile in isolamento (fake del repository)
- Permette di cambiare strategia di persistenza senza toccare la logica applicativa

```typescript
// domain/ports/order-repository.ts -- Port
export interface OrderRepository {
  findById(id: OrderId): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

// infrastructure/repositories/drizzle-order-repository.ts -- Driven Adapter
export class DrizzleOrderRepository implements OrderRepository {
  constructor(private readonly db: OrdersDb) {}

  async findById(id: OrderId): Promise<Order | null> {
    const row = await this.db.query.orders.findFirst({ where: eq(orders.id, id.value) });
    return row ? Order.fromPersistence(row) : null;
  }

  async save(order: Order): Promise<void> {
    // upsert + persist domain events nella stessa transazione (Unit of Work)
  }
}

// application/create-order/create-order.handler.ts -- usa solo il Port
export class CreateOrderHandler implements CommandHandler<CreateOrderCommand, OrderId> {
  constructor(private readonly orders: OrderRepository, private readonly uow: UnitOfWork) {}
  // mai `db` Drizzle direttamente qui
}
```

**Opzioni scartate:**
- **Accesso diretto a Drizzle**: scartato, viola il principio esagonale -- Application dipenderebbe da Infrastructure
- **Generic repositories**: scartato, astrazione troppo generica che perde le specificita' del dominio

### 6.6 Read/Write separation

**Decisione D-35: CONFERMATA -- CQRS leggero, non mandatorio**

**Scelta**: CQRS leggero come pattern **principale ma non obbligatorio**. Il framework fornisce i tipi `Command<T>` e `Query<T>` e pipeline behavior differenziati (audit solo sui command, caching sulle query). Ogni modulo decide se adottare la separazione in base alla propria complessita'.

**Quando usare CQRS**: moduli con logica di dominio significativa, dove la separazione tra scritture (che passano per aggregati e repository) e letture (che possono usare proiezioni ottimizzate) porta valore reale.

**Quando non serve**: moduli semplici (CRUD puro, poche regole di business) possono usare handler generici senza forzare la separazione command/query. Il framework lo supporta senza penalita'.

**Nota sulle query e il repository pattern (D-34)**: le query di lettura possono bypassare il repository e accedere a un **read-model Port** dedicato (es. `OrderReadModel`) per evitare di caricare aggregati interi quando serve solo una proiezione. L'adapter Drizzle del read-model puo' usare query SQL tipizzate (Drizzle o Kysely interno) ottimizzate. Questo non viola l'esagonale: il Port e' comunque definito in Domain, l'implementazione in Infrastructure.

**Opzione scartata:**
- Nessuna separazione: scartata come default, ma di fatto consentita per moduli semplici che non necessitano della distinzione.

### 6.7 Strategia Stored Procedure e Views legacy

**Decisione D-36: CONFERMATA**

> **Principio fondamentale**: questo NON e' un porting. Il legacy viene studiato per comprendere le capability, poi tutto viene ricostruito da zero nel nuovo stack. Le stored procedure e le view legacy sono fonte di conoscenza, non codice da copiare.

Il database legacy contiene 324 stored procedure, 172 view, 35 funzioni e 6 trigger. La strategia e':

| Categoria | Quantita' | Strategia | Motivazione |
|---|---|---|---|
| `sAN_*` (engine interno) | ~200+ | RICOSTRUIRE in TypeScript / Drizzle | Logica interna del workflow engine, va ripensata nel nuovo stack |
| `sEX_*` (API dati esterne) | ~100+ | EVALUATE caso per caso | Forniscono un'interfaccia dati strutturata. Alcune possono essere mantenute come view Postgres se tecnicamente vantaggioso (query complesse, performance). La decisione avviene tabella per tabella durante la classificazione dettagliata |
| `sIF_*` (metadata) | ~15 | EVALUATE caso per caso | Interfacce metadata, valutare utilita' |
| `sADMEX_*` (admin) | poche | EVALUATE caso per caso | Admin/introspezione |
| `vAN_*` (viste interne) | ~100+ | RICOSTRUIRE in TypeScript / Drizzle | Catena di processing interna (1.0 -> 2.0 -> 3.0), va ripensata |
| `vEX_*` (viste API) | ~70+ | EVALUATE caso per caso | Come sEX, valutare singolarmente |
| Trigger (6) | 6 | RICOSTRUIRE come domain events / hook `@seaside/hooks` | CDC da gestire con pattern moderni |
| Funzioni `fAN_*` | 35 | RICOSTRUIRE in TypeScript | Logica di calcolo |

**Criterio per "mantenere" una sEX/vEX**: solo se la query e' complessa, performance-critical, e il costo di riscrittura in Drizzle/SQL non e' giustificato. Anche in quel caso, la view viene ricreata nello schema Postgres del modulo proprietario (non copiata dal legacy). Le view Postgres sono dichiarate come tabelle Drizzle in modalita' read-only.

### 6.8 Strategia di connessione al database

**Decisione D-37: CONFERMATA**

> **Principio fondamentale**: la connection string del database non viene MAI hardcodata nel codice applicativo. Il codice legge sempre la variabile d'ambiente standard `DATABASE_URL` (formato Postgres `postgres://user:pass@host:port/db?schema=...`). L'ambiente in cui si esegue determina il valore effettivo della stringa. Nessun `if` nel codice, nessun branching su ambienti.

**Come funziona:**

| Scenario | Cosa succede | Chi configura |
|---|---|---|
| **Sviluppo locale** | Aspire AppHost crea un container Postgres e inietta automaticamente `DATABASE_URL` nei processi che lo referenziano (`api`, `worker`) | AppHost (`builder.AddPostgres("postgres").AddDatabase("appdb")`) |
| **Debug su ambiente esterno** | Lo sviluppatore imposta `DATABASE_URL` nel proprio `.env.local` (non versionato) puntando al DB dell'ambiente target (anonimizzato) | Lo sviluppatore |
| **Produzione (ACA)** | I Container App ricevono `DATABASE_URL` di Azure Database for PostgreSQL tramite Azure Key Vault, env var, o Managed Identity (token-based auth) | IT, nel Container Apps Environment |

**Pattern nell'AppHost (vertical repo):**

```csharp
IResourceBuilder<IResourceWithConnectionString> postgres;

if (builder.ExecutionContext.IsPublishMode)
{
    postgres = builder.AddConnectionString("appdb");
}
else
{
    postgres = builder.AddPostgres("postgres")
                      .WithDataVolume()
                      .AddDatabase("appdb");
}

var api = builder.AddNodeApp("api", "../apps/api", "start")
    .WithReference(postgres)   // inietta DATABASE_URL nel processo api
    .WaitFor(postgres);
```

In publish mode, `AddConnectionString("appdb")` dichiara che la connection string arriva dall'esterno. In development mode, `AddPostgres()` crea un container Postgres locale.

**Il codice applicativo e' sempre lo stesso:**

```typescript
// apps/api/src/db.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

Il modulo non sa e non deve sapere se il database e' un container locale, un'istanza Azure Postgres di staging, o il database di produzione. L'unica cosa che cambia e' il valore di `DATABASE_URL`, e quel valore viene dall'esterno.

**Override per debug su ambiente esterno:**

Lo sviluppatore che vuole fare debug puntando a un database di un ambiente non locale ha due opzioni:

1. **`.env.local`** (raccomandato, non versionato): impostare `DATABASE_URL=postgres://...` nel proprio file. `.env.local` e' in `.gitignore` di default
2. **Variabile d'ambiente shell**: `export DATABASE_URL=...` per la sessione corrente

In entrambi i casi, sovrascrive il valore iniettato da Aspire.

**Regole vincolanti:**

- **MAI** connection string committata in `.env`, `package.json`, `config/*.json`
- **MAI** `if (process.env.NODE_ENV === 'staging') { ... }` per scegliere la connection string nel codice applicativo
- **MAI** secret o credenziali in file committati
- L'unico punto del codice che conosce la topologia infrastrutturale e' l'**AppHost** (e solo per il branch development/publish)
- I moduli business e gli Host ricevono `DATABASE_URL` tramite env var standard

**Flusso di anonimizzazione**: l'azienda ha gia' un processo di anonimizzazione per gli ambienti non di produzione. Lo sviluppatore che punta a un DB esterno per debug lo fa sempre verso un'istanza anonimizzata. Il meccanismo di anonimizzazione resta fuori dal perimetro del framework (e' un processo infrastrutturale gestito da IT).

Documentazione tecnica dettagliata: [`docs/architecture/aspire-deployment-guide.md`](aspire-deployment-guide.md).

---

## Capitolo 7 -- Identity, Autenticazione e Sicurezza

**Decisione D-40: CONFERMATA** -- tutti i provider auth del legacy devono essere supportati.
**Decisioni D-41 / D-42 / D-43: CONFERMATE** -- Auth.js multi-provider nel BFF Next.js, RBAC permission-based + workspace, users/roles framework-level.
**Decisioni D-44 / D-45 / D-46 / D-47: CONFERMATE** -- BFF Next.js, session management, secrets management, security hardening.

> **Principio**: il sistema di identity del legacy viene studiato per capire i requisiti, poi ricostruito da zero con pattern moderni (Auth.js + Hono + Postgres). Nessun codice legacy viene copiato.

### 7.1 Cosa il framework deve fornire

Il framework deve esporre:
- **Interfacce standard** per accedere all'utente corrente (`CurrentUser`, `CurrentSession`) iniettate negli handler via `HandlerContext`
- **BFF pattern** con httpOnly cookie -- il JWT non raggiunge mai il browser (D-44, Next.js + Auth.js)
- **Middleware di autenticazione**:
  - Lato Next.js: Auth.js gestisce sessione e cookie
  - Lato API Hono: middleware `bearerAuth` che valida i JWT server-to-server emessi dal BFF
- **Multi-provider auth**: supporto plug-in per provider diversi (D-41), pacchetto `@seaside/identity-web` con providers preconfigurati
- **Policy di autorizzazione** definibili per modulo ma registrate centralmente (D-42)
- **Claim enrichment** per aggiungere informazioni applicative ai claim dell'utente (callback `session` di Auth.js)
- **Audit trail** di autenticazione (login, logout, fallimenti)
- **Session management** server-side con idle timeout, concurrent sessions configurabili (D-45)
- **CSRF protection** via double-submit cookie token gestito da Auth.js + middleware Hono dedicato (D-44)
- **Security headers** (CSP, X-Frame-Options, HSTS, etc.) configurati di default (D-47)
- **Rate limiting** su endpoint critici (auth, API pubbliche) (D-47) via `@hono/rate-limiter`
- **Input sanitization** per rich text (DOMPurify), auto-trimming stringhe (D-47)
- **Secrets management** con Key Vault + alternative non-Azure (D-46)

### 7.2 Pattern di autenticazione

**Decisione D-41: CONFERMATA -- Auth.js (NextAuth v5) multi-provider nel BFF Next.js + JWT server-to-server per API Hono**

**Scelta**: Auth.js v5 come hub di autenticazione integrato nel BFF Next.js. Tutte le chiamate del browser passano per Next.js, che mantiene una sessione server-side con httpOnly cookie. Le chiamate da Next.js verso l'API Hono usano un **JWT firmato server-to-server** (short-lived, audience-scoped). Il framework supporta **tutti i provider legacy dal giorno 1** tramite il sistema di Providers di Auth.js.

Ogni provider e' un Provider Auth.js. L'aggiunta di un provider e' una riga di configurazione -- non modifica il core. I verticali scelgono quali provider abilitare.

| Provider legacy | Provider Auth.js | Pacchetto / Note |
|---|---|---|
| Custom forms (username/password) | `Credentials` provider | Built-in Auth.js, validation contro `platform.users` |
| Azure AD (Entra ID) | `MicrosoftEntraID` provider | `@auth/microsoft-entra-id` |
| Azure AD B2C | `AzureADB2C` provider | `@auth/azure-ad-b2c` |
| Google | `Google` provider | `@auth/google` |
| SAML2 | Custom provider basato su `samlify` | Wrapper nel pacchetto `@seaside/identity-web` |
| Microsoft Teams | Custom provider basato su Teams JS SDK | Wrapper nel pacchetto `@seaside/identity-web` |
| Power BI | Custom provider (PBI embed token) | Wrapper nel pacchetto `@seaside/identity-web` |

**Provider di autenticazione trovati nel legacy (da supportare tutti):**

| Provider | Backend (ANServer) | Frontend (ANWebFE) | Note |
|---|---|---|---|
| **Azure AD (Entra ID)** | `LoginTypeAadService`, ADAL | `loginAuthenticationAADPage` | SSO aziendale |
| **Azure AD B2C** | `LoginTypeAadb2CController` | `loginAuthenticationAADB2CPage` | Utenti esterni |
| **Google** | via OAuth2 | `loginAuthenticationGooglePage` | Login social |
| **SAML2** | `SAML2AuthCodeService` | `loginAuthenticationSAML2Page` | Federazione enterprise |
| **Custom forms** | `ANAuth` (JWT custom) | Login form standard | Username/password interni |
| **Microsoft Teams** | via Teams JS SDK | `microsoftTeamsAuthenticationPage` | Tab integration |
| **Power BI** | via PBI embed token | `pbiAuthenticationPage` | Report embedding |

**Flusso con custom forms (username/password) -- con BFF Next.js (D-44):**

```
Browser → POST /api/auth/callback/credentials (username, password)
                    │
                    ▼
         Next.js Route Handler (Auth.js Credentials provider)
         valida le credenziali contro platform.users
                    │
                    ▼
         Auth.js callback "session" arricchisce con
         ruoli, permessi, workspace dell'utente
                    │
                    ▼
         Auth.js crea sessione server-side (Redis adapter)
         e imposta httpOnly secure cookie "__Secure-authjs.session-token"
                    │
                    ▼
Browser → richiesta successiva a /api/orders (cookie automatico)
                    │
                    ▼
         Next.js Route Handler:
         1. legge sessione tramite auth()
         2. emette JWT server-to-server con audience="api"
         3. inoltra a Hono API con Authorization: Bearer {jwt}
                    │
                    ▼
         Hono API: middleware bearerAuth valida JWT,
         popola CurrentUser, esegue mediator
```

**Flusso con provider esterno (es. Azure AD, Google, SAML2) -- con BFF Next.js:**

```
Browser → GET /api/auth/signin/microsoft-entra-id
                    │
                    ▼
         Auth.js redirect a Microsoft Entra ID
                    │
                    ▼
         Utente autentica, IdP redirige a /api/auth/callback/microsoft-entra-id
                    │
                    ▼
         Auth.js valida id_token, esegue callback "signIn":
         - upsert user nella tabella platform.users
         - mappa claims esterni → ruoli/permessi interni
                    │
                    ▼
         Auth.js crea sessione server-side (stessa shape del custom forms)
                    │
                    ▼
         Imposta httpOnly secure cookie
                    │
                    ▼
Browser → flusso identico al custom forms (cookie automatico, JWT server-to-server)
```

**Principio fondamentale**: indipendentemente dal provider, dopo l'autenticazione il browser ha sempre un **httpOnly cookie di sessione gestito da Auth.js**. Il server mantiene i claims e lo stato della sessione. Il resto del sistema (autorizzazione, `CurrentUser`, audit) non sa e non gli interessa quale provider ha autenticato l'utente.

> **Nota**: il JWT non e' mai esposto al browser. Viene emesso dal BFF al momento della chiamata server-to-server verso l'API Hono, con scope ristretto, TTL breve (es. 60s), audience `api`, firmato con la chiave del framework. Vedi dettagli in [Cap. 7.6](#76-bff-pattern-e-token-management).

### 7.3 Modello di autorizzazione

**Decisione D-42: CONFERMATA -- RBAC permission-based + Workspace scoping (opt-in)**

**Scelta**: modello **permission-based** con scoping opzionale per **workspace**. Il concetto di "container" del legacy evolve in workspace: un perimetro selezionabile dall'utente che varia lo scope dei dati e dei permessi.

#### 7.3.1 Permission-based authorization

Il framework fornisce:
- `PermissionChecker` come servizio in `@seaside/security`
- `requirePermission(name)` middleware Hono come decoratore di route
- `AuthorizationBehavior` nel mediator pipeline (D-21) come decoratore di handler tramite metadata
- Ogni modulo dichiara i propri permessi
- I ruoli raggruppano permessi (gestiti a livello di framework, tabella `platform.role_permissions`)

```typescript
// Ogni modulo dichiara i propri permessi (costanti tipizzate)
export const OrderPermissions = {
  View:   'orders.view',
  Create: 'orders.create',
  Edit:   'orders.edit',
  Delete: 'orders.delete',
  Export: 'orders.export',
} as const;

// Uso nelle route Hono (driving adapter)
app.get('/orders',
  requirePermission(OrderPermissions.View),
  async (c) => mediator.query(new GetOrdersQuery(/* ... */)).then(toHttp(c)),
);

// Uso a livello di command/query via metadata letti dall'AuthorizationBehavior
export class CreateOrderCommand implements Command<OrderId> {
  static readonly permission = OrderPermissions.Create;
  constructor(readonly input: CreateOrderInput) {}
}
```

**Struttura permessi:**

```
Ruolo "Project Manager"
├── orders.view
├── orders.create
├── orders.edit
├── tasks.view
├── tasks.create
└── tasks.assign

Ruolo "Viewer"
├── orders.view
└── tasks.view
```

#### 7.3.2 Workspace scoping (opt-in)

Il workspace e' un **building block opt-in** del framework. Se un'app lo attiva, l'utente puo' selezionare un workspace e tutto il sistema (dati, permessi, UI) si scopa automaticamente a quel perimetro.

**Concetto**: il workspace e' un perimetro logico che varia lo scope dell'applicazione. Nel legacy era il "container". Nel nuovo sistema e' generico: ogni verticale decide cosa sia un workspace nel proprio dominio (progetto, cliente, cantiere, dipartimento, ecc.).

**Cosa fornisce il framework (`@seaside/workspace`):**

```typescript
// Il contesto workspace corrente (popolato dal middleware)
export interface WorkspaceContext {
  readonly currentWorkspaceId: string | null;
  readonly hasWorkspace: boolean;
}

// Marker per schemi Drizzle scoped a un workspace
export interface WorkspaceScopedTable {
  readonly workspaceId: string;  // colonna obbligatoria
}

// Permessi scoped per workspace
export interface WorkspacePermissionService {
  hasPermission(userId: string, workspaceId: string, permission: string): Promise<boolean>;
  getPermissions(userId: string, workspaceId: string): Promise<readonly string[]>;
}
```

**Data access automatico (`@seaside/infrastructure`):**

Drizzle non ha "global query filters" come EF Core. Il framework risolve il problema con due strumenti complementari:

```typescript
// 1) Repository base che filtra automaticamente per workspaceId
//    Tutti i repository di entita' workspace-scoped estendono WorkspaceScopedRepository
//    che inietta il filtro nella query.
export abstract class WorkspaceScopedRepository<T> {
  protected scopedQuery() {
    const wsId = this.workspaceCtx.currentWorkspaceId;
    return this.db.select().from(this.table).where(eq(this.table.workspaceId, wsId));
  }
}

// 2) RLS Postgres (Row-Level Security) come secondo livello di difesa
//    Abilitato sulle tabelle workspace-scoped. Il framework apre la connessione
//    e setta la variabile di sessione app.current_workspace usata dalla policy RLS.
SET LOCAL app.current_workspace = '...';
SELECT * FROM orders;   -- filtrato automaticamente dalla policy RLS
```

I due livelli (application-level filter nei repository + RLS database-level) sono complementari: il primo previene bug accidentali, il secondo blocca qualunque query che dovesse aggirare il repository.

**Come il workspace arriva al backend:**

```
Frontend seleziona workspace → header HTTP X-Workspace-Id: {guid}
                                        │
                                        ▼
              Framework middleware legge header,
              verifica che l'utente abbia accesso al workspace,
              popola IWorkspaceContext
                                        │
                                        ▼
              Ogni query su IWorkspaceScopedEntity
              e' filtrata automaticamente
                                        │
                                        ▼
              Ogni permission check usa
              IWorkspacePermissionService (permessi scoped)
```

**Nel JWT**: il workspace corrente **non** sta nel JWT (cambierebbe troppo spesso). Viaggia come header HTTP per richiesta. Il JWT contiene solo l'identita' dell'utente. Il middleware verifica ad ogni richiesta che l'utente abbia accesso al workspace richiesto.

**Permessi con workspace:**

Un utente puo' avere ruoli (e quindi permessi) diversi per workspace:

```
Utente "Mario Rossi"
├── Workspace "Progetto Alpha" → Ruolo "Project Manager" (CRUD completo)
├── Workspace "Progetto Beta"  → Ruolo "Viewer" (sola lettura)
└── Workspace "Progetto Gamma" → nessun accesso
```

**Shell UI (`@seaside/shell`):**

```tsx
// Il framework fornisce il componente workspace selector nella shell React
import { SeasideShell } from '@seaside/shell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SeasideShell
      navItems={navItems}
      workspaces={userWorkspaces}
      onWorkspaceChange={(ws) => router.push(`/?workspace=${ws.id}`)}
    >
      {children}
    </SeasideShell>
  );
}
```

**Cosa il framework NON definisce (resta nel verticale):**
- Cosa sia un workspace nel dominio (progetto, cliente, cantiere)
- Come si creano/eliminano workspace (CRUD specifico)
- Regole di business per assegnazione utenti a workspace
- Logica di migrazione dati tra workspace

**Cosa succede se un'app NON usa i workspace:**
Niente. Se nessuna tabella implementa `WorkspaceScopedTable`, i repository workspace-scoped non vengono usati. Se l'app non configura il workspace selector nella shell, non appare. `WorkspaceContext.hasWorkspace` ritorna `false`. Tutto funziona senza workspace.

**Feature flags del legacy (`tFeature_M`, `tFeatureAuthorization_R`)**: ABBANDONATE. Non vengono ricostruite nel nuovo framework. Se un verticale ha bisogno di feature flags, puo' usare librerie standard TypeScript (`flagsmith`, `unleash`, oppure `@seaside/configuration` con un FeatureFlag provider semplice).

### 7.4 Gestione utenti/ruoli

**Decisione D-43: CONFERMATA -- Framework-level**

**Scelta**: utenti, ruoli, permessi e gruppi sono entita' di piattaforma gestite dal framework nello schema `platform` (coerente con D-32).

Le app business non gestiscono mai direttamente queste entita'. Le consumano tramite interfacce:
- `CurrentUser` -- identita' e claims dell'utente corrente
- `CurrentSession` -- sessione corrente (workspace, provider auth, timestamp)
- `PermissionChecker` -- verifica permessi
- `WorkspaceContext` -- workspace corrente (opt-in)
- `WorkspacePermissionService` -- permessi scoped per workspace (opt-in)

**Tabelle di piattaforma (schema `platform`, gestite dal pacchetto `@seaside/users`):**

| Tabella | Scopo | Derivazione legacy |
|---|---|---|
| `platform.users` | Utente del sistema (display name, email, lingua, stato) | `tAMUser_M` |
| `platform.roles` | Ruolo (raggruppa permessi) | `tRole` |
| `platform.user_roles` | Assegnazione utente-ruolo (opzionalmente scoped per workspace) | `tUserRole` |
| `platform.permissions` | Permesso granulare (modulo.azione) | Nuovo (il legacy non aveva permessi granulari) |
| `platform.role_permissions` | Assegnazione permesso-ruolo | Nuovo |
| `platform.groups` | Gruppo di utenti | `tAMGroup_M` |
| `platform.user_groups` | Membership utente-gruppo | `tAMUserGroup_R` |
| `platform.user_logins` | Credenziali per provider (multi-provider, Auth.js Accounts adapter) | `tLogin`, `tLoginAAD`, `tLoginSAML2` |
| `platform.user_workspaces` | Accesso utente a workspace + ruolo nel workspace | Evoluzione di container auth |
| `platform.audit_log` | Audit accessi e operazioni | `tAccessLog`, `tAMUserLog` |
| `platform.sessions` | Sessioni Auth.js (se Drizzle adapter; altrimenti in Redis) | -- |

### 7.5 Tabelle legacy rilevanti per la ricostruzione

Queste tabelle informano la struttura dati da **ricostruire** nel nuovo schema:

| Tabella legacy | Scopo | Nel nuovo framework |
|---|---|---|
| `tAMUser_M` | Utenti | Entita' `User` nel framework |
| `tAMGroup_M` / `tAMUserGroup_R` | Gruppi e membership | Entita' `Group`, `UserGroup` |
| `tLogin` / `tLoginAAD` / `tLoginSAML2` | Credenziali per provider | Entita' `UserLogin` (multi-provider) |
| `tLoginType*` | Configurazione provider | Configurazione auth scheme (D-41) |
| `tRole` / `tUserRole` | Ruoli | Entita' `Role`, `UserRole` (con workspace scope) |
| `tFeature_M` / `tFeatureAuthorization_R` | Feature flags | ABBANDONATE |
| `tAccessLog*` | Audit accessi | Entita' `AuditLog` nel building block Audit |
| `tDisclaimer` / `tUserDisclaimerLog` | Disclaimer utente | PLATFORM come funzionalita' (engine disclaimer, modello dati, API accettazione). APP-SPECIFIC come configurazione (testi, versioni, regole di attivazione per app) |
| Container auth (`tAMCPMTaskAutorized`) | Autorizzazioni per container | Evolve in `UserWorkspace` (workspace scoping) |

### 7.6 BFF pattern e token management

**Decisione D-44: CONFERMATA -- Next.js come BFF con httpOnly cookie + JWT server-to-server verso l'API Hono**

**Scelta**: il frontend Next.js comunica con il browser via httpOnly cookie (gestito da Auth.js). Le Route Handlers di Next.js (`app/api/*`) sono il BFF e fanno da proxy verso l'API Hono usando un JWT server-to-server short-lived. Il JWT non raggiunge mai il browser. Il browser riceve un httpOnly secure cookie che identifica la sessione; Next.js traduce la sessione in `CurrentUser` prima di chiamare la API.

**Motivazione**: elimina il vettore XSS piu' pericoloso. Con il JWT in localStorage o sessionStorage, qualsiasi vulnerabilita' XSS nel frontend (o in una dipendenza npm) puo' esfiltrare il token. Con BFF Next.js + httpOnly cookie, il token non e' accessibile da JavaScript. Inoltre il pattern Next.js BFF azzera l'overhead di un processo separato (rispetto a un BFF .NET o Node.js dedicato).

**Topologia:**

```
Browser
    │
    │  httpOnly secure cookie (SameSite=Lax)
    │  + CSRF token (double-submit cookie)
    │
    ▼
Next.js (frontend + BFF, processo unico)
    │
    ├── Auth.js: gestisce sessione, callback OIDC/OAuth/Credentials,
    │           CSRF token, refresh sessione
    │
    ├── Route Handlers /api/*: proxy verso Hono
    │   - leggono sessione (auth())
    │   - emettono JWT server-to-server (audience=api, TTL 60s)
    │   - inoltrano la richiesta con Authorization: Bearer
    │
    └── Server Components / Pages
        - leggono sessione (auth())
        - chiamano direttamente i Repository (read-only) o le API Hono via fetch
        - non espongono mai JWT al browser
                │
                ▼
Hono API (processo separato)
    │
    ├── Middleware bearerAuth: valida JWT (firma, expiry, audience)
    ├── Middleware setCurrentUser: popola CurrentUser dai claims
    ├── Middleware setWorkspace: legge X-Workspace-Id, verifica accesso
    └── Mediator pipeline: handler business
```

**Flusso di login (custom forms -- username/password):**

```
1. Browser → POST /api/auth/callback/credentials { csrfToken, username, password }
2. Next.js (Auth.js) valida credenziali contro platform.users (via fetch al Hono o direttamente via @seaside/users repository)
3. Auth.js callback "session" arricchisce: ruoli, permessi, workspace abilitati
4. Auth.js crea sessione (Redis adapter), imposta:
   - httpOnly secure cookie "__Secure-authjs.session-token" (SameSite=Lax)
   - CSRF cookie "__Host-authjs.csrf-token" (double-submit)
5. Browser riceve cookie → ogni richiesta successiva lo invia automaticamente
6. Le Route Handler /api/* leggono auth(), emettono JWT s2s e proxano a Hono
```

**Flusso di login (provider esterno -- es. Azure AD, Google, SAML2):**

```
1. Browser → GET /api/auth/signin/microsoft-entra-id
2. Auth.js OAuth/OIDC flow → redirect a Microsoft Entra ID
3. Microsoft Entra autentica → callback /api/auth/callback/microsoft-entra-id
4. Auth.js valida id_token, esegue callback signIn:
   - upsert in platform.users (Drizzle adapter Auth.js)
   - mappa claims esterni → ruoli/permessi interni
5. Auth.js crea sessione (stessa shape del custom forms)
6. Set httpOnly cookie come sopra
7. Browser → flusso identico al custom forms
```

**Diagramma di sequenza -- Login flow:**

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Next.js (BFF + Auth.js)
    participant IDP as Identity Provider
    participant DB as Postgres
    participant R as Redis
    participant API as Hono API

    Note over B,N: Login con provider esterno (AAD/Google/SAML2)
    B->>N: GET /api/auth/signin/microsoft-entra-id
    N->>IDP: Redirect OpenID Connect
    IDP->>IDP: Utente si autentica
    IDP->>N: Callback /api/auth/callback/... con id_token
    N->>DB: Upsert platform.users, mappa claims interni (ruoli, permessi)
    N->>R: Crea sessione server-side (Auth.js Redis adapter)
    N->>B: Set-Cookie: httpOnly, Secure, SameSite=Lax

    Note over B,API: Richiesta autenticata successiva
    B->>N: GET /api/orders (cookie automatico)
    N->>R: auth() valida sessione, estrai claims
    N->>N: Emette JWT s2s (audience=api, TTL 60s)
    N->>API: GET /orders, Authorization: Bearer {jwt}
    API->>API: bearerAuth valida JWT → CurrentUser
    API->>DB: Drizzle query
    API->>N: 200 OK + dati
    N->>B: 200 OK + dati
```

**Principio invariante**: indipendentemente dal provider, dopo l'autenticazione il browser ha un **httpOnly cookie con la stessa semantica**. Il resto del sistema (`CurrentUser`, `PermissionChecker`, handler) non sa e non gli interessa come l'utente si e' autenticato.

**Nota su JWT server-to-server**: il JWT resta come formato per comunicazione **server-to-server** (Next BFF -> Hono API; Hono API -> Worker via broker tramite integration events). Ma il browser non vede mai un JWT. Firmato con HS256 o RS256 (key rotation, Cap. 7.8.1), audience-scoped (`api`, `worker-jobs`), TTL breve (60s tipico).

#### 7.6.1 Token refresh e rotation

Con il BFF pattern, il concetto di "refresh token" classico scompare per il browser. Il browser ha un **cookie di sessione** gestito da Auth.js server-side. Non c'e' un token da refreshare lato client.

La gestione avviene server-side via Auth.js + framework wrapper:

| Parametro | Default | Configurabile via env var | Descrizione |
|---|---|---|---|
| `SESSION_IDLE_TIMEOUT` | 1800 (s) | `SEASIDE_SESSION_IDLE_TIMEOUT` | Dopo questo periodo di inattivita' la sessione scade |
| `SESSION_SLIDING` | `true` | `SEASIDE_SESSION_SLIDING` | Ogni richiesta rinnova il timeout |
| `SESSION_MAX_DURATION` | 28800 (s) | `SEASIDE_SESSION_MAX_DURATION` | Durata massima assoluta (anche con attivita') |

```typescript
// apps/web/auth.config.ts (configurazione Auth.js fornita da @seaside/identity-web)
export const authConfig = seasideAuthConfig({
  session: {
    strategy: 'database',          // server-side (Redis adapter)
    maxAge: env.SESSION_MAX_DURATION,
    updateAge: env.SESSION_IDLE_TIMEOUT,
  },
  providers: [
    credentialsProvider(),
    microsoftEntraIDProvider(),
    googleProvider(),
    saml2Provider(),
    // ...
  ],
});
```

**Rotation**: il cookie session ID viene rigenerato ad ogni autenticazione riuscita (Auth.js rotation) per prevenire session fixation. Il vecchio session ID diventa invalido.

**Revocation**: le sessioni sono tracciate in Redis. Un admin puo' invalidare una sessione specifica o tutte le sessioni di un utente. Alla prossima richiesta, il cookie non corrisponde piu' a una sessione valida → risposta 401 → popup sessione scaduta → redirect a login.

**Token rubato -- analisi dei vettori:**

Con BFF Next.js + httpOnly + SameSite=Lax, il cookie non e' accessibile da JavaScript e non viene inviato su richieste cross-site di top-level navigation pericolose:

| Vettore | Mitigazione |
|---|---|
| XSS che legge il cookie | Impossibile (httpOnly) |
| XSS che fa richieste same-origin | Mitigato da CSRF double-submit cookie + CSP restrittiva |
| Cross-site request | Bloccato da SameSite=Lax (Strict per endpoint sensibili) |
| Man-in-the-middle | Mitigato da Secure=true (solo HTTPS) + HSTS |
| Accesso fisico al browser | Fuori scope applicativo |
| Compromissione account | Admin revoca tutte le sessioni da dashboard |
| JWT s2s rubato dal traffico interno | TLS interno + short TTL (60s) + audience scope |

**Come accorgersi di compromissione:**
- Dashboard admin: sessioni attive per utente con IP, user-agent, timestamp
- Alert configurabile: login da IP/paese insolito
- L'utente puo' vedere le proprie sessioni attive e terminare quelle sospette

#### 7.6.2 CSRF protection

Con httpOnly cookies, la CSRF protection e' **obbligatoria**. Auth.js v5 implementa nativamente il pattern double-submit cookie:

- Cookie `__Host-authjs.csrf-token` (non-httpOnly, leggibile da JS lato client)
- Header `X-CSRF-Token` inviato dal client per ogni mutazione (POST/PUT/DELETE)
- Auth.js verifica match cookie/header

Il framework fornisce nel pacchetto `@seaside/identity-web`:

- Un fetch wrapper `apiClient()` (lato client) che legge il CSRF cookie e lo inietta in tutte le richieste mutanti
- Un middleware Route Handler `requireCsrf()` da applicare alle Route Handlers custom

```typescript
// apps/web/app/api/orders/route.ts
import { auth } from '@/auth';
import { requireCsrf } from '@seaside/identity-web/server';

export const POST = requireCsrf(async (req) => {
  const session = await auth();
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 });
  // proxy verso Hono API con JWT s2s
  return proxyToApi(req, session);
});
```

**Mitigazione cross-site di top-level navigation**: `SameSite=Lax` blocca POST cross-site (i form non possono postare sulla sessione). Per endpoint particolarmente sensibili il framework imposta `SameSite=Strict` (Auth.js permette override per cookie name).

### 7.7 Session management

**Decisione D-45: CONFERMATA -- Sessioni server-side con multi-sessione configurabile**

Il framework gestisce le sessioni lato server tramite Auth.js. La scelta del BFF Next.js (D-44) rende naturale questo approccio: il cookie identifica la sessione, il server (Next.js + Redis adapter) mantiene lo stato.

**Derivazione legacy**: il legacy aveva `ANWebFE SessionService` con gestione idle timeout e concurrent sessions. La capability e' classificata PLATFORM + REWRITE: viene ricostruita nel framework con pattern moderni.

#### 7.7.1 Storage sessioni

| Ambiente | Storage | Configurazione |
|---|---|---|
| **Development** | Redis (container Aspire) o Postgres (Drizzle adapter di Auth.js) | Automatico tramite AppHost |
| **Produzione** | Redis (Azure Cache for Redis) -- primario. Postgres come fallback / single-server config | Adapter Auth.js |

```csharp
// Aspire AppHost -- registra Redis per le sessioni
var redis = builder.AddRedis("session-store");
var postgres = builder.AddPostgres("postgres").AddDatabase("appdb");

var web = builder.AddNpmApp("web", "../apps/web", "dev")
    .WithReference(redis)
    .WithReference(postgres);
```

```typescript
// apps/web/auth.config.ts
import { RedisAdapter } from '@seaside/identity-web/adapters/redis';

export const authConfig = seasideAuthConfig({
  adapter: RedisAdapter({ url: env.REDIS_URL }),
  session: { strategy: 'database', maxAge: 28800 },
  // ...
});
```

Lo storage e' intercambiabile via adapter Auth.js senza modificare il resto del codice.

#### 7.7.2 Concurrent sessions

Auth.js base non implementa nativamente il limite di sessioni concorrenti per utente. Il framework lo aggiunge via callback `signIn` + lookup su `platform.sessions`:

| Parametro | Default | Env var | Descrizione |
|---|---|---|---|
| `CONCURRENT_SESSIONS` | `true` | `SEASIDE_CONCURRENT_SESSIONS` | L'utente puo' avere piu' sessioni attive (multi-dispositivo) |
| `MAX_CONCURRENT_SESSIONS` | `0` (illimitato) | `SEASIDE_MAX_CONCURRENT_SESSIONS` | Se > 0, la sessione piu' vecchia viene terminata alla creazione di una nuova |

```typescript
// @seaside/identity-web -- callback applicato all'authConfig
async signIn({ user }) {
  if (env.MAX_CONCURRENT_SESSIONS > 0) {
    await sessionService.enforceLimit(user.id, env.MAX_CONCURRENT_SESSIONS);
  }
  return true;
}
```

Ogni sessione traccia: user agent, IP, timestamp di creazione, ultimo utilizzo. L'admin puo' visualizzare e terminare sessioni dalla dashboard.

#### 7.7.3 Comportamento al timeout (frontend Next.js)

Il framework fornisce nel pacchetto `@seaside/identity-web` un wrapper del client che gestisce la scadenza sessione:

1. Rileva risposta `401 Unauthorized` da Hono API tramite le Route Handlers BFF
2. Mostra un **popup modale bloccante**: "La sessione e' scaduta. Effettua nuovamente il login." (componente `<SessionExpiredDialog>` di `@seaside/shell`)
3. Al click su "OK" → chiama `signOut()` di Auth.js → redirect a `/api/auth/signin`
4. Il popup blocca l'interazione con l'app per evitare perdita di dati o richieste in errore

```tsx
// @seaside/identity-web -- hook usato da @seaside/shell
'use client';
import { useSession, signOut } from 'next-auth/react';

export function SessionExpiredGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const unsub = onApiUnauthorized(() => setExpired(true));
    return unsub;
  }, []);

  return (
    <>
      {children}
      <SessionExpiredDialog
        open={expired || status === 'unauthenticated'}
        onConfirm={() => signOut({ callbackUrl: '/auth/signin' })}
      />
    </>
  );
}
```

I verticali possono personalizzare il messaggio del popup ma non il comportamento (redirect obbligatorio).

#### 7.7.4 Session security

| Misura | Implementazione |
|---|---|
| **Session fixation prevention** | Session ID rigenerato dopo ogni autenticazione riuscita |
| **Session hijacking - cookie** | `httpOnly` + `Secure` + `SameSite=Strict` |
| **Session hijacking - opzionale** | Validazione user-agent e IP range (configurabile, disattivato di default per compatibilita' VPN/mobile) |

#### 7.7.5 Audit delle sessioni

Ogni evento di sessione viene registrato in `platform.audit_log` (building block Audit, `@seaside/audit`):

| Evento | Dati registrati |
|---|---|
| Login riuscito | UserId, provider auth, IP, user-agent, workspace (se selezionato), timestamp |
| Login fallito | Username tentato, provider, IP, user-agent, motivo fallimento, timestamp |
| Logout | UserId, tipo (volontario / timeout / revoca admin), timestamp |
| Sessione revocata | UserId, AdminId che ha revocato, sessione target, timestamp |
| Cambio workspace | UserId, old workspace, new workspace, timestamp |

Le sessioni attive sono visibili sia dall'utente (le proprie) sia dall'admin (tutte) tramite interfacce fornite dal framework.

### 7.8 Secrets management

**Decisione D-46: CONFERMATA -- Azure Key Vault (primario) + environment variables (alternativa non-Azure / dev)**

| Ambiente | Strategia | Dettaglio |
|---|---|---|
| **Development** | `.env.local` (non versionato) + Aspire | Nessun secret in file versionati. Aspire inietta connection string automaticamente. `dotenv-cli` carica `.env.local` per i processi locali |
| **Produzione Azure** | Azure Key Vault | Il Container App legge i secret dal vault. Accesso via Managed Identity (no password) tramite `@azure/identity` + `@azure/keyvault-secrets` |
| **Produzione non-Azure** | Environment variables | I secret sono configurati dall'infrastruttura (Kubernetes secrets, Docker secrets) |

```typescript
// apps/api/src/config.ts -- integrazione Key Vault
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  JWT_SIGNING_KEY: z.string().min(32),
  // ...
});

async function loadConfig() {
  if (process.env.NODE_ENV === 'production') {
    const vault = new SecretClient(env.KEY_VAULT_URI, new DefaultAzureCredential());
    for (const key of ['JWT_SIGNING_KEY', 'AUTH_SECRET']) {
      const secret = await vault.getSecret(key);
      process.env[key] = secret.value;
    }
  }
  return schema.parse(process.env);
}
```

#### 7.8.1 Key rotation

| Tipo di secret | Strategia di rotation |
|---|---|
| **JWT signing keys (server-to-server)** | Il framework supporta **key rotation senza downtime** tramite JWKS interno servito da `@seaside/identity-web`. La vecchia chiave resta valida per la verifica dei token gia' emessi. La nuova chiave viene usata per i nuovi token. Dopo un periodo di overlap (configurabile, default 24h) la vecchia chiave viene rimossa |
| **Connection strings** | Rotation manuale: aggiornamento del secret nel Key Vault / env var → rolling update dei container → verifica |
| **API keys terze parti** | Rotation manuale con la stessa procedura |
| **AUTH_SECRET (Auth.js)** | Rotation manuale con grace period: deploy con `AUTH_SECRET_PREVIOUS` impostata al vecchio valore per accettare cookie firmati con la vecchia chiave durante la finestra di rotazione |
| **Cookie encryption keys** | Auth.js firma i cookie con `AUTH_SECRET`. Per encryption-at-rest delle sessioni in Redis si usa la chiave di Auth.js stesso |

**Per ambienti non-Azure**: rotation manuale. La procedura e' documentata come runbook operativo.

#### 7.8.2 Cosa va dove

| Informazione | Dove | Versionato? |
|---|---|---|
| Connection string DB (`DATABASE_URL`) | Key Vault / env var | **NO** |
| JWT signing key (server-to-server) | Key Vault / env var | **NO** |
| API keys terze parti | Key Vault / env var | **NO** |
| `AUTH_SECRET` Auth.js | Key Vault / env var | **NO** |
| Configurazione applicativa (timeout, URL, feature flags) | File `config/*.ts` versionato + env var di override | SI (file), NO (override) |
| Parametri specifici per ambiente (hostname, porte) | env var non-secret | NO (ma non sensibili) |

#### 7.8.3 Encryption at rest

| Livello | Meccanismo |
|---|---|
| **Database** | Postgres Transparent Data Encryption (TDE), attivo di default su Azure Database for PostgreSQL Flexible Server |
| **Campi sensibili (PII, dati sanitari)** | Il framework fornisce `FieldEncryptor` (`@seaside/security`) basato su AES-256-GCM con chiave da Key Vault per encryption a livello applicativo prima della persistenza. La scelta di quali campi cifrare e' responsabilita' del verticale. Drizzle column type custom per encrypt/decrypt automatico |
| **Cookie di sessione** | Auth.js firma JWT/sessioni con `AUTH_SECRET` |
| **Outbox messages** | I payload degli eventi nell'outbox sono in chiaro (JSON). Se contengono dati sensibili, il verticale deve cifrare i campi sensibili prima della pubblicazione. Il framework puo' fornire un `EventPayloadEncryptor` come estensione futura |

### 7.9 Security hardening

**Decisione D-47: CONFERMATA -- Security headers, rate limiting, CORS, input sanitization**

Questa sezione raggruppa le misure di hardening che il framework fornisce **di default** a tutti i verticali. Sono configurate nel `ServiceDefaults` e/o nell'Host e si attivano automaticamente.

#### 7.9.1 CORS policy

```typescript
// apps/api/src/middleware/cors.ts
import { cors } from 'hono/cors';

app.use('*', cors({
  origin: env.SEASIDE_CORS_ALLOWED_ORIGINS.split(','),
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowHeaders: ['Authorization', 'Content-Type', 'X-Workspace-Id', 'X-CSRF-Token', 'traceparent'],
  maxAge: 600,
}));
```

| Ambiente | Comportamento |
|---|---|
| **Produzione (BFF Next.js)** | Frontend Next.js fa solo chiamate **server-to-server** verso Hono API. Il browser non chiama mai direttamente Hono. CORS sul lato API riguarda solo Next.js (allowed origin: dominio API privato/interno) |
| **Development** | Next.js dev server (`localhost:3000`) chiama Hono (`localhost:7001`) sempre via fetch server-side. CORS configurato solo per debug diretto API |
| **API esposte a terzi** | Se un verticale espone API a sistemi esterni, configura le allowed origins specifiche |

Con il BFF Next.js, CORS in produzione e' un non-problema lato browser: tutte le chiamate del browser vanno a Next.js, stessa origin.

#### 7.9.2 Content Security Policy (CSP)

Il framework configura security headers restrittivi di default. Lato Next.js tramite `next.config.js` headers + middleware; lato Hono tramite `hono/secure-headers`.

```typescript
// apps/web/next.config.js -- security headers Next.js
const securityHeaders = seasideSecurityHeaders({
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'nonce-{NONCE}'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // AntD richiede inline per styled
    imgSrc: ["'self'", 'data:', 'blob:'],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
  hsts: { maxAge: 31536000, includeSubDomains: true },
});

module.exports = {
  async headers() { return [{ source: '/:path*', headers: securityHeaders }]; },
};
```

```typescript
// apps/api/src/middleware/security.ts -- security headers Hono
import { secureHeaders } from 'hono/secure-headers';

app.use('*', secureHeaders({
  contentSecurityPolicy: { /* meno restrittivo lato API: niente script-src */ },
  strictTransportSecurity: 'max-age=31536000; includeSubDomains',
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
}));
```

**Derivazione legacy**: il legacy (NewSeasidePerYuri) usava `helmet()` per Node.js con le stesse funzionalita'. Il nuovo framework formalizza il pattern in helper riusabili (`seasideSecurityHeaders()`).

**Personalizzazione**: i verticali possono estendere la CSP policy (es. aggiungere origini per CDN immagini, iframe per embedding), ma non possono rimuovere le restrizioni base. L'estensione avviene via configurazione:

```typescript
// apps/web/seaside.config.ts
export default {
  security: {
    csp: {
      additionalScriptSrc: ['https://cdn.trusted.com'],
      additionalImgSrc: ['https://images.trusted.com'],
      additionalFrameSrc: ['https://embed.trusted.com'],
    },
  },
};
```

#### 7.9.3 Rate limiting

Il framework configura rate limiting tramite middleware Hono (`@hono/rate-limiter` + Redis store):

```typescript
// apps/api/src/middleware/rate-limit.ts
import { rateLimiter } from '@hono/rate-limiter';
import { RedisStore } from '@seaside/security/rate-limit-redis';

const store = new RedisStore({ url: env.REDIS_URL });

app.use('*', rateLimiter({
  windowMs: 60_000,
  limit: 100,
  store,
  keyGenerator: (c) => getClientIp(c) ?? 'anonymous',
  message: { type: 'https://errors.seaside.dev/rate-limit', title: 'Too Many Requests' },
}));

// Endpoint auth con rate limit aggressivo (anti brute-force)
app.use('/auth/*', rateLimiter({ windowMs: 60_000, limit: 10, store }));
```

Lato Next.js, lo stesso pattern e' applicato alle Route Handlers di login (`/api/auth/callback/credentials`) tramite `@seaside/identity-web/rate-limit`.

I parametri sono configurabili via env var (`SEASIDE_RATE_LIMIT_*`) o file `seaside.config.ts`. I verticali possono aggiungere rate limiter specifici per i propri endpoint.

#### 7.9.4 Input validation e sanitization

**Validation (gia' definita -- Cap. 5.6):**
- Zod schemas negli handler via `ValidationBehavior` del mediator pipeline (D-21, D-22)
- Ogni command/query ha uno schema Zod dedicato registrato dal modulo
- La validazione e' per-handler, non globale

**Derivazione legacy**: il legacy (NewSeasidePerYuri) usava Zod per validation schema-based. Il nuovo framework formalizza Zod come standard nel pipeline.

**Sanitization (nuova):**

Il framework fornisce:

1. **Anti-XSS per rich text**: `htmlSanitizer` nel pacchetto `@seaside/security`. Usa `isomorphic-dompurify` (DOMPurify lato server) per sanitizzare HTML generato da utenti. Whitelist di tag e attributi consentiti, strip di tutto il resto.

```typescript
// @seaside/security
import DOMPurify from 'isomorphic-dompurify';

export interface HtmlSanitizer {
  sanitize(html: string, options?: { allowedTags?: readonly string[] }): string;
}

export const defaultSanitizer: HtmlSanitizer = {
  sanitize(html, options) {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: options?.allowedTags ?? ['p','br','strong','em','ul','ol','li','a','h1','h2','h3'],
      ALLOWED_ATTR: ['href','title','target','rel'],
    });
  },
};

// Uso nell'handler
export class UpdateArticleHandler implements CommandHandler<UpdateArticleCommand, void> {
  constructor(private readonly sanitizer: HtmlSanitizer, private readonly articles: ArticleRepository) {}

  async handle(cmd: UpdateArticleCommand): Promise<Result<void>> {
    const safeHtml = this.sanitizer.sanitize(cmd.content);
    // ... persisti safeHtml
    return Result.ok(undefined);
  }
}
```

2. **SQL injection prevention**: garantita architetturalmente da Drizzle (prepared statements / parametrized queries) + repository pattern (D-34). Nessun SQL raw consentito senza `sql\`\`` taggato (verificato da architecture tests / lint rule).

3. **Global string trimming**: il framework fornisce un `trimStrings()` zod transformer riusabile incluso negli schemi base. Comportamento ereditato dal legacy.

4. **Security headers**: gestiti centralmente dal middleware (sez. 7.9.2). Includono `X-Content-Type-Options: nosniff` che previene MIME sniffing.

**Cosa NON era nel legacy e viene aggiunto:**
- DOMPurify esplicito per rich text (il legacy non lo aveva in modo formalizzato)
- Rate limiting Redis-backed con scope per endpoint (il legacy non lo aveva)
- CSP policy esplicita e configurabile (il legacy usava helmet defaults)

---

## Capitolo 8 -- Architettura dei Repository

### 8.1 Modello multi-repo

**Decisione D-51: CONFERMATA -- Multi-repo, ognuno Turborepo, framework come pacchetti npm**

Il progetto adotta un modello **multi-repo**:

- **Framework repo** (`SEASYDE_AI`): Turborepo mantenuto dal team framework. Contiene i pacchetti `@seaside/*` (building blocks, shared UI, tooling). Pubblica pacchetti npm su un feed privato (Azure Artifacts npm / GitHub Packages).
- **Vertical repos** (uno per prodotto): Turborepo mantenuti dai team di prodotto. Contengono AppHost (Aspire .NET), app Next.js, app Hono, worker, moduli business. Consumano il framework come pacchetti npm.

Questo modello e' stato scelto perche':
- Ci sara' un team dedicato al framework e team separati per ogni verticale
- L'isolamento tra framework e verticali deve essere **fisico** (confine di pacchetto npm), non solo logico
- Ogni verticale ha il proprio ciclo di sviluppo, CI/CD e cadenza di release
- L'aggiornamento del framework e' esplicito e controllato (si alza la versione del pacchetto)
- Turborepo dentro ogni repo abilita build incrementali, cache, esecuzione parallela dei task

### 8.2 Layer logici

I layer architetturali restano gli stessi del modular monolith, ma attraversano due repository:

```
FRAMEWORK REPO (Turborepo)                VERTICAL REPO (Turborepo)
──────────────────                        ──────────────────
                                          ┌──────────────┐
                                          │   AppHost    │  (Aspire .NET, orchestrazione dev)
                                          └──────┬───────┘
                                                 │ orchestra
                                    ┌────────────┼──────────────────┐
                                    │            │                  │
                              ┌─────▼──────┐ ┌───▼────┐  ┌─────────▼──────────┐
                              │  apps/web  │ │workers │  │  observability     │
                              │  apps/api  │ │        │  │  (da @seaside)     │
                              └─────┬──────┘ └───┬────┘  └────────────────────┘
                                    │            │
                                    │ compongono │
                                    ▼            ▼
                              ┌──────────────────────────┐
                              │      modules/*           │  (business modules)
                              └────────────┬─────────────┘
                                           │ dipendono da (via npm)
┌──────────────────────────────────────────┤
│                                          │
│  ┌─────────────────────────┐             │
│  │  @seaside/*             │ ◄───────────┘
│  │  (building blocks)       │
│  ├─────────────────────────┤
│  │  @seaside/shell, components, theming
│  └─────────────────────────┘
│
└─ pubblicati come npm ────────────►  consumati come pacchetti npm
```

**Direzione delle dipendenze (vincolante):**
- `apps/web` (Next.js) -> `modules/*`, `@seaside/*` (npm), tipi del verticale
- `apps/api` (Hono) -> `modules/*`, `@seaside/*` (npm)
- `apps/worker` -> `modules/*`, `@seaside/*` (npm) -- no UI
- `modules/*` -> `@seaside/*` (npm), `packages/contracts` del verticale
- `@seaside/*` -> nulla di interno (solo dipendenze npm esterne)
- AppHost (Aspire .NET) -> orchestra tutto, non contiene logica

### 8.3 Struttura del framework repo

```
SEASYDE_AI/                              # FRAMEWORK REPO (Turborepo)
│
├── package.json                          # root, workspaces: ["packages/*", "tooling/*"]
├── pnpm-workspace.yaml                   # o npm workspaces
├── turbo.json                            # pipeline build/test/lint/release
├── tsconfig.base.json                    # base tsconfig esteso da tutti i package
├── .changeset/                           # changesets per versioning
│
├── packages/                             # FRAMEWORK CORE
│   ├── abstractions/                    # → npm: @seaside/abstractions
│   ├── application/                     # → npm: @seaside/application
│   ├── domain/                          # → npm: @seaside/domain
│   ├── infrastructure/                  # → npm: @seaside/infrastructure
│   ├── security/                        # → npm: @seaside/security
│   ├── identity/                        # → npm: @seaside/identity (server side)
│   ├── identity-web/                    # → npm: @seaside/identity-web (Auth.js wiring)
│   ├── users/                           # → npm: @seaside/users
│   ├── configuration/                   # → npm: @seaside/configuration
│   ├── audit/                           # → npm: @seaside/audit
│   ├── observability/                   # → npm: @seaside/observability
│   ├── background-jobs/                 # → npm: @seaside/background-jobs
│   ├── error-handling/                  # → npm: @seaside/error-handling
│   ├── hooks/                           # → npm: @seaside/hooks
│   ├── file-storage/                    # → npm: @seaside/file-storage
│   ├── hierarchical-entities/           # → npm: @seaside/hierarchical-entities
│   ├── state-machine/                   # → npm: @seaside/state-machine
│   ├── workspace/                       # → npm: @seaside/workspace
│   ├── messaging-azure-sb/              # → npm: @seaside/messaging-azure-sb
│   ├── messaging-nats/                  # → npm: @seaside/messaging-nats (futuro)
│   ├── shell/                           # → npm: @seaside/shell (React/Next.js shell)
│   ├── components/                      # → npm: @seaside/components (React + AntD wrapper)
│   ├── theming/                         # → npm: @seaside/theming (design tokens + AntD theme)
│   ├── dynamic-forms/                   # → npm: @seaside/dynamic-forms (react-hook-form + zod)
│   └── testing/                         # → npm: @seaside/testing (vitest helpers, axe wrapper)
│
├── tooling/                              # PACCHETTI DI BUILD/LINT INTERNI
│   ├── tsconfig/                        # → npm: @seaside/tsconfig (base, react, node)
│   ├── eslint-config/                   # → npm: @seaside/eslint-config
│   ├── dependency-cruiser/              # → npm: @seaside/dependency-cruiser (regole arch)
│   └── prettier-config/                 # → npm: @seaside/prettier-config
│
├── tests/
│   ├── architecture/                    # dependency-cruiser tests sul framework stesso
│   └── e2e-smoke/                       # smoke test sui template emessi
│
├── docs/
│   ├── adr/
│   └── architecture/
│
├── .editorconfig
└── README.md
```

### 8.4 Struttura di un vertical repo (template)

Il team framework fornisce un **template repo completo e funzionante** (starter kit) da cui ogni verticale parte. Il template contiene la struttura pronta, un modulo di esempio con tutti i pattern architetturali, app Next.js con shell e theming, app Hono con mediator, AppHost Aspire, architecture tests e CI/CD base. Al primo `dotnet run --project AppHost` (o `pnpm dev` se si bypassa Aspire) il verticale e' operativo.

> **Dettaglio completo**: il design dello starter kit e' documentato in [STARTER_KIT.md](STARTER_KIT.md).
> Il framework fornisce anche generatori (`pnpm seaside new module`, `pnpm seaside new worker`) per scaffolding rapido di moduli, worker ed eventi.

```
[nomeprodotto]/                          # VERTICAL REPO (Turborepo, da template)
│
├── package.json                         # root, workspaces: ["apps/*", "modules/*", "packages/*"]
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json                   # estende @seaside/tsconfig/base
├── .changeset/                          # changesets (opzionale per verticali)
│
├── AppHost/                             # Aspire AppHost (.NET 9, unico progetto C#)
│   ├── AppHost.csproj
│   └── Program.cs                       # builder.AddPostgres / AddRedis / AddNpmApp / AddNodeApp
│
├── apps/
│   ├── web/                             # Next.js (frontend + BFF)
│   │   ├── package.json                 # dipende da @seaside/shell, components, identity-web, ...
│   │   ├── next.config.js
│   │   ├── auth.config.ts               # Auth.js config (multi-provider)
│   │   ├── app/                         # App Router
│   │   │   ├── (auth)/
│   │   │   ├── (app)/
│   │   │   └── api/                     # Route Handlers BFF
│   │   ├── components/
│   │   └── Dockerfile
│   ├── api/                             # Hono API
│   │   ├── package.json                 # dipende da @seaside/application, infrastructure, ...
│   │   ├── src/
│   │   │   ├── server.ts                # entrypoint Hono (compone moduli)
│   │   │   └── middleware/
│   │   └── Dockerfile
│   └── worker/                          # Node.js worker (1 o piu')
│       ├── package.json
│       ├── src/server.ts
│       └── Dockerfile
│
├── modules/                             # BUSINESS MODULES (package npm interni)
│   └── orders/
│       ├── package.json                 # nome: @<vertical>/module-orders
│       ├── src/
│       │   ├── domain/
│       │   ├── application/
│       │   ├── infrastructure/
│       │   ├── endpoints/
│       │   └── index.ts
│       ├── drizzle/                     # migrations del modulo
│       │   ├── 0001_init.sql
│       │   └── drizzle.config.ts
│       └── vitest.config.ts
│
├── packages/                            # PACCHETTI INTERNI CONDIVISI DAL VERTICALE
│   ├── contracts/                       # DTO/integration events condivisi tra moduli
│   ├── eslint-config/                   # estende @seaside/eslint-config
│   └── tsconfig/                        # estende @seaside/tsconfig
│
├── tests/
│   ├── architecture/                    # dependency-cruiser tests
│   ├── integration/                     # Testcontainers
│   └── e2e/                             # Playwright
│
├── .npmrc                               # punta al feed privato @seaside
├── .editorconfig
└── README.md
```

### 8.5 Strategia di packaging

Il framework pubblica pacchetti npm con **semantic versioning** su un feed privato.

**Pacchetti pubblicati (npm scope `@seaside`):**

| Pacchetto | Contenuto |
|---|---|
| `@seaside/abstractions` | Interfacce e contratti base (Entity, Command, Query, Result, MessageBus...) |
| `@seaside/application` | Mediator, pipeline, CQRS base types, DI leggero, Hono adapter |
| `@seaside/domain` | Primitive di dominio (Entity, AggregateRoot, ValueObject, DomainEvent) |
| `@seaside/infrastructure` | Drizzle base, Unit of Work, Repository base, outbox interceptor |
| `@seaside/security` | Auth helpers, RBAC PermissionChecker, FieldEncryptor, HtmlSanitizer, security headers |
| `@seaside/identity` | Identity server-side (JWT s2s, JWKS endpoint, key rotation) |
| `@seaside/identity-web` | Auth.js wiring + providers + adapters (Redis, Drizzle) preconfigurati |
| `@seaside/users` | Schema Drizzle e service per User, Role, Permission, Group, UserWorkspace |
| `@seaside/audit` | Audit trail (hook automatici, AuditLogger, schema platform.audit_log) |
| `@seaside/observability` | Logging strutturato (pino), metrics (OTel), tracing (OTel) |
| `@seaside/configuration` | ModuleConfiguration, env loader con Zod, FeatureFlag provider |
| `@seaside/error-handling` | Error mapping, Problem Details middleware |
| `@seaside/background-jobs` | Abstractions per job/worker + BullMQ adapter |
| `@seaside/hooks` | Pre/PostSave/Delete hooks integrati con Drizzle interceptor |
| `@seaside/file-storage` | Astrazione file storage (Azure Blob Storage, local disk) |
| `@seaside/hierarchical-entities` | Entita' gerarchiche, query su alberi (materialized path), operazioni sottoalbero |
| `@seaside/state-machine` | Macchina a stati, transizioni, guard, azioni disponibili |
| `@seaside/workspace` | Workspace scoping, repository base WorkspaceScopedRepository, RLS helper, middleware Hono, componente shell selector |
| `@seaside/messaging-azure-sb` | Adapter Azure Service Bus + Outbox/Inbox infra + OutboxRelay worker |
| `@seaside/messaging-nats` | Adapter NATS JetStream (futuro) |
| `@seaside/shell` | Shell applicativa React (layout, nav, sidebar, header, workspace selector, session expired guard) |
| `@seaside/components` | Componenti UI condivisi (`<SeasideDataGrid>`, `<SeasideForm>`, ...) wrappati sopra Ant Design |
| `@seaside/theming` | Design tokens, AntD ConfigProvider, dark mode, density |
| `@seaside/dynamic-forms` | Engine form dinamiche (react-hook-form + zod + schema renderer) |
| `@seaside/testing` | Utility per Vitest, axe wrapper, Testcontainers helpers |

**Regole di versionamento:**

- Semantic versioning: MAJOR.MINOR.PATCH
- MAJOR: breaking changes (richiede intervento nei verticali)
- MINOR: nuove feature, backward-compatible
- PATCH: bug fix
- **Independent versioning**: ogni pacchetto ha il proprio ciclo di rilascio. Solo i pacchetti effettivamente modificati vengono pubblicati con una nuova versione (Changesets gestisce questo)
- **Monorepo con changesets**: tutti i pacchetti risiedono nello stesso Turborepo. Changesets traccia le modifiche per pacchetto e bumpa le versioni minime necessarie
- **Changelog per pacchetto**: ogni pacchetto ha il proprio `CHANGELOG.md` generato da changesets. Il changelog globale aggrega le modifiche per release

**Breaking changes e deprecation:**

- **Deprecation period**: 1 anno. Le API deprecate vengono segnate con `@deprecated` JSDoc (rilevato dal linter ESLint `deprecation/deprecation`)
- **Co-esistenza**: old e new API coesistono per l'intero periodo di deprecation. La vecchia API delega internamente alla nuova (wrapper) per evitare doppia manutenzione
- **Escalation**: warning nella minor che introduce la deprecation → la major successiva (dopo >= 1 anno) rimuove la vecchia API
- **Migration guide**: guide testuali incluse nel changelog della major release (changesets supporta extended changelog)
- **Supporto versioni**: supporto fino a N-3 (i verticali hanno 3 major version per aggiornare)
- **Pre-rilascio**: Release Candidate (`@seaside/abstractions@2.0.0-rc.1`) su ambienti interni prima della pubblicazione ufficiale

**Feed privato:**
- Azure Artifacts npm o GitHub Packages (da decidere a livello operativo)
- Ogni vertical repo ha un `.npmrc` che punta al feed con autenticazione (token in env var `NPM_TOKEN`)

### 8.6 Modello di consumo del framework

Questo modello rende esplicito come i team di prodotto consumano il framework. Sostituisce il concetto di "estensibilita' profonda" descritto nel brainstorming Pavia:

1. **Creare un nuovo prodotto verticale**: il team framework fornisce il template repo. Il team di prodotto lo clona/genera e inizia a lavorare nelle aree designate (`modules/`, `apps/web`, `apps/api`, `apps/worker`). Il framework non si tocca.

2. **Usare i building blocks**: il verticale referenzia i pacchetti npm del framework e usa le interfacce, i base types, i pipeline behaviors. Il framework fa il lavoro pesante (validazione, audit, auth, error handling, observability); il verticale scrive solo la logica di business.

3. **Aggiornare il framework**: quando esce una nuova versione del framework, il team di prodotto alza le versioni nei `package.json` (un solo `pnpm update --recursive @seaside/*` o tramite `Renovate`/`Dependabot`), verifica la compatibilita', e adotta le nuove feature.

> **Nota sulla "estensibilita' light" del brainstorming**: va distinta in due parti.
> - **Hook nei flussi applicativi** (pre-save, post-save, pre-delete, etc.): previsti nel framework base come building block `@seaside/hooks`. I verticali implementano le interfacce del framework (es. `PreSaveHook<TEntity>`, `PostSaveHook<TEntity>`) e le registrano via DI. Il framework li scopre e li esegue automaticamente nei punti appropriati del flusso. Senza questi hook, i verticali non avrebbero un modo standard per intervenire nel ciclo di vita delle entita'.
> - **Sandbox per esecuzione codice custom** (SQL, JavaScript, codice utente finale): DEFER. E' una capability che un prodotto verticale potra' costruire sopra gli hook quando servira'. Non e' responsabilita' del framework base.

### 8.7 Regole di dipendenza

#### Dipendenze consentite (vertical repo)

| Pacchetto sorgente | Puo' dipendere da |
|---|---|
| `AppHost/` (Aspire .NET) | Niente codice TypeScript (orchestratore puro: dichiara container e processi) |
| `apps/web` (Next.js) | `modules/*`, `@seaside/*` (npm), `packages/contracts` |
| `apps/api` (Hono) | `modules/*`, `@seaside/*` (npm), `packages/contracts` |
| `apps/worker` | `modules/*`, `@seaside/*` (npm), `packages/contracts` -- **NO** `@seaside/shell`, `components`, `theming` |
| `modules/*` | `@seaside/*` (npm), `packages/contracts` |
| `packages/contracts` | `@seaside/abstractions` (npm) |

#### Dipendenze consentite (framework repo)

| Pacchetto sorgente | Puo' dipendere da |
|---|---|
| `@seaside/*` (building blocks) | Solo altri `@seaside/*` e pacchetti npm esterni |
| `@seaside/shell`, `components`, `theming` | `@seaside/abstractions`, `@seaside/security` (per permission hooks), `react`, `antd` |
| `@seaside/identity-web` | `@seaside/identity`, `@seaside/users`, `next-auth`, `react` |
| `tooling/*` | Nessuna dipendenza interna al framework (sono pacchetti tooling autonomi) |

#### Dipendenze vietate

| Divieto | Motivazione |
|---|---|
| `@seaside/*` -> `modules/*` | Il framework non conosce i verticali |
| `@seaside/*` -> `apps/*` | Il framework non conosce gli host |
| `modules/*` -> `apps/*` | I moduli non conoscono chi li ospita |
| `modules/*` -> altri `modules/*` | Nessun coupling diretto tra moduli (senza approvazione) |
| `apps/worker` -> `@seaside/shell`, `components`, `theming` | I worker non hanno interfaccia utente |
| `@seaside/domain` -> `@seaside/infrastructure` | Rispetto dell'esagonale anche nel framework |

> **Enforcement**: nel framework repo, le regole sono verificate da `dependency-cruiser` (D-81). Nei vertical repos, le regole sono **fisicamente imposte** dal confine di pacchetto: il verticale non puo' modificare il framework perche' lo consuma come pacchetto npm pubblicato.

#### Dipendenze intra-modulo -- Hexagonal (D-23)

All'interno di ogni modulo business, i layer logici seguono le regole di dipendenza dell'architettura esagonale (Cap. 5.9.3):

| Layer sorgente | Puo' dipendere da | NON puo' dipendere da |
|---|---|---|
| `domain/` | Solo `@seaside/domain`, `@seaside/abstractions` | Application, Infrastructure, Endpoints |
| `application/` | `domain/`, `@seaside/application`, `@seaside/abstractions` | Infrastructure, Endpoints |
| `infrastructure/` | `domain/`, `application/`, `@seaside/infrastructure`, pacchetti esterni (Drizzle, Azure SDK, ecc.) | Endpoints |
| `endpoints/` | `application/` (via mediator), `@seaside/abstractions` | Domain (non direttamente), Infrastructure |

> **Enforcement**: queste regole sono verificate da `dependency-cruiser` con la configurazione condivisa `@seaside/dependency-cruiser` (D-81, Cap. 13.4). Le regole vengono applicate automaticamente a ogni modulo scoperto nei `modules/*`.

### 8.8 Comunicazione tra moduli business

I moduli business all'interno di un vertical repo sono isolati tra loro. La comunicazione tra moduli e' governata da due principi architetturali **mandatori**:

**Decisione D-56: CONFERMATA -- Eventual Consistency**

I moduli non si aspettano reazioni sincrone dagli altri moduli. Quando un modulo pubblica un integration event, il modulo consumatore lo processera' **eventualmente** -- non nella stessa richiesta HTTP, non nella stessa transazione. Questo e' un vincolo architetturale, non un'opzione.

Conseguenze:
- Nessuna transazione distribuita tra moduli
- Nessuna chiamata sincrona diretta tra moduli (no reference dirette, no shared DbContext)
- La UI deve essere progettata per tollerare ritardi tra un'operazione e i suoi effetti collaterali su altri moduli
- Ogni modulo e' **autonomo**: ha i propri dati, le proprie regole, il proprio stato

**Decisione D-57: CONFERMATA -- Comunicazione asincrona con buffering queue**

Tutta la comunicazione cross-modulo avviene tramite **Integration Events** pubblicati su un message broker con coda persistente. Il framework fornisce l'infrastruttura di messaging nel building block `Messaging`.

Pattern di comunicazione consentiti:

| Pattern | Quando | Esempio |
|---|---|---|
| **Integration Events via broker** (mandatorio) | Comunicazione tra moduli | `OrderCreated` → modulo Inventory reagisce |
| **Shared Contracts** (complementare) | DTO condivisi per i payload degli eventi | `OrderCreatedEvent` definito in Contracts |
| **Direct reference** | **VIETATO** | -- |

Flusso:

```
Modulo A                              Message Broker                    Modulo B
─────────                             ──────────────                    ─────────
Handler                               Azure Service Bus
  │                                    / NATS JetStream
  ├── uow.commit()                          │
  │   ├── persist entity               │
  │   └── persist outbox ──────────────►│ topic: orders.created
  │       (stessa transazione)          │         │
  │                                     │         ▼
  │                                     │   Consumer (subscription)
  │                                     │         │
  │                                     │         ▼
  │                                     │   Inbox check (idempotenza)
  │                                     │         │
  │                                     │         ▼
  │                                     │   IntegrationEventHandler
  │                                     │         │
  │                                     │         ▼
  │                                     │   Modulo B reagisce
```

**Diagramma di sequenza -- Messaging con Outbox/Inbox:**

```mermaid
sequenceDiagram
    participant A as Modulo A (Handler)
    participant DBA as DB Modulo A
    participant OR as OutboxRelay (Worker)
    participant SB as Azure Service Bus
    participant IF as InboxFilter
    participant B as Modulo B (Handler)
    participant DBB as DB Modulo B

    A->>DBA: uow.commit() (entita' + outbox_message nella stessa transazione)
    Note over DBA: Transazione atomica: dati + evento

    OR->>DBA: Poll OutboxMessages (non processati)
    OR->>SB: Publish OrderCreated (topic: orders.created)
    OR->>DBA: Mark as processed

    SB->>IF: Deliver message (consumer subscription)
    IF->>DBB: Check InboxMessages (MessageId gia' processato?)
    alt Nuovo messaggio
        IF->>B: Invoke IntegrationEventHandler
        B->>DBB: Processa + salva InboxMessage
    else Duplicato
        IF->>IF: Scarta (idempotenza)
    end
```

#### 8.8.1 Message broker

**Decisione D-58: CONFERMATA -- Azure Service Bus (primario) + NATS JetStream (futuro)**

Il deploy primario e' su Azure, quindi Azure Service Bus e' il broker di default. NATS JetStream sara' integrato come alternativa per scenari non-Azure o on-premise.

L'astrazione e' presente **dal giorno 1**: i moduli non conoscono il broker sottostante.

**Architettura (coerente con D-23 Hexagonal):**

```
@seaside/abstractions                  @seaside/messaging-azure-sb
┌──────────────────────┐              ┌──────────────────────────────┐
│  MessageBus (Port)   │◄─────────────│  AzureServiceBusAdapter       │  ← primario
│                      │              └──────────────────────────────┘
│  - publish()         │
│  - subscribe()       │              @seaside/messaging-nats
│  - schedule()        │              ┌──────────────────────────────┐
│  - request()         │◄─────────────│  NatsMessageBusAdapter        │  ← futuro
│  - deadLetter()      │              └──────────────────────────────┘
└──────────────────────┘
```

**Interfaccia completa MessageBus:**

L'astrazione deve coprire **tutte** le funzionalita' necessarie, non solo il caso banale publish/subscribe. Feature non supportate da un adapter specifico lanciano `UnsupportedFeatureError` con messaggio chiaro.

```typescript
export interface MessageBus {
  // Core: publish/subscribe
  publish<T extends IntegrationEvent>(message: T): Promise<void>;
  subscribe<T extends IntegrationEvent>(
    eventType: new (...args: any[]) => T,
    handler: (msg: T, ctx: ConsumerContext) => Promise<void>,
  ): Promise<Subscription>;

  // Scheduled delivery (Azure SB: scheduledEnqueueTimeUtc)
  schedule<T extends IntegrationEvent>(message: T, scheduledTime: Date): Promise<void>;

  // Request/reply (per casi specifici, sincrono-sopra-asincrono)
  request<TRequest, TResponse>(request: TRequest, timeoutMs: number): Promise<TResponse>;

  // Dead letter management
  deadLetter(messageId: string, reason: string): Promise<void>;
  getDeadLetters(topic: string, maxCount: number): Promise<readonly DeadLetterMessage[]>;

  // Topic management
  topicExists(topicName: string): Promise<boolean>;
}
```

**Nota sul lock-in**: l'astrazione copre la superficie completa. Se un adapter non supporta una feature (es. NATS non ha scheduled delivery nativo), l'adapter puo' implementarla con un workaround (es. delayed publish via timer) o lanciare `UnsupportedFeatureError`. Il costo reale dello switch e' documentato: ogni feature usata che va oltre publish/subscribe base richiede verifica di compatibilita' nell'adapter target.

**Pacchetti npm:**

| Pacchetto | Contenuto | Quando |
|---|---|---|
| `@seaside/abstractions` | `MessageBus`, `IntegrationEvent`, contratti messaging | Giorno 1 |
| `@seaside/messaging-azure-sb` | Adapter Azure Service Bus (`@azure/service-bus`) | Giorno 1 |
| `@seaside/messaging-nats` | Adapter NATS JetStream (`nats.js`) | Fase successiva |

**Wiring nelle app:**

```typescript
// apps/api/src/server.ts -- scelta via env
import { createMessageBus } from '@seaside/messaging-azure-sb';
// import { createMessageBus } from '@seaside/messaging-nats'; // futuro

export const messageBus = createMessageBus({
  connectionString: env.SERVICE_BUS_CONNECTION_STRING,
  defaultRetryPolicy: { maxRetries: 3, backoff: 'exponential' },
});
```

**Compatibilita' payload:** i moduli serializzano il messaggio in JSON tramite l'astrazione `MessageBus`. Il payload e' identico indipendentemente dal broker sottostante. Solo l'adapter cambia (connessione, topic/subject, ack). Lo switch avviene **senza toccare codice applicativo**.

**Aspire:**

```csharp
// AppHost -- risorse broker
if (builder.ExecutionContext.IsPublishMode)
{
    // Prod: Azure Service Bus gia' provisioned
    var serviceBus = builder.AddConnectionString("messaging");
    api.WithReference(serviceBus);
    worker.WithReference(serviceBus);
}
else
{
    // Dev: emulatore o istanza di sviluppo (Azure Service Bus emulator container)
    var serviceBus = builder.AddAzureServiceBus("messaging");
    api.WithReference(serviceBus);
    worker.WithReference(serviceBus);
}
```

#### 8.8.2 Outbox/Inbox pattern

**Decisione D-59: CONFERMATA -- Outbox/Inbox per garanzia di consegna**

Per garantire che un integration event venga **sempre** consegnato se i dati sono stati salvati, il framework implementa l'Outbox pattern:

**Outbox (lato publisher):**
- L'integration event viene serializzato e scritto in una tabella `<schema-modulo>.outbox_messages` **nella stessa transazione** della Unit of Work
- Un worker dedicato (`OutboxRelay`) legge periodicamente la tabella e pubblica i messaggi sul broker. Postgres `LISTEN/NOTIFY` riduce la latenza di trigger a millisecondi
- Dopo la pubblicazione confermata, il messaggio viene marcato come inviato
- Se il processo crasha dopo il commit, l'evento e' comunque in tabella e verra' pubblicato al prossimo ciclo

**Inbox (lato consumer):**
- Quando un consumer riceve un messaggio, prima di processarlo verifica nella tabella `InboxMessages` se il `MessageId` e' gia' stato processato
- Se si', scarta il messaggio (idempotenza)
- Se no, processa e registra il `MessageId` nell'inbox
- Questo protegge dalla doppia consegna (at-least-once delivery del broker)

```
Tabelle per modulo:

[NomeModulo]_OutboxMessages
├── Id (GUID)
├── EventType (string)
├── Payload (JSON)
├── CreatedAt (datetime)
├── ProcessedAt (datetime, nullable)
└── Error (string, nullable)

[NomeModulo]_InboxMessages
├── Id (GUID)
├── MessageId (GUID)
├── EventType (string)
├── ProcessedAt (datetime)
```

Il framework fornisce:
- `OutboxUowHook` (in `@seaside/messaging-azure-sb`) che si aggancia all'Unit of Work di `@seaside/infrastructure` e scrive automaticamente nella tabella outbox al commit
- `OutboxRelay` worker (Node.js process) che fa il relay verso il broker (Postgres LISTEN/NOTIFY + polling di backup)
- `InboxFilter` middleware Hono/consumer che verifica l'idempotenza prima di invocare l'handler
- Tutto nel pacchetto `@seaside/messaging-azure-sb` (e futuro `messaging-nats`)

#### 8.8.3 Comunicazione complementare: Shared Contracts

I Shared Contracts restano un pattern **complementare** (non alternativo) agli integration events. Servono per definire i DTO dei payload degli eventi in un'area condivisa del vertical repo, in modo che publisher e consumer concordino sul formato senza dipendere l'uno dall'implementazione dell'altro.

```
src/
  ├── Contracts/                          # Shared tra moduli dello stesso vertical
  │   ├── Orders/
  │   │   └── OrderCreatedEvent.cs       # DTO dell'integration event
  │   └── Inventory/
  │       └── InventoryReservedEvent.cs
  ├── Modules/
  │   ├── Orders/         # pubblica OrderCreatedEvent
  │   └── Inventory/      # consuma OrderCreatedEvent, pubblica InventoryReservedEvent
```

#### 8.8.4 Saga pattern (choreography-based)

Quando un flusso multi-modulo fallisce a meta', ogni modulo e' responsabile delle proprie **compensating transactions**. Il framework adotta il pattern **choreography-based saga**: niente orchestratore centrale, ogni modulo reagisce agli eventi e compensa autonomamente.

**Flusso normale:**

```
ModuloA: crea Ordine → pubblica OrderCreated
ModuloB: riceve OrderCreated → riserva inventario → pubblica InventoryReserved
ModuloC: riceve InventoryReserved → crea spedizione → pubblica ShipmentCreated
```

**Flusso con fallimento e compensazione:**

```
ModuloC: creazione spedizione FALLISCE → pubblica ShipmentFailed
ModuloB: riceve ShipmentFailed → rilascia inventario → pubblica InventoryReleased
ModuloA: riceve InventoryReleased → aggiorna stato ordine a "Annullato"
```

**Diagramma di sequenza -- Saga con compensazione:**

```mermaid
sequenceDiagram
    participant A as Modulo Ordini
    participant SB as Service Bus
    participant B as Modulo Inventario
    participant C as Modulo Spedizioni

    Note over A,C: Flusso normale
    A->>SB: OrderCreated (correlationId: abc-123)
    SB->>B: OrderCreated
    B->>B: Riserva inventario
    B->>SB: InventoryReserved (correlationId: abc-123)
    SB->>C: InventoryReserved
    C->>C: Crea spedizione... FALLISCE

    Note over A,C: Compensazione
    C->>SB: ShipmentFailed (correlationId: abc-123)
    SB->>B: ShipmentFailed
    B->>B: Rilascia inventario
    B->>SB: InventoryReleased (correlationId: abc-123)
    SB->>A: InventoryReleased
    A->>A: Ordine → stato "Annullato"
```

**Regole:**

| Aspetto | Regola |
|---|---|
| **Pattern** | Choreography (niente orchestratore centrale) |
| **Compensating transactions** | Ogni modulo implementa handler per gli eventi di fallimento dei moduli a valle |
| **Correlation ID** | Ogni integration event porta un `CorrelationId` (GUID) per tracciare l'intero flusso distribuito |
| **Dead letter queue** | Messaggi non processabili dopo N retry finiscono nella DLQ. `messageBus.deadLetter()` per spostamento esplicito |
| **Timeout** | Se un modulo non riceve risposta entro un tempo configurabile, pubblica evento di compensazione |
| **Idempotenza** | Garantita dall'Inbox pattern (Cap. 8.8.2): ogni handler puo' ricevere lo stesso evento piu' volte senza effetti collaterali |
| **Distributed tracing** | Correlation ID propagato su ogni evento + OpenTelemetry Activity per tracciare il flusso end-to-end in Aspire dashboard |
| **Monitoring** | Metriche su: eventi pubblicati, eventi consumati, eventi in DLQ, latenza tra publish e consume |

**Il framework fornisce:**
- `correlationId` automatico in `IntegrationEvent` (popolato dal primo evento, propagato nei successivi tramite OTel baggage)
- `OutboxRelay` con retry configurabile (default: 3 retry con exponential backoff)
- `DeadLetterService` per gestione DLQ (lista, reprocess, purge)
- Metriche OpenTelemetry per monitoring dei flussi

#### 8.8.5 Caching

**Strategia a due livelli:**

| Livello | Tecnologia | Priorita' | Quando |
|---|---|---|---|
| **In-memory** | `IMemoryCache` (.NET built-in) | Priorita' 0 (giorno 1) | Dati read-heavy poco variabili (configurazioni, permessi, lookup) |
| **Distributed** | Redis via `IDistributedCache` | Fase successiva | Dati condivisi tra istanze, sessioni, cache di query complesse |

**Invalidation:** prevalentemente **event-based**. Quando un modulo modifica un dato che altri moduli cachano, pubblica un integration event di invalidazione. Il modulo consumatore invalida la propria cache al ricevimento dell'evento. Time-based (TTL) come fallback per dati che non hanno eventi di modifica espliciti.

**Response caching per API:** gestito da **Azure** (Azure Front Door / Application Gateway) con politiche di caching basate su header `Cache-Control`. Il framework non implementa response caching middleware -- e' responsabilita' dell'infrastruttura. Hono offre `cache()` middleware abilitabile per i pochi endpoint che lo richiedono.

**CQRS read-side caching:** valutato **caso per caso** dai singoli moduli. Il framework fornisce le primitive (`MemoryCache` + `RedisCache` adapter unificati dietro l'interfaccia `Cache` in `@seaside/infrastructure`), il verticale decide cosa cachare in base al proprio dominio. Non imponiamo una strategia unica.

**Static assets frontend:** gestiti dalla pipeline di build Next.js (`next build` produce asset con content hash nel filename) + CDN/Azure Blob Storage con header `Cache-Control: max-age=31536000, immutable` per asset con hash. Next.js Image gestisce automaticamente l'ottimizzazione delle immagini.

**Il framework fornisce:**
- Helper `createCache()` che configura cache in-memory (LRU) + opzionalmente Redis backend
- `CacheInvalidator` per invalidazione tipizzata: `invalidate<TEntity>(entityId)` che pubblica un evento di invalidazione su `MessageBus`
- Pattern di cache-aside ready-to-use nei repository base

### 8.9 Naming e namespace

**Decisione D-52: CONFERMATA -- `@seaside` (npm scope)**

Il root namespace del framework e' lo scope npm `@seaside`. Tutti i pacchetti pubblicati seguono il pattern `@seaside/<package-name>`.

**Pacchetti npm pubblicati** (elenco completo nel Cap. 8.5):

- `@seaside/abstractions`
- `@seaside/domain`
- `@seaside/application`
- `@seaside/infrastructure`
- `@seaside/security`
- `@seaside/messaging-azure-sb`
- `@seaside/shell`, `@seaside/components`, `@seaside/theming`
- ... (vedi Cap. 8.5)

**Namespace verticale:** `@<nomeprodotto>` come scope npm interno al monorepo (es. `@disclosure/module-orders`, `@disclosure/contracts`). I pacchetti interni non vengono pubblicati ma referenziati tramite npm workspaces (`workspace:*`).

### 8.10 Workspace structure

**Decisione D-53: CONFERMATA**

**Framework repo (Turborepo):**

```
SEASYDE_AI/
├── package.json                  # root workspaces: ["packages/*", "tooling/*"]
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .changeset/
├── packages/
│   ├── abstractions/
│   ├── application/
│   ├── domain/
│   ├── infrastructure/
│   └── ...                       # vedi Cap. 8.3
├── tooling/
│   ├── tsconfig/
│   ├── eslint-config/
│   ├── dependency-cruiser/
│   └── prettier-config/
└── tests/
    ├── architecture/
    └── e2e-smoke/
```

**Vertical repo (Turborepo):**

```
[nomeprodotto]/
├── package.json                  # root workspaces: ["apps/*", "modules/*", "packages/*"]
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── AppHost/                      # unico progetto .NET (Aspire)
│   ├── AppHost.csproj
│   └── Program.cs
├── apps/
│   ├── web/                      # Next.js
│   ├── api/                      # Hono
│   └── worker/                   # Node.js
├── modules/
│   ├── orders/
│   └── ...
├── packages/
│   ├── contracts/
│   ├── eslint-config/
│   └── tsconfig/
└── tests/
    ├── architecture/
    ├── integration/
    └── e2e/
```

### 8.11 CI/CD e produzione artifact

**Decisione D-55: CONFERMATA**

**Vincolo di compliance**: gli sviluppatori NON gestiscono il deploy in produzione. Il deployment e' responsabilita' di IT. Questa separazione e' un requisito delle certificazioni interne (procedure SOC) e non e' negoziabile.

**Modello di deployment: multi-container su Azure Container Apps**

Ogni vertical repo produce **piu' Docker image** -- una per ogni servizio deployabile separatamente:

| Container | Contenuto | Scaling | Esempio image |
|---|---|---|---|
| **Web** | Next.js standalone build (`next start`) | Indipendente | `nomeprodotto-web:1.2.3` |
| **API** | Hono server (`node dist/server.js`) | Indipendente | `nomeprodotto-api:1.2.3` |
| **Worker N** | Node.js worker (`node dist/worker.js`) | Indipendente | `nomeprodotto-scheduler:1.2.3` |
| **OutboxRelay** | Node.js worker dedicato per outbox -> broker | Indipendente | `nomeprodotto-outbox-relay:1.2.3` |

Tutti i container di un verticale vengono deployati in un unico **Azure Container Apps Environment**. L'Environment e' l'unita' logica gestita da IT: un singolo perimetro che contiene tutti i servizi del prodotto.

**Database**: Azure Database for PostgreSQL Flexible Server, **esterno ai container**. Il database non viene mai containerizzato. L'istanza Azure Postgres e' gestita da IT separatamente. I container ricevono `DATABASE_URL` tramite environment variable o Azure Key Vault -- il pattern e' identico a quello descritto nel [Cap. 6.8](#68-strategia-di-connessione-al-database).

**Perche' Azure Container Apps (ACA) e non App Service:**

| Criterio | Azure Container Apps | Azure App Service |
|---|---|---|
| Multi-container | Nativamente supportato, ogni servizio e' un Container App separato | Supporto limitato (Docker Compose, Linux only, preview) |
| Scaling per servizio | Indipendente per ogni Container App | Tutti i container scalano insieme |
| Worker (no HTTP) | Supporta container senza ingress | Pensato per workload HTTP |
| Aspire integration | Target nativo di `azd` | Richiede setup manuale |
| Service discovery | Integrato nativamente con Aspire | Non disponibile |
| Costi | Consumption plan (pay-per-use) | Always-on (piano dedicato) |

**Responsabilita':**

| Chi | Cosa fa | Cosa NON fa |
|---|---|---|
| **Team framework** | Sviluppa i building blocks. La CI/CD del framework repo builda, testa e pubblica pacchetti npm sul feed privato | Non deploya nulla in produzione |
| **Team verticale** | Sviluppa moduli/app/worker. La CI/CD del vertical repo builda, testa e produce le Docker image del prodotto | Non deploya in produzione |
| **IT** | Prende le Docker image dal registry e le deploya nel Container Apps Environment del cliente. Gestisce Azure Database for PostgreSQL. | Non builda, non modifica codice |

**Flusso CI/CD:**

```mermaid
flowchart TD
    subgraph FW["CI/CD Framework Repo (Turborepo)"]
        FW1[Push / merge su main] --> FW2[turbo run build test lint]
        FW2 --> FW3[architecture tests<br/>dependency-cruiser]
        FW3 --> FW4["changeset publish<br/>npm publish @seaside/*"]
    end

    subgraph VR["CI/CD Vertical Repo (Turborepo)"]
        VR1[Push / merge su main] --> VR2[pnpm install dal feed privato]
        VR2 --> VR3["turbo run build test lint<br/>(Next.js + Hono + worker + moduli)"]
        VR3 --> VR4[Run test: unit + integration + architecture + E2E]
        VR4 --> VR5["Docker build per servizio<br/>(web, api, worker, outbox-relay)"]
        VR5 --> VR6["Push image su Container Registry"]
    end

    subgraph DEPLOY["Deploy (responsabilita' IT)"]
        VR6 --> D1["IT prende le image"]
        D1 --> D2["Deploy su Azure Container Apps Environment"]
        D2 --> D3[web container]
        D2 --> D4[api container]
        D2 --> D5[worker container]
        D3 & D4 & D5 --> D6[("Azure Database for PostgreSQL<br/>esterno ai container")]
    end

    FW4 -.->|dipendenza compilata| VR2

    style FW fill:#e8f5e9,stroke:#388e3c
    style VR fill:#e3f2fd,stroke:#1976d2
    style DEPLOY fill:#fff3e0,stroke:#f57c00
```

**Come framework e verticale si combinano nelle image**: il vertical repo referenzia i pacchetti npm del framework come dipendenze. Al momento del `docker build`, i pacchetti framework sono gia' installati e bundlati dentro l'output di ogni image (tsup o `next build standalone`). Ogni image e' **autocontenuta**: contiene il codice verticale + le dipendenze framework gia' risolte. IT riceve image pronte da deployare.

**Ruolo del manifest Aspire nel deployment:**

L'AppHost Aspire genera un manifest (`aspire-manifest.json`) che descrive l'**intera topologia** del verticale: quali servizi esistono, come comunicano, di quali risorse esterne hanno bisogno (es. `DATABASE_URL`, `REDIS_URL`). Questo manifest e' l'unico artefatto di configurazione che IT usa per capire la topologia.

```csharp
// AppHost/Program.cs del vertical repo
IResourceBuilder<IResourceWithConnectionString> postgres;
IResourceBuilder<IResourceWithConnectionString> redis;

if (builder.ExecutionContext.IsPublishMode)
{
    postgres = builder.AddConnectionString("appdb");
    redis = builder.AddConnectionString("cache");
}
else
{
    postgres = builder.AddPostgres("postgres").WithDataVolume().AddDatabase("appdb");
    redis = builder.AddRedis("cache").WithDataVolume();
}

var api = builder.AddNodeApp("api", "../apps/api", "start")
    .WithReference(postgres)
    .WithReference(redis)
    .WaitFor(postgres);

var worker = builder.AddNodeApp("worker", "../apps/worker", "start")
    .WithReference(postgres)
    .WithReference(redis);

builder.AddNpmApp("web", "../apps/web", "dev")
    .WithReference(api)
    .WithReference(redis)
    .WithHttpEndpoint(env: "PORT");
```

In development, `dotnet run --project AppHost` avvia tutto localmente (container Postgres + Redis, processi Node.js, Next.js dev server, Aspire dashboard). In publish mode, `azd` legge il manifest e genera l'infrastruttura ACA corrispondente. **Un unico AppHost descrive entrambi gli scenari.**

**Flusso di deploy per IT:**

```
Container Registry                  Azure
┌─────────────────────┐            ┌────────────────────────────────────────────┐
│ nomeprodotto-       │            │  Container Apps Environment                │
│   web:1.2.3         │ ─deploy──▶ │  ┌─────┐ ┌─────┐ ┌────────┐ ┌──────────┐ │
│ nomeprodotto-       │            │  │ web │ │ api │ │ worker │ │ outbox-  │ │
│   api:1.2.3         │            │  └──┬──┘ └──┬──┘ └───┬────┘ │ relay    │ │
│ nomeprodotto-       │            │     │       │        │      └────┬─────┘ │
│   worker:1.2.3      │            │     │   ┌───▼────────▼───────────▼──┐    │
│ nomeprodotto-       │            │     │   │ service discovery (Aspire) │    │
│   outbox-relay:1.2.3│            │     │   └───────────────────────────┘    │
└─────────────────────┘            └─────│────────────────────────────────────┘
                                         │
                                  ┌──────▼──────────────────────────────────┐
                                  │  Azure Database for PostgreSQL (esterno) │
                                  │  Azure Cache for Redis (esterno)         │
                                  │  Azure Service Bus (esterno)             │
                                  │  connection string via Key Vault /        │
                                  │  env var                                  │
                                  └──────────────────────────────────────────┘
```

Documentazione tecnica dettagliata: [`docs/architecture/aspire-deployment-guide.md`](aspire-deployment-guide.md).

#### 8.11.1 Monitoring in produzione

Il monitoring in produzione e' **responsabilita' di IT**, non del team di sviluppo. Il framework si limita a **esporre telemetria standard via OpenTelemetry** (tramite `@seaside/observability`) in modo che l'infrastruttura Azure la consumi automaticamente.

| Responsabilita' | Chi | Come |
|---|---|---|
| **Emissione telemetria** | Team framework / verticale | OpenTelemetry Node SDK (`@opentelemetry/sdk-node`) preconfigurato in `@seaside/observability` (traces, metrics, logs) |
| **Raccolta e storage** | IT / Azure | Azure Monitor / Application Insights riceve telemetria via OTLP HTTP exporter |
| **Alerting e dashboard** | IT | Configurazione Azure Monitor alerts, dashboard, action groups |
| **SLA/SLO** | IT + business | Definiti per prodotto, non per framework |
| **Runbook e on-call** | IT | Documentazione operativa gestita da IT |

Il framework garantisce che ogni servizio emetta telemetria strutturata (distributed tracing OTel, metriche custom, log strutturati `pino`) e health checks (`/health` -- readiness, `/alive` -- liveness). IT decide come consumarla.

---

## Capitolo 9 -- Framework Building Blocks

### 9.1 Elenco dei Building Blocks proposti

**Decisione D-60: DA CONFERMARE**

| Building Block (pacchetto npm) | Scopo | Stato |
|---|---|---|
| **`@seaside/abstractions`** | Interfacce base, marker interfaces, contratti fondamentali (`Entity`, `ValueObject`, `AuditableEntity`, `CurrentUser`, `Result`, `MessageBus`, `IntegrationEvent`) | Core |
| **`@seaside/application`** | Mediator setup, pipeline behaviors, CQRS base types (`Command`, `Query`, `Handler`), defineModule helper, DI leggero | Core |
| **`@seaside/domain`** | Primitive di dominio: `Entity<TId>`, `AggregateRoot`, `ValueObject`, `DomainEvent`, `DomainEventTracker` | Core |
| **`@seaside/infrastructure`** | Implementazioni condivise: Drizzle base client, `UnitOfWork`, `Repository` base, hook framework che si aggancia al commit | Core |
| **`@seaside/security`** | Middleware auth Hono, policy framework, `PermissionChecker`, claim enrichment, `HtmlSanitizer`, `FieldEncryptor`, security headers helper | Core |
| **`@seaside/identity`** | JWT s2s emission e verifica, JWKS endpoint, key rotation | Da estrarre |
| **`@seaside/identity-web`** | Auth.js config + providers preconfigurati per i 7 provider legacy, adapter Redis/Drizzle, rate-limit signin | Da estrarre |
| **`@seaside/users`** | Schema Drizzle + service per `User`, `Role`, `Permission`, `Group`, `UserWorkspace` | Da estrarre |
| **`@seaside/configuration`** | Configurazione centralizzata, env loader Zod, settings per modulo, feature flags | Core |
| **`@seaside/audit`** | Audit trail automatico, hook framework, schema `platform.audit_log`, logging di operazioni sensibili | Core |
| **`@seaside/observability`** | Logging strutturato (`pino`), metriche custom (OTel), distributed tracing (OTel), health checks `/health` `/alive`, log rotation | Core |
| **`@seaside/background-jobs`** | Abstractions per job scheduling, execution, monitoring + BullMQ adapter | Core |
| **`@seaside/error-handling`** | Exception handling middleware Hono, Problem Details, error mapping | Core |
| **`@seaside/hooks`** | Extension points nel ciclo di vita delle entita'. Interfacce: `PreSaveHook<T>`, `PostSaveHook<T>`, `PreDeleteHook<T>`, `PostDeleteHook<T>`. Hook sync o async. `HookContext<T>` con entita', state, `CurrentUser`, `AbortSignal`. Ordine per `hookOrder` metadata. Discovery via container DI. Pre-hook nella transazione, post-hook fuori. Design completo in [Cap. 9.4](#94-hook-design). | Core |
| **`@seaside/messaging-azure-sb`** | Astrazione messaging: `MessageBus`, `IntegrationEvent`, Outbox/Inbox pattern, `OutboxRelay` worker. Adapter Azure Service Bus (primario). Pacchetto separato `@seaside/messaging-nats` per NATS JetStream (futuro) | CONFERMATA |
| **`@seaside/hierarchical-entities`** | `HierarchicalEntity<TId>` (opt-in), materialized path, query helpers (figli, discendenti, antenati, sottoalbero), Drizzle column type per `path`, operazioni su sottoalberi (clone, move, delete). Pattern estratto dal task tree legacy, generalizzato per qualsiasi entita' gerarchica | CONFERMATA |
| **`@seaside/state-machine`** | `StatefulEntity<TState>` (opt-in), `StateMachineDefinition<TState, TAction>`, guard sulle transizioni, domain events automatici su cambio stato, query azioni disponibili. Pattern estratto dalla logica task legacy, generalizzato per qualsiasi entita' con ciclo di vita a stati | CONFERMATA |
| **`@seaside/workspace`** | `WorkspaceContext`, `WorkspaceScopedTable` (opt-in), `WorkspacePermissionService`, `WorkspaceScopedRepository` con filtro automatico, RLS Postgres helper, middleware Hono per header `X-Workspace-Id`, shell component `<WorkspaceSelector>`. Pattern estratto dal concetto di "container" del legacy, generalizzato come perimetro di scoping | CONFERMATA |
| **`@seaside/dynamic-forms`** | Engine per form dinamiche da definizioni (schema -> form). Capability PLATFORM confermata. Frontend: `react-hook-form` + `zod` + renderer schema-driven sopra `<SeasideForm>` (`@seaside/components`). **Requisiti a11y obbligatori** (uguali al legacy): (1) ogni campo generato ha `<label>` associata via `htmlFor`/`id`, (2) errori di validazione annunciati via `aria-live="polite"`, (3) raggruppamenti logici con `<fieldset>`+`<legend>`, (4) indicatori campo obbligatorio accessibili (`aria-required="true"` + indicatore visivo non solo asterisco), (5) custom field types registrati dai verticali devono rispettare gli stessi vincoli a11y. Backend: schema definition (Zod), validazione server-side, persistenza definizioni form | CONFERMATA |

> **Packaging**: ogni building block viene pubblicato come pacchetto npm individuale sul feed privato. I vertical repos consumano i building blocks esclusivamente tramite questi pacchetti. Dettagli sulla strategia di packaging nel [Cap. 8.5](#85-strategia-di-packaging).

### 9.2 Granularita' dei pacchetti

**Decisione D-61: CONFERMATA -- Un pacchetto per building block**

**Scelta**: Opzione A -- Un pacchetto npm per building block. Ogni consumer prende solo cio' che serve.

Ogni building block e' un pacchetto separato, pubblicato come pacchetto npm individuale. Un modulo che necessita solo di `@seaside/domain` non si porta dietro `@seaside/security` o `@seaside/audit`.

Turborepo (D-03) gestisce nativamente questa granularita': i package interni sono linkati via `workspace:*`, i package esterni vengono installati come dipendenze normali. Cambiare la versione del framework e' un singolo `pnpm update --recursive @seaside/*` nel verticale.

**Opzione scartata:**
- Opzione B (raggruppati per area in pochi pacchetti): scartata, un consumer che serve solo `@seaside/abstractions` si porterebbe dietro anche application e domain.

### 9.3 Abstractions strategy

**Decisione D-62: CONFERMATA -- Ibrido**

**Scelta**: Opzione C -- Un pacchetto `@seaside/abstractions` con il nucleo minimo comune + ogni building block espone le proprie interfacce specifiche nel proprio pacchetto.

`@seaside/abstractions` contiene **solo** le interfacce fondamentali che quasi tutti i consumer referenziano:
- `Entity<TId>`, `ValueObject`, `AuditableEntity`
- `CurrentUser`, `HandlerContext`
- `Result<T>`, `Error`
- `MessageBus`, `IntegrationEvent`
- `Command<T>`, `Query<T>`, `Notification`
- Marker types e contratti base

Le interfacce specifiche di ciascun building block restano nel proprio pacchetto:
- `@seaside/security` espone `AuthorizationService`, `PermissionChecker`
- `@seaside/audit` espone `AuditLogger`
- `@seaside/hooks` espone `PreSaveHook<T>`, `PostSaveHook<T>`, `PreDeleteHook<T>`, `PostDeleteHook<T>`
- etc.

**Motivazione (coerenza con D-61)**: con 20+ pacchetti separati, un Abstractions unico che contenga tutto diventerebbe un mega-pacchetto che vanifica la granularita'. L'ibrido garantisce che il pacchetto piu' referenziato (`@seaside/abstractions`) resti leggero, mentre ogni BB mantiene le proprie interfacce specifiche vicine all'implementazione.

**Opzioni scartate:**
- Opzione A (Abstractions unico): scartata, diventerebbe troppo grande e annullerebbe il vantaggio di D-61
- Opzione B (solo per-BB): scartata, un modulo che vuole solo `Entity` dovrebbe sapere in quale BB sta

### 9.4 Hook design

Il building block `@seaside/hooks` fornisce extension points nel ciclo di vita delle entita'. I verticali implementano le interfacce del framework e le registrano nel container DI. Il framework li scopre e li esegue automaticamente.

#### 9.4.1 Scope operazioni

Gli hook operano **solo** sul ciclo di vita delle entita' (Save e Delete):

| Interfaccia | Quando | Nella transazione? |
|---|---|---|
| `PreSaveHook<T>` | Prima del commit della Unit of Work -- sia create (added) che update (modified) | **Si** -- stessa transazione. Se fallisce, rollback |
| `PostSaveHook<T>` | Dopo il commit completato con successo | **No** -- fuori transazione. Se fallisce, l'entita' e' gia' salvata |
| `PreDeleteHook<T>` | Prima del commit con entity in stato deleted | **Si** -- stessa transazione. Se fallisce, rollback |
| `PostDeleteHook<T>` | Dopo il commit completato con successo per una delete | **No** -- fuori transazione |

Lo scope e' volutamente ristretto. Hook su publishEvent, operazioni custom o altri flussi non sono previsti nella v1. Se un verticale ne ha bisogno, lo richiede al team framework per valutazione.

#### 9.4.2 Interfacce

Tutte le interfacce sono **async** (`Promise<void>`). In TypeScript non c'e' vantaggio nell'esporre due varianti (sync/async) come in .NET, perche' `async` con corpo sincrono ha overhead trascurabile e il runtime lo ottimizza.

```typescript
// @seaside/hooks
export interface PreSaveHook<T> {
  readonly entityType: new (...args: any[]) => T;   // discriminator
  readonly hookOrder?: number;                       // default 0
  execute(context: HookContext<T>): Promise<void>;
}

export interface PostSaveHook<T> {
  readonly entityType: new (...args: any[]) => T;
  readonly hookOrder?: number;
  execute(context: HookContext<T>): Promise<void>;
}

// Identiche signature per PreDeleteHook<T> e PostDeleteHook<T>
```

Il pattern adottato e' `entityType` come campo discriminator (non decoratori, niente `reflect-metadata`): coerente con il tipo di DI leggero usato dal framework e con l'enforcement di `dependency-cruiser`.

#### 9.4.3 HookContext

```typescript
export type EntityState = 'added' | 'modified' | 'deleted';

export interface HookContext<T> {
  /** L'entita' coinvolta nell'operazione. */
  readonly entity: T;

  /** Stato dell'entita'. */
  readonly state: EntityState;

  /** Utente corrente (claims, permessi, workspace). */
  readonly currentUser: CurrentUser;

  /** AbortSignal della richiesta. */
  readonly signal: AbortSignal;

  /**
   * Proprieta' modificate (solo per state === 'modified').
   * Chiave: nome proprieta', Valore: { oldValue, newValue }.
   */
  readonly changedProperties: ReadonlyMap<keyof T, { oldValue: unknown; newValue: unknown }>;
}
```

Il contesto e' **read-only** per i post-hook. I pre-hook possono modificare `entity` (es. auto-populate campi, validazione custom) -- in TypeScript questo richiede che l'entita' non sia `readonly` lato pre-hook; il framework rilassa la regola via overload tipizzato.

#### 9.4.4 Ordine di esecuzione

Se piu' hook sono registrati per lo stesso tipo e la stessa fase (es. 3 `PreSaveHook<Order>`):

```typescript
export class AuditPreSaveHook implements PreSaveHook<Order> {
  readonly entityType = Order;
  readonly hookOrder = 10;   // eseguito per primo
  async execute(ctx: HookContext<Order>) { /* ... */ }
}

export class ValidationPreSaveHook implements PreSaveHook<Order> {
  readonly entityType = Order;
  readonly hookOrder = 20;   // eseguito per secondo
  async execute(ctx: HookContext<Order>) { /* ... */ }
}

// Senza hookOrder esplicito → 0 di default → eseguito prima di quelli con ordine positivo
```

- Esecuzione in ordine **crescente** di `hookOrder`
- Default: `0`
- Hook con lo stesso ordine: esecuzione in ordine di registrazione (deterministico ma non garantito semanticamente)
- I pre-hook sono eseguiti **sequenzialmente** (non in parallelo) perche' possono modificare l'entita'
- I post-hook sono eseguiti **sequenzialmente** per semplicita' e prevedibilita'

#### 9.4.5 Discovery e registrazione

Il framework fornisce un helper di registrazione dichiarativa al bootstrap del modulo:

```typescript
// modules/orders/src/index.ts
import { defineModule } from '@seaside/application';
import { SetAuditFieldsPreSaveHook, OrderCreatedPostSaveHook } from './application/hooks';

export const ordersModule = defineModule({
  name: 'orders',
  handlers: [/* ... */],
  hooks: [
    SetAuditFieldsPreSaveHook,
    OrderCreatedPostSaveHook,
  ],
});
```

Il container DI leggero del framework istanzia gli hook con scope request (un'istanza per command/query). Il framework discoveri gli hook tramite il campo `entityType` di ciascun hook e li indicizza per tipo.

Il framework registra anche i propri hook interni (es. `AuditPreSaveHook` per audit trail automatico) con `hookOrder` basso (`-100`) per garantire che vengano eseguiti prima degli hook del verticale.

#### 9.4.6 Esecuzione nel flusso Unit of Work

Il framework si aggancia all'`UnitOfWork.commit()` di `@seaside/infrastructure`. Drizzle non ha un concetto di "change tracker" come EF Core: il framework lo emula tracciando le entita' aggiunte/modificate/eliminate via repository base.

```
1. Handler chiama uow.commit()
2. UoW raccoglie le entita' tracked dai repository (added, modified, deleted)
3. Per ogni entita':
   a. Risolve i pre-hook registrati per quel tipo (via entityType)
   b. Esegue i pre-hook in ordine crescente di hookOrder (stessa transazione)
   c. Se un pre-hook rigetta la Promise / lancia → rollback, commit fallisce
4. UoW esegue le query Drizzle INSERT/UPDATE/DELETE all'interno della transazione
5. Per ogni entita' salvata/eliminata:
   a. Risolve i post-hook registrati per quel tipo
   b. Esegue i post-hook in ordine (fuori transazione)
   c. Se un post-hook fallisce → log errore + DLQ, NON rollback (l'entita' e' gia' salvata)
```

#### 9.4.7 Testing

Gli hook sono classi normali con dependency injection. Si testano come qualsiasi servizio:

```typescript
import { describe, it, expect } from 'vitest';
import { SetAuditFieldsPreSaveHook } from './set-audit-fields.pre-save-hook';

describe('SetAuditFieldsPreSaveHook', () => {
  it('sets createdBy when order is created', async () => {
    const hook = new SetAuditFieldsPreSaveHook();
    const order = new Order({ title: 'Test' });

    await hook.execute({
      entity: order,
      state: 'added',
      currentUser: { id: 'user-1', name: 'Test', permissions: [] },
      signal: AbortSignal.timeout(1000),
      changedProperties: new Map(),
    });

    expect(order.createdBy).toBe('user-1');
  });
});
```

Non serve mock del framework o dell'UoW. L'hook riceve un `HookContext<T>` e lo processa. Il framework orchestra l'esecuzione, ma l'hook e' testabile in isolamento.

---

## Capitolo 10 -- Shared UI

### 10.1 Ruolo della UI condivisa

La UI condivisa stabilisce la coerenza visiva e metodologica di tutte le app costruite sul framework. Definisce il "come appare" e il "come si comporta" l'interfaccia, senza definire il "cosa fa" (che e' responsabilita' delle app).

### 10.2 Shell applicativa (UiShell)

La shell e' il layout esterno che avvolge ogni pagina di ogni app:
- Header con branding, utente corrente, notifiche
- Sidebar / navigation menu (configurabile per app)
- Area contenuto principale
- Footer (opzionale)
- Toast/notification area

La shell deve essere **configurabile** (ogni app configura le proprie voci di menu, il proprio titolo, etc.) ma **non sostituibile** (la struttura del layout e' imposta dal framework).

### 10.3 Theming e design system

**Decisione D-12: CONFERMATA -- design tokens imposti dal framework, personalizzazione vincolata per le app**

Il framework **impone** il sistema di theming. Le app possono personalizzare colori e branding ma **non possono uscire dai vincoli** definiti dal framework.

**Meccanismo: design tokens a due livelli**

Il theming si basa su **CSS custom properties** (design tokens) organizzati in due livelli:

| Livello | Chi lo definisce | Cosa contiene | Esempio |
|---|---|---|---|
| **Framework tokens** | Team framework | Struttura del design system: spacing scale, typography scale, border radius, shadow system, breakpoints, z-index scale | `--seaside-spacing-md: 16px`, `--seaside-font-size-body: 14px`, `--seaside-radius-md: 6px` |
| **App theme tokens** | Team verticale | Colori brand, logo, accent, palette specifiche dell'app | `--seaside-color-primary: #7BAF2E`, `--seaside-color-accent: #1890ff` |

**Cosa il framework impone (non sovrascrivibile):**

- **Struttura del layout**: spacing, dimensioni shell, breakpoints responsive
- **Scala tipografica**: dimensioni font, line-height, font-weight per ogni livello (h1-h6, body, caption)
- **Pattern di interazione**: animazioni, transizioni, durate standard
- **Accessibilita'**: contrasto minimo tra foreground e background (WCAG AA)
- **Componenti opinati**: i componenti del framework (`SeasideDataGrid`, `SeasideForm`, etc.) usano i token e non accettano override di struttura

**Cosa le app possono personalizzare (entro vincoli):**

- **Palette colori**: primary, accent, success, warning, error, neutral
- **Logo e branding**: logo nell'header, favicon, titolo app
- **Dark mode**: il framework fornisce il meccanismo di switch; l'app sceglie se abilitarlo
- **Densita'**: compact / default / comfortable. La density modifica **solo spacing, padding e altezze** dei componenti (es. altezza riga tabella, padding input, spacing tra campi form). Il font-size **non cambia** con la density. Su viewport mobile (<768px) il framework forza automaticamente "comfortable" per garantire target touch >= 44px (WCAG 2.5.5). I valori esatti per ciascun livello sono definiti nei foundation token durante l'implementazione di `@seaside/theming`

**Come funziona in pratica:**

Il framework pubblica un pacchetto npm `@seaside/theming` che contiene:

```
@seaside/theming/
  ├── tokens/
  │   ├── foundation.css         # token strutturali (CSS variables non sovrascrivibili)
  │   └── theme-contract.css     # token di tema (CSS variables sovrascrivibili dalle app)
  ├── presets/
  │   ├── default.ts             # AntD theme.token + extension
  │   └── dark.ts                # variante dark
  ├── provider/
  │   └── SeasideThemeProvider.tsx  # wrap dei figli con AntD ConfigProvider + CSS variables
  └── utils/
      └── density.ts             # helper density-aware
```

Il vertical repo crea il proprio file di tema che sovrascrive solo i token permessi:

```typescript
// apps/web/src/theme/mia-app-theme.ts
import { defaultTheme, type SeasideTheme } from '@seaside/theming';

export const miaAppTheme: SeasideTheme = {
  ...defaultTheme,
  tokens: {
    // Personalizzazione consentita: colori brand
    colorPrimary: '#2E7BAF',
    colorAccent: '#AF7B2E',
  },
  // Personalizzazione consentita: densita'
  density: 'compact',
};

// I token strutturali (foundation: spacing, typography, radius, shadows, breakpoints)
// non sono sovrascrivibili: vengono importati automaticamente dal framework
```

```tsx
// apps/web/app/layout.tsx
import { SeasideThemeProvider } from '@seaside/theming';
import { miaAppTheme } from '@/theme/mia-app-theme';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <SeasideThemeProvider theme={miaAppTheme}>{children}</SeasideThemeProvider>
      </body>
    </html>
  );
}
```

**Vincolo architetturale**: i componenti del framework leggono **solo** i design tokens (CSS variables + AntD `theme.token`). Nessun componente accetta stili inline o class override che bypassino i token. Le app che vogliono componenti custom li costruiscono usando i token del framework, non sovrascrivendo quelli esistenti.

### 10.4 Component library

**Decisione D-11: CONFERMATA -- Ant Design (React) baseline dal giorno 1**

**Scelta**: Ant Design (React, v5+) come component library primaria. Allineamento tecnologico col reference UI (NewSeasidePerYuri). Eventuali librerie avanzate (data grid enterprise, scheduler, PDF viewer, rich text editor) saranno integrate dietro lo stesso wrapper `<Seaside*>` se e quando emergeranno requisiti specifici. Niente Syncfusion al giorno 1.

| Library | Ruolo | Quando |
|---|---|---|
| **Ant Design (React)** | Baseline: tutti i componenti standard (form, table, dialog, layout, navigation, date picker, select, ecc.) | Giorno 1 |
| **AG Grid Enterprise / MUI X DataGrid Pro / Tanstack Table** | Data grid enterprise (pivot, virtual scroll, Excel export, editing inline) | Solo se serve |
| **react-pdf-viewer / Apryse** | PDF viewer | Solo se serve |
| **FullCalendar** | Scheduler | Solo se serve |
| **TipTap / Lexical** | Rich text editor | Solo se serve |
| **Recharts / Apache ECharts** | Charting | Solo se serve |

> **Nota su Syncfusion**: il legacy aveva valutato Syncfusion (anche se non lo usava). Per il nuovo framework partiamo solo con Ant Design e introdurremo librerie commerciali (Syncfusion o alternative) solo se un verticale dimostra requisiti che AntD non puo' soddisfare. Decisione operativa rinviata.

**Architettura wrapper (Livello 2: API unificata):**

Ogni componente `<Seaside*>` definisce una propria **API unificata** che nasconde completamente la libreria sottostante. Il verticale non sa e non gli interessa se sotto c'e' AntD o un'altra libreria. L'API del wrapper e' l'unico contratto pubblico.

**Livello di astrazione**: API unificata (Livello 2). Il wrapper:
- Definisce props proprie del framework (non espone direttamente quelle della libreria sottostante)
- Aggiunge comportamenti standard (validazione, loading states, error handling, accessibilita')
- Nasconde completamente la libreria: nessun tipo `antd` visibile al consumatore
- Consente switch di implementazione senza impatto sui verticali (il costo e' nel wrapper, non nei consumatori)

**Trade-off accettato**: le feature avanzate specifiche di una libreria sono disponibili solo se mappate nell'API del wrapper. Feature non mappate = non disponibili per i verticali. Questo e' intenzionale: il wrapper garantisce coerenza a costo di limitare le feature al sottoinsieme mappato. Se un verticale ha bisogno di una feature non mappata, la richiede al team framework che la aggiunge al wrapper.

I verticali usano **solo** i componenti `<Seaside*>`, mai `antd` direttamente.

```
Verticale                   Framework (@seaside/components)          Libraries
─────────                   ───────────────────────────────          ─────────
                            ┌──────────────────────────┐
<SeasideDataGrid>    ────►  │  SeasideDataGrid          │──────►  <Table>  (AntD)
                            │                           │            o
                            │  Sceglie l'impl in base   │──────►  <AgGridReact>  (AG Grid)
                            │  alla configurazione      │
                            └──────────────────────────┘

                            ┌──────────────────────────┐
<SeasideForm>        ────►  │  SeasideForm              │──────►  react-hook-form + AntD
                            └──────────────────────────┘

                            ┌──────────────────────────┐
<SeasideChart>       ────►  │  SeasideChart             │──────►  Recharts (default)
                            └──────────────────────────┘
```

**Matrice componente → libreria → API wrapper:**

| Componente framework | Libreria sottostante | Fase | API wrapper espone |
|---|---|---|---|
| `SeasideDataGrid` | `Table` (AntD) → AG Grid (futuro) | Giorno 1 → switch on-demand | `dataSource`, `columns`, `pagination`, `sorting`, `filtering`, `selection`, `export` |
| `SeasideForm` | `Form` (AntD) + `react-hook-form` + `zod` | Giorno 1 | `fields`, `defaultValues`, `onSubmit`, `schema`, `dirtyState` |
| `SeasideDialog` | `Modal` (AntD) | Giorno 1 | `open`, `title`, `content`, `footer`, `closable`, `width` |
| `SeasideSelect` | `Select` (AntD) | Giorno 1 | `options`, `value`, `placeholder`, `searchable`, `multiple`, `loading` |
| `SeasideDatePicker` | `DatePicker` / `RangePicker` (AntD) | Giorno 1 | `value`, `format`, `range`, `disabled`, `min`, `max` |
| `SeasideTree` | `Tree` (AntD) | Giorno 1 | `nodes`, `selected`, `expanded`, `checkable`, `draggable` |
| `SeasideChart` | `Recharts` (futuro: ECharts/Apache) | Giorno 1 (opt-in) | `series`, `type`, `labels`, `legend`, `tooltip` |
| `SeasidePdfViewer` | `react-pdf-viewer` | Dopo | `documentUrl`, `toolbar`, `zoom`, `annotations` |
| `SeasideScheduler` | `FullCalendar` | Dopo | `events`, `views`, `currentDate`, `readonly` |
| `SeasideRichTextEditor` | `TipTap` (futuro: Lexical) | Dopo | `value`, `toolbar`, `placeholder`, `readonly` |

**Principio**: AntD copre l'80% dei casi (componenti standard). Librerie aggiuntive entrano solo dove serve potenza enterprise che AntD non ha. I verticali non vedono la differenza -- usano sempre `<Seaside*>`.

**Vincolo**: i verticali **non importano mai** `antd` o `@ant-design/*` direttamente. Tutto passa dai wrapper `@seaside/components`. Questo permette di switchare o aggiungere implementazioni senza impatto. `dependency-cruiser` blocca imports di `antd` dai package del verticale (consentito solo da `@seaside/components`).

**Processo per feature non mappate**: se un verticale necessita di una feature della libreria sottostante non esposta dal wrapper, la richiede al team framework. Il team valuta, la aggiunge all'API del wrapper, e la rende disponibile a tutti i verticali. Nessun verticale bypassa il wrapper.

### 10.4.1 Pattern UI da adottare dal reference (NewSeasidePerYuri)

Il reference (NewSeasidePerYuri) e' l'ispirazione visiva e UX per il nuovo sistema. La sua tecnologia (React + Ant Design 5 + Express + Turborepo) coincide quasi integralmente con quella del nuovo framework. I pattern di design da adottare:

| Pattern | Dettaglio dal reference | Adottabilita' |
|---|---|---|
| Sidebar 240px/48px collassabile | 5 zone: logo, quick nav, menu, selector, user | Alta |
| Design tokens: colorPrimary #7BAF2E, borderRadius 6 | Stile visivo coerente | Alta |
| DataTable: search + filters + paginazione + export | Pattern list page standard | Alta |
| DynamicForm: form da definizioni schema | Capability PLATFORM confermata | Alta |
| Page list: header + table + modal create/edit | Pattern standard | Alta |
| Page detail: back + card + descriptions + tabs | Pattern standard | Alta |
| Dashboard widget-based | Metric, chart, text widgets | Alta |
| NotificationDropdown: bell + badge + popover | Pattern standard | Alta |
| Permission-based menu: `usePermission(module, action)` | Pattern authorization | Alta |

### 10.5 Accessibilita' (a11y) -- enforcement dal framework

Il framework impone l'accessibilita' come vincolo non negoziabile su tutte le app. Il target e' **WCAG 2.1 livello AA**.

L'enforcement avviene su 4 livelli, dal piu' preventivo al piu' reattivo:

**Livello 1 -- Componenti accessibili by design (compile-time)**

I componenti del framework (`@seaside/components`) incorporano l'accessibilita' alla radice:
- ARIA roles, labels e attributi gia' integrati nei template
- Keyboard navigation (Tab, Enter, Escape, frecce) gestita internamente
- Focus management: focus trapping nei dialog/modal, focus restore alla chiusura
- Live regions (`aria-live`) per feedback dinamico (toast, errori, loading)
- Skip links per navigazione rapida nella shell

Le app che usano i componenti del framework ereditano automaticamente l'a11y senza sforzo aggiuntivo. I componenti custom delle app devono usare gli stessi pattern.

**Livello 2 -- Linting statico (sviluppo + CI)**

Il framework fornisce la configurazione condivisa `@seaside/eslint-config` che include `eslint-plugin-jsx-a11y` con regole strict:

| Regola `jsx-a11y/*` | Cosa verifica |
|---|---|
| `alt-text` | Ogni `<img>` ha `alt` |
| `anchor-has-content` | `<a>` ha contenuto testuale o `aria-label` |
| `label-has-associated-control` | Input hanno label associata |
| `no-static-element-interactions` | Elementi non interattivi (`div`/`span`) non hanno handler `onClick` senza ruolo |
| `click-events-have-key-events` | `onClick` accompagnato da `onKeyDown` |
| `no-positive-tabindex` | No `tabindex` positivi |
| `role-has-required-aria-props` | Ruoli ARIA hanno gli attributi richiesti |
| `aria-props` / `aria-proptypes` | Attributi ARIA validi |
| `interactive-supports-focus` | Elementi interattivi sono focusabili |

Queste regole sono configurate come **errori** (non warning): il codice non passa la CI se violate. Il vertical repo eredita la configurazione ESLint dal framework senza poterla disattivare. Inoltre `eslint-plugin-react` + `eslint-plugin-react-hooks` aggiungono regole strutturali per React.

**Livello 3 -- Test automatici a11y (CI pipeline)**

La CI pipeline dei vertical repo include test di accessibilita' automatici con **axe-core** (engine open source di Deque, standard de facto):

- **Unit/component test**: `vitest-axe` + `@testing-library/react` per testare ogni componente in isolamento
- **E2E test**: `@axe-core/playwright` per testare le pagine complete nel browser (Playwright e' la scelta E2E, D-80)

Il framework fornisce una test utility per semplificare i test a11y nei verticali:

```typescript
// Fornito dal framework in @seaside/testing
import { expectAccessible } from '@seaside/testing/a11y';
import { render } from '@testing-library/react';

it('should be accessible', async () => {
  const { container } = render(<MyComponent />);
  await expectAccessible(container);
});
```

`expectAccessible()` esegue axe-core sul componente e fallisce se trova violazioni WCAG AA. I vertical repo aggiungono questo test a ogni componente custom.

**Livello 4 -- Audit periodico (quality gate)**

La CI pipeline include un check **Lighthouse CI** (via `@lhci/cli`) che misura l'accessibility score su un set di pagine rappresentative. Se il punteggio scende sotto una soglia (es. 90/100), la build fallisce.

**Riepilogo dei livelli:**

| Livello | Quando | Strumento | Cosa blocca |
|---|---|---|---|
| Componenti a11y by design | Sviluppo | `@seaside/components` (su AntD, gia' WCAG AA) | Nulla (prevenzione) |
| Linting statico | Sviluppo + CI | `eslint-plugin-jsx-a11y` (errori, non warning) | Build (errori lint) |
| Test axe-core | CI | `vitest-axe` + `@axe-core/playwright` | Build (test falliti) |
| Lighthouse CI | CI | Lighthouse CI | Build (score sotto soglia) |

> **Nota**: l'obiettivo non e' la perfezione immediata ma il **non-regresso**. Il framework stabilisce la baseline, i quality gate impediscono di scendere sotto.

### 10.6 Convenzioni UX

Il framework deve definire standard per:
- **Form**: validazione inline, salvataggio, annullamento, dirty state
- **Tabelle/Grid**: paginazione, sorting, filtering, selezione, export
- **Feedback**: toast per successo, dialog per conferme distruttive, inline per errori di campo
- **Loading**: **spinner** per tutte le operazioni di caricamento (decisione confermata). Skeleton screen come evoluzione futura a bassa priorita'
- **Empty states**: messaggio + azione suggerita
- **Errori**: pagine di errore standard (404, 500, 403), error boundary per errori di componente
- **Navigazione**: breadcrumb, tabs, menu laterale, deep linking

### 10.7 Confine UI condivisa vs app

| Shared UI (framework) | App-specific UI (verticale) |
|---|---|
| Shell e layout | Pagine di dominio |
| Componenti base (form, grid, dialog) | Componenti composti specifici del dominio |
| Theming e design tokens | Override di tema per branding (entro vincoli) |
| Pattern di navigazione | Voci di menu specifiche |
| Standard UX (loading, errori, empty) | Workflow UI specifici |
| Accessibilita' imposta (componenti, lint, test, audit) | I componenti custom dell'app rispettano le stesse regole a11y |

### 10.8 Responsive e touch device

**Priorita':**

| Aspetto | Priorita' | Note |
|---|---|---|
| **Responsive layout** | Alta | Il layout si adatta a risoluzioni diverse (desktop, laptop, tablet landscape) |
| **Touch device friendly** | Media | Target touch >= 44px (WCAG 2.5.5), gesture base supportate |
| **Mobile layout** | Bassa (nice to have) | Layout dedicato per smartphone non e' un requisito iniziale |

**Breakpoint di riferimento:**

| Breakpoint | Range | Comportamento |
|---|---|---|
| `xs` | < 576px | Mobile (bassa priorita') |
| `sm` | 576px - 767px | Mobile landscape (bassa priorita') |
| `md` | 768px - 991px | Tablet portrait. Sidebar collassata (48px), density "comfortable" forzata |
| `lg` | 992px - 1199px | Tablet landscape / laptop piccolo. Sidebar 48px default, espandibile |
| `xl` | >= 1200px | Desktop. Sidebar 240px, layout completo |

**Touch device:** su viewport < 768px il framework forza density "comfortable" (target touch >= 44px). I componenti interattivi hanno area touch minima 44x44px. Gestiti eventi `touch` sui componenti drag-and-drop.

### 10.9 Lazy loading e code splitting

**Principio**: ogni modulo/route dell'applicazione e' lazy-loaded. Il bundle iniziale contiene solo la shell, il router e le dipendenze minime. In Next.js App Router il code splitting per route e' **automatico** (per ogni `page.tsx` viene creato un chunk).

**Strategia di code splitting:**

| Livello | Cosa viene splittato | Come |
|---|---|---|
| **Route-level** | Ogni pagina/feature e' un chunk separato | Automatico in Next.js App Router (`app/<route>/page.tsx`) |
| **Module-level** | Ogni modulo business e' caricato lazy | Route group `(app)/<module>/` |
| **Component-level** | Componenti pesanti (chart, editor rich text, PDF viewer) caricati on-demand | `next/dynamic` con `ssr: false` se serve |
| **Third-party** | Librerie pesanti (rich text editor, charts) in chunk separati | `next/dynamic` import |

**Regole:**
- Il bundle iniziale (shell + login) non deve superare i target Core Web Vitals (vedi Cap. 10.12)
- Pagine pesanti (form complesse, dashboard) usano `dynamic(() => import('...'), { ssr: false, loading: () => <SeasideSpinner /> })`
- I wrapper Syncfusion / AG Grid / TipTap (futuri) sono sempre `dynamic()` per non gonfiare il bundle delle pagine list
- Server Components (default in App Router) NON spediscono codice al browser: zero JS per markup statico

### 10.10 SSR (Server-Side Rendering)

**Decisione: adottare Next.js App Router con Server Components + selective client hydration**

Next.js fornisce nativamente SSR, RSC e streaming. Non serve setup aggiuntivo.

Motivazioni:
- Miglioramento LCP (Largest Contentful Paint): il primo rendering non dipende dal download e parsing di tutto il JS
- SEO non e' un requisito primario (app enterprise interna), ma SSR migliora la percezione di velocita'
- React Server Components riducono drasticamente la dimensione del bundle client (markup e dati statici stay-on-server)

**Modalita': RSC + Streaming + selective Client Components**

| Fase | Descrizione |
|---|---|
| Server render | Next.js renderizza Server Components lato Node.js. Streaming HTML al browser |
| Client hydration | Solo i componenti marcati `'use client'` vengono idratati; il resto resta server-only |
| Data fetching | `fetch()` lato Server Component, deduplicato e cacheable. Tipi condivisi dal pacchetto `contracts` |

**Vincoli:**
- I componenti che usano API browser (`window`, `document`, `localStorage`) o hooks React (`useState`, `useEffect`) devono essere marcati `'use client'`
- Le Server Components non possono usare hooks React ma possono fare `async`/`await` direttamente
- Le chiamate API durante il server render devono essere idempotenti (GET only) e tipizzate via fetch wrapper `@seaside/identity-web/fetch`
- Il framework fornisce hook `useSeasideClient()` per accesso sicuro alle API browser (con guard SSR)

### 10.11 Image optimization e file storage

**Storage: Azure Blob Storage** (pattern dal legacy)

Le immagini e i file **non** vengono salvati come base64 nel database. Il pattern e':

1. Upload: il file viene caricato su Azure Blob Storage, il DB salva solo i metadati (URL, filename, size, MIME type, hash)
2. Download: il client richiede il file via URL firmato (SAS token) o tramite endpoint proxy del BFF Next.js
3. Il building block `@seaside/file-storage` fornisce l'astrazione `FileStorageService`

**Interfaccia:**

```typescript
export interface FileStorageService {
  upload(input: { content: ReadableStream | Buffer; fileName: string; contentType: string }): Promise<FileUploadResult>;
  download(fileId: string): Promise<ReadableStream>;
  delete(fileId: string): Promise<void>;
  getTemporaryUrl(fileId: string, expirySeconds: number): Promise<string>;
}
```

Adapter: `AzureBlobFileStorage` (`@azure/storage-blob`) per produzione; `LocalFileStorage` per development.

**Image optimization frontend:**
- `next/image` come componente standard per tutte le immagini (`<Image>` di Next.js gestisce automaticamente lazy loading, srcset, AVIF/WebP, layout shift prevention)
- Il framework fornisce `<SeasideImage>` (wrap di `next/image`) con default sensati (`loading="lazy"`, `placeholder="blur"` se hash blur fornito, `sizes` automatici)
- File caricati su Azure Blob: configurazione `next.config.js` `images.remotePatterns` per autorizzare il dominio Blob

### 10.12 Core Web Vitals

**Priorita' 2** -- target definiti ma non bloccanti per la prima release.

| Metrica | Target | Descrizione |
|---|---|---|
| **LCP** (Largest Contentful Paint) | < 2.5s | Tempo di rendering dell'elemento piu' grande visibile |
| **INP** (Interaction to Next Paint) | < 200ms | Latenza delle interazioni utente (sostituisce FID) |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Stabilita' visiva della pagina durante il caricamento |

**Come si misurano:**
- **Sviluppo**: Chrome DevTools Performance panel, Lighthouse, Next.js Speed Insights
- **CI**: Lighthouse CI come quality gate (soglia warning, non bloccante per P2)
- **Produzione**: `web-vitals` library + `useReportWebVitals` di Next.js per Real User Monitoring (RUM)

**Azioni per rispettare i target:**
- LCP: Server Components + streaming + preload dei font (`next/font`) + CSS critico inline
- INP: Server Components ove possibile + React 19 transitions + memoizzazione mirata (`useMemo`, `useCallback`, `React.memo`)
- CLS: dimensioni esplicite su immagini (`<next/image width/height>`) e contenitori, skeleton/spinner con dimensione fissa, `font-display: swap` via `next/font`

### 10.13 State management

**Decisione: stato locale React + TanStack Query per server state**

Il legacy (ANWebFE Angular) usava servizi con RxJS `BehaviorSubject`. Il nuovo framework adotta un mix di primitive React standard + librerie focalizzate.

**Pattern:**

| Tipo di stato | Dove | Come |
|---|---|---|
| **Stato locale componente** | Nel componente | `useState`, `useReducer` |
| **Stato condiviso tra componenti vicini** | Context React | `createContext` + custom hook (es. `useWorkspaceContext`, fornito dal framework) |
| **Stato globale UI (sidebar collassata, theme)** | `zustand` (light store) | Store globale minimale fornito da `@seaside/shell` |
| **Stato server (dati API)** | `@tanstack/react-query` | Caching, revalidation, optimistic updates. Stato canonico del server |
| **Stato URL (filtri, paginazione)** | URL search params | `useSearchParams` di Next.js + helper `@seaside/shell/url-state` |
| **Stato persistente (preferenze)** | `localStorage` via `useSeasideStorage` (sicuro SSR) | Per preferenze utente (lingua, density, sidebar state) |
| **Stato sessione** | Auth.js `useSession()` + `@seaside/identity-web` hooks | Identita' utente, permessi, workspace |

**Regole:**
- **Nessuna libreria di state management globale** (Redux Toolkit, Jotai globale, Recoil) senza approvazione del team framework
- **TanStack Query** e' la baseline per il server state: niente fetch in `useEffect` manuali
- Minimizzare lo stato globale: preferire dati freschi dal server (fetch on navigate)
- Lo stato globale e' riservato a: sessione utente, preferenze, navigazione, notifiche
- I servizi di stato espongono solo Signals `readonly` — le mutazioni avvengono tramite metodi del servizio

**Migrazione dal legacy:**
- I servizi esistenti con `BehaviorSubject` vengono migrati a `signal()` + `computed()`
- Il `BroadcastService` (event bus del legacy) viene sostituito da integration events tipizzati tramite servizi dedicati

### 10.14 Internazionalizzazione (i18n)

**Decisione: `next-intl` + ICU message format**

Il framework adotta `next-intl` come soluzione i18n. Motivazioni:
- Integrazione nativa con Next.js App Router (Server Components + Client Components, routing per locale)
- ICU MessageFormat (`intl-messageformat`) per pluralizzazione, selezione genere, nested expressions
- Type-safety: tipi generati dalle chiavi di traduzione, niente magic strings
- Statically optimized: traduzioni del locale corrente bundle-splitted per route
- Ecosistema React maturo: il pattern e' lo stesso che il reference (NewSeasidePerYuri) puo' adottare

**Lingue supportate (42):** ar-EG, az-AZ, bg-BG, bn-BD, bs-BA, cs-CZ, da-DK, de-DE, el-GR, en-GB, en-US, es-ES, et-EE, fr-FR, he-IL, hr-HR, hu-HU, id-ID, is-IS, it-IT, ka-GE, kk-KZ, ko, lt-LT, lv-LV, ms-MY, nl-NL, no-NO, pl-PL, pt-PT, ro-RO, ru-RU, sk-SK, sq-AL, sr-Cyrl, sv-SE, th-TH, tr-TR, uk-UK, vi, zh-CN, zh-Hant.

**Come funziona:**

```tsx
// app/[locale]/orders/page.tsx (Server Component)
import { useTranslations } from 'next-intl';

export default function OrdersPage() {
  const t = useTranslations('orders');
  return <h1>{t('title')}</h1>;
}
```

```tsx
// Client Component con pluralizzazione (ICU)
'use client';
import { useTranslations } from 'next-intl';

export function OrdersCount({ count }: { count: number }) {
  const t = useTranslations('orders');
  return <span>{t('count', { count })}</span>;
}
```

```json
// messages/it-IT.json
{
  "orders": {
    "title": "Ordini",
    "count": "{count, plural, =0 {Nessun ordine} one {1 ordine} other {# ordini}}"
  }
}
```

**Struttura file di traduzione:**

```
apps/web/messages/
  ├── en-US.json
  ├── it-IT.json
  ├── de-DE.json
  └── ...
```

Il workflow di traduzione:
1. Sviluppatori aggiungono chiavi in `it-IT.json` (lingua master)
2. `next-intl` valida che tutte le altre lingue abbiano le stesse chiavi (script di check in CI)
3. I file JSON vengono tradotti (manualmente o con strumenti di traduzione tipo Crowdin/Lokalise)
4. `next build` produce bundle ottimizzati per locale (routing `/[locale]/...`)

**Componenti framework e i18n:**
I componenti `@seaside/components` (DataGrid, Form, Dialog, etc.) e `@seaside/shell` (workspace selector, session dialog) accettano un namespace `@seaside/*` di traduzioni che il framework distribuisce pre-tradotto per tutte le 42 lingue (paginazione, "Nessun risultato", "Caricamento...", bottoni standard).

**Formattazione localizzata:**
- Date/orari: `useFormatter().dateTime()` di `next-intl` (Intl.DateTimeFormat sotto)
- Numeri: `useFormatter().number()` (Intl.NumberFormat)
- Valute: `useFormatter().number({ style: 'currency', currency: '...' })`
- Pluralizzazione: ICU message format

**RTL (Right-to-Left):**
Lingue RTL supportate: arabo (ar-EG), ebraico (he-IL). Il framework:
- Applica `dir="rtl"` sul `<html>` in base al locale corrente (gestito dal middleware Next.js + `@seaside/theming`)
- I design token di spacing usano `inline-start`/`inline-end` (CSS logical properties) invece di `left`/`right`
- Ant Design supporta nativamente RTL via `<ConfigProvider direction="rtl">` (configurato automaticamente da `@seaside/theming`)
- I componenti framework sono testati in modalita' RTL
- La sidebar si sposta a destra in RTL

---

## Capitolo 11 -- Business Modules e Application Hosts

### 11.1 Struttura di un modulo business

Ogni modulo business e' una unita' autonoma con architettura **Hexagonal** (D-23). I layer interni seguono le regole di dipendenza definite nel Cap. 5.9.3:

```
modules/
  └── <nome-modulo>/                     # package npm @<vertical>/module-<nome>
      ├── package.json
      ├── tsconfig.json
      ├── src/
      │   ├── domain/                    # CENTRO: entita', aggregati, VO, domain events, Ports
      │   │   ├── entities/
      │   │   ├── value-objects/
      │   │   ├── events/
      │   │   ├── errors/
      │   │   └── ports/                 # Ports: interfacce TS che il dominio richiede al mondo esterno
      │   ├── application/               # USE CASES: handlers CQRS, schema zod. Dipende solo da Domain
      │   │   ├── <use-case>/
      │   │   │   ├── *.command.ts
      │   │   │   ├── *.handler.ts
      │   │   │   └── *.schema.ts
      │   │   └── event-handlers/
      │   ├── infrastructure/            # DRIVEN ADAPTERS: schemi Drizzle, repository, adapter
      │   │   ├── schema/
      │   │   └── repositories/
      │   ├── endpoints/                 # DRIVING ADAPTERS: Hono routes, sottilissimi
      │   │   └── <module>-endpoints.ts
      │   └── index.ts                   # esporta defineModule(...) per il bootstrap
      ├── drizzle/                       # migrations del modulo (drizzle-kit)
      │   └── *.sql
      └── vitest.config.ts
```

Il modulo vive nel **vertical repo** del prodotto e referenzia i building blocks del framework come pacchetti npm `@seaside/*`.

Il modulo non conosce:
- Chi lo ospita (apps/api, apps/worker, apps/web)
- Gli altri moduli (comunica via integration events o contracts)
- La UI (la UI del modulo sta in `apps/web` del vertical repo, non nel modulo)
- Il framework (lo consuma tramite pacchetti npm, non ne vede il sorgente)

### 11.2 Come gli host compongono i moduli

**App API (`apps/api`)** -- Hono server che compone i moduli:

```typescript
// apps/api/src/server.ts
import { Hono } from 'hono';
import { createSeasideApp } from '@seaside/application/hono';
import { ordersModule } from '@<vertical>/module-orders';
import { inventoryModule } from '@<vertical>/module-inventory';
import { db } from './db';
import { messageBus } from './message-bus';

const app = createSeasideApp({
  modules: [ordersModule, inventoryModule],
  infrastructure: { db, messageBus },
  behaviors: defaultBehaviors(),
});

export default app;
```

`createSeasideApp` legge da ciascun modulo:
- Handler CQRS (Command/Query/Notification handler)
- Schemi Zod
- Hook (`PreSaveHook`, `PostSaveHook`, ...)
- Endpoint Hono (montati su `/<modulo>/*`)
- Integration event subscriptions

**App Web (`apps/web`)** -- Next.js che:
1. Importa i moduli **solo per i tipi** (DTO, integration event types) via `@<vertical>/contracts`
2. Usa il BFF Next.js per proxare chiamate a `apps/api`
3. Importa `@seaside/shell`, `@seaside/components`, `@seaside/theming` per la UI
4. Configura Auth.js (`auth.config.ts`) con i provider del verticale
5. Configura navigation, menu, routing

```typescript
// apps/web/middleware.ts (esempio)
import { auth } from '@/auth';
import { seasideMiddleware } from '@seaside/identity-web/middleware';

export default seasideMiddleware({ auth });
```

**App Worker (`apps/worker`)** -- Node.js standalone che esegue handler asincroni di moduli:

```typescript
// apps/worker/src/server.ts
import { createSeasideWorker } from '@seaside/background-jobs/worker';
import { ordersModule } from '@<vertical>/module-orders';
import { db } from './db';
import { messageBus } from './message-bus';

const worker = createSeasideWorker({
  modules: [ordersModule],
  infrastructure: { db, messageBus },
});

worker.start();
```

### 11.3 Regole di isolamento

- Un modulo non puo' accedere allo schema Drizzle di un altro modulo (`dependency-cruiser` blocca import cross-module)
- La comunicazione tra moduli avviene tramite integration events o shared contracts (`packages/contracts`)
- Un modulo espone i propri endpoint, che `createSeasideApp` registra automaticamente
- Le migrazioni di un modulo non toccano le tabelle di altri moduli (schema Postgres separati per modulo)

### 11.4 Primo host applicativo

**Decisione D-54: DA DECIDERE**

Il nome e lo scope della prima business app devono essere definiti. Questa app sara' il primo caso reale costruito sopra il framework.

Domande aperte:
- Come si chiama?
- Quali capability legacy deve coprire?
- Ha bisogno di apps/web + apps/api separate (caso comune) o un solo Next.js full-stack? La risposta dipende da quanto codice backend non-BFF e' necessario
- Quali moduli business richiede?

Queste domande verranno chiarite durante la discovery dei repository.

---

## Capitolo 12 -- Workers e Background Processes

### 12.1 Strategia di decomposizione

Ogni Windows Service legacy deve essere analizzato scomponendo le responsabilita':

| Responsabilita' | Target possibile |
|---|---|
| Scheduling (esecuzione periodica) | Worker Node.js + Scheduler.Worker |
| Orchestrazione di flussi | Worker Node.js o modulo backend |
| Logica di dominio pura | Modulo business |
| Integrazione con sistemi esterni | Worker Node.js o modulo |
| Trasformazione dati batch | Worker Node.js |
| Notifiche/reporting | Worker Node.js |
| Persistenza stato | Modulo business |

### 12.2 Discovery: Windows Service legacy (ANWinService)

Il legacy ha **un singolo Windows Service** (`ANWinService`) che esegue 4 thread paralleli con scheduling a sleep-loop:

| Thread | Classe | Cosa fa | Sleep config | Dipendenze |
|---|---|---|---|---|
| **Queue Polling** | `AnThreadQueue` | Esegue stored procedure e Logic Apps dalla coda | `ThreadTime` | ANCoreContext, QueueService, ANAuth, Flurl (Logic Apps) |
| **Mail** | `AnThreadMail` | Invia email SMTP e notifiche Microsoft Teams | `MailBucketTime` | MailService, MicrosoftTeamsService |
| **Survey Save** | `ANThreadSurveySaveMeAndDependents` | Salvataggio bulk survey + Azure Blob | `SurveySaveThreadTime` | ANCoreContext, BlobStorage |
| **Power BI Export** | `ANAsyncPrintQueue` | Esporta report PBI in PowerPoint | `PBIExportThreadTime` | PowerBI API |

**Decomposizione proposta per il nuovo sistema:**

| Thread legacy | Target nel nuovo sistema | Motivazione |
|---|---|---|
| Queue Polling | **Worker Node.js separato** (`Scheduler.Worker`) | Schedulato, puo' fallire in isolamento, esecuzione periodica |
| Mail / Teams notifications | **Worker Node.js separato** (`Notifications.Worker`) | I/O bound, deve fallire in isolamento, ritentabile |
| Survey Save | **EVALUATE** -- potrebbe essere un handler nel modulo business, o un worker se il batch e' pesante | Dipende dal volume e dalla latenza richiesta |
| Power BI Export | **DEFER** o **DROP** | Capability specifica, da valutare se serve nella nuova piattaforma |

> Nota: questi worker verranno ricostruiti da zero come processi Node.js basati su `@seaside/background-jobs` e orchestrati da Aspire (`AddNodeApp`). Il codice legacy serve solo per capire le responsabilita'.

### 12.3 Criteri di separazione

**Tenere come Worker separato se:**
- E' schedulato (esecuzione periodica)
- E' long-running (minuti/ore)
- E' resource-intensive
- Deve scalare indipendentemente
- Puo'/deve fallire in isolamento senza impattare la web app

**Portare nel backend/modulo se:**
- E' business logic mascherata da servizio
- Serve in modo vicino al flusso applicativo
- Non richiede reale autonomia operativa
- L'esecuzione e' breve e on-demand

**Eliminare se:**
- La funzionalita' non e' piu' necessaria
- E' stata sostituita da capability moderne

### 12.3 Pattern standard per worker

**Decisione D-70: CONFERMATA -- Processo Node.js + `@seaside/background-jobs` + BullMQ adapter**

**Scelta**: ogni worker e' un processo Node.js standalone con entrypoint singolo (`apps/<nome>-worker/src/server.ts`) basato sull'astrazione `BackgroundJob` di `@seaside/background-jobs`. **BullMQ (Redis)** e' la libreria di queue/scheduling integrata come adapter di default: fornisce code persistenti, retry con backoff, scheduling delayed/cron, dashboard opzionale (`bull-board`).

Il framework fornisce:
- `BackgroundJob<TInput>` interface (un job e' un consumer tipizzato di messaggi)
- `createSeasideWorker({ modules, infrastructure })` per il bootstrap del processo
- Graceful shutdown su SIGTERM (drena code, completa job in-flight, chiude connessioni)
- Health check `/health` (Redis + DB) e `/alive` per Kubernetes/ACA
- Logging strutturato (pino) + tracing OTel (root span per job)
- Retry policy configurabile (default: 3 retry exponential backoff, poi DLQ)

```typescript
// modules/orders/src/application/jobs/export-orders.job.ts
import { defineJob } from '@seaside/background-jobs';

export const exportOrdersJob = defineJob({
  name: 'orders.export',
  schema: exportOrdersSchema, // zod
  handler: async (input, ctx) => {
    // ctx.db (Drizzle), ctx.messageBus, ctx.currentUser, ctx.logger
    // ...
    return Result.ok(undefined);
  },
});
```

**Adapter alternativi (opt-in da singoli verticali):**

- **`@seaside/background-jobs-azure-sb`**: usa Azure Service Bus come backend invece di Redis/BullMQ (per scenari Azure-only, no Redis)
- **`@seaside/background-jobs-nats`** (futuro): NATS JetStream

**Opzioni scartate come default del framework:**
- **Agenda.js**: meno attivo di BullMQ, persistenza solo MongoDB
- **Bree**: ottimo ma single-process (no queue distribuita)
- **node-cron** puro: nessuna persistenza/retry
- **Inngest, Trigger.dev**: SaaS, niente self-hosting nativo per il caso target

### 12.4 Scheduling e gestione code

**Decisione D-71: CONFERMATA -- `Scheduler.Worker` separato + broker, con astrazione multi-adapter**

**Scelta**: un `Scheduler.Worker` (processo Node.js dedicato) pubblica job sul broker al momento giusto. I worker ascoltano le code ed eseguono. Lo scheduling e' completamente separato dall'esecuzione.

Come per il messaging (D-58), l'infrastruttura di scheduling usa la **stessa astrazione `MessageBus`** per pubblicare i job schedulati. Il broker sottostante e':
- **Fase 1**: Azure Service Bus (deploy Azure, primario)
- **Fase 2**: NATS JetStream (alternativa non-Azure)

Lo switch avviene via configurazione, identico a D-58. Non serve un'astrazione separata per lo scheduling: lo Scheduler pubblica messaggi sullo stesso broker usato per gli integration events.

**Nota su BullMQ vs Azure Service Bus per lo scheduling**: BullMQ fornisce nativamente scheduling cron + delayed jobs con persistenza Redis. Azure Service Bus fornisce solo scheduled enqueue (no cron nativo). Per il `Scheduler.Worker`:
- Se l'adapter di `MessageBus` e' `azure-sb`: il Scheduler usa Postgres come storage delle definizioni cron + libreria `cron` (Node) per timing, e pubblica via `messageBus.schedule()`
- Se l'adapter e' `bullmq`: il Scheduler usa direttamente BullMQ `repeatable jobs`

#### Architettura

```
┌───────────────────────────┐
│     Scheduler.Worker       │
│     (Node.js process)      │
│                            │
│  - Legge definizioni cron  │
│  - Usa cron + cron-parser  │
│  - Pubblica su MessageBus  │◄─── stessa astrazione di D-58
│  - Aspire-managed          │
└─────────────┬─────────────┘
              │ pubblica job message
              ▼
┌───────────────────────────┐
│     Message Broker         │
│                            │
│  Azure Service Bus (fase 1)│
│  NATS JetStream   (fase 2) │
│                            │
│  - Coda per tipo di job    │
│  - Retry, DLQ              │
│  - At-least-once delivery  │
└─────────────┬─────────────┘
              │ consumer subscription
              ▼
┌───────────────────────────┐
│     Worker Services        │
│     (Node.js processes)    │
│                            │
│  - Ascoltano la propria    │
│    coda via MessageBus     │
│  - Eseguono il task        │
│  - Stateless, scalabili    │
│  - Aspire-managed          │
└───────────────────────────┘
```

#### Componenti

**Scheduler.Worker (Node.js):**

```typescript
// apps/scheduler-worker/src/server.ts
import { createSchedulerWorker } from '@seaside/background-jobs/scheduler';
import { db } from './db';
import { messageBus } from './message-bus';

const scheduler = createSchedulerWorker({
  db,
  messageBus,
  // Legge le definizioni da config (file YAML o tabella platform.schedules)
  source: 'config',
});

scheduler.start();
```

**Definizione schedule (configurazione, non codice):**

```yaml
# apps/scheduler-worker/schedules.yaml
schedules:
  - name: daily-import
    cron: "0 2 * * *"
    topic: jobs.import
    payload:
      type: full-import
  - name: hourly-sync
    cron: "0 * * * *"
    topic: jobs.sync
    payload:
      type: incremental
```

**Worker consumer (esempio):**

```typescript
// apps/import-worker/src/server.ts
import { createSeasideWorker } from '@seaside/background-jobs/worker';
import { z } from 'zod';
import { db } from './db';
import { messageBus } from './message-bus';

const importJobSchema = z.object({ type: z.enum(['full-import', 'incremental']) });

const worker = createSeasideWorker({
  infrastructure: { db, messageBus },
  consumers: [
    {
      topic: 'jobs.import',
      schema: importJobSchema,
      handler: async (input, ctx) => {
        ctx.logger.info({ type: input.type }, 'Import started');
        await runImport(input, ctx);
      },
      retry: { maxAttempts: 3, backoff: 'exponential' },
    },
  ],
});

worker.start();
```

**Cron expressions:**

La libreria `cron-parser` (MIT, parser puro, zero dipendenze native) fornisce parsing e calcolo del prossimo trigger per cron expressions standard. La libreria `node-cron` o `croner` fornisce l'esecuzione effettiva degli intervalli. Entrambe sono incluse in `@seaside/background-jobs/scheduler` come dipendenza interna.

#### Perche' non serve un'astrazione separata per lo scheduling

Lo Scheduler.Worker usa `MessageBus` (D-58) per pubblicare i job. I worker usano `MessageBus` per ricevere i job. Il broker sottostante (Azure SB o NATS) gestisce code, retry, DLQ.

Quando si switcha broker (da Azure SB a NATS), **sia il messaging degli integration events che lo scheduling dei job switchano insieme** -- perche' usano la stessa infrastruttura. Non c'e' bisogno di due astrazioni.

```
Fase 1 (Azure):
  Integration Events ──► Azure Service Bus
  Scheduled Jobs     ──► Azure Service Bus (stesse code)

Fase 2 (alternativa):
  Integration Events ──► NATS JetStream
  Scheduled Jobs     ──► NATS JetStream (stessi subject)

Switch: una riga di config nelle app, identico a D-58.
```

#### AppHost Aspire

```csharp
// Lo scheduler e' un AddNodeApp come gli altri worker
var scheduler = builder.AddNodeApp("scheduler", "../apps/scheduler-worker", "start")
    .WithReference(messaging)  // stesso broker degli integration events
    .WithReference(postgres);

var importWorker = builder.AddNodeApp("import-worker", "../apps/import-worker", "start")
    .WithReference(messaging)
    .WithReference(postgres);
```

#### Opzioni scartate

| Opzione | Motivazione scarto |
|---|---|
| A (ASB scheduled messages) | Niente cron native, recurring job complesso da gestire da soli |
| B (Azure Queue Storage) | Troppo limitato, no pub/sub, no ordering |
| C (Azure Functions Timer) | Aggiunge un runtime serverless separato allo stack |
| D (BullMQ standalone come scheduler globale) | Resta opt-in: BullMQ e' adapter di `@seaside/background-jobs`. Usato direttamente quando il broker primario e' Redis. Coesiste con Service Bus via doppio adapter |

### 12.5 Integrazione con Aspire

Tutti i worker vengono registrati nell'AppHost Aspire come `AddNodeApp`:

```csharp
// AppHost Program.cs
var scheduler = builder.AddNodeApp("scheduler", "../apps/scheduler-worker", "start");
var imports = builder.AddNodeApp("import-worker", "../apps/import-worker", "start");
var outboxRelay = builder.AddNodeApp("outbox-relay", "../apps/outbox-relay", "start");
```

Aspire fornisce automaticamente: service discovery, health checks (`/health`, `/alive` esposti dai worker), logging stream nella dashboard, tracing OTLP, environment variables.

---

## Capitolo 13 -- Testing Strategy

### 13.1 Test framework

**Decisione D-80: CONFERMATA -- Vitest (unit + integration), Playwright (E2E)**

| Framework | Pro | Contro |
|---|---|---|
| **Vitest** | Veloce (esbuild + native ESM), API compatibile Jest, watch mode istantaneo, supporto nativo TS/ESM/JSX, integrazione Turborepo eccellente, in-source testing | Ecosistema piu' giovane di Jest (compensato dalla compatibilita') |
| **Jest** | Maturo, ecosistema enorme | Lento, ESM nativo problematico, transform overhead |
| **Node test runner** | Built-in Node.js, zero deps | Manca features (snapshot, mock helper, coverage UI) |

**Raccomandazione**: Vitest. Unico runner per unit + integration test, condiviso da `apps/`, `packages/`, `modules/`. Configurazione comune in `@seaside/vitest-config`.

Librerie complementari raccomandate:
- **`@testing-library/react`** + **`@testing-library/jest-dom`**: testing componenti React in modo user-centric
- **`vitest-mock-extended`**: mocking type-safe di interfacce TS (ports/handlers)
- **`@faker-js/faker`**: generazione dati fake
- **`vitest-axe`**: asserzioni accessibilita' (Cap. 10.5 + Cap. 13.5)
- **`testcontainers`**: integration test (Cap. 13.3)
- **`msw`** (Mock Service Worker): mocking HTTP per test frontend che parlano col BFF

### 13.2 Unit tests

Ogni modulo business ha i propri unit tests in `src/` o in `__tests__/`:

```
modules/orders/
  ├── src/
  │   ├── domain/
  │   │   └── order.ts
  │   │   └── order.test.ts        # co-located test
  │   ├── application/
  │   │   └── create-order.handler.ts
  │   │   └── create-order.handler.test.ts
  │   └── ...
  └── vitest.config.ts
```

Testano: domain logic, handlers, schema zod, mapping. Vitest discoveri i file `*.test.ts` automaticamente.

### 13.3 Integration tests

**Decisione D-82: CONFERMATA -- Testcontainers for Node.js**

**Opzione A -- Testcontainers (raccomandata):**
Container Docker effimeri per Postgres, Redis, Azure Service Bus emulator, etc. Test realistici. Implementazione: pacchetto `testcontainers` ufficiale per Node.js.

**Pro:** test realistici, ambiente identico alla produzione.
**Contro:** richiede Docker, piu' lento dei test in-memory puri.

**Opzione B -- SQL in-memory (pglite, sql.js):**
PGLite (`@electric-sql/pglite`) come Postgres WASM in-process. Adapter Drizzle dedicato.

**Pro:** velocissimo, zero Docker.
**Contro:** non copre 100% delle feature Postgres (es. LISTEN/NOTIFY non supportato per outbox relay), comportamenti talvolta diversi.

**Opzione C -- Embedded Postgres:**
Pacchetto `embedded-postgres` o `postgres-server` Node.

**Pro:** Postgres reale.
**Contro:** complica la portabilita' CI/CD; preferibile Testcontainers.

**Raccomandazione**: Testcontainers come default per i test di integrazione che toccano Postgres, Redis, Service Bus. PGLite come opzione opt-in per test rapidi che non richiedono LISTEN/NOTIFY o estensioni avanzate. Il framework fornisce fixture base (`@seaside/testing`) per setup/teardown di container `postgres:16`, `redis:7`, `mcr.microsoft.com/azure-messaging/servicebus-emulator`.

```typescript
// @seaside/testing
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';

export async function startPostgresFixture() {
  const container = await new PostgreSqlContainer('postgres:16').start();
  const db = drizzle(container.getConnectionUri());
  await migrate(db);
  return { container, db, dispose: () => container.stop() };
}
```

### 13.4 Architecture tests

**Decisione D-81: CONFERMATA -- `dependency-cruiser`**

Architecture tests automatizzati per verificare le regole di dipendenza a ogni build. Coprono sia le regole inter-pacchetto (Cap. 8.7) sia le regole **intra-modulo** imposte dall'architettura esagonale (D-23, Cap. 5.9.3).

**Strumento**: `dependency-cruiser`. Lavora su AST (import statements + import dinamici), supporta TypeScript, ESM/CJS, configurazione dichiarativa JSON, integrazione CI nativa. Sostituisce NetArchTest per lo stack TypeScript.

**Configurazione condivisa**: il framework pubblica `@seaside/dependency-cruiser` con la base di regole. Ogni vertical repo e il framework stesso estendono questa config.

#### Regole inter-pacchetto (Cap. 8.7)

- `@seaside/*` non importa da `modules/*`
- `modules/*` non importa da `apps/*`
- `@seaside/shell`, `components`, `theming` non importati da `apps/worker/*`
- Cross-module imports vietati: `modules/orders/*` non importa da `modules/inventory/*`
- `antd` non importato fuori da `@seaside/components`
- `drizzle-orm` non importato fuori da `infrastructure/`

#### Regole intra-modulo -- Hexagonal (D-23)

Per ogni modulo business, i test verificano che:

- **`domain/` non dipende da `application/`, `infrastructure/`, `endpoints/`** -- il centro dell'esagono non conosce l'esterno
- **`application/` non dipende da `infrastructure/` ne' da `endpoints/`** -- i use case orchestrano il dominio, non conoscono gli adapter
- **`endpoints/` non dipende da `infrastructure/`** -- i driving adapter parlano solo al mediator
- **`infrastructure/` implementa solo Ports definiti in `domain/`** -- gli adapter driven sono sostituibili

Esempio di configurazione `dependency-cruiser`:

```javascript
// .dependency-cruiser.cjs
module.exports = {
  extends: '@seaside/dependency-cruiser/hexagonal',
  forbidden: [
    {
      name: 'domain-no-application',
      severity: 'error',
      comment: 'Domain layer cannot depend on Application layer',
      from: { path: 'modules/[^/]+/src/domain' },
      to:   { path: 'modules/[^/]+/src/application' },
    },
    {
      name: 'domain-no-infrastructure',
      severity: 'error',
      from: { path: 'modules/[^/]+/src/domain' },
      to:   { path: 'modules/[^/]+/src/infrastructure' },
    },
    {
      name: 'application-no-infrastructure',
      severity: 'error',
      from: { path: 'modules/[^/]+/src/application' },
      to:   { path: 'modules/[^/]+/src/infrastructure' },
    },
    {
      name: 'no-cross-module',
      severity: 'error',
      from: { path: 'modules/([^/]+)/' },
      to:   { path: 'modules/(?!\\1)([^/]+)/' },   // pattern dinamico
    },
    {
      name: 'no-antd-outside-components',
      severity: 'error',
      from: { pathNot: '@seaside/components' },
      to:   { dependencyTypes: ['npm'], path: '^antd' },
    },
  ],
};
```

Queste regole vengono applicate **per ogni modulo** scoperto nei `modules/*` tramite pattern di percorso, senza dover scrivere regole specifiche per ciascun modulo. Il framework fornisce la config in `@seaside/dependency-cruiser/hexagonal` come preset esteso dai verticali.

In CI: `npx depcruise --validate src` e fallisce la build se trova violazioni.

### 13.5 Accessibility tests (a11y)

La CI pipeline dei vertical repo include test di accessibilita' automatici come quality gate. Dettagli nel [Cap. 10.5](#105-accessibilita-a11y----enforcement-dal-framework).

**Strumenti:**
- **axe-core** (via `vitest-axe` per component test e `@axe-core/playwright` per E2E): test automatici WCAG AA
- **`eslint-plugin-jsx-a11y`**: linting statico sui componenti React (errori, non warning)
- **Lighthouse CI** (`@lhci/cli`): audit periodico con soglia minima (es. 90/100)

Il framework fornisce `@seaside/testing` con utility `expectAccessible()` per semplificare i test a11y nei verticali.

### 13.6 E2E Testing (Playwright)

**Framework: Playwright** (D-80 CONFERMATA)

Architettura completa per test end-to-end, di performance e di regressione.

#### 13.6.1 Struttura E2E

```
tests/
  └── E2E/
      ├── playwright.config.ts          # configurazione globale
      ├── fixtures/
      │   ├── auth.fixture.ts           # login/session management per tutti i provider
      │   ├── app.fixture.ts            # setup app (base URL, browser)
      │   └── db.fixture.ts             # seed/cleanup dati di test
      ├── pages/                        # Page Object Model
      │   ├── login.page.ts
      │   ├── shell.page.ts             # sidebar, header, breadcrumb
      │   ├── data-grid.page.ts         # interazione con SeasideDataGrid
      │   └── form.page.ts              # interazione con SeasideForm
      ├── tests/
      │   ├── smoke/                    # subset critico, eseguito ad ogni commit
      │   │   ├── login.spec.ts
      │   │   └── navigation.spec.ts
      │   ├── e2e/                      # flussi completi
      │   │   ├── crud-orders.spec.ts
      │   │   ├── dynamic-forms.spec.ts
      │   │   └── multi-module-flow.spec.ts
      │   ├── a11y/                     # test accessibilita' su pagine complete
      │   │   └── pages-a11y.spec.ts    # axe-core su ogni pagina
      │   ├── visual/                   # screenshot comparison
      │   │   └── pages-visual.spec.ts
      │   └── performance/              # metriche di performance
      │       └── core-web-vitals.spec.ts
      └── helpers/
          ├── api.helper.ts             # chiamate API dirette per setup dati
          └── wait.helper.ts            # utility per attesa condizioni
```

#### 13.6.2 Configurazione

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'results/e2e-results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },  // touch device
  ],
  webServer: {
    command: 'npm run dev',                 // turbo run dev -- avvia Next.js + Hono + Postgres via Aspire
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### 13.6.3 Auth nei test

```typescript
// fixtures/auth.fixture.ts
// Stato di sessione pre-autenticato, riutilizzato tra test
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: 'auth-state.json' });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

// Setup globale: login una volta, salva sessione
async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('/login');
  await page.fill('[data-testid="username"]', process.env.TEST_USER);
  await page.fill('[data-testid="password"]', process.env.TEST_PASSWORD);
  await page.click('[data-testid="submit"]');
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: 'auth-state.json' });
  await browser.close();
}
```

#### 13.6.4 Shell + lazy loading

I test E2E verificano che la shell funzioni con moduli lazy-loaded:
- Navigazione da un modulo all'altro senza reload pagina
- Breadcrumb aggiornato correttamente dopo navigazione
- Sidebar riflette i permessi dell'utente corrente
- Lazy loading trasparente: la pagina appare senza errori dopo navigazione

#### 13.6.5 Mock backend (opzionale)

Per test frontend-only (senza backend reale):

```typescript
// Intercetta API e rispondi con dati mock
await page.route('**/api/orders**', async route => {
  await route.fulfill({ json: mockOrdersResponse });
});
```

Utilizzato per: test di regressione UI, test a11y, test visual. Non utilizzato per: test di flusso E2E completo (quelli usano il backend reale via Aspire).

### 13.7 Performance testing

**Tool: Playwright + k6**

| Tipo | Tool | Quando | Dove |
|---|---|---|---|
| **Core Web Vitals** | Playwright + `web-vitals` + Next.js `reportWebVitals` | Ogni PR | CI (Lighthouse CI) |
| **Load testing** | k6 | Pre-release | Ambiente staging |
| **DB query monitoring** | Drizzle logger + `pg_stat_statements` | Sviluppo + CI | Test di integrazione |
| **Regression** | Playwright performance traces | Ogni PR | CI |

#### 13.7.1 Core Web Vitals in CI

```typescript
// tests/performance/core-web-vitals.spec.ts
test('homepage meets CWV targets', async ({ page }) => {
  await page.goto('/');
  const metrics = await page.evaluate(() => {
    return new Promise(resolve => {
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        resolve({
          lcp: entries.find(e => e.entryType === 'largest-contentful-paint')?.startTime,
          cls: entries.find(e => e.entryType === 'layout-shift')?.value,
        });
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
  });
  expect(metrics.lcp).toBeLessThan(2500);  // LCP < 2.5s
  expect(metrics.cls).toBeLessThan(0.1);    // CLS < 0.1
});
```

#### 13.7.2 Load testing con k6

```javascript
// k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // ramp-up
    { duration: '5m', target: 50 },   // sustained load
    { duration: '2m', target: 0 },    // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p95<500'],    // 95th percentile < 500ms
    http_req_failed: ['rate<0.01'],    // < 1% errori
  },
};

export default function () {
  const res = http.get(`${__ENV.BASE_URL}/api/orders?page=1&pageSize=20`);
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
```

**Baseline metrics:**

| Metrica | Target | Misurazione |
|---|---|---|
| API response time (p95) | < 500ms | k6 |
| API response time (p99) | < 1000ms | k6 |
| Concurrent users | >= 50 senza degradazione | k6 |
| DB query time (p95) | < 100ms | Drizzle logger + `pg_stat_statements` |
| N+1 queries | 0 | Drizzle logger + asserzione count nei test |

#### 13.7.3 DB query monitoring

- **Drizzle logger**: abilitabile via `drizzle({ logger: true })` o logger custom che traccia tutte le query con timing
- **`pg_stat_statements`**: estensione Postgres attivabile in dev/staging per profilazione aggregata (top query per tempo, frequenza, righe)
- **N+1 detection**: test di integrazione che intercetta il logger e verifica il numero di query per operazione (es. "list 20 orders deve fare <= 3 query")
- **Query plan check**: per query complesse, `EXPLAIN ANALYZE` automatizzato in test su Testcontainers per verificare l'uso di indici

### 13.8 Struttura test projects

```
apps/api/
  ├── src/
  │   └── ...                                  # codice + co-located *.test.ts (Vitest)
  ├── vitest.config.ts
  └── package.json

modules/orders/
  ├── src/
  │   ├── domain/
  │   │   └── order.test.ts                    # unit tests Vitest
  │   ├── application/
  │   │   └── create-order.handler.test.ts
  │   └── infrastructure/
  │       └── orders.repository.integration.test.ts   # Testcontainers
  └── vitest.config.ts

packages/dependency-cruiser/                   # preset condiviso architecture rules
  └── hexagonal.cjs

tests/                                         # cross-cutting test suite
  ├── e2e/                                     # Playwright (Cap. 13.6)
  │   ├── playwright.config.ts
  │   ├── fixtures/
  │   ├── pages/
  │   └── specs/
  ├── architecture/                            # smoke depcruise + report
  │   └── depcruise.json
  └── k6/                                      # Load testing (Cap. 13.7)
      └── load-test.js
```

---

## Capitolo 14 -- Migration Strategy

### 14.1 Principio fondamentale

La migrazione avviene **per capability**, non per repository. Ogni capability trovata nei repo legacy viene:
1. Identificata
2. Classificata
3. Riprogettata per il target
4. Implementata nel nuovo framework/modulo appropriato

### 14.2 Sistema di classificazione

| Classificazione | Significato | Destinazione |
|---|---|---|
| **PLATFORM** | Capability core del framework | `@seaside/*` packages |
| **SHARED** | Riusabile ma non core | `@seaside/*` con scope limitato (es. `@seaside/file-storage`) |
| **APP-SPECIFIC** | Specifica di una sola app | `modules/<modulo>` nel vertical repo |
| **EXTRACT** | Da estrarre come worker/package/modulo separato | `apps/worker-*` o nuovo modulo nel vertical |
| **REWRITE** | Funzionalita' da mantenere ma da riscrivere | Nuovo codice TypeScript nel target appropriato |
| **DROP** | Da eliminare | Nessuna |
| **DEFER** | Da rinviare a fase successiva | Backlog |

### 14.3 Processo decisionale per ogni capability

Per ogni capability identificata:

1. **Serve ancora?** No -> DROP
2. **Serve ora?** No -> DEFER
3. **E' riusabile da piu' app?** Si -> PLATFORM o SHARED
4. **E' specifica di una app?** Si -> APP-SPECIFIC
5. **Va ripensata nella forma?** Si -> REWRITE o EXTRACT
6. **Puo' essere portata cosi' com'e'?** Raramente, ma se si' -> REWRITE (comunque adattata allo stack target)

### 14.4 Regole di migrazione

- Mai copiare codice legacy nel framework senza classificazione
- Mai inserire scorciatoie nate per la prima migrazione nei building blocks
- Ogni capability migrata deve rispettare le regole di dipendenza del nuovo repo
- La migrazione non deve contaminare il framework con logiche app-specific
- Ogni capability migrata deve avere test

---

## Capitolo 15 -- Backlog Streams

Il backlog iniziale e' organizzato in 9 stream operativi. Ogni stream produce deliverable verificabili.

### Stream 1: Discovery & Classification

- Analisi repository legacy
- Analisi repository di riferimento
- Inventory capability
- Classificazione capability (PLATFORM/SHARED/APP-SPECIFIC/EXTRACT/REWRITE/DROP/DEFER)
- Documento di ricognizione

### Stream 2: Architecture & Guardrails

- Finalizzazione decisioni architetturali (questo documento)
- Creazione ADR per ogni decisione
- Definizione regole di dipendenza
- Definizione convenzioni di naming, coding, testing

### Stream 3: Repository Bootstrap

- Creazione framework repo Turborepo: `packages/@seaside/*`, `tooling/`, `apps/` di esempio, Aspire AppHost
- Setup npm workspaces + Turborepo pipeline (`turbo.json`)
- Setup Changesets per versioning e release
- Setup CI/CD framework: build, test, pubblicazione pacchetti npm su feed privato (Azure Artifacts npm o GitHub Packages)
- Creazione vertical template repo Turborepo: `apps/web` (Next.js), `apps/api` (Hono), `apps/worker`, Aspire AppHost, struttura `modules/` pronta
- Setup `.editorconfig`, `tsconfig` base, `eslint`, `prettier`, `dependency-cruiser` condivisi
- Setup feed privato npm
- Creazione documenti guardrail (ADR, convenzioni)

### Stream 4: Framework Foundation

- Implementazione `@seaside/abstractions` (interfacce ports + result types)
- Implementazione `@seaside/application` (mediator, pipeline behaviors, CQRS)
- Implementazione `@seaside/domain` (Aggregate, ValueObject, DomainEvent base)
- Implementazione `@seaside/infrastructure` (Drizzle helpers, UoW, Outbox)
- Implementazione `@seaside/error-handling` (Problem Details RFC 9457)
- Implementazione `@seaside/configuration` (env loader tipato + Zod schema)
- Implementazione `@seaside/observability` (OpenTelemetry Node + structured logger)

### Stream 5: Shared UI

- Implementazione shell applicativa
- Setup theming e design tokens
- Primi componenti condivisi
- Standard UX documentati

### Stream 6: Windows Services Decomposition

- Analisi dettagliata di ogni Windows Service
- Classificazione per responsabilita'
- Proposta target per ciascuno
- Implementazione worker strategy

### Stream 7: First Host Application

- Definizione scope della prima app
- Creazione primo Host
- Implementazione primi moduli business
- Integrazione con framework

### Stream 8: Testing & Quality Gates

- Setup test projects
- Implementazione architecture tests
- Setup integration test infrastructure (Testcontainers)
- Quality gates per PR/merge

### Stream 9: Migration by Capability

- Migrazione capability per capability secondo classificazione
- Verifica conformita' alle regole del framework
- Test per ogni capability migrata

---

## Capitolo 16 -- Rischi e Mitigazioni

| # | Rischio | Impatto | Probabilita' | Mitigazione |
|---|---|---|---|---|
| R1 | Framework troppo grande | Il framework diventa rigido e difficile da mantenere | Media | Regola del confine (riusabile da 2+ app). Review periodica dei confini. |
| R2 | Framework troppo piccolo | Le app duplicano logica che dovrebbe essere condivisa | Media | Capability review durante ogni sprint. Promuovere a framework quando emerge riuso. |
| R3 | Prima app contamina il framework | Scorciatoie app-specific finiscono nei BuildingBlocks | Media | Rischio ridotto dal modello multi-repo: il verticale non puo' modificare il framework (confine di pacchetto). Resta il rischio di aggiungere al framework astrazioni che servono solo a un verticale. Mitigazione: ADR per ogni inclusione, code review. |
| R4 | Over-engineering | Troppa astrazione troppo presto | Media | YAGNI: implementare solo cio' che serve ora. Ogni building block deve avere almeno un consumer. |
| R5 | Discovery incompleta | Capability legacy non identificate emergono tardi | Media | Analisi sistematica di ogni repo. Classificazione completa prima del bootstrap. |
| R6 | Decisioni architetturali non documentate | Perdita di contesto sulle scelte fatte | Bassa | ADR per ogni decisione. Questo documento come riferimento. |
| R7 | Dipendenze incrociate tra moduli | I moduli diventano accoppiati vanificando il modular monolith | Media | Architecture tests. Integration events come pattern di comunicazione. |
| R8 | Stack TypeScript end-to-end | Forte dipendenza da un singolo ecosistema (npm); rischio di vulnerabilita' supply chain | Bassa | Mitigato da: feed privato Azure Artifacts, npm audit + Renovate/Dependabot in CI, lockfile committato, allowlist di package permessi tramite policy. Vantaggio rispetto a dual-stack: tipi condivisi via package `contracts`, ridotta cognitive load |
| R9 | Curva di apprendimento team | Pattern nuovi (vertical slices, mediator, modular monolith) | Media | Documentazione interna, esempi nel framework, modulo di esempio. |
| R10 | Porting involontario | Pressione a "copiare" codice legacy per velocita' | Alta | Principio "ricostruzione da zero" documentato. Ogni capability classificata prima di implementare. Code review strutturale. |

---

## Capitolo 17 -- Discovery Results

Questo capitolo documenta i risultati della discovery dei 4 repository analizzati. I dettagli completi sono nei documenti dedicati:
- `.planning/repository-map.md` -- ricognizione completa di ogni repository
- `.planning/capability-classification.md` -- classificazione di ogni capability

### 17.1 Repository analizzati

| Repository | Path | Tipo | Stack legacy | Stack target |
|---|---|---|---|---|
| **ANServer** | `OldCodeBase/ANServer` | Backend legacy + Windows Service | .NET Framework 4.8, EF6, ASP.NET Web API 2 (OWIN), SignalR 2 | Node.js + Hono + Drizzle + Postgres |
| **ANWebFE** | `OldCodeBase/ANWebFE` | Frontend legacy | Angular 16, Angular Material, UIRouter, Schema Formly | Next.js (App Router) + React 19 + Ant Design |
| **Liquibase** | `OldCodeBase/Liquibase` | Database legacy | SQL Server, Liquibase, schema `Seaside` | Postgres 16 + drizzle-kit (riscrittura schema) |
| **NewSeasidePerYuri** | `OldCodeBase/NewSeasidePerYuri` | Reference UI/UX | React 18, Ant Design 5, TypeScript, Express, Turborepo | Riferimento allineato al target |

### 17.2 Numeri chiave

| Metrica | Valore legacy |
|---|---|
| Progetti backend (.NET) | 21 (da ricostruire come `apps/` + `modules/` Node.js) |
| Moduli Angular frontend | 186+ (da ricostruire come pagine Next.js + componenti React) |
| Tabelle database | 268 (da rimodellare in Postgres + Drizzle, organizzate per schema/modulo) |
| Stored Procedures | 324 (da riscrivere in TypeScript/Drizzle; mantenute solo se giustificate -- Cap. 6.7) |
| Views | 172 (rivalutate: la maggior parte diventa query Drizzle; views Postgres solo se necessario) |
| Funzioni SQL | 35 (riscritte in TypeScript o, dove giustificato, come funzioni Postgres) |
| Trigger | 6 (riscritti come domain events + outbox hook; pattern preferito ai trigger DB) |
| Windows Services | 1 (con 4 thread) -- decomposto in worker Node.js indipendenti |
| Provider di autenticazione | 7 (AAD, B2C, Google, SAML2, custom, Teams, PBI) -- mappati su provider Auth.js |
| Capability identificate (backend) | 26 |
| Capability identificate (frontend) | 34 |

### 17.3 Principio guida della discovery

> **Questo progetto NON e' una migrazione**. I repository legacy vengono studiati per comprendere capability, requisiti e pattern. Tutto viene ricostruito da zero nel nuovo stack. Il codice legacy e' una fonte di conoscenza, non codice da copiare.

Il reference (NewSeasidePerYuri) e' ispirazione per l'estetica e i pattern UX. Il dominio del reference (ERM - Enterprise Risk Management) e' diverso dal legacy (Workflow/Task Management - CPM). Solo i pattern UI vengono adottati.

### 17.4 Dominio legacy: Analitica / Seaside

Il sistema legacy si chiama "Analitica" / "Seaside" ed e' una piattaforma di **workflow e task management** (CPM - Core Process Management):
- Processi (`tCPM_M`) definiscono workflow
- Task gerarchici (`tDDataCPMTask_D` con auto-referenza via `FatherId`)
- Load/Istanze (`tLoad_M`) sono esecuzioni di un workflow
- Oggetti (`tObject`) collegano form, survey, video, PBI, documenti ai task
- Survey con form dinamiche (Schema Formly, 50+ tipi di campo)

**Questo dominio e' interamente APP-SPECIFIC. Nulla del CPM/workflow deve entrare nel framework.**

### 17.5 Decisioni confermate dalla discovery

| Decisione | Valore | Riferimento |
|---|---|---|
| Auth providers | Tutti i 7 provider del legacy, mappati su provider Auth.js (NextAuth v5) | Cap. 7 |
| Dynamic Forms | Capability PLATFORM (`@seaside/forms`) | Cap. 9 |
| SP/Views strategy | sAN/vAN -> riscrittura in TypeScript/Drizzle, sEX/vEX -> evaluate caso per caso | Cap. 6.7 |
| Multi-tenancy | Non prevista (workspace scoping si') | Cap. 2.6 |
| UI technology | Next.js (App Router) + React 19 + Ant Design | Cap. 4 |
| Backend language | TypeScript su Node.js LTS (>= 22) | Cap. 3.1 |
| Orchestrazione dev | .NET Aspire AppHost (Node + Postgres + Next via `AddNodeApp`/`AddNpmApp`) | Cap. 3.2 |
| Monorepo | Turborepo + npm workspaces per ogni repo (framework + verticali) | Cap. 3.3 |

### 17.6 Relazioni tra repository

**Mappa legacy:**

```
ANWebFE (Angular SPA)
    |
    | REST API (HTTP + JWT)
    | SignalR (WebSocket, Azure Service Bus backplane)
    |
    v
ANServer (ASP.NET Web API + OWIN)
    |
    | Entity Framework 6
    | Stored Procedure Adapters (46)
    |
    v
Liquibase (SQL Server, schema Seaside)
    |
    | Changelog-based migrations
    | 324 SP, 172 views, 35 functions, 6 triggers
    v
Database (Azure SQL)

NewSeasidePerYuri (React + Express + SQLite)
    -- Nessuna relazione tecnica con gli altri repo
    -- Solo ispirazione UI/UX
```

**Mappa target (post rebuild):**

```
apps/web (Next.js App Router + React + Ant Design)
    |
    | Auth.js (server session, httpOnly cookies)
    | Route Handlers (BFF) -- fetch verso Hono
    | WebSocket (opzionale, broker Azure Service Bus)
    |
    v
apps/api (Hono su Node.js LTS)
    |
    | Mediator (@seaside/application) + Pipeline Behaviors
    | Drizzle ORM (Ports/Adapters)
    |
    v
Postgres 16 (Azure Database for PostgreSQL Flexible Server)
    | drizzle-kit migrations per modulo, schemi separati
    | Views/functions Postgres opzionali e giustificate
    v
apps/worker-* (Node.js processes)
    | BullMQ (Redis) o Service Bus consumers
    | Outbox relay, scheduler, importer
```

### 17.7 Documentazione GSD trovata

Tutti e 3 i repository legacy contengono una cartella `.planning/codebase/` con documentazione GSD:

| Documento | ANServer | ANWebFE | Liquibase |
|---|---|---|---|
| ARCHITECTURE.md | Si | Si | Si |
| STRUCTURE.md | Si | Si | Si |
| STACK.md | Si | Si | Si |
| INTEGRATIONS.md | Si | Si | Si |
| CONVENTIONS.md | Si | Si | Si |
| TESTING.md | Si | Si | Si |
| CONCERNS.md | No | Si | Si |

NewSeasidePerYuri non ha `.planning` ma ha `ARCHITECTURE_PROMPT.md` e specifiche UI in `docs/`.

---

## Appendice A -- Glossario

| Termine | Definizione |
|---|---|
| **Framework** | La base condivisa (`@seaside/*` packages) che fornisce capability trasversali |
| **Platform** | Sinonimo di Framework in questo contesto |
| **Building Block** | Singolo pacchetto npm del framework core (es. `@seaside/security`, `@seaside/audit`, `@seaside/observability`) |
| **App** | Applicazione eseguibile in `apps/`: `apps/web` (Next.js), `apps/api` (Hono), `apps/worker-*` (Node.js). Sostituisce il concetto di "Host" .NET |
| **Module** | Unita' business autonoma in `modules/<nome>`, package npm interno che contiene dominio, logica applicativa, endpoint registrabili e migrations Drizzle |
| **Worker** | Processo Node.js background separato (`apps/worker-*`) per responsabilita' che richiedono isolamento (scheduler, outbox relay, import) |
| **Shell** | Layout UI esterno (header, sidebar, content area) fornito da `@seaside/shell` -- componenti React |
| **AppHost** | Progetto Aspire C# (`apphost/`) che orchestra in locale Node services, Postgres, Redis, Service Bus emulator e Next.js apps tramite `AddNodeApp` / `AddNpmApp`. Non hosta servizi .NET applicativi |
| **ServiceDefaults** | Concetto Aspire .NET non applicabile a Node.js: sostituito da `@seaside/observability` + `@seaside/configuration` che applicano standard tecnici (telemetry, health, resilienza) ai servizi Node |
| **BFF** | Backend-for-Frontend: Next.js stesso (Route Handlers + Auth.js) -- vedi Cap. 7.6 |
| **Capability** | Funzionalita' o responsabilita' identificata nei repo legacy, soggetta a classificazione |
| **ADR** | Architecture Decision Record -- documento che traccia una decisione architetturale |
| **Framework Repo** | Repository dedicato al framework (`@seaside/*` npm packages). Turborepo + npm workspaces. Mantenuto dal team framework. Pubblica pacchetti npm sul feed privato |
| **Vertical Repo** | Repository dedicato a un singolo prodotto verticale (Modules + Apps + Workers). Turborepo + npm workspaces. Mantenuto dal team di prodotto. Consuma i pacchetti `@seaside/*` |
| **Package Feed** | Feed privato npm (Azure Artifacts npm, GitHub Packages) dove il framework pubblica i propri pacchetti consumati dai verticali |
| **Vertical Slice** | Pattern dove ogni feature e' una unita' autonoma Request -> Handler -> Response |
| **Mediator** | Pattern che disaccoppia il mittente di una richiesta dal suo handler, con pipeline di behavior. Implementazione: `@seaside/application` |
| **Pipeline Behavior** | Componente che si inserisce nella pipeline del mediator per cross-cutting concerns (logging, validation, transaction, authorization) |
| **Integration Event** | Evento pubblicato da un modulo e consumato da altri per comunicazione disaccoppiata (via `@seaside/messaging` + outbox/inbox) |
| **Design Token** | Variabile (colore, spacing, font) definita dal design system e usata nei componenti (`@seaside/theming`, CSS variables + Ant Design `ConfigProvider`) |
| **Turborepo** | Build system per monorepo con caching incrementale e pipeline parallele. Sostituisce il concetto di MSBuild + Central Package Management |
| **npm workspaces** | Meccanismo nativo di npm per gestire piu' package nello stesso repo con link locali |
| **Changesets** | Tool di release management che gestisce versioning semver + changelog generation per i pacchetti pubblicati |
| **Drizzle** | ORM TypeScript SQL-first usato dal framework (`@seaside/persistence`) come unico accesso dati. `drizzle-kit` gestisce le migrations |
| **Hono** | Web framework Node.js leggero e veloce usato in `apps/api` per esporre HTTP endpoint |
| **Auth.js (NextAuth v5)** | Libreria di autenticazione per Next.js usata come BFF: session management server-side, provider OIDC multipli, JWT server-to-server verso Hono |
| **Zod** | Libreria di validazione/schema TypeScript usata al posto di FluentValidation (Cap. 5.6) |
| **Vitest** | Test runner per unit e integration (Cap. 13.1) |
| **dependency-cruiser** | Tool di static analysis per enforce delle regole di dipendenza (Cap. 13.4) sostituto di NetArchTest |
| **next-intl** | Libreria i18n per Next.js basata su ICU MessageFormat (Cap. 10.14) |
| **BullMQ** | Libreria di code/jobs scheduler basata su Redis usata opzionalmente da `@seaside/background-jobs` (Cap. 12) |
| **`AddNodeApp` / `AddNpmApp`** | Estensioni Aspire C# che permettono di orchestrare processi Node.js dal `apphost` |
