# Aspire: Deployment su Azure Container Apps con Azure SQL esterno

## Panoramica

Ogni vertical repo produce **piu' Docker image** (frontend, API, worker). Tutte vengono deployate in un unico **Azure Container Apps (ACA) Environment**. Il database e' un **Azure SQL Database esterno**, mai containerizzato. L'AppHost Aspire descrive l'intera topologia in un unico punto.

---

## Come funziona Aspire nei due ambienti

| Contesto | Ruolo dell'AppHost |
|---|---|
| **Development** (`dotnet run`) | Orchestratore locale: avvia processi .NET, container Docker (SQL Server locale), frontend Angular. Inietta connection string e porte automaticamente |
| **Production** (`--publisher manifest`) | Generatore di manifest: produce `aspire-manifest.json` che descrive la topologia. `azd` lo consuma per creare l'infrastruttura ACA |

L'AppHost **non gira mai in produzione**. E' uno strumento di build e sviluppo.

---

## Topologia di deployment

```
Container Apps Environment (gestito da IT)
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │   frontend   │   │     api      │   │   scheduler     │  │
│  │   (nginx +   │   │  (ASP.NET    │   │  (Background    │  │
│  │   Angular)   │   │   Core)      │   │   Service)      │  │
│  │              │   │              │   │                 │  │
│  │  ingress:    │   │  ingress:    │   │  ingress: no    │  │
│  │  external    │   │  internal    │   │  (no HTTP)      │  │
│  └──────┬───────┘   └──────┬───────┘   └────────┬────────┘  │
│         │                  │                    │            │
│         │    ┌─────────────▼────────────────────▼──┐        │
│         │    │       service discovery (Aspire)     │        │
│         │    └─────────────────────────────────────┘        │
│         │                                                    │
└─────────│────────────────────────────────────────────────────┘
          │
          │  HTTPS (API calls)
          │
┌─────────▼────────────────────────────────────────────────────┐
│                Azure SQL Database                            │
│  (istanza gestita da IT, esterna ai container)               │
│  connection string via Azure Key Vault / env var             │
└──────────────────────────────────────────────────────────────┘
```

**Nota**: il frontend Angular chiama l'API tramite il service discovery interno di ACA. L'API e i worker accedono ad Azure SQL Database tramite connection string iniettata dall'ambiente.

---

## AppHost: un unico punto per tutta la topologia

```csharp
// AppHost.cs del vertical repo
IResourceBuilder<IResourceWithConnectionString> sql;

if (builder.ExecutionContext.IsPublishMode)
{
    // Produzione: Azure SQL Database esterno
    // La connection string arriva da Key Vault / env var
    sql = builder.AddConnectionString("appdb");
}
else
{
    // Development: container SQL Server locale gestito da Aspire
    sql = builder.AddSqlServer("sql")
                 .AddDatabase("appdb");
}

var api = builder.AddProject<Projects.NomeProdotto_Api>("api")
    .WithReference(sql)
    .WaitFor(sql);

var scheduler = builder.AddProject<Projects.NomeProdotto_Scheduler>("scheduler")
    .WithReference(sql)
    .WaitFor(sql);

builder.AddNpmApp("frontend", "../Frontend")
    .WithReference(api)
    .WithHttpEndpoint(env: "PORT");
```

`AddConnectionString("appdb")` in publish mode dice ad Aspire: "questa risorsa esiste gia', la connection string arriva dall'esterno". Il manifest generato indica che il deploy deve configurare `ConnectionStrings:appdb` senza creare alcuna risorsa database.

---

## Generazione manifest e deploy

### 1. Generare il manifest

```bash
dotnet run --project AppHost \
  --publisher manifest \
  --output-path ./aspire-manifest.json
```

Il manifest descrive:
- Quali progetti/container esistono
- Le dipendenze tra di essi (chi parla con chi)
- Quali risorse esterne servono (connection string del database)
- Le porte e gli endpoint

### 2. Deploy con `azd` (Azure Developer CLI)

```bash
azd init
azd up
```

`azd` legge il manifest e:
- Crea il Container Apps Environment (se non esiste)
- Crea un Container App per ogni servizio (frontend, api, scheduler)
- Configura il service discovery tra i container
- Chiede le connection string per le risorse esterne (database)
- Configura le environment variable per ogni container

### 3. Alternative a `azd`

