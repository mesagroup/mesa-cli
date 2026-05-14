# Guida al Vibecoding su Seaside

> Questa guida e' rivolta ai **business analyst e domain expert** che costruiscono applicazioni
> usando Claude Code sopra la piattaforma Seaside.
> Non serve saper programmare: serve conoscere il dominio di business e seguire queste regole.

---

## 1. Cos'e' Seaside e cosa vi fornisce

Seaside e' una piattaforma applicativa interna che fornisce tutto cio' che serve per costruire
applicazioni business: layout grafico, componenti visivi, gestione utenti e permessi,
sicurezza, gestione errori, monitoraggio, e molto altro. Pensatelo come le fondamenta e
l'impianto elettrico di una casa: voi dovete occuparvi solo di arredare le stanze.

Ogni applicazione business (chiamata **verticale**) e' un progetto separato che consuma Seaside
come ingrediente gia' pronto. Voi lavorate nel vostro progetto verticale, scrivete la logica
di dominio (le regole del vostro business), e Seaside si occupa di tutto il resto. Nel vostro
progetto verticale, Seaside arriva come pacchetti pre-compilati (NuGet per il backend, npm per
il frontend): non potete e non dovete modificarli. Il codice del framework e' gestito
separatamente dal team di architettura.

---

## 2. Prerequisiti: cosa installare

Prima di iniziare, assicuratevi di avere installato sul vostro computer:

