# Seaside Starter Kit -- Design Document

> Documento di design per lo starter kit del framework Seaside.
> Lo starter kit e' il punto di partenza per ogni nuovo prodotto verticale.
> Riferimenti: Architecture Decision Book Cap. 8.4, Cap. 10, Cap. 11.

## 1. Obiettivo

Fornire un **template repo completo e funzionante** da cui ogni nuovo prodotto verticale parte. Il verticale clona il template, rinomina i placeholder, e ha immediatamente:

- Backend .NET con Aspire, Host, modulo di esempio, architettura esagonale
- Frontend Angular con shell, theming, auth, pagina di esempio
- CI/CD base, test scaffold, architecture tests
- Tutto gia' wired con i pacchetti framework (NuGet + npm)

Il team verticale scrive **solo logica di business** dal giorno 1. Zero setup infrastrutturale.

---

## 2. Cosa contiene lo starter kit

### 2.1 Struttura completa del template repo

```
seaside-vertical-template/
│
├── src/
│   ├── AppHost/                                 # Aspire AppHost
│   │   ├── AppHost.csproj
│   │   └── Program.cs                          # Orchestra Host, DB, broker, risorse
│   │
│   ├── Hosts/
│   │   └── MyApp.Web/                          # Host web (BFF + API)
│   │       ├── MyApp.Web.csproj
│   │       ├── Program.cs                      # Registra moduli, shell, auth, middleware
│   │       ├── appsettings.json
│   │       └── appsettings.Development.json
│   │
│   ├── Modules/
│   │   └── SampleModule/                       # Modulo di esempio (da rinominare o eliminare)
│   │       ├── SampleModule.csproj
│   │       ├── Domain/
│   │       │   ├── Entities/
│   │       │   │   └── SampleEntity.cs         # Aggregate Root di esempio
│   │       │   ├── ValueObjects/
│   │       │   │   └── SampleValueObject.cs
│   │       │   ├── Events/
│   │       │   │   └── SampleCreatedEvent.cs   # Domain Event di esempio
│   │       │   ├── Errors/
│   │       │   │   └── SampleErrors.cs
│   │       │   └── Abstractions/
│   │       │       └── ISampleRepository.cs    # Port (D-34)
│   │       │
│   │       ├── Application/
│   │       │   ├── CreateSample/
│   │       │   │   ├── CreateSampleCommand.cs
│   │       │   │   ├── CreateSampleHandler.cs  # Handler CQRS di esempio
│   │       │   │   └── CreateSampleValidator.cs
│   │       │   ├── GetSample/
│   │       │   │   ├── GetSampleQuery.cs
│   │       │   │   ├── GetSampleHandler.cs
│   │       │   │   └── GetSampleResponse.cs
│   │       │   └── EventHandlers/
│   │       │       └── SampleCreatedEventHandler.cs
│   │       │
│   │       ├── Infrastructure/
│   │       │   ├── SampleDbContext.cs           # DbContext isolato (D-32)
│   │       │   ├── SampleRepository.cs          # Driven Adapter (D-34)
│   │       │   ├── Configurations/
│   │       │   │   └── SampleEntityConfiguration.cs
│   │       │   └── Migrations/                  # EF Migrations (D-33)
│   │       │
│   │       ├── Endpoints/
│   │       │   └── SampleEndpoints.cs           # Minimal API (driving adapter)
│   │       │
│   │       └── DependencyInjection.cs           # Wiring Ports -> Adapters
│   │
│   ├── Contracts/                               # Shared contracts tra moduli
│   │   └── SampleModule/
│   │       └── SampleCreatedIntegrationEvent.cs # Integration Event DTO (D-57)
│   │
│   ├── Workers/                                 # (vuoto, pronto per worker)
│   │   └── .gitkeep
│   │
│   └── Frontend/                                # Angular workspace
│       ├── angular.json                         # Pre-configurato con convenzioni framework
│       ├── package.json                         # Referenzia @seaside/shell, components, theming
│       ├── tsconfig.json
│       ├── .eslintrc.json                       # Regole lint framework (incluse a11y)
│       │
│       └── src/
│           ├── main.ts                          # Bootstrap Angular con shell
│           ├── app/
│           │   ├── app.config.ts                # Configurazione app: auth, routing, shell
│           │   ├── app.routes.ts                # Routing base con lazy loading
│           │   ├── app.component.ts             # Root component con <seaside-shell>
│           │   │
│           │   ├── core/                        # Servizi singleton dell'app
│           │   │   ├── auth/
│           │   │   │   └── auth.config.ts       # Configurazione auth provider (D-41)
│           │   │   ├── navigation/
│           │   │   │   └── nav-items.ts         # Voci menu per la shell
│           │   │   └── api/
│           │   │       └── api.config.ts        # Base URL, interceptor HTTP
│           │   │
│           │   ├── features/                    # Feature modules (pagine di dominio)
│           │   │   └── sample/                  # Feature di esempio (da rinominare o eliminare)
│           │   │       ├── sample.routes.ts
│           │   │       ├── pages/
│           │   │       │   ├── sample-list/
│           │   │       │   │   ├── sample-list.component.ts
│           │   │       │   │   └── sample-list.component.html
│           │   │       │   └── sample-detail/
│           │   │       │       ├── sample-detail.component.ts
│           │   │       │       └── sample-detail.component.html
│           │   │       └── services/
│           │   │           └── sample.service.ts    # Chiama API backend
│           │   │
│           │   └── shared/                      # Componenti locali dell'app (non framework)
│           │       └── .gitkeep
│           │
│           ├── themes/
│           │   └── app-theme.scss               # Override colori brand (D-12)
│           │
│           ├── environments/
│           │   ├── environment.ts
│           │   └── environment.development.ts
│           │
│           └── assets/
│               ├── logo.svg                     # Logo placeholder dell'app
│               └── favicon.ico
│
├── tests/
│   ├── UnitTests/
│   │   └── SampleModule.Tests/
│   │       ├── SampleModule.Tests.csproj
│   │       ├── Domain/
│   │       │   └── SampleEntityTests.cs         # Test dominio in isolamento
│   │       └── Application/
│   │           └── CreateSampleHandlerTests.cs  # Test handler con mock repository
│   │
│   ├── IntegrationTests/
│   │   └── SampleModule.IntegrationTests/
│   │       ├── SampleModule.IntegrationTests.csproj
│   │       └── SampleEndpointsTests.cs          # Test E2E con Testcontainers
│   │
│   └── ArchitectureTests/
│       ├── ArchitectureTests.csproj
│       └── HexagonalRulesTests.cs               # Regole esagonali D-23 (auto-discover moduli)
│
├── Directory.Build.props                        # Proprieta' condivise .NET
├── Directory.Packages.props                     # Central Package Management (D-03)
├── nuget.config                                 # Feed privato Seaside
├── global.json                                  # SDK version pin
├── .editorconfig                                # Stile codice (dal framework)
├── .gitignore
├── docker-compose.yml                           # (opzionale) per chi non usa Aspire CLI
├── MyApp.sln                                    # Solution pre-configurata
├── README.md                                    # Istruzioni setup e personalizzazione
└── RENAME_GUIDE.md                              # Guida per rinominare i placeholder
```