| Tool | Target | Note |
|---|---|---|
| `azd` | Azure Container Apps | Integrazione nativa con Aspire, raccomandato |
| [Aspirate](https://github.com/prom3theu5/aspirational-manifests) | Docker Compose / Kubernetes generico | Per ambienti non-Azure |
| Aspire Manifest -> Helm | Kubernetes qualsiasi | Per chi usa Helm charts |

---

## Puntare a Azure SQL Database esterno

### Il meccanismo di base

Aspire inietta le connection string come configuration key. Il codice applicativo legge sempre `ConnectionStrings:appdb` e non sa da dove viene il valore.

### In development (container locale)

Aspire crea un container SQL Server e inietta automaticamente:

```
ConnectionStrings:appdb = Server=127.0.0.1,PORT;Database=appdb;User Id=sa;Password=...
```

### In produzione (Azure SQL Database)

IT configura la connection string tramite uno di questi meccanismi:

**Opzione A -- Azure Key Vault (raccomandata):**

Il Container App e' configurato per leggere i secret da Key Vault. IT inserisce la connection string nel vault:

```
Secret name:  ConnectionStrings--appdb
Secret value: Server=prod-sql.database.windows.net;Database=AppDb;...
```

ACA mappa automaticamente il secret nell'environment variable `ConnectionStrings__appdb`.

**Opzione B -- Environment variable diretta:**

IT configura l'environment variable nel Container App:

```
ConnectionStrings__appdb=Server=prod-sql.database.windows.net;Database=AppDb;...
```

**Opzione C -- Managed Identity (consigliata per sicurezza):**

Il Container App usa una Managed Identity per autenticarsi ad Azure SQL Database senza password:

```
ConnectionStrings__appdb=Server=prod-sql.database.windows.net;Database=AppDb;Authentication=Active Directory Managed Identity
```

In tutti i casi il codice applicativo resta identico:

```csharp
builder.Services.AddDbContext<MyModuleDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("appdb")));
```

### Override per debug su ambiente esterno

Lo sviluppatore che vuole fare debug puntando a un database non locale:

1. **Variabile d'ambiente** (raccomandato): impostare `ConnectionStrings__appdb=Server=staging-sql.company.com;...` nel proprio ambiente di esecuzione
2. **User secrets** (`dotnet user-secrets`): per evitare di esporre connection string nei file versionati

---

## Riepilogo del pattern architetturale

```
┌───────────────────────────────────────────────────────────────┐
│                        AppHost.cs                             │
│                                                               │
│  Development:                                                 │
│    AddSqlServer("sql").AddDatabase("appdb") → container Docker│
│    AddProject("api") + AddProject("scheduler")               │
│    AddNpmApp("frontend") → dev server Angular                │
│                                                               │
│  Production (publish mode):                                   │
│    AddConnectionString("appdb") → Azure SQL esterno           │
│    AddProject("api") + AddProject("scheduler") → Docker image│
│    AddNpmApp("frontend") → Docker image (nginx)              │
│                                                               │
│  In entrambi i casi inietta: ConnectionStrings:appdb          │
└──────────────────────────────┬────────────────────────────────┘
                               │  manifest / orchestrazione
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  Container Apps Environment                                  │
│  ┌──────────┐  ┌─────┐  ┌───────────┐                       │
│  │ frontend │  │ api │  │ scheduler │  ← Docker image       │
│  └────┬─────┘  └──┬──┘  └─────┬─────┘                       │
│       │           │           │                              │
│       │     ConnectionStrings:appdb                          │
│       │           │           │                              │
└───────│───────────│───────────│──────────────────────────────┘
        │           │           │
        │     ┌─────▼───────────▼──────┐
        │     │  Azure SQL Database    │
        │     │  (gestito da IT)       │
        │     └────────────────────────┘
        │
   HTTPS (utenti)
```

---

## Regole vincolanti

- **MAI** containerizzare il database in produzione: Azure SQL Database e' sempre esterno
- **MAI** connection string in file versionati (`appsettings.json`, `appsettings.Development.json`)
- **MAI** credenziali o secret committati nel repo
- L'**AppHost** e' l'unico punto che conosce la topologia infrastrutturale (branch dev/publish)
- I moduli business e gli Host ricevono la connection string tramite configuration injection standard .NET
- IT configura la connection string tramite Key Vault, env var, o Managed Identity

---

## Fonti

- [Aspire deployment overview](https://learn.microsoft.com/en-us/dotnet/aspire/deployment/overview)
- [External parameters and connection strings](https://learn.microsoft.com/en-us/dotnet/aspire/fundamentals/external-parameters)
- [Azure Container Apps deployment with azd](https://learn.microsoft.com/en-us/dotnet/aspire/deployment/azure/aca-deployment)
- [Azure Container Apps overview](https://learn.microsoft.com/en-us/azure/container-apps/overview)
