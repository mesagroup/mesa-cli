# Dependency Rules -- SEASYDE_AI

> Regole di dipendenza dei repository. Queste regole sono vincolanti. Nel framework repo sono verificate da architecture tests. Nei vertical repos sono imposte fisicamente dal confine di pacchetto NuGet.
> Ultimo aggiornamento: 2026-03-09

---

## 1. Principio fondamentale

Le dipendenze sono **unidirezionali** e **controllate** attraverso **due repository** separati:

- **Framework repo** — contiene BuildingBlocks, Shared, ServiceDefaults. Pubblicati come pacchetti NuGet/npm.
- **Vertical repo** (uno per prodotto) — contiene AppHost, Hosts, Modules, Workers. Consuma il framework come pacchetti NuGet.

Nessun layer inferiore puo' dipendere da un layer superiore. Il framework non puo' dipendere dalle applicazioni. Nei vertical repos il confine di pacchetto NuGet **impone fisicamente** l'impossibilita' di modificare il framework.

```
FRAMEWORK REPO                           VERTICAL REPO
──────────────────                       ──────────────────
                                          ┌──────────────┐
                                          │   AppHost    │  (orchestrazione Aspire)
                                          └──────┬───────┘
                                                 │ orchestra
                                    ┌────────────┼──────────────────┐
                                    │            │                  │
                              ┌─────▼──────┐ ┌───▼────┐  ┌─────────▼──────────┐
                              │   Hosts    │ │Workers │  │  ServiceDefaults   │
                              │  (Web/Api) │ │        │  │  (da NuGet)        │
                              └─────┬──────┘ └───┬────┘  └────────────────────┘
                                    │            │
                                    │ compongono │
                                    ▼            ▼
                              ┌──────────────────────────┐
                              │       Modules            │  (business modules)
                              └────────────┬─────────────┘
                                           │ dipendono da (via NuGet)
┌──────────────────────────────────────────┤
│                                          │
│  ┌─────────────────────────┐             │
│  │    BuildingBlocks       │ ◄───────────┘
│  ├─────────────────────────┤
│  │    Shared               │
│  └─────────────────────────┘
│
└─ pubblicati come NuGet/npm ──────►  consumati come pacchetti
```

**Direzione delle dipendenze:**

- **Hosts** -> Modules, Shared (NuGet), BuildingBlocks (NuGet)
- **Workers** -> Modules, BuildingBlocks (NuGet) — niente UI
- **Modules** -> BuildingBlocks (NuGet), Shared.Contracts (NuGet)
- **BuildingBlocks** -> nulla di interno (solo pacchetti NuGet esterni)
- **ServiceDefaults** -> solo pacchetti Aspire/OpenTelemetry (NuGet)
- **AppHost** -> orchestra tutto, non contiene logica

---

## 2. Matrice delle dipendenze consentite

### 2.1 Contesto: framework repo (dipendenze tra progetti)

Questi progetti vivono nello stesso repository e si referenziano come **project reference**.

| Sorgente ↓ / Target → | BuildingBlocks | Shared | ServiceDefaults |
|---|---|---|---|
| **BuildingBlocks** | INTERNI | NO | NO |
| **Shared** | Abstractions | INTERNI | NO |
| **ServiceDefaults** | NO | NO | -- |

Legenda:
- **INTERNI** = puo' dipendere da altri progetti dello stesso layer
- **Abstractions** = solo da BuildingBlocks.Abstractions
- **NO** = dipendenza vietata

#### Regole per layer (framework repo)

##### BuildingBlocks
- **PUO' dipendere da**: altri BuildingBlocks + pacchetti NuGet esterni
- **NON DEVE dipendere da**: Shared, ServiceDefaults
- **NOTA**: le dipendenze tra BuildingBlocks seguono una gerarchia interna (vedi sezione 3)

##### Shared
- **Shared.Contracts PUO' dipendere da**: BuildingBlocks.Abstractions
- **Shared.UiComponents PUO' dipendere da**: Shared.UiTheming, BuildingBlocks.Abstractions
- **Shared.UiShell PUO' dipendere da**: Shared.UiComponents, Shared.UiTheming, BuildingBlocks.Abstractions
- **Shared.Kernel PUO' dipendere da**: BuildingBlocks.Abstractions
- **NESSUN progetto Shared PUO' dipendere da**: ServiceDefaults

