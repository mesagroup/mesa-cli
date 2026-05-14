# Seaside -- Review Critico Architetturale

> Data creazione: 2026-03-12
> Ultimo aggiornamento: 2026-03-12
> Scopo: checklist di anomalie, incoerenze, rischi e gap ancora aperti.
> In fondo: log delle decisioni gia' risolte.

---

## 1. SICUREZZA

- [x] **Outbox e dati sensibili**: ~~encryption payload~~ — il committente ha deciso di non cifrare i payload outbox. Resta da definire: scadenza/pulizia messaggi processati, audit accesso tabella outbox (inseriti come dettaglio implementativo del BB Messaging).

---

## 2. INCOERENZE DOCUMENTALI

- [x] **Execution plan non allineato**: corretto nell'aggiornamento execution-plan v2.0 — D-20 ora riportata come CONFERMATA (Vertical Slices + Minimal APIs + Mediator).
- [x] **Numerazione duplicata Cap. 10**: corretto — 10.6 Convenzioni UX, 10.7 Confine UI condivisa vs app.
- [x] **Log rotation**: aggiunta nell'ADB come capability del BB Observability (non DROP).
- [x] **Disclaimer management**: deciso — piattaforma come funzionalita', app-specific come configurazione e gestione attivazione. Aggiornato ADB.
- [x] **ADR individuali mancanti**: non necessari -- l'ADB e' la fonte di verita' unica per tutte le decisioni. Tracciabilita' sufficiente con il cruscotto decisioni (Cap. 2) e il log nel CRITICAL_REVIEW.
- [x] **Ripetizioni non allineate**: verificato -- tutte le 5 coppie sono coerenti (5.7.7 vs 11.1: dettaglio vs sintesi, 5.9.3 vs 8.7: stessa tabella con rimando, 8.8 vs 12.4: complementari non sovrapposti, 6.7 vs classification Sez. 7: stessa strategia, execution-plan vs ADB Cap. 2: allineati in v2.0). Nessuna divergenza trovata.

---

## 3. CUSTOMIZZAZIONE vs STANDARDIZZAZIONE

- [x] **Theming enforcement**: documentato onestamente in `docs/app-guidelines/theming.md` -- enforcement organizzativo (code review + stylelint rule), non tecnico. Checklist inclusa.
- [x] **Wrapper componenti = lock-in**: deciso Livello 2 (API unificata) per tutti i componenti. Matrice componente → libreria → API wrapper aggiunta in ADB Cap. 10.4. Trade-off documentato: feature non mappate non disponibili, verticali richiedono al team framework.
- [x] **Density incompleta**: definito -- density modifica solo spacing/padding/altezze, non font-size. Mobile (<768px) forza comfortable automaticamente (target touch 44px). Valori esatti definiti in fase di implementazione di `@seaside/theming`. Aggiornato ADB Cap. 10.3.
- [x] **Hook design -- ordine di esecuzione**: `[HookOrder(n)]`, default 0, esecuzione crescente. Dettaglio in ADB Cap. 9.4.4.
- [x] **Hook design -- scope transazionale**: pre-hook nella stessa transazione (rollback se fallisce), post-hook fuori transazione. ADB Cap. 9.4.1.
- [x] **Hook design -- context object**: `HookContext<T>` con Entity, EntityState, ICurrentUser, ChangedProperties. ADB Cap. 9.4.3.
- [x] **Hook design -- async**: supporto sia sync (`IPreSaveHookSync<T>`) che async (`IPreSaveHook<T>` con ValueTask). ADB Cap. 9.4.2.
- [x] **Hook design -- discovery**: assembly scanning via `AddHooks(assembly)`, registrazione Scoped. ADB Cap. 9.4.5.
- [x] **Hook design -- scope operazioni**: solo Save (create+update) e Delete. PostDeleteHook aggiunto. ADB Cap. 9.4.1.
- [x] **Hook design -- testing**: hook e' classe con DI, testabile con `new MyHook(deps)` + `ExecuteAsync(context)`. ADB Cap. 9.4.7.

---

## 4. ACCESSIBILITA'