### 2.2 Cosa e' gia' wired e funzionante

Al primo `dotnet run` (AppHost) + `ng serve` (Frontend), il verticale ha:

| Funzionalita' | Stato | Dettaglio |
|---|---|---|
| **Aspire dashboard** | Funzionante | Mostra Host, DB, tutti i servizi |
| **SQL Server locale** | Funzionante | Container creato da Aspire, migration applicata |
| **Host API** | Funzionante | Swagger/OpenAPI disponibile, health check attivo |
| **Modulo di esempio** | Funzionante | CRUD completo: crea, legge, lista SampleEntity |
| **Architecture tests** | Funzionanti | Verificano regole esagonali sul modulo di esempio |
| **Shell Angular** | Funzionante | Layout con sidebar, header, navigation |
| **Theming** | Funzionante | Token framework applicati, placeholder per colori brand |
| **Auth** | Pre-configurato | Provider configurabile, login/logout flow, guard sulle route |
| **Pagina di esempio** | Funzionante | Lista + dettaglio di SampleEntity, usa componenti framework |
| **API client** | Funzionante | Service Angular che chiama gli endpoint del modulo di esempio |
| **Custom mediator pipeline (D-21)** | Funzionante | Validation, logging, error handling gia' attivi |
| **Outbox** | Pre-configurato | Tabella outbox nel DB, relay configurato per Azure SB (D-59) |
| **Unit tests** | Funzionanti | Test dominio e handler del modulo di esempio |
| **Integration tests** | Funzionanti | Test endpoint con Testcontainers |
| **Lint + a11y** | Configurati | ESLint Angular con regole a11y del framework |