##### ServiceDefaults
- **PUO' dipendere da**: solo pacchetti NuGet Aspire e OpenTelemetry
- **NON DEVE dipendere da**: nessun altro progetto del framework repo
- **CONTIENE**: setup OpenTelemetry, health checks, resilienza HTTP (Polly), service discovery

### 2.2 Contesto: vertical repo (dipendenze tra progetti locali e pacchetti NuGet)

Qui Modules, Hosts, Workers, AppHost sono **progetti locali** con project reference tra loro. BuildingBlocks e Shared sono **pacchetti NuGet** consumati dal framework repo — non sono progetti modificabili.

| Sorgente ↓ / Target → | AppHost | Modules | Hosts | Workers | BuildingBlocks (NuGet) | Shared (NuGet) | ServiceDefaults (NuGet) |
|---|---|---|---|---|---|---|---|
| **AppHost** | -- | ref | ref | ref | — | — | ref |
| **Hosts** | NO | SI | NO | NO | SI | SI | ref |
| **Workers** | NO | SI | NO | NO | SI | NO UI | ref |
| **Modules** | NO | NO | NO | NO | SI | Contracts | NO |

Legenda:
- **SI** = dipendenza consentita
- **NO** = dipendenza vietata
- **ref** = referenza per registrazione (ServiceDefaults) o orchestrazione (AppHost)
- **Contracts** = solo da Shared.Contracts (DTO e interfacce neutre)
- **NO UI** = puo' dipendere da Shared.Contracts e Shared.Kernel ma NON da Shared.Ui*
- **—** = non applicabile (AppHost non contiene codice che importa questi namespace)

> **Nota**: BuildingBlocks e Shared **non** sono progetti locali nel vertical repo. Sono pacchetti NuGet compilati. Il vincolo di dipendenza e' quindi **fisico**: il codice del vertical repo non puo' modificare il framework.

#### Regole per layer (vertical repo)

##### AppHost
- **PUO' referenziare**: tutti i progetti locali (per orchestrazione Aspire)
- **NON DEVE contenere**: business logic, configurazione applicativa, codice condiviso

##### ServiceDefaults
- Consumato come pacchetto NuGet dal framework, oppure copia locale. Contiene solo setup Aspire/OpenTelemetry.

##### Hosts
- **PUO' dipendere da**: Modules (locali), pacchetti NuGet del framework (BuildingBlocks.*, Shared.*, ServiceDefaults)
- **NON DEVE dipendere da**: altri Hosts, Workers, AppHost

##### Workers
- **PUO' dipendere da**: Modules (locali), pacchetti NuGet del framework (BuildingBlocks.*, ServiceDefaults, Shared.Contracts, Shared.Kernel)
- **NON DEVE dipendere da**: Shared.Ui*, Hosts, altri Workers, AppHost

##### Modules
- **PUO' dipendere da**: pacchetti NuGet del framework (BuildingBlocks.*, Shared.Contracts)
- **NON DEVE dipendere da**: altri Modules (senza approvazione esplicita), Hosts, Workers, Shared.Ui*, AppHost
- **NOTA**: un modulo non conosce chi lo ospita ne' gli altri moduli

---

## 3. Gerarchia interna dei BuildingBlocks

I BuildingBlocks hanno una gerarchia di dipendenza interna (verificata da architecture tests nel framework repo):

```
                ┌─────────────────┐
                │  Abstractions   │  (nessuna dipendenza interna)
                └────────┬────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────▼─────┐  ┌────▼────┐  ┌──────▼──────┐
    │  Domain   │  │ ErrorH. │  │ Application │
    └─────┬─────┘  └─────────┘  └──────┬──────┘
          │                        ┌────┤
          ├──────────────────┐     │    │
          │                  │     │    │
    ┌─────▼──────────────┐ ┌▼─────▼──┐ │  ┌─────▼─────┐
    │HierarchicalEntities│ │StateMach.│ │  │   Hooks   │
    └────────────────────┘ └─────────┘ │  └───────────┘
          │                    ┌───────┘
          └──────────┐  ┌─────┘
                     │  │
              ┌──────▼──▼─────┐
              │ Infrastructure│
              └────────┬──────┘
                       │
         ┌─────────────┼─────────────────┐
         │             │                 │
   ┌─────▼────┐  ┌────▼──────┐  ┌──────▼───────┐
   │ Security │  │   Audit   │  │ Observability│
   └──────────┘  └───────────┘  └──────────────┘
         │
   ┌─────▼────┐  ┌───────────────┐  ┌──────────────┐
   │ Identity │  │ Configuration │  │BackgroundJobs│
   └──────────┘  └───────────────┘  └──────────────┘
         │
   ┌─────▼────┐  ┌───────────────┐  ┌───────────┐  ┌───────────┐
   │  Users   │  │ DynamicForms  │  │ Messaging │  │ Workspace │
   └──────────┘  └───────────────┘  └───────────┘  └───────────┘
```