> **Approccio**: il framework fornisce vincoli tecnici (ESLint rules, axe-core, componenti a11y by design, `RouteAnnouncerService`, DynamicForms a11y).
> Il resto (test manuali screen reader, test con utenti, budget) e' demandato alle singole app.
> Linee guida per i verticali in `docs/app-guidelines/accessibility.md`.

### 4.1 WCAG AA -- vincoli tecnici platform

- [x] I componenti "accessible by design" non esistono ancora — corretto: sono requisiti di implementazione per F6.4, non dichiarazioni. L'a11y sara' verificata con `expectAccessible()` su ogni componente.
- [x] ESLint a11y rules coprono solo un sottoinsieme di WCAG — accettato: le rules sono il livello 2 di enforcement (ADB 10.5). I gap residui coperti da axe-core (livello 3) e linee guida per i verticali.
- [x] axe-core copre ~57% di WCAG. Il 43% richiede test manuali — demandato alle singole app. Documentato in `docs/app-guidelines/accessibility.md` Sez. 6.4-6.5.
- [x] Lighthouse a11y 90/100 non garantisce accessibilita' reale — accettato come quality gate minimo. Test manuali demandati alle app.

### 4.2 Gap a11y specifici

- [x] Focus management nella SPA navigation — platform: `RouteAnnouncerService` in `@seaside/shell` (gia' nell'ADB Cap. 10.5). Documentato in app-guidelines.
- [x] Keyboard navigation testing plan — demandato alle app. Linee guida in `docs/app-guidelines/accessibility.md` Sez. 6.5.
- [x] Color contrast con temi custom — platform: il framework validera' i token di tema al build time. Documentato in app-guidelines/theming.md.
- [x] Zoom 200% (WCAG 1.4.4) — linee guida in app-guidelines/accessibility.md Sez. 5. Verifica a carico delle app.
- [x] Testing con screen reader reali — demandato alle app. Raccomandazione NVDA/VoiceOver in app-guidelines Sez. 6.4.
- [x] Testing con utenti reali con disabilita' — demandato alle app. Fuori scope framework.

### 4.3 Dark mode

- [x] Come garantire contrasto AA in entrambi i temi — platform: i design token forniscono palette con contrasto AA. Documentato in app-guidelines/theming.md e accessibility.md Sez. 4.
- [x] Come validare componenti custom dei verticali in dark mode — demandato alle app via code review e axe-core. Documentato in app-guidelines.
- [x] Come gestire immagini/icone con trasparenza in dark mode — linee guida in app-guidelines/accessibility.md Sez. 4.

### 4.4 Dynamic Forms

- [x] Label association corretta per ogni input generato da schema — platform: @ngx-formly lo fa built-in + requisito obbligatorio in ADB Cap. 9.1 e execution plan F7.2.
- [x] Error announcement per screen reader — platform: aria-live + aria-describedby. Requisito in ADB e F7.2.
- [x] Fieldset/legend per raggruppamenti logici — platform: requisito in ADB e F7.2.
- [x] Required field indicators accessibili (non solo asterisco visivo) — platform: aria-required + indicatore visivo. Requisito in ADB e F7.2.
- [x] Accessibilita' dei 50+ custom field types — platform fornisce base class accessibile. Verticali responsabili per i propri custom types. Requisito in ADB e F7.2.

---

## 5. AGGIORNAMENTI E VERSIONING

