# Confronto tra architettura SEASYDE_AI e brainstorming CTO/SA Pavia

> Documento di verifica di allineamento tra le decisioni architetturali documentate in SEASYDE_AI e le idee emerse nel brainstorming CTO/SA.
> Ultimo aggiornamento: 2026-03-09

---

## Mappatura dei nomi

| Brainstorming Pavia | Architettura SEASYDE_AI | Note |
|---|---|---|
| **C-Side Extended** | Framework (BuildingBlocks + Shared) | Il framework base condiviso |
| **Prodotti verticali** (es. "Cippo Lippo") | Business Modules + Application Hosts | Le app di business costruite on top |
| **Seaside attuale** | Legacy (ANServer + ANWebFE + Liquibase) | Il sistema da ripensare |
| **Template repository FE/BE** | Monorepo con struttura condivisa | Approccio diverso, vedi sezione 3 |

---

## 1. Punti di allineamento (OK, niente da rivedere)

### 1.1 Separazione framework / prodotti verticali

**Brainstorming**: "partire da repository template per il front-end e il back-end (C-Side Extended), sui quali i prodotti verticali monteranno le loro parti specifiche tramite repository dedicati"

**Nostra architettura**: Separazione netta tra BuildingBlocks/Shared (framework) e Modules/Hosts (app business). Regola del confine: "se non e' riusabile da 2+ app, non sta nel framework". Dipendenze unidirezionali verificate da architecture tests.

**Stato**: ALLINEATO. Il principio e' lo stesso. La meccanica di implementazione differisce (monorepo vs multi-repo) -- vedi sezione 3.1.

### 1.2 .NET Aspire come strato di orchestrazione

**Brainstorming**: "utilizzare .NET Aspire per gestire l'infrastruttura, la configurazione delle applicazioni e gli ambienti di sviluppo locali", "IaC per sviluppatori", "unificherebbe la configurazione tra gli ambienti di sviluppo locale, staging e produzione"

**Nostra architettura**: Aspire confermato come D-02. AppHost per orchestrazione, ServiceDefaults per standard tecnici. Aspire fornisce: orchestrazione locale, service discovery, dashboard observability, health checks, gestione risorse dichiarativa.

**Stato**: ALLINEATO. L'adozione di Aspire e' confermata e il ruolo e' coerente.

### 1.3 Superamento del legacy

**Brainstorming**: "La struttura attuale di Seaside deve essere completamente ripensata"

**Nostra architettura**: Principio fondamentale: "niente porting 1:1, ogni capability viene classificata, ripensata e ricostruita". 80 capability classificate, di cui nessuna viene copiata.

**Stato**: ALLINEATO.

### 1.4 Componibilita' del frontend

**Brainstorming**: "componenti front-end componibili, mappati sui domini applicativi"

**Nostra architettura**: Shared.UiShell (shell applicativa), Shared.UiComponents (componenti condivisi), Shared.UiTheming (design system). Le app compongono i componenti del framework senza sostituirli.

**Stato**: ALLINEATO nel principio. La granularita' della composizione va definita meglio -- vedi sezione 2.3.

### 1.5 Scomposizione del backend in servizi separabili

**Brainstorming**: "decomporre C-Side in servizi back-end separabili (invocabili tramite token e con minimi side effect)"

**Nostra architettura**: Modular monolith con moduli isolati, comunicazione via integration events o shared contracts. Vertical slices con mediator pipeline. Ogni modulo espone endpoint propri.

**Stato**: PARZIALMENTE ALLINEATO. I moduli sono separabili, ma non sono pensati come "servizi invocabili da terzi". Vedi sezione 2.1.

---

## 2. Gap identificati (presenti nel brainstorming, assenti o incompleti nella nostra architettura)

Questi sono i punti critici che richiedono attenzione.

### 2.1 CRITICO -- Modello di estensibilita' / extension points

**Brainstorming**: descrive due livelli di estensibilita':

1. **Estensibilita' profonda**: prodotti verticali che creano nuovi servizi backend e componenti frontend, appoggiandosi ai servizi del framework. Sviluppatori (interni o partner certificati) partono da un progetto template.

2. **Estensibilita' light (webhook/sandbox)**: punti di hook nei flussi applicativi (pre-save, post-save). Gli sviluppatori scrivono codice (SQL, JavaScript) in una sandbox controllata che inietta un oggetto contesto, limita l'ambito e valida il codice.