| Software | A cosa serve | Come installarlo |
|---|---|---|
| **.NET 10 SDK** | Esegue il backend dell'applicazione | [https://dot.net/download](https://dotnet.microsoft.com/download) |
| **Node.js 22+** | Esegue il frontend dell'applicazione | [https://nodejs.org](https://nodejs.org) (versione LTS) |
| **Docker Desktop** | Fornisce il database e altri servizi in locale | [https://docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| **Git** | Gestisce il codice sorgente | [https://git-scm.com](https://git-scm.com) |
| **Claude Code** | Lo strumento AI che scrive il codice per voi | `npm install -g @anthropic-ai/claude-code` |

### Verifica dell'installazione

Aprite un terminale e digitate questi comandi uno alla volta. Ognuno deve restituire un numero di versione senza errori:

```
dotnet --version
node --version
docker --version
git --version
claude --version
```

---

## 3. Setup iniziale: creare la vostra applicazione

### 3.1 Copiare il template

Il team di architettura fornisce un template gia' pronto. Copiatelo e rinominatelo:

```bash
# Clonate il template (il link vi viene fornito dal team architettura)
git clone <url-del-template> MioProdotto
cd MioProdotto

# Eliminate la storia Git del template e create la vostra
rm -rf .git
git init
git add .
git commit -m "Setup iniziale da template Seaside"
```

Sostituite `MioProdotto` con il nome reale della vostra applicazione.

### 3.2 Rinominare i placeholder

Il template usa nomi generici che vanno sostituiti con i nomi della vostra applicazione.
C'e' un file `RENAME_GUIDE.md` nella root del progetto che elenca tutti i punti da rinominare.

Potete chiedere direttamente a Claude Code di farlo:

```
Leggi il file RENAME_GUIDE.md e rinomina tutti i placeholder.
Il nome del prodotto e': [NomeProdotto].
Il primo modulo business si chiama: [NomeModulo].
```

### 3.3 Primo avvio

Avviate Docker Desktop (deve essere in esecuzione per il database).

```bash
# Verificate che tutto compili
dotnet build

# Avviate il backend (include database, API, dashboard di monitoraggio)
dotnet run --project src/AppHost
```

In un secondo terminale:

```bash
# Avviate il frontend
cd src/Frontend
npm install
npx ng serve
```

### 3.4 Cosa vedrete

| Indirizzo | Cosa mostra |
|---|---|
| `https://localhost:18888` | **Aspire Dashboard** -- pannello di monitoraggio di tutti i servizi |
| `http://localhost:5100/swagger` | **Swagger** -- lista di tutte le API del backend (per verificare che funzionino) |
| `http://localhost:4200` | **Frontend** -- la vostra applicazione web |

Se tutto funziona, vedrete la pagina di esempio con una lista e un form. Questo e' il punto di partenza.

---

## 4. Le 10 Regole d'Oro

Queste regole **non sono negoziabili**. Se le seguite, il team di architettura potra' sempre
ricostruire e manutenere il vostro lavoro. Se le violate, il lavoro dovra' essere rifatto.

### Regola 1: Partite sempre dal template

Non create mai un progetto da zero. Partite sempre dal vertical-template fornito dal team
architettura. Il template contiene gia' tutta la configurazione necessaria.

### Regola 2: Ogni funzionalita' di business = un Modulo separato

Se la vostra applicazione gestisce Ordini, Clienti e Fatture, queste sono **tre moduli
separati**, ognuno nella propria cartella sotto `src/Modules/`:

```
src/Modules/
  Ordini/          <-- tutto cio' che riguarda gli ordini
  Clienti/         <-- tutto cio' che riguarda i clienti
  Fatture/         <-- tutto cio' che riguarda le fatture
```

Un modulo non deve accedere direttamente ai dati di un altro modulo.

### Regola 3: Rispettate la struttura interna dei moduli

Ogni modulo ha **quattro cartelle** con ruoli precisi. Quando chiedete a Claude Code di creare
qualcosa, specificate sempre dove deve andare:

| Cartella | Cosa contiene | In parole semplici |
|---|---|---|
| `Domain/` | Entita', regole, definizioni | "Le cose del mio business e le loro regole" |
| `Application/` | Operazioni e casi d'uso | "Cosa si puo' fare con queste cose" |
| `Infrastructure/` | Salvataggio dati, connessioni esterne | "Come e dove salvo i dati" |
| `Endpoints/` | Punti di accesso API | "Come il frontend chiede i dati al backend" |

### Regola 4: Non mettete logica nei file di sistema

I file `Program.cs` (sia nell'Host che nell'AppHost) sono file di **configurazione**, non di
logica. Non chiedete a Claude Code di mettere regole di business, calcoli o logica complessa
in questi file. Tutta la logica va nei Moduli.

### Regola 5: Nel frontend, usate solo i componenti Seaside

Per tabelle, form, dialog, bottoni e tutti gli elementi visivi, usate i componenti che
iniziano con `<seaside-*>` (ad esempio `<seaside-data-grid>`, `<seaside-dialog>`).

**Non chiedete a Claude Code di installare altre librerie grafiche** come Material, Bootstrap,
PrimeNG o simili. Il design e' gia' gestito dal framework.

### Regola 6: Non modificate i file di framework

Questi file sono gestiti dal team architettura e **non devono essere modificati**:

- `Directory.Build.props`
- `Directory.Packages.props`
- `global.json`
- `nuget.config`
- `.editorconfig`
- Qualsiasi file dentro `ServiceDefaults/`

### Regola 7: Tra moduli, comunicate tramite eventi

Se il modulo Ordini deve informare il modulo Fatture che un ordine e' stato confermato,
**non** deve chiamare direttamente il codice del modulo Fatture. Deve pubblicare un
**evento di integrazione** (Integration Event) che il modulo Fatture riceve in modo autonomo.

Dite a Claude Code: *"Crea un Integration Event per notificare che un ordine e' stato
confermato, seguendo il pattern del SampleModule."*

### Regola 8: Un endpoint = un file

Ogni operazione esposta al frontend deve essere in un file separato nella cartella `Endpoints/`
del modulo. Non accumulate molti endpoint nello stesso file.

### Regola 9: Documentate ogni modulo con SPEC.md

Per ogni modulo che create, dovete avere un file `SPEC.md` nella root del modulo che descrive
cosa fa. Vedete il documento [CONVENZIONI-DOCUMENTAZIONE.md](CONVENZIONI-DOCUMENTAZIONE.md)
per il template da seguire.

### Regola 10: Prima di consegnare, estraete le specifiche

Quando avete finito di lavorare su un modulo o sull'intera applicazione, eseguite il
**prompt di estrazione specifiche** per generare automaticamente un documento che descrive
tutto cio' che avete costruito. Vedete [ESTRAZIONE-SPECIFICHE.md](ESTRAZIONE-SPECIFICHE.md).

---

## 5. Come parlare a Claude Code

Claude Code e' il vostro strumento di lavoro. La qualita' di quello che produce dipende
da **come gli chiedete le cose**. Ecco i pattern che funzionano e quelli da evitare.

### 5.1 Pattern efficaci

#### Creare un nuovo modulo

```
Crea un nuovo modulo business chiamato "Ordini" seguendo esattamente il pattern
del SampleModule gia' presente nel template. Il modulo deve gestire gli ordini
di acquisto con queste informazioni: numero ordine, data, cliente, lista prodotti,
importo totale, stato (bozza, confermato, spedito, completato).
```

#### Aggiungere una funzionalita' a un modulo esistente

```
Nel modulo Ordini, aggiungi la possibilita' di cambiare lo stato di un ordine
da "bozza" a "confermato". Questa operazione deve:
- Verificare che l'ordine sia in stato "bozza"
- Verificare che l'ordine abbia almeno un prodotto
- Aggiornare lo stato a "confermato"
- Pubblicare un evento OrdineConfermatoEvent

Segui il pattern Command/Handler gia' presente nel modulo.
```

#### Creare una pagina frontend

```
Crea una pagina Angular per visualizzare la lista degli ordini.
Usa il componente <seaside-data-grid> per la tabella con le colonne:
numero ordine, data, cliente, importo totale, stato.
Aggiungi un pulsante "Nuovo Ordine" che naviga alla pagina di creazione.
Segui le convenzioni frontend del progetto (standalone, OnPush, signals, lazy loading).
```

#### Aggiungere una regola di business

```
Nel modulo Ordini, aggiungi questa regola di business:
un ordine non puo' essere confermato se l'importo totale supera 10.000 euro
e il cliente non ha un rating di credito sufficiente (campo CreditRating
dell'entita' Cliente nel modulo Clienti).

Nota: siccome il dato del cliente e' in un altro modulo, usa un Integration Event
o un Shared Contract per ottenere l'informazione, non un riferimento diretto.
Documenta questa regola con un commento BUSINESS RULE nel codice.
```

### 5.2 Anti-pattern: cosa NON chiedere

| Richiesta problematica | Perche' e' sbagliata | Cosa chiedere invece |
|---|---|---|
| "Installa Material UI" | Viola Regola 5 (solo componenti Seaside) | "Usa `<seaside-data-grid>` per questa tabella" |
| "Metti tutto in un unico file" | Viola Regola 3 (struttura moduli) | "Segui la struttura Domain/Application/Infrastructure/Endpoints" |
| "Crea il progetto da zero" | Viola Regola 1 (usare il template) | "Aggiungi un modulo al progetto seguendo il SampleModule" |
| "Fai un modulo Ordini che legge direttamente dal DB dei Clienti" | Viola Regola 7 (comunicazione tra moduli) | "Usa un Integration Event per ottenere i dati dal modulo Clienti" |
| "Modifica il file Directory.Build.props" | Viola Regola 6 (file di framework) | "Non serve: le configurazioni di build sono gia' corrette" |
| "Ignora gli errori di compilazione e vai avanti" | Produce codice non funzionante | "Correggi gli errori di compilazione prima di procedere" |

### 5.3 Prompt di contesto utile

Quando iniziate una sessione di lavoro con Claude Code, dategli contesto:

```
Sto lavorando su un'applicazione verticale Seaside. Leggi il file CLAUDE.md
nella root del progetto per le regole architetturali. Poi leggi i file SPEC.md
esistenti nei moduli per capire cosa e' gia' stato costruito.
Oggi voglio lavorare su: [descrizione di cosa volete fare].
```

---

## 6. Gestione dell'esecuzione locale

### 6.1 Avvio e arresto dei servizi

#### Avviare tutto

```bash
# Terminale 1: backend + database + dashboard
dotnet run --project src/AppHost

# Terminale 2: frontend
cd src/Frontend
npm install    # solo la prima volta o dopo modifiche a package.json
npx ng serve
```

#### Fermare tutto

- **Backend**: premete `Ctrl+C` nel terminale dove gira `dotnet run`
- **Frontend**: premete `Ctrl+C` nel terminale dove gira `ng serve`

### 6.2 Verificare che tutto funzioni

| Cosa verificare | Come | Risultato atteso |
|---|---|---|
| Backend in esecuzione | Aprite `https://localhost:18888` | Dashboard Aspire con servizi verdi |
| API funzionanti | Aprite `http://localhost:5100/swagger` | Pagina Swagger con lista endpoint |
| Database attivo | Nella dashboard Aspire, controllate lo stato "sql" | Stato: Running |
| Frontend in esecuzione | Aprite `http://localhost:4200` | Pagina dell'applicazione |

### 6.3 Ricompilare dopo modifiche

- **Backend**: se Claude Code modifica file `.cs`, fermate e riavviate `dotnet run --project src/AppHost`
- **Frontend**: le modifiche ai file `.ts` e `.html` si vedono automaticamente nel browser (hot reload)
- **Database**: se Claude Code ha creato nuove migrazioni, fermate e riavviate il backend

### 6.4 Troubleshooting

| Problema | Causa probabile | Soluzione |
|---|---|---|
| "Porta gia' in uso" | Un'istanza precedente non si e' chiusa | Chiudete tutti i terminali e riavviate |
| "Docker is not running" | Docker Desktop non e' attivo | Avviate Docker Desktop e attendete che sia pronto |
| Build fallita con errori | Claude Code ha generato codice con errori | Chiedete a Claude Code: "Correggi gli errori di compilazione" |
| `npm install` fallisce | Versione di Node.js sbagliata | Verificate `node --version` (deve essere 22+) |
| Frontend non si collega al backend | Backend non avviato o su porta diversa | Avviate prima il backend, poi il frontend |
| "Connection refused" su Swagger | L'AppHost non ha finito di avviarsi | Attendete 30 secondi e riprovate |

### 6.5 Chiedere aiuto a Claude Code per problemi tecnici

Se qualcosa non funziona e non sapete come risolvere:

```
Ho questo errore quando cerco di avviare l'applicazione:
[incollate qui il messaggio di errore]

Aiutami a capire cosa e' andato storto e a risolvere il problema,
rispettando le regole architetturali del progetto.
```

---

## 7. Flusso di lavoro consigliato

Ecco il flusso di lavoro raccomandato per una giornata di vibecoding:

```
1. Avviate Docker Desktop
2. Aprite un terminale nella cartella del progetto
3. Avviate Claude Code: claude
4. Date contesto a Claude Code (vedi Sez. 5.3)
5. Lavorate modulo per modulo:
   a. Descrivete a Claude Code cosa volete costruire
   b. Verificate che compili: dotnet build
   c. Avviate e testate nel browser
   d. Aggiornate il SPEC.md del modulo
6. A fine giornata:
   a. Eseguite il prompt di estrazione specifiche
   b. Committate il lavoro: git add . && git commit -m "descrizione"
   c. Pushate: git push
```

### Frequenza di test

Non aspettate di aver costruito tutto per testare. Dopo ogni funzionalita':

1. Compilate (`dotnet build`)
2. Avviate (`dotnet run --project src/AppHost`)
3. Verificate nel browser che funzioni
4. Se non funziona, chiedete a Claude Code di correggere

---

## 8. Glossario

| Termine | Significato |
|---|---|
| **Verticale** | La vostra applicazione. Si chiama "verticale" perche' e' un prodotto indipendente costruito sopra la piattaforma Seaside |
| **Modulo** | Un'area funzionale della vostra applicazione (es. Ordini, Clienti, Fatture). Ogni modulo e' isolato dagli altri |
| **Endpoint** | Un punto di accesso che il frontend usa per leggere o scrivere dati nel backend |
| **Entita'** | Un concetto del vostro business rappresentato nel codice (es. un Ordine, un Cliente) |
| **Integration Event** | Un messaggio che un modulo invia per informare gli altri moduli che qualcosa e' successo |
| **Template** | Il progetto di partenza gia' pronto fornito dal team architettura |
| **AppHost** | Il componente che orchestra tutti i servizi (database, API, frontend) in locale |
| **Aspire Dashboard** | Il pannello di monitoraggio dove vedete lo stato di tutti i servizi |
| **Swagger** | La pagina dove potete provare le API del backend direttamente dal browser |
| **Build** | Il processo di compilazione che verifica che il codice sia corretto |
| **SPEC.md** | Il documento che descrive cosa fa un modulo, da tenere aggiornato durante lo sviluppo |
| **Domain** | L'area del modulo che contiene le regole di business (le regole del vostro dominio) |
| **Frontend** | La parte visuale dell'applicazione, quella che gli utenti vedono nel browser |
| **Backend** | La parte invisibile che gestisce dati, regole e sicurezza |