- [x] **Umbrella release anti-pattern**: ~~tutti i pacchetti rilasciati insieme~~ — deciso independent versioning con versione unificata. Monorepo, stesso numero di versione, ma solo i pacchetti modificati vengono pubblicati. Aggiornato ADB Cap. 8.5 e app-guidelines/packaging-and-versioning.md.
- [x] **Breaking changes -- comunicazione**: changelog per pacchetto + release notes aggregate per release. Migration guide inclusa nel changelog della major.
- [x] **Breaking changes -- migration guide**: guide testuali nel changelog (no codemods).
- [x] **Breaking changes -- deprecation period**: 1 anno. Deprecation nella minor (warning), rimozione nella major successiva.
- [x] **Breaking changes -- supporto N-1/N-2**: supporto fino a N-3. I verticali hanno 3 major version per aggiornare.
- [x] **Breaking changes -- pre-rilascio**: Release Candidate su ambienti interni prima della pubblicazione.
- [x] **NuGet e npm stessa versione**: ~~breaking changes FE/BE non correlate~~ — risolto: versione unificata nel monorepo. Le breaking changes FE/BE possono avvenire in release diverse, ma il numero di versione resta unico. Il changelog per pacchetto documenta le modifiche effettive.
- [x] **Strategia deprecation API**: `[Obsolete("messaggio")]` (.NET) + `@deprecated` JSDoc (TS). Co-esistenza old/new per l'intero periodo di deprecation (1 anno), vecchia API delega alla nuova internamente. No analyzer custom — compilatore e linter sufficienti. Aggiornato ADB Cap. 8.5 e app-guidelines/packaging-and-versioning.md.

---

## 6. UI/UX

- [x] **Mobile/responsive**: responsive si (breakpoint definiti in ADB Cap. 10.8), touch device friendly priorita' media (target touch >= 44px), mobile layout nice to have a bassa priorita'. Sidebar collassata su tablet, density comfortable forzata sotto 768px.
- [x] **Bundle size budget**: delegato alle singole app. Il framework fornisce lazy loading e code splitting (Cap. 10.9) come strumenti, i verticali gestiscono il proprio budget.
- [x] **Lazy loading strategy**: definita in ADB Cap. 10.9. Route-level, module-level, component-level e third-party splitting. `loadComponent()`/`loadChildren()` obbligatori, nessun eager loading di pagine.
- [x] **SSR/SSG**: Angular SSR (`@angular/ssr`) con hydration adottato. ADB Cap. 10.10. Transfer state per evitare doppia fetch, wrapper `SeasidePlatformService` per accesso sicuro a API browser.
- [x] **Image optimization**: Azure Blob Storage per persistenza (no base64), lazy loading nativo, WebP, responsive images con srcset, componente `<seaside-image>`. Building block `BuildingBlocks.FileStorage` con `IFileStorageService`. ADB Cap. 10.11.
- [x] **Core Web Vitals targets**: definiti in ADB Cap. 10.12 come priorita' 2. LCP < 2.5s, INP < 200ms, CLS < 0.1. Misurazione con Lighthouse CI (warning, non bloccante) e Web Vitals RUM in produzione.
- [x] **Code splitting per modulo**: definito in ADB Cap. 10.9. 4 livelli di splitting (route, module, component, third-party). Syncfusion in chunk separati, preloading strategy `PreloadAllModules`.
- [x] **State management**: servizi Angular con Signals (evoluzione del pattern legacy service-oriented con BehaviorSubject). Nessuna libreria esterna (no NgRx/Akita/NGXS) senza approvazione. ADB Cap. 10.13.
- [x] **I18n -- libreria**: Angular built-in i18n (`@angular/localize`) confermato. 42 lingue supportate, file XLIFF per lingua compilati al build. ADB Cap. 10.14.
- [x] **I18n -- componenti framework**: label interne (paginazione, "Nessun risultato", bottoni standard) incluse in `@seaside/components` con traduzioni per tutte le 42 lingue. ADB Cap. 10.14.
- [x] **I18n -- RTL**: supportato per arabo (ar_EG) e ebraico (he_IL). `dir="rtl"` automatico, CSS logical properties, sidebar a destra, componenti testati in RTL. ADB Cap. 10.14.
- [x] **I18n -- formatting**: `DatePipe`/`DecimalPipe`/`CurrencyPipe` con locale Angular, ICU message format per pluralizzazione, no moment.js (deprecato). ADB Cap. 10.14.
- [x] **Convenzioni UX**: **spinner** per tutte le operazioni di caricamento (decisione confermata). Skeleton screen come evoluzione futura a bassa priorita'. Aggiornato ADB Cap. 10.6.

---

## 7. ARCHITETTURA E DESIGN