**Nostra architettura**: **NON PREVEDE un modello di estensibilita' esplicito**. I Modules sono pensati come codice interno sviluppato dal team, non come punti di estensione per sviluppatori esterni o partner. Non esiste il concetto di:
- Hook/webhook nei flussi applicativi
- Sandbox per esecuzione di codice custom
- Progetto template per sviluppatori di estensioni
- Plugin model

**Impatto**: ALTO. Se il framework deve supportare personalizzazioni da parte di team diversi (o partner), serve un modello di estensibilita' esplicito che oggi manca completamente.

**Decisioni da prendere**:
1. Il framework deve supportare estensibilita' profonda (nuovi servizi/componenti da template)?
2. Il framework deve supportare estensibilita' light (webhook/sandbox)?
3. Chi saranno i consumer delle estensioni: solo team interni o anche partner esterni?
4. Quando serve: subito (nel framework base) o dopo (quando i prodotti verticali lo richiedono)?

**Raccomandazione**: progettare almeno le **interfacce di estensibilita'** nel framework base, anche se l'implementazione completa viene differita. In particolare:
- Definire un pattern di "extension point" nei building blocks (es. interfacce `IPreSaveHook<T>`, `IPostSaveHook<T>`)
- Prevedere nella struttura del monorepo un'area per "extension templates"
- La sandbox puo' essere DEFER ma l'architettura deve lasciare spazio

**DECISIONE PRESA (2026-03-09)**:

Il modello di estensibilita' e' stato chiarito e formalizzato nel Cap. 8 dell'ADB:

1. **Estensibilita' profonda** = coincide con il modello di consumo del framework. I team di prodotto creano un vertical repo partendo dal template fornito dal team framework, referenziano i pacchetti NuGet/npm del framework, e costruiscono i propri Modules/Hosts/Workers. Non si "estende" il framework: lo si usa come base. Questo corrisponde a quanto descritto nel brainstorming ("sviluppatori partono da un progetto template").

2. **Estensibilita' light (hook/sandbox)** = resta un tema separato da affrontare come building block futuro. Non riguarda la struttura dei repository ma e' una capability runtime (hook nei flussi applicativi). DEFER.

3. **Consumer**: team interni per ora. La struttura multi-repo con pacchetti rende naturale un'eventuale apertura futura a partner.

4. **Quando**: il modello base (multi-repo + pacchetti) e' previsto dal bootstrap. La sandbox e' DEFER.

### 2.2 CRITICO -- Modello di deployment: monorepo vs multi-repo con pipeline di merge

**Brainstorming**: "Una pipeline di CI/CD si occupera' di impacchettare, buildare e deployare il tutto come un unico artifact di prodotto". Menziona esplicitamente "quattro repo" che diventano un unico backend e frontend. Il modello e': repo template (C-Side Extended) + repo del prodotto verticale -> pipeline -> artifact unico.

**Nostra architettura**: **Monorepo unico** dove framework e moduli business convivono. L'artifact e' il risultato di un singolo build. Non ci sono repo separati per i prodotti verticali.

**Divergenza**: il brainstorming prevede **multi-repo** (framework come template + repo separati per prodotto), noi abbiamo scelto **monorepo**.

**Impatto**: ALTO. Questa e' una divergenza strutturale.

**Analisi delle opzioni**:

| Aspetto | Monorepo (nostra scelta) | Multi-repo (brainstorming) |
|---|---|---|
| Semplicita' iniziale | Alta | Media |
| Separazione team | Piu' difficile | Naturale |
| CI/CD | Semplice (un build) | Complessa (merge pipeline) |
| Versionamento framework | Implicito (tutto insieme) | Esplicito (version del template) |
| Aggiornamento framework | Immediato per tutte le app | Richiede merge/update per ogni prodotto |
| Scalabilita' team | Difficile con molti team | Naturale |
| Partner/terze parti | Impraticabile | Fattibile |
| Architecture tests | Semplici (tutto visibile) | Piu' complessi (cross-repo) |

**Decisioni da prendere**:
1. Il framework sara' consumato solo da un team interno (monorepo OK) o da team multipli/partner (multi-repo necessario)?
2. I prodotti verticali vivranno nello stesso repo del framework o in repo separati?
3. Come si gestisce il versionamento del framework se i prodotti sono in repo separati?