---

## 3. Dettaglio componenti

### 3.1 AppHost (Aspire)

```csharp
// src/AppHost/Program.cs
var builder = DistributedApplication.CreateBuilder(args);

// Database
IResourceBuilder<IResourceWithConnectionString> db;
if (builder.ExecutionContext.IsPublishMode)
{
    db = builder.AddConnectionString("appdb");
}
else
{
    db = builder.AddSqlServer("sql")
                .AddDatabase("appdb");
}

// Message broker (D-58)
IResourceBuilder<IResourceWithConnectionString> messaging;
if (builder.ExecutionContext.IsPublishMode)
{
    messaging = builder.AddConnectionString("messaging");
}
else
{
    // Dev: Azure Service Bus emulator o istanza di sviluppo
    messaging = builder.AddAzureServiceBus("messaging");
}

// Host web
var web = builder.AddProject<Projects.MyApp_Web>("web")
    .WithReference(db)
    .WithReference(messaging);

builder.Build().Run();
```

### 3.2 Host (Program.cs)

```csharp
// src/Hosts/MyApp.Web/Program.cs
var builder = WebApplication.CreateBuilder(args);

// Framework standard
builder.AddServiceDefaults();

// Messaging (D-58) -- astrazione, non sa quale broker c'e' sotto
builder.AddAzureServiceBusMessaging(); // o AddNatsMessaging() via config

// Moduli business
builder.AddSampleModule();
// builder.AddAltroModulo(); // aggiungere qui i propri moduli

var app = builder.Build();

// Pipeline
app.UseServiceDefaults();
app.UseAuthentication();
app.UseAuthorization();

// Endpoint registration
app.MapSampleModuleEndpoints();
// app.MapAltroModuloEndpoints();

app.Run();
```

### 3.3 Modulo di esempio -- pattern completo

Il modulo di esempio dimostra **tutti** i pattern architetturali decisi:

| Pattern | Dove nel modulo | Decisione |
|---|---|---|
| Hexagonal / Ports & Adapters | Struttura cartelle Domain/Application/Infrastructure/Endpoints | D-23 |
| Aggregate Root + Entity | `Domain/Entities/SampleEntity.cs` | D-20 |
| Repository come Port | `Domain/Abstractions/ISampleRepository.cs` → `Infrastructure/SampleRepository.cs` | D-34 |
| CQRS (Command + Query separati) | `Application/CreateSample/` (command) + `Application/GetSample/` (query) | D-35 |
| Domain Events | `Domain/Events/SampleCreatedEvent.cs` → `Application/EventHandlers/` | Cap. 5.7.5 |
| Integration Events + Outbox | `Contracts/SampleModule/SampleCreatedIntegrationEvent.cs` | D-57, D-59 |
| DbContext isolato per modulo | `Infrastructure/SampleDbContext.cs` | D-32 |
| EF Migrations per modulo | `Infrastructure/Migrations/` | D-33 |
| Minimal API endpoints | `Endpoints/SampleEndpoints.cs` | D-20 |
| Validation via pipeline | `Application/CreateSample/CreateSampleValidator.cs` | Cap. 5.3 |