- [x] **Dependency hell 17+ NuGet**: risolto con meta-pacchetto `Seaside.BuildingBlocks.All` che referenzia tutti i BB come dipendenze transitive. Verticali scelgono: singoli pacchetti (granulare) o meta-pacchetto (un solo PackageReference). ADB Cap. 8.5.
- [x] **Hexagonal -- feedback tardivo**: accettato — build-time (CI) e' sufficiente, non usiamo Roslyn analyzer per write-time. I test NetArchTest in CI danno feedback rapido.
- [x] **Hexagonal -- namespace trap**: mitigato — i test verificano anche che le classi nei folder Domain/Application/Infrastructure/Endpoints siano nel namespace corrispondente (convention-based check). ADB Cap. 13.4.
- [x] **Hexagonal -- god project**: accettato — un .csproj per modulo con 4 folder logici. Se un modulo cresce troppo, si splitta in due moduli business, non in due .csproj dello stesso modulo. Il confine e' il bounded context.
- [x] **Saga pattern**: choreography-based saga. Ogni modulo gestisce le proprie compensating transactions via integration events. CorrelationId per distributed tracing, DLQ per eventi non processabili, timeout con evento di compensazione. ADB Cap. 8.8.4.
- [x] **DbContext e shared data**: nessun accesso cross-DbContext. I moduli accedono ai dati del framework via `ICurrentUser` (read-only) e ai dati di altri moduli via API/integration events. Join cross-DbContext vietati — denormalizzare se necessario. ADB Cap. 6.3.
- [x] **IMessageBus astrazione leaky**: interfaccia estesa con `PublishAsync`, `SubscribeAsync`, `ScheduleAsync`, `RequestAsync`, `DeadLetterAsync`, `GetDeadLettersAsync`, `TopicExistsAsync`. Feature non supportate da un adapter → `NotSupportedException`. Costo reale dello switch documentato. ADB Cap. 8.8.1.
- [x] **Caching -- layer**: in-memory (`IMemoryCache`) priorita' 0 dal giorno 1, Redis (`IDistributedCache`) in fase successiva. ADB Cap. 8.8.5.
- [x] **Caching -- invalidation**: prevalentemente event-based (integration event di invalidazione), time-based (TTL) come fallback. ADB Cap. 8.8.5.
- [x] **Caching -- response**: gestito da Azure (Front Door / Application Gateway), non dal framework. ADB Cap. 8.8.5.
- [x] **Caching -- CQRS read side**: valutato caso per caso dai singoli moduli. Il framework fornisce le primitive, il verticale decide. ADB Cap. 8.8.5.
- [x] **Caching -- static assets**: content hash nel filename + CDN con `Cache-Control: max-age=31536000, immutable`. ADB Cap. 8.8.5.

---

## 8. TESTING E QUALITY

- [x] **E2E -- configurazione Playwright**: architettura completa definita in ADB Cap. 13.6. Page Object Model, auth fixture con session pre-autenticata riusabile, mock backend via route interception, test su shell + moduli lazy-loaded, a11y con axe-core, visual regression con screenshot. Multi-browser (Chromium, Firefox, mobile Chrome).
- [x] **Performance testing**: k6 per load testing (baseline: p95 < 500ms, p99 < 1s, >= 50 utenti concorrenti), Playwright per Core Web Vitals in CI, EF Core logging per DB query monitoring (N+1 detection, query plan check). ADB Cap. 13.7.

---

## 9. RISCHI OPERATIVI

- [x] **Governance team framework**: fuori scope ADB — decisione organizzativa del committente.
- [x] **Maturita' stack**: fuori scope ADB — decisione del committente, stack gia' confermato.
- [x] **Monitoring produzione -- stack**: responsabilita' IT. Il framework espone OpenTelemetry, Azure lo consuma. Aggiunto ADB Cap. 8.11.1.
- [x] **Monitoring produzione -- alerting**: responsabilita' IT. Documentato in ADB Cap. 8.11.1.
- [x] **Monitoring produzione -- SLA/SLO**: responsabilita' IT + business, per prodotto non per framework. Documentato in ADB Cap. 8.11.1.
- [x] **Monitoring produzione -- runbook**: responsabilita' IT. Documentato in ADB Cap. 8.11.1.
- [x] **Costi per-instance**: fuori scope ADB — decisione infrastrutturale/business del committente.
- [x] **Lock-in SQL Server**: fuori scope ADB — decisione del committente, D-30 gia' confermata.
- [x] **Custom mediator (D-21)**: fuori scope review — decisione gia' confermata, dettagli implementativi nella task di sviluppo.
- [x] **Dual component library (D-11)**: fuori scope review — decisione gia' confermata con matrice in ADB Cap. 10.4.