**Raccomandazione**: per la fase iniziale (1 team, 1 prodotto), il **monorepo resta valido e piu' semplice**. Ma la struttura interna deve essere progettata in modo che il framework possa essere **estratto come NuGet/npm packages** in futuro, abilitando il modello multi-repo quando servira'. Questo significa:
- I BuildingBlocks devono essere progettati come pacchetti pubblicabili
- La Shared UI deve essere una libreria consumabile indipendentemente
- Le dipendenze devono andare solo dal prodotto verso il framework, mai viceversa (gia' previsto)

**DECISIONE PRESA (2026-03-09)**:

Adottato il modello **multi-repo con pacchetti NuGet/npm**:

- Il framework vive nel proprio repository (`SEASYDE_AI`), mantenuto dal team framework
- Ogni prodotto verticale ha il proprio repository, mantenuto dal team di prodotto
- Il framework pubblica pacchetti NuGet (backend) e npm (frontend) su un feed privato
- I verticali consumano il framework come dipendenze di pacchetto
- L'isolamento tra framework e verticali e' **fisico** (confine di pacchetto)

Motivazione: ci saranno team separati per il framework e per ogni verticale. Il monorepo non e' sostenibile con team multipli e prodotti diversi.

Dettagli nel Cap. 8 dell'ADB aggiornato.

### 2.3 IMPORTANTE -- Sandbox per esecuzione di codice custom

**Brainstorming**: descrive una sandbox per esecuzione controllata di codice di customizzazione. Include:
- Supporto a SQL e JavaScript (potenzialmente altri linguaggi)
- Oggetto contesto iniettato con scope limitato
- Validazione del codice prima dell'esecuzione
- Tracciamento delle dipendenze
- Evoluzione delle attuali "validation" e "post action"

**Nostra architettura**: **Non prevista**.

**Impatto**: MEDIO-ALTO se il sistema deve supportare customizzazioni per cliente. BASSO se le customizzazioni sono solo a livello di configurazione.

**Decisione da prendere**: la sandbox e' un requisito del framework base o di un prodotto specifico?

**Raccomandazione**: DEFER la sandbox come capability, ma prevedere i punti di hook (extension points) nel framework base. La sandbox e' un container di esecuzione per gli hook, ma gli hook devono esistere prima.

**DECISIONE PRESA (2026-03-09)**:

La "sandbox" e gli "hook" sono due temi distinti:

1. **Hook nei flussi applicativi**: previsti nel framework base come building block `Hooks` (Cap. 9 ADB). Il framework fornisce interfacce (`IPreSaveHook<T>`, `IPostSaveHook<T>`, `IPreDeleteHook<T>`), un hook context e il meccanismo di discovery/esecuzione automatica. I verticali li usano dal giorno uno per intervenire nel ciclo di vita delle entita'. Senza hook, i verticali non avrebbero un modo standard per inserire logica nei flussi.

2. **Sandbox per esecuzione codice utente finale**: DEFER. E' una capability di un prodotto verticale, non del framework. Quando un verticale avra' bisogno di far eseguire codice all'utente finale (SQL, JavaScript, etc.), costruira' la sandbox sopra gli hook gia' presenti nel framework.

### 2.4 IMPORTANTE -- Ambiente di sviluppo locale containerizzato con DB

**Brainstorming**: "un sistema basato su container che permetta allo sviluppatore di avere un ambiente di sviluppo locale completo", "copia anonimizzata del database di sviluppo", "debug completo con strumenti standard"

**Nostra architettura**: Aspire fornisce orchestrazione locale (F5 experience), ma non affrontiamo esplicitamente:
- Come uno sviluppatore ottiene un DB locale con dati realistici
- Anonimizzazione dei dati
- Il flusso di debug per codice custom/sandbox

**Impatto**: MEDIO. Aspire risolve parzialmente il problema (crea risorse locali dichiarativamente), ma non copre l'anonimizzazione DB ne' il flusso sandbox.

**DECISIONE PRESA (2026-03-12)**:

1. **Connection string via environment variables**: la connection string del database non e' MAI hardcodata nel codice. Il codice applicativo usa sempre `ConnectionStrings:{nome}` dalla configurazione standard .NET. L'ambiente determina il valore:
   - **Sviluppo locale**: Aspire AppHost crea un container SQL Server e inietta la connection string automaticamente
   - **Debug su ambiente esterno**: lo sviluppatore imposta la variabile d'ambiente `ConnectionStrings__{nome}` puntando al DB target (anonimizzato)
   - **Produzione**: IT configura tramite secret manager / env var / Key Vault

2. **Nessun `if` sugli ambienti nel codice**: niente branching `if (isDevelopment)` con connection string diverse. L'unico punto che distingue dev/prod e' l'AppHost Aspire (branch `IsPublishMode`).

3. **Anonimizzazione**: esiste gia' un processo aziendale di anonimizzazione per gli ambienti non di produzione. Il framework non lo gestisce — e' un processo infrastrutturale di IT. Lo sviluppatore che fa debug su un ambiente esterno punta sempre a un DB gia' anonimizzato.

4. **Seed locale**: per lo sviluppo locale con dati realistici, il vertical repo puo' includere script di seed nel setup Aspire. Questo e' responsabilita' del team di prodotto, non del framework.

Dettagli nel Cap. 6.8 dell'ADB e in `docs/architecture/aspire-deployment-guide.md`.

> **Azione A5**: ~~aggiungere meccanismo seed/anonimizzazione~~ → SUPERATO. La strategia e' basata su variabili d'ambiente + processi infrastrutturali esistenti. Il framework fornisce il meccanismo di configuration injection tramite Aspire.

### 2.5 IMPORTANTE -- CI/CD e artifact di prodotto

**Brainstorming**: "Una pipeline di CI/CD si occupera' di impacchettare, buildare e deployare il tutto come un unico artifact di prodotto, che sara' poi installato sulle istanze dei clienti"

**Nostra architettura**: menziona CI/CD nel backlog (Stream 3 e Stream 8) ma non ne dettaglia la strategia. Non descrive:
- Come vengono prodotti gli artifact
- Come viene gestito il deployment su istanze cliente
- Come si combinano framework + prodotto verticale nell'artifact finale

**Impatto**: MEDIO. Non blocca il bootstrap ma deve essere affrontato prima del primo deploy.

**Decisione da prendere**: il modello di deploy e' per-istanza (ogni cliente ha il proprio deployment) o SaaS multi-tenant?

**Raccomandazione**: aggiungere un capitolo "Deployment Strategy" all'Architecture Decision Book.

**DECISIONE PRESA (2026-03-09)**:

1. **Separazione dev/IT**: gli sviluppatori producono artifact, IT deploya in produzione. Questo e' un vincolo di compliance (certificazioni interne, procedure SOC) non negoziabile.

2. **Come si combinano framework + verticale**: gia' risolto dal modello multi-repo + NuGet (Cap. 8). Il vertical repo referenzia i pacchetti framework come dipendenze NuGet/npm. Al build, tutto viene compilato in un singolo artifact. IT riceve un unico deliverable.

3. **Modello di deploy**: per-istanza (confermato da D-50: multi-tenancy non prevista). Ogni cliente ha il proprio deployment.

4. **Formato artifact**: da definire con IT (Docker image, deployment package, etc.).

Dettagli nel Cap. 8.11 dell'ADB.

### 2.6 MEDIO -- Apertura a partner / developer ecosystem

**Brainstorming**: "sviluppatori (interni o futuri partner certificati) di creare estensioni partendo da un progetto template"

**Nostra architettura**: pensata esclusivamente per team interno. Non prevede:
- Documentazione per sviluppatori esterni
- API pubbliche vs interne
- Licensing o isolation per partner
- Template di progetto per estensioni

**Impatto**: BASSO a breve termine (non previsto "oggi ne' l'anno prossimo" secondo il brainstorming stesso). MA la struttura deve rendere possibile l'apertura futura.

**Raccomandazione**: non affrontare ora, ma assicurarsi che le dependency rules e l'isolation dei moduli siano sufficientemente forti da permettere in futuro l'apertura. Questo e' gia' previsto nella nostra architettura.

### 2.7 MEDIO -- Impatto sulle procedure SOC

**Brainstorming**: "questa cosa ci caca sopra qualunque procedura SOC che abbiamo scritto quest'anno" (Yuri Diamanti). L'introduzione di Aspire e del nuovo stack potrebbe impattare le procedure di conformita'.

**Nostra architettura**: non menziona compliance SOC.

**Impatto**: MEDIO. Non e' un problema architetturale ma operativo. Va pianificato.

**Raccomandazione**: aggiungere un rischio R11 nella sezione Rischi e Mitigazioni dell'Architecture Decision Book.

---

## 3. Divergenze esplicite (scelte diverse tra brainstorming e architettura)

### 3.1 Monorepo vs template-repo + merge pipeline

**Brainstorming**: modello multi-repo con template.
**Nostra architettura**: monorepo.

**Analisi**: la divergenza e' giustificata per la fase iniziale (1 team, 1 primo prodotto). Il monorepo e' piu' semplice, piu' veloce da bootstrappare, e non richiede una pipeline di merge complessa. Tuttavia, la struttura interna deve essere predisposta per un'eventuale separazione futura.

**Azione richiesta**: confermare che il monorepo e' la scelta corretta per la fase attuale, con l'impegno di progettare i BuildingBlocks come pacchetti estraibili.

**RISOLTO (2026-03-09)**: la divergenza e' stata risolta adottando il modello multi-repo con pacchetti. Il framework vive nel proprio repo e i verticali in repo separati, allineandosi con la visione del brainstorming. Vedi Cap. 8 ADB.

### 3.2 Naming

**Brainstorming**: usa "C-Side Extended" come nome del framework.
**Nostra architettura**: usa "SEASYDE_AI".

**RISOLTO (2026-03-12)**: il root namespace e' confermato come **Seaside** (D-52 nell'ADB). Il repo di progetto resta `SEASYDE_AI` ma tutti i pacchetti NuGet, namespace .NET e pacchetti npm usano il prefisso `Seaside.*` / `@seaside/*`.

