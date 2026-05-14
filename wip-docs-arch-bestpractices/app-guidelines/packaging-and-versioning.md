# Packaging e versioning -- Guida per i team verticali

> Riferimento architetturale: ADB Cap. 8.5, 3.3

---

## 1. Come consumare i pacchetti

### 1.1 Backend (.NET -- NuGet)

Il verticale referenzia i building block come pacchetti NuGet dal feed privato:

```xml
<!-- Directory.Packages.props del verticale -->
<ItemGroup>
  <PackageVersion Include="Seaside.BuildingBlocks.Abstractions" Version="1.0.0" />
  <PackageVersion Include="Seaside.BuildingBlocks.Domain" Version="1.0.0" />
  <PackageVersion Include="Seaside.BuildingBlocks.Application" Version="1.0.0" />
  <PackageVersion Include="Seaside.BuildingBlocks.Infrastructure" Version="1.0.0" />
  <PackageVersion Include="Seaside.BuildingBlocks.Security" Version="1.0.0" />
  <PackageVersion Include="Seaside.Shared.Contracts" Version="1.0.0" />
  <!-- ... altri BB necessari -->
</ItemGroup>
```

Nei `.csproj` dei moduli:

```xml
<!-- Senza attributo Version (Central Package Management) -->
<PackageReference Include="Seaside.BuildingBlocks.Domain" />
<PackageReference Include="Seaside.BuildingBlocks.Application" />
```

**Regole**:
- Usare **Central Package Management** (`Directory.Packages.props`) per tutte le versioni
- Nessun attributo `Version` nei `.csproj`
- Tutti i pacchetti Seaside alla **stessa versione** (versione unificata del framework)

### 1.2 Frontend (npm)

```json
{
  "dependencies": {
    "@seaside/shell": "^1.0.0",
    "@seaside/components": "^1.0.0",
    "@seaside/theming": "^1.0.0",
    "@seaside/testing": "^1.0.0"
  }
}
```

**Regole**:
- Usare il prefisso `^` (compatibile con minor updates)
- Tutti i pacchetti `@seaside/*` alla **stessa versione** (versione unificata del framework)

---

## 2. Quali pacchetti servono

### 2.1 Backend -- pacchetti per caso d'uso

| Caso d'uso | Pacchetti necessari |
|---|---|
| Modulo business base | `Abstractions`, `Domain`, `Application`, `Infrastructure` |
| + Autenticazione/autorizzazione | + `Security` |
| + Audit trail | + `Audit` |
| + Messaging/eventi | + `Messaging` |
| + Entita' gerarchiche | + `HierarchicalEntities` |
| + Macchina a stati | + `StateMachine` |
| + Workspace scoping | + `Workspace` |
| + Background jobs | + `BackgroundJobs` |
| + Form dinamiche | + `DynamicForms` |
| + Configurazione | + `Configuration` |
| + File upload/storage | + `FileStorage` |

Ogni pacchetto e' indipendente. Prendi solo cio' che serve.

**Alternativa: meta-pacchetto** `Seaside.BuildingBlocks.All` — un singolo `PackageReference` che include tutti i building block come dipendenze transitive. Utile per verticali che usano molti BB e preferiscono un setup semplificato.

### 2.2 Frontend -- pacchetti

| Pacchetto | Contenuto | Sempre necessario? |
|---|---|---|
| `@seaside/shell` | Layout, navigation, session handling, breadcrumb | Si |
| `@seaside/components` | Componenti UI (data grid, form, dialog, etc.) | Si |
| `@seaside/theming` | Design tokens, temi, mixins | Si |
| `@seaside/testing` | Utility per test (expectAccessible, mock helpers) | Si (devDependency) |

---

## 3. Aggiornamento dei pacchetti

### 3.1 Versioning del framework

Il framework usa **independent versioning con versione unificata**: i pacchetti risiedono in un monorepo e condividono lo stesso numero di versione, ma solo i pacchetti effettivamente modificati vengono pubblicati ad ogni release.

Formato: `Major.Minor.Patch` (semantic versioning).

| Tipo di release | Cosa cambia | Azione richiesta dal verticale |
|---|---|---|
| **Patch** (1.0.x) | Bug fix, performance | Aggiornare i pacchetti modificati senza modifiche al codice |
| **Minor** (1.x.0) | Nuove feature, deprecation notices | Aggiornare, verificare deprecation |
| **Major** (x.0.0) | Breaking changes | Seguire la migration guide, aggiornare codice |

> **Nota**: non tutti i pacchetti vengono rilasciati ad ogni release. Controllare il changelog per sapere quali pacchetti hanno ricevuto modifiche.

### 3.2 Come aggiornare

1. Aggiornare le versioni in `Directory.Packages.props` (backend) e `package.json` (frontend)
2. `dotnet restore` + `npm install`
3. `dotnet build` -- verificare warning di deprecation
4. `dotnet test` -- verificare che i test passino
5. `npm run build` + `npm run test`
6. Se major: seguire la migration guide del changelog

### 3.3 Policy di aggiornamento

- **Patch**: aggiornare entro 1 settimana
- **Minor**: aggiornare entro 1 sprint
- **Major**: pianificare l'aggiornamento, seguire la migration guide

---

## 4. Deprecation

Quando il framework depreca una API:

1. Viene segnata con `[Obsolete("Usa X invece. Rimossa in vM.0")]` (.NET) o `@deprecated` JSDoc (TypeScript)
2. La build produce un **warning** (non errore) per l'intero periodo di deprecation (**1 anno**)
3. La vecchia API delega internamente alla nuova — funziona, ma genera warning
4. Nella major successiva (dopo >= 1 anno), la API viene rimossa. La migration guide e' nel changelog della major

**Supporto versioni**: il framework supporta fino a **N-3**. I verticali hanno 3 major version per completare la migrazione.

Il verticale deve:
- Monitorare i warning di deprecation nella build (compilatore C# + ESLint `deprecation/deprecation`)
- Pianificare la migrazione prima della rimozione (controllare il changelog per la versione target)
- Non ignorare i warning: dopo 3 major, l'API viene rimossa

---

## 5. Feed NuGet/npm privato

I pacchetti del framework sono pubblicati su un feed privato (Azure Artifacts o equivalente).

### 5.1 Configurazione NuGet

```xml
<!-- nuget.config nella root del verticale -->
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
    <add key="seaside" value="https://pkgs.dev.azure.com/{org}/_packaging/seaside/nuget/v3/index.json" />
  </packageSources>
</configuration>
```

### 5.2 Configurazione npm

```
# .npmrc nella root del verticale
@seaside:registry=https://pkgs.dev.azure.com/{org}/_packaging/seaside/npm/registry/
```

---

## 6. Checklist per aggiornamento

- [ ] Tutti i pacchetti `Seaside.*` alla stessa versione
- [ ] Tutti i pacchetti `@seaside/*` alla stessa versione
- [ ] Build senza errori dopo aggiornamento
- [ ] Test verdi dopo aggiornamento
- [ ] Warning di deprecation annotati e pianificati
- [ ] Changelog del framework letto per breaking changes