### 3.1 Dipendenze interne consentite

| BuildingBlock | Puo' dipendere da |
|---|---|
| Abstractions | Nessun altro BuildingBlock (solo NuGet) |
| Domain | Abstractions |
| Application | Abstractions, Domain |
| ErrorHandling | Abstractions |
| Hooks | Abstractions, Domain, Application |
| Infrastructure | Abstractions, Domain, Application |
| Security | Abstractions, Infrastructure |
| Audit | Abstractions, Infrastructure |
| Observability | Abstractions |
| Identity | Abstractions, Security, Infrastructure |
| Users | Abstractions, Identity, Infrastructure |
| Configuration | Abstractions, Infrastructure |
| BackgroundJobs | Abstractions |
| DynamicForms | Abstractions, Domain, Infrastructure |
| HierarchicalEntities | Abstractions, Domain |
| StateMachine | Abstractions, Domain |
| Messaging | Abstractions |
| Workspace | Abstractions, Domain, Infrastructure |

### 3.2 Regola chiave

Un modulo business che necessita solo di interfacce base puo' dipendere esclusivamente da **BuildingBlocks.Abstractions**, senza portarsi dietro l'intero framework.

### 3.3 Regole esagonali intra-modulo (D-23)

All'interno di ogni modulo business si applica l'architettura esagonale. Ogni modulo e' suddiviso in quattro layer con regole di dipendenza rigide:

- **Domain** (Entities, Value Objects, Ports): NON dipende da Application, Infrastructure, Endpoints.
- **Application** (Use Cases, Command/Query Handlers): dipende da **Domain** soltanto. NON dipende da Infrastructure ne' da Endpoints.
- **Infrastructure** (Driven Adapters — persistenza, client esterni): dipende da **Domain** e **Application** (implementa le Ports definite nel Domain).
- **Endpoints** (Driving Adapters — API controllers, Razor pages, gRPC): dipende da **Application** soltanto. NON dipende da Domain direttamente ne' da Infrastructure.

```
Endpoints (Driving Adapter)
    │
    ▼
Application (Use Cases)
    │
    ▼
Domain (Entities, Ports)
    ▲
    │
Infrastructure (Driven Adapter)
```

| Sorgente ↓ / Target → | Domain | Application | Infrastructure | Endpoints |
|---|---|---|---|---|
| Domain | -- | NO | NO | NO |
| Application | SI | -- | NO | NO |
| Infrastructure | SI | SI | -- | NO |
| Endpoints | NO | SI | NO | -- |

> **Nota**: queste regole sono verificate automaticamente da **NetArchTest** architecture tests (D-81).

---

## 4. Comunicazione tra moduli

I moduli business all'interno di un **vertical repo** sono isolati tra loro. Non possono referenziarsi direttamente.

### 4.1 Pattern consentiti

#### Integration Events (raccomandato)

Comunicazione asincrona via eventi in-process. Il framework fornisce un event bus.

```
ModuloA pubblica: UserCreatedEvent
    |
    v
[Event Bus in-process (fornito dal framework)]
    |
    v
ModuloB consuma: UserCreatedEvent -> aggiorna le proprie tabelle
```

- Il publisher non conosce i consumer
- Nessun coupling diretto
- Eventualmente consistente

#### Shared Contracts

Un modulo espone interfacce e DTO in Shared.Contracts. L'altro modulo dipende solo dal contratto.

```
Shared.Contracts/
  └── IModuloAQueryService.cs  (interfaccia)

ModuloA implementa IModuloAQueryService
ModuloB dipende da Shared.Contracts (non da ModuloA)
L'Host registra l'implementazione via DI
```

### 4.2 Pattern vietati

- **Direct reference**: ModuloA -> ModuloB (crea coupling forte)
- **Shared database tables**: i moduli non accedono alle tabelle di altri moduli
- **Cross-module DbContext**: un modulo non usa il DbContext di un altro modulo