---

## 4. Riepilogo azioni richieste

### Azioni critiche (da risolvere prima del bootstrap)

| # | Tema | Azione | Capitolo ADB da aggiornare |
|---|---|---|---|
| A1 | Extension points | **RISOLTO**: il modello di consumo del framework (multi-repo + NuGet) E' il modello di estensibilita' profonda. Hook/sandbox DEFER come building block futuro | Cap. 8.6 |
| A2 | Monorepo vs multi-repo | **RISOLTO**: adottato multi-repo con pacchetti NuGet/npm. Framework repo + vertical repos separati | Cap. 8.1 |
| A3 | Deployment model | **RISOLTO**: per-istanza (D-50 conferma no multi-tenancy). Dev produce artifact, IT deploya. Vincolo compliance. | Cap. 8.11 |

### Azioni importanti (da affrontare durante il framework bootstrap)

| # | Tema | Azione | Capitolo ADB da aggiornare |
|---|---|---|---|
| A4 | Sandbox / Hook | **RISOLTO**: hook nel framework base (BB `Hooks`), sandbox DEFER a prodotto verticale | Cap. 9 (Building Blocks) |
| A5 | Developer Experience | **RISOLTO**: strategia connection string via environment variables (Cap. 6.8). Aspire per dev locale, env var per debug su ambiente esterno. Anonimizzazione e' processo IT esistente. Seed locale a carico del vertical repo | Cap. 6.8 |
| A6 | CI/CD strategy | **RISOLTO**: documentato in Cap. 8.11. Framework CI/CD pubblica NuGet/npm. Verticale CI/CD produce artifact. IT deploya. | Cap. 8.11 |
| A7 | SOC compliance | Aggiungere rischio R11 per impatto su procedure SOC | Cap. 16 (Rischi) |