### 3.4 Frontend Angular -- dettaglio

#### app.component.ts (root)

```typescript
// Usa la shell del framework come layout root
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SeasideShellComponent, RouterOutlet],
  template: `
    <seaside-shell
      [navItems]="navItems"
      [appTitle]="'MyApp'"
      [logoSrc]="'assets/logo.svg'">
      <router-outlet />
    </seaside-shell>
  `
})
export class AppComponent {
  navItems = NAV_ITEMS; // importati da core/navigation/nav-items.ts
}
```

#### nav-items.ts

```typescript
import { SeasideNavItem } from '@seaside/shell';

export const NAV_ITEMS: SeasideNavItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/dashboard',
  },
  {
    label: 'Samples',
    icon: 'list',
    route: '/samples',
  },
  // Aggiungere qui le voci menu del proprio verticale
];
```

#### app.routes.ts

```typescript
export const routes: Routes = [
  {
    path: 'samples',
    loadChildren: () => import('./features/sample/sample.routes')
      .then(m => m.SAMPLE_ROUTES),
    canActivate: [authGuard], // Guard dal framework
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
```

#### app-theme.scss

```scss
// Personalizzazione colori brand del verticale (D-12)
@use '@seaside/theming/tokens/theme-contract';

:root {
  // Sostituire con i colori del proprio brand
  --seaside-color-primary: #2E7BAF;
  --seaside-color-accent: #AF7B2E;
  --seaside-color-primary-contrast: #FFFFFF;

  // Densita' (compact | default | comfortable)
  --seaside-density: default;
}
```

#### Feature di esempio (sample-list)

```typescript
@Component({
  selector: 'app-sample-list',
  standalone: true,
  imports: [SeasideDataGridComponent, SeasideButtonComponent],
  template: `
    <seaside-data-grid
      [data]="samples()"
      [columns]="columns"
      [loading]="loading()"
      (rowClick)="onRowClick($event)">
    </seaside-data-grid>
    <seaside-button label="Nuovo" (click)="onCreate()" />
  `
})
export class SampleListComponent {
  private sampleService = inject(SampleService);

  samples = signal<SampleResponse[]>([]);
  loading = signal(true);
  columns = [
    { field: 'name', header: 'Nome' },
    { field: 'createdAt', header: 'Data creazione', type: 'date' },
  ];

  constructor() {
    this.sampleService.getAll().subscribe(data => {
      this.samples.set(data);
      this.loading.set(false);
    });
  }
}
```

---

## 4. Architecture Tests pre-configurati

Il template include architecture tests che verificano le regole esagonali (D-23, D-81) **su tutti i moduli** presenti nella solution, senza doverli scrivere per ciascuno:

```csharp
// tests/ArchitectureTests/HexagonalRulesTests.cs
public class HexagonalRulesTests
{
    // Scopre automaticamente tutti i moduli nella solution
    // basandosi sulla convenzione: namespace che contiene .Domain, .Application, etc.
    private static IEnumerable<string> DiscoverModuleNamespaces()
    {
        // Scansiona gli assembly per trovare i namespace dei moduli
        // Es: "MyApp.Modules.SampleModule", "MyApp.Modules.Orders", etc.
    }

    [Theory]
    [MemberData(nameof(GetModules))]
    public void Domain_Should_Not_Depend_On_Application(string moduleNamespace)
    {
        Types.InNamespace($"{moduleNamespace}.Domain")
            .ShouldNot()
            .HaveDependencyOn($"{moduleNamespace}.Application")
            .GetResult()
            .IsSuccessful.Should().BeTrue();
    }

    [Theory]
    [MemberData(nameof(GetModules))]
    public void Domain_Should_Not_Depend_On_Infrastructure(string moduleNamespace)
    {
        Types.InNamespace($"{moduleNamespace}.Domain")
            .ShouldNot()
            .HaveDependencyOn($"{moduleNamespace}.Infrastructure")
            .GetResult()
            .IsSuccessful.Should().BeTrue();
    }

    [Theory]
    [MemberData(nameof(GetModules))]
    public void Application_Should_Not_Depend_On_Infrastructure(string moduleNamespace)
    {
        Types.InNamespace($"{moduleNamespace}.Application")
            .ShouldNot()
            .HaveDependencyOn($"{moduleNamespace}.Infrastructure")
            .GetResult()
            .IsSuccessful.Should().BeTrue();
    }

    [Theory]
    [MemberData(nameof(GetModules))]
    public void Endpoints_Should_Not_Depend_On_Infrastructure(string moduleNamespace)
    {
        Types.InNamespace($"{moduleNamespace}.Endpoints")
            .ShouldNot()
            .HaveDependencyOn($"{moduleNamespace}.Infrastructure")
            .GetResult()
            .IsSuccessful.Should().BeTrue();
    }
}
```

---

## 5. Come si usa il template

### 5.1 Setup iniziale di un nuovo verticale

```bash
# 1. Clona il template
git clone https://github.com/[org]/seaside-vertical-template.git MyNewApp
cd MyNewApp
rm -rf .git
git init

# 2. Rinomina i placeholder (seguire RENAME_GUIDE.md)
#    - "MyApp" → nome del prodotto
#    - "SampleModule" → nome del primo modulo reale (o eliminare)
#    - Aggiornare solution name, namespace, titolo app, colori tema

# 3. Verifica che tutto funzioni
dotnet restore
dotnet build
dotnet test

# 4. Avvia
dotnet run --project src/AppHost
cd src/Frontend && npm install && ng serve

# 5. Apri il browser
#    - Aspire dashboard: https://localhost:18888
#    - App frontend: http://localhost:4200
#    - Swagger API: https://localhost:7001/swagger
```

### 5.2 Aggiungere un nuovo modulo business

```bash
# Il framework fornira' un dotnet template per scaffoldare un nuovo modulo:
dotnet new seaside-module -n Orders -o src/Modules/Orders

# Genera:
# src/Modules/Orders/
#   ├── Orders.csproj
#   ├── Domain/ (vuoto con cartelle)
#   ├── Application/ (vuoto con cartelle)
#   ├── Infrastructure/ (DbContext base)
#   ├── Endpoints/ (vuoto)
#   └── DependencyInjection.cs (wiring base)

# Poi registrare nel Host:
# builder.AddOrders();
# app.MapOrdersEndpoints();
```

### 5.3 Aggiungere una feature frontend

```bash
# Genera una nuova feature Angular
ng generate component features/orders/pages/order-list --standalone

# Aggiungere la route in app.routes.ts
# Aggiungere la voce menu in nav-items.ts
```

---

## 6. dotnet new templates forniti dal framework

Il framework pubblica template `dotnet new` per scaffolding rapido:

| Template | Comando | Cosa genera |
|---|---|---|
| **Vertical repo** | `dotnet new seaside-vertical -n MyApp` | Intero repo verticale (equivalente al clone del template) |
| **Modulo business** | `dotnet new seaside-module -n Orders` | Modulo con struttura esagonale completa |
| **Worker** | `dotnet new seaside-worker -n Notifications` | Worker Service con Aspire integration |
| **Integration Event** | `dotnet new seaside-event -n OrderCreated` | DTO evento + handler skeleton |

I template sono distribuiti come NuGet package: `Seaside.Templates`.

```bash
# Installare i template
dotnet new install Seaside.Templates

# Usare
dotnet new seaside-vertical -n MioProdotto
dotnet new seaside-module -n Ordini -o src/Modules/Ordini
```

---

## 7. RENAME_GUIDE.md (contenuto)