---

## 10. QUALITA' DOCUMENTALE

- [x] **Lingua inconsistente**: accettata — stile misto italiano/inglese e' intenzionale. Corpo in italiano, termini tecnici e codice in inglese. Coerente con il contesto del team.
- [x] **Diagrammi assenti**: aggiunti 7 diagrammi Mermaid nell'ADB: C4 Context (Cap. 1.5), C4 Container (Cap. 1.5), C4 Component/BB dependency graph (Cap. 1.5), auth/BFF login flow (Cap. 7.6), messaging Outbox/Inbox (Cap. 8.8), saga compensation flow (Cap. 8.8.4), CI/CD pipeline (Cap. 8.11).

---

## CONTEGGIO

| Sezione | Checkbox aperte |
|---|---|
| 1. Sicurezza | 0 |
| 2. Incoerenze documentali | 0 |
| 3. Customizzazione / Standardizzazione | 0 |
| 4. Accessibilita' | 0 |
| 5. Aggiornamenti e Versioning | 0 |
| 6. UI/UX | 0 |
| 7. Architettura e Design | 0 |
| 8. Testing e Quality | 0 |
| 9. Rischi operativi | 0 |
| 10. Qualita' documentale | 0 |
| **Totale** | **0** |

---

## DECISIONI RISOLTE (log)

Tutte confermate nella sessione del 2026-03-12:

| Decisione | Scelta |
|---|---|
| D-11 | ng-zorro-antd baseline + Syncfusion per componenti avanzati, dietro wrapper |
| D-21 | Custom lightweight mediator built in-house (no MediatR per licenza) |
| D-22 | Opzione A+C: `Result<T>` + FluentValidation pipeline |
| D-41 | JWT Bearer + multi-scheme auth |
| D-42 | Permission-based RBAC + workspace scoping opt-in |
| D-43 | Users/Roles gestiti a livello framework |
| D-44 | BFF pattern con httpOnly secure cookie, anti-forgery |
| D-45 | Redis sessions in produzione, in-memory in dev, sliding expiration |
| D-46 | Key Vault, TDE su Azure SQL, IDataProtector per campi sensibili |
| D-47 | CSP, rate limiting, CORS, CSRF, HtmlSanitizer, security headers |
| D-52 | Root namespace "Seaside" |
| D-54 | Prima business app: "DISCLOSURE 2.0" |
| D-80 | xUnit (backend), Jest (unit FE), Playwright (E2E FE) |
| D-82 | Opzione A confermata |

### Altre azioni completate

| Azione | Stato |
|---|---|
| HelloWorld rimosso da main | Fatto (era esperimento su ramo separato) |
| Architecture tests creati | `tests/ArchitectureTests/` con HexagonalRulesTests, ModuleIsolationTests, BuildingBlocksDependencyTests |
| Capitolo Security (Cap. 7) completato | D-44/45/46/47 coprono tutti i gap originali |
| OldCodeBase credenziali | Ignorato -- e' solo reference per UI, non parte del prodotto |
| Outbox encryption | Non necessaria -- committente ha deciso di non cifrare i payload |
| Cap. 10 numerazione | Corretta: 10.6 Convenzioni UX, 10.7 Confine UI condivisa vs app |
| Log rotation | Aggiunta nell'ADB come capability del BB Observability |
| Disclaimer management | Platform come funzionalita', app-specific come configurazione e gestione attivazione |
| Execution plan D-20 | Era gia' allineato nell'aggiornamento v2.0 |
| App guidelines folder | Creata `docs/app-guidelines/` con theming, a11y, frontend, security, packaging |
| Theming enforcement | Documentato onestamente in app-guidelines/theming.md |