---

## 5. Dipendenze vietate -- Riepilogo

Queste dipendenze sono **sempre** vietate.

- Nel **framework repo**: le violazioni vengono rilevate dagli architecture tests.
- Nei **vertical repos**: le regole contro la modifica del framework sono **fisicamente impossibili** perche' il framework e' un pacchetto NuGet compilato. Gli architecture tests nel vertical repo verificano l'isolamento dei moduli (Modules -> altri Modules, Modules -> Hosts, ecc.).

| Dipendenza vietata | Motivazione |
|---|---|
| BuildingBlocks -> Modules | Il framework non dipende dalle app |
| BuildingBlocks -> Hosts | Il framework non dipende dagli host |
| BuildingBlocks -> Workers | Il framework non dipende dai worker |
| Shared.Ui* -> Modules | La UI condivisa non conosce i moduli business |
| Shared -> Hosts | I componenti condivisi non conoscono gli host |
| Modules -> Hosts | I moduli non sanno chi li ospita |
| Modules -> altri Modules | Nessun coupling diretto tra moduli |
| Modules -> Shared.Ui* | I moduli non contengono UI (la UI del modulo sta nell'Host) |
| Workers -> Shared.Ui* | I worker non hanno interfaccia utente |
| Workers -> Hosts | I worker non conoscono gli host |
| ServiceDefaults -> qualsiasi progetto interno | ServiceDefaults e' solo standard tecnico Aspire |

---

## 6. Enforcement: Architecture Tests

Le regole di dipendenza vengono verificate automaticamente con **NetArchTest** in entrambi i repository.

### 6.1 Architecture tests nel framework repo

Verificano la gerarchia interna dei BuildingBlocks, l'isolamento di Shared e ServiceDefaults.

```csharp
// BuildingBlocks non referenzia Shared
Types.InAssembly(buildingBlocksAssembly)
    .ShouldNot()
    .HaveDependencyOn("Seaside.Shared")
    .GetResult()
    .IsSuccessful.Should().BeTrue();

// Shared non referenzia ServiceDefaults
Types.InAssembly(sharedAssembly)
    .ShouldNot()
    .HaveDependencyOn("Seaside.ServiceDefaults")
    .GetResult()
    .IsSuccessful.Should().BeTrue();

// ServiceDefaults non referenzia BuildingBlocks ne' Shared
Types.InAssembly(serviceDefaultsAssembly)
    .ShouldNot()
    .HaveDependencyOn("Seaside.BuildingBlocks")
    .GetResult()
    .IsSuccessful.Should().BeTrue();
```

### 6.2 Architecture tests nel vertical repo

Verificano l'isolamento tra moduli e le regole tra progetti locali. Le regole contro la modifica del framework sono superflue qui perche' BuildingBlocks e Shared sono pacchetti NuGet compilati.

```csharp
// Questi test girano nel progetto di test del vertical repo

// Modules non referenzia Hosts
Types.InAssembly(modulesAssembly)
    .ShouldNot()
    .HaveDependencyOn("MioVerticale.Hosts")
    .GetResult()
    .IsSuccessful.Should().BeTrue();

// Modules non referenzia altri Modules
Types.InNamespace("MioVerticale.Modules.ModuloA")
    .ShouldNot()
    .HaveDependencyOn("MioVerticale.Modules.ModuloB")
    .GetResult()
    .IsSuccessful.Should().BeTrue();

// Workers non referenzia UI (namespace del framework NuGet)
Types.InAssembly(workersAssembly)
    .ShouldNot()
    .HaveDependencyOn("Seaside.Shared.Ui")
    .GetResult()
    .IsSuccessful.Should().BeTrue();
```

### 6.3 Quando eseguire i test

- A ogni build (CI/CD) — sia framework repo sia vertical repo
- Pre-commit (opzionale, per feedback rapido)
- Come gate obbligatorio per merge in branch principale

---

## 7. Gestione delle eccezioni

Se una dipendenza vietata risulta **strettamente necessaria**, deve essere:

1. Documentata in un **ADR** (Architecture Decision Record)
2. Approvata esplicitamente dal committente
3. Aggiunta come eccezione esplicita negli architecture tests con commento motivazionale
4. Rivalutata periodicamente

Non esistono eccezioni "temporanee" non documentate.