Guida per personalizzare il template dopo il clone:

| Placeholder | Sostituire con | File coinvolti |
|---|---|---|
| `MyApp` | Nome del prodotto (es. `GestioneOrdini`) | .sln, .csproj, Program.cs, angular.json, package.json, appsettings |
| `SampleModule` | Nome del primo modulo reale, oppure eliminare la cartella | Tutto sotto Modules/SampleModule/, Contracts/SampleModule/, tests/ |
| `SampleEntity` | Nome della prima entita' reale | File nel modulo di esempio |
| `--seaside-color-primary: #2E7BAF` | Colore primary del brand | Frontend/src/themes/app-theme.scss |
| `--seaside-color-accent: #AF7B2E` | Colore accent del brand | Frontend/src/themes/app-theme.scss |
| `assets/logo.svg` | Logo del prodotto | Frontend/src/assets/ |
| `'MyApp'` (appTitle) | Titolo dell'app nella shell | app.component.ts |

---

## 8. Manutenzione del template

Il template repo e' mantenuto dal **team framework**:

- Quando un building block evolve, il template viene aggiornato
- Il template referenzia sempre l'ultima versione stabile dei pacchetti Seaside
- Le convenzioni (.editorconfig, lint rules, architecture tests) sono sincronizzate con il framework
- Il template ha la propria CI che verifica che compili e i test passino con l'ultima versione dei pacchetti

I verticali gia' creati **non** vengono aggiornati automaticamente dal template. L'aggiornamento avviene alzando la versione dei pacchetti Seaside nel `Directory.Packages.props` del verticale. Le breaking changes sono documentate nel changelog del framework.

---

## 9. Relazione con le decisioni architetturali

| Decisione | Come si riflette nello starter kit |
|---|---|
| D-01 (.NET 10) | global.json pinna la versione SDK |
| D-02 (Aspire) | AppHost pre-configurato con DB e broker |
| D-03 (Central Package Mgmt) | Directory.Packages.props con tutti i Seaside.* |
| D-10 (Angular 21+) | angular.json e package.json pre-configurati |
| D-12 (Theming) | app-theme.scss con token placeholder |
| D-20 (Vertical Slices + Mediator) | Modulo di esempio con handler CQRS |
| D-23 (Hexagonal) | Struttura cartelle Domain/Application/Infrastructure/Endpoints |
| D-32 (DbContext per modulo) | SampleDbContext isolato |
| D-33 (EF Migrations) | Cartella Migrations/ nel modulo |
| D-34 (Repository pattern) | ISampleRepository → SampleRepository |
| D-35 (CQRS) | Command e Query separati nel modulo di esempio |
| D-56 (Eventual consistency) | Integration event di esempio con outbox |
| D-57 (Async communication) | Contracts/ con DTO evento, handler di esempio |
| D-58 (Azure SB + NATS) | AppHost con broker, Host con AddMessaging() |
| D-59 (Outbox/Inbox) | Tabella outbox nella migration del modulo |
| D-81 (Architecture tests) | HexagonalRulesTests.cs con auto-discovery |
| D-11 (ng-zorro + Syncfusion) | Componenti frontend usano wrapper @seaside/* che astraggono ng-zorro e Syncfusion |
| D-21 (Custom Mediator) | Pipeline mediator custom in BuildingBlocks.Application, usato dagli handler |
| D-41 (JWT Bearer + multi-scheme) | Auth pre-configurato con JWT Bearer e supporto multi-provider |
| D-42 (Permission-based + Workspace) | Guard e middleware permission-based; workspace opt-in via building block |
| D-43 (Users/Roles framework) | Entita' Users e Roles gestite dal framework, consumate dai verticali |
| D-52 (Root namespace Seaside) | Tutti i pacchetti usano namespace Seaside.* |
| D-61 (Un .csproj per BB) | Ogni building block e' un pacchetto NuGet separato |
| D-70 (BackgroundService) | Worker template usa BackgroundService standard |