### Azioni a bassa priorita' (DEFER ma da non dimenticare)

| # | Tema | Azione |
|---|---|---|
| A8 | Partner ecosystem | Documentare come vincolo futuro: la struttura deve permettere apertura a partner |
| A9 | ~~Multi-repo futuro~~ | **SUPERATO**: multi-repo adottato dal bootstrap. Non serve piu' rivalutare |
| A10 | Sandbox implementazione | Implementare la sandbox quando un prodotto verticale la richiede |

---

## 5. Conclusione

L'architettura SEASYDE_AI e' **sostanzialmente allineata** con la visione del brainstorming Pavia per quanto riguarda:
- Separazione framework / prodotti verticali
- Adozione di .NET Aspire
- Ricostruzione da zero (no porting)
- Componibilita' frontend e backend

I gap principali riguardano:
1. **Modello di estensibilita'** -- il brainstorming prevede extension points e sandbox che la nostra architettura non contempla
2. **Modello di deployment** -- multi-repo vs monorepo e pipeline di merge
3. **Developer experience** -- ambiente locale con DB realistico

Nessuno di questi gap invalida il lavoro fatto. Richiedono decisioni aggiuntive che possono essere integrate nell'architettura esistente senza stravolgimenti.

La raccomandazione e':
- Prendere le decisioni A1, A2, A3 prima del bootstrap
- Pianificare A4-A7 durante la fase di framework foundation
- Registrare A8-A10 come vincoli futuri nel backlog

**Aggiornamento 2026-03-12**: tutte le azioni critiche (A1, A2, A3) e importanti (A4, A5, A6) sono state risolte. Il modello multi-repo con pacchetti NuGet/npm e' confermato (Cap. 8 ADB). Il naming e' stato formalizzato: root namespace `Seaside` (D-52). Restano aperte solo A7 (SOC compliance), A8 (partner ecosystem) e A10 (sandbox implementazione).
