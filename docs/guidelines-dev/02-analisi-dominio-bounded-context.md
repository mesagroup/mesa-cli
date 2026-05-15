# Analisi del dominio e bounded context

Stato: bozza v0.1, 2026-05-15. Audience: dev di ingegnerizzazione, AF, AET.

## Obiettivo

Questa guida descrive come il dev, insieme all'AF, identifica i **bounded
context** del prodotto prima di iniziare l'industrializzazione. L'output e' una
mappa del dominio che guida tutte le scelte strutturali successive: moduli
Hono, schema Postgres, integrazioni cross-context, naming del codice.

Non e' una guida accademica al Domain-Driven Design. E' un protocollo operativo
calibrato sui prototipi `mesa prototype` e sul target architetturale del
prodotto industrializzato (Hexagonal + Vertical Slices + schema-per-modulo).
Si applica a prodotti standalone; quando il prodotto embedda librerie o
componenti di altri sistemi del portfolio (es. SEASYDE), quei punti diventano
integrazioni di contesti esterni, da trattare come ACL o Published Language —
non come parte interna del dominio.

## Perche' prima dei moduli

Il `01-processo-industrializzazione.md` definisce dove arrivare: API Hono
separata, moduli in Vertical Slice, Hexagonal interno, schema Postgres
dedicato per modulo, integration event cross-modulo. Ma non risponde a una
domanda che precede tutto il resto:

> Quanti moduli, con quali nomi, con quali responsabilita'?

Se la risposta arriva dal codice del prototipo, si rischia di:

- ereditare confini casuali nati dal vibecoding;
- ritrovare aggregati impliciti tagliati a meta';
- usare nomi tecnici (`UserService`, `ItemManager`) invece di nomi di dominio;
- creare dipendenze cross-modulo che diventano debito strutturale al primo
  cambio di requisito.

La discovery dei bounded context inverte questa direzione: si parte dal dominio,
si nominano i contesti, si decidono i confini, e **poi** si trasla tutto sulla
struttura del codice. Il prototipo viene usato come fonte di evidenza
(comportamento osservato, casi d'uso validati), non come blueprint.

## Cosa e' un bounded context (definizione operativa)

Per i nostri scopi, un bounded context e' una porzione di dominio dove:

1. **Un termine ha un solo significato.** Se "ordine" significa cose diverse in
   due punti del sistema, sono due contesti.
2. **Le regole di business sono coerenti tra loro.** Se applicare una regola in
   un punto richiede sempre di sapere cose di un altro punto, probabilmente
   sono lo stesso contesto.
3. **Cambia con un ritmo proprio.** Se due funzionalita' evolvono sempre
   insieme per ragioni di business, sono nello stesso contesto. Se evolvono
   indipendentemente, sono contesti diversi.
4. **Ha un linguaggio condiviso interno.** Le persone che lavorano su quel
   pezzo usano gli stessi termini con lo stesso significato.

Un bounded context **non** e':

- una tabella del database;
- un servizio HTTP;
- un microservizio;
- un team.

Puo' diventare ognuna di queste cose come **conseguenza** della scelta di
confine, ma non e' definito da loro.

## Quando fare la discovery

| Situazione | Quando |
| --- | --- |
| Prototipo validato dal PO, primo giro di industrializzazione | Subito dopo la review iniziale, prima della prima PR strutturale |
| Aggiunta di un dominio nuovo a un prodotto esistente | Prima di scrivere il modulo nuovo |
| Integrazione con un altro SAT o sistema esterno | Prima di disegnare l'integration event o l'ACL |
| Dubbio su un confine esistente che si sta rivelando sbagliato | Prima del refactor strutturale, non durante |

Per prototipi piccoli (2-3 use case lineari, un solo dominio evidente) la
sessione e' breve (30-60 min) o si chiude con un ADR che dice "modulo unico,
motivazione X". Il formalismo non e' l'obiettivo; la consapevolezza si'.

## Partecipanti

| Ruolo | Cosa porta |
| --- | --- |
| AF | Contesto funzionale, vocabolario del business, motivazione delle scelte PO |
| Dev di ingegnerizzazione | Lettura del prototipo, vincoli architetturali, traduzione in struttura |
| PO o domain expert (opzionale) | Risoluzione delle ambiguita' di significato che AF non puo' sciogliere |
| AET (su richiesta) | Quando emergono integrazioni cross-SAT o pattern che impattano il portfolio |

Il dev **non** fa la discovery da solo. Anche se conosce bene il dominio,
mancano il vocabolario di business e la legittimazione delle scelte. AF non fa
la discovery da solo: i confini devono atterrare in codice e schema DB.

## Materiale di partenza

Prima della sessione, il dev raccoglie:

- product brief sintetico;
- elenco issue funzionali chiuse del prototipo (cosa fa il sistema oggi);
- elenco issue aperte e debito noto;
- decisioni PO rilevanti;
- repo del prototipo gia' letto in review iniziale.

Niente di tutto questo viene proiettato durante la sessione: serve come
backstop per dirimere dubbi, non come traccia da seguire.

## Leggere il prototipo: preparazione, non conclusione

Il dev che entra in sessione ha gia' letto il prototipo nella review iniziale.
Quella lettura non e' tempo perso: e' il materiale grezzo che rende le domande
piu' affilate. Ma e' materiale **grezzo**, non risposta.

Cosa il dev estrae dal codice **prima** della sessione:

| Categoria | Cosa raccogliere | Come usarlo in sessione |
| --- | --- | --- |
| Entita' osservate | Tabelle Drizzle, tipi TypeScript principali, oggetti con ciclo di vita proprio | Chiedere: "questa entita' esiste nel vocabolario business? Con questo nome?" |
| Nomi ricorrenti | Termini che compaiono in funzioni, tabelle, endpoint | Chiedere: "in business chiamate cosi'? Lo stesso termine ha lo stesso significato dappertutto?" |
| Flussi end-to-end | Sequenze di chiamate per i casi d'uso principali | Disegnare gli eventi dello Step 1 e capire dove cambia il "padrone" del dato |
| Punti di integrazione | Chiamate HTTP esterne, code, librerie verso altri sistemi | Identificare candidati a context boundary o ACL |
| Inconsistenze | Stesso concetto con nomi diversi, o nomi uguali con comportamenti diversi | Chiedere: "questi sono due concetti diversi o uno solo malvestito?" |

Output di questa preparazione: una nota breve, max una pagina, salvata come
`docs/discovery-prep.md` nel branch di lavoro. Non e' un artefatto formale,
serve solo a portare materiale affilato in sessione.

### Evidenza vs. conclusione

La trappola da evitare: trattare i nomi del codice come nomi di bounded
context. Il prototipo nasce dal vibecoding. I suoi nomi vengono dalle issue,
dalle conversazioni informali, dai default dell'AI. Sono **un'ipotesi**, non
una verita'.

Esempi pratici di come si fa la differenza:

- Il codice ha una tabella `users`. **Non** concludere "esiste un bounded
  context Users". Chiedi: in business cosa sono questi `users`? Sono clienti?
  Operatori? Entrambi? E' un contesto o sono due?
- Il codice mescola `orders` e `payments` nello stesso file. **Non**
  concludere "e' un solo contesto". Chiedi: stesso owner? Stesse regole?
  Cambiano con lo stesso ritmo? E' un accoppiamento voluto o un'urgenza del
  prototipo?
- Il codice ha `createOrderAndSendNotification`. **Non** concludere "le
  notifiche sono parte di ordini". Chiedi: chi e' responsabile delle
  notifiche nel business? Cambiano per ragioni diverse dagli ordini?

Il principio: il codice ti dice **cosa il sistema fa oggi**. Il dominio ti
dice **cosa dovrebbe contare**. La discovery e' dove i due si confrontano, e
dove vince il dominio — salvo casi in cui il codice rivela una struttura che
il business non ha ancora articolato, e che merita di essere riportata in
superficie. In quei casi raro ma interessanti, il codice non e' una scorciatoia:
e' un input che fa emergere la conversazione giusta.

## Tecnica: Event Storming lite

Usiamo una versione leggera di Event Storming, calibrata per sessioni da 2-4
ore con 2-4 partecipanti. Strumento: una lavagna virtuale (Miro, FigJam) o
fisica con post-it di tre colori.

### Step 1 — Eventi di dominio (20-40 min)

Ogni partecipante scrive su post-it **arancione** gli eventi rilevanti del
dominio, al passato:

- `Ordine creato`
- `Pagamento incassato`
- `Spedizione confermata`
- `Resoconto generato`

Regole:
- al passato, mai al presente (`Crea ordine` e' un comando, non un evento);
- in linguaggio di business, mai tecnico (`Record inserito in tabella orders`
  non e' un evento di dominio);
- granularita' del business: se un evento esiste perche' "qualcuno se ne
  accorge", e' valido; se esiste solo perche' "lo scrive il codice", e' rumore.

Alla fine si dispongono in ordine temporale grossolano. Non serve precisione,
serve avere il flusso davanti.

### Step 2 — Comandi e attori (20-30 min)

Per ogni evento, si chiede: **chi lo causa, con quale azione?**

Post-it **blu** per i comandi (`Crea ordine`, `Conferma pagamento`), post-it
**giallo** per gli attori (`Cliente`, `Operatore magazzino`, `Sistema
contabile`).

Spesso emerge che eventi vicini hanno attori e comandi diversi. E' il primo
segnale di confine: se due eventi vivono in mondi diversi, sono candidati a
stare in contesti diversi.

### Step 3 — Aggregati e raggruppamenti (30-60 min)

Si raggruppano eventi e comandi attorno alle entita' di business che cambiano
stato (gli aggregati): `Ordine`, `Spedizione`, `Cliente`, `Inventario`.

Si disegnano cerchi attorno ai gruppi e si nominano. Sono i candidati
bounded context.

Domande di verifica per ogni cerchio:

1. Le persone che lavorano su questo pezzo usano gli stessi termini?
2. Una regola business in questo pezzo dipende sempre da informazioni di un
   altro pezzo, o si regge da sola?
3. Se cambio una regola qui, devo per forza cambiarne una altrove?
4. Lo stesso termine compare in due cerchi diversi con significati diversi?

Se la risposta alla 4 e' si', uno dei due ha il nome sbagliato. Si rinomina
prima di procedere — nominare bene **e' meta' del lavoro**.

### Step 4 — Context map (20-40 min)

Per ogni coppia di contesti che si parlano, si decide il tipo di relazione:

| Tipo | Quando usarla | Implicazione in codice |
| --- | --- | --- |
| **Shared Kernel** | Due contesti condividono un nucleo (es. tipi di valore) | Pacchetto condiviso, governance esplicita |
| **Customer / Supplier** | Un contesto serve dati ad altri downstream | API interna versionata, contratto stabile |
| **Conformist** | Il consumer si adatta al modello del producer | Nessun ACL, accoppiamento accettato |
| **Anti-Corruption Layer** | Il consumer protegge il proprio modello da quello del producer | Adapter in `infrastructure/`, traduzione esplicita |
| **Published Language** | Comunicazione via eventi con schema pubblicato | Integration event via Service Bus, schema versionato |
| **Separate Ways** | I contesti non si parlano | Nessuna integrazione |

Per i prodotti SAT, le combinazioni piu' frequenti sono:

- **Published Language** — quando due contesti devono restare disaccoppiati nel
  tempo. E' il default per integration event cross-modulo.
- **Anti-Corruption Layer** — quando il prodotto integra un sistema esterno
  (legacy, terzo, MESAPPA) e non vuole portarsi in casa il suo modello.
- **Customer / Supplier** — tra moduli dello stesso prodotto che hanno
  dipendenza diretta ma controllata.

### Step 5 — Ubiquitous language (20-30 min)

Per ogni bounded context, si scrive un mini-glossario:

```
Context: Ordini
- Ordine: richiesta di acquisto registrata, prima della conferma di pagamento.
- Riga ordine: singola voce dell'ordine, con prodotto e quantita'.
- Bozza: ordine non ancora confermato dal cliente, modificabile.

Context: Spedizioni
- Spedizione: unita' fisica in movimento dal magazzino al cliente.
- Collo: contenitore fisico di una spedizione.
- Tracking ID: identificativo della spedizione presso il corriere.
```

Questi termini sono il contratto: in codice, in DB, nei test, nelle issue.
Niente sinonimi, niente traduzioni libere.

## Mapping sull'architettura target

Una volta che la mappa e' stabile, si traduce in struttura:

### Da bounded context a modulo Hono

Ogni bounded context diventa un modulo nell'API Hono:

```
apps/api/src/
  modules/
    orders/
      domain/
      application/
      infrastructure/
      endpoints/
    shipments/
      domain/
      application/
      infrastructure/
      endpoints/
    inventory/
      domain/
      application/
      infrastructure/
      endpoints/
```

Le regole architetturali del `01-processo-industrializzazione.md` si
applicano **dentro ogni modulo**, non tra moduli.

### Da bounded context a schema Postgres

Ogni contesto possiede uno schema Postgres dedicato:

```sql
-- migrations/orders/0001_init.sql
CREATE SCHEMA IF NOT EXISTS orders;
CREATE TABLE orders.orders (...);
CREATE TABLE orders.order_lines (...);

-- migrations/shipments/0001_init.sql
CREATE SCHEMA IF NOT EXISTS shipments;
CREATE TABLE shipments.shipments (...);
CREATE TABLE shipments.parcels (...);
```

Niente join cross-schema. Se il modulo `shipments` ha bisogno di un dato di
`orders`, lo chiede via API interna o lo riceve via integration event e ne
mantiene una proiezione locale.

### Da context map a integrazioni

| Relazione in context map | Implementazione tecnica |
| --- | --- |
| Published Language | Outbox nel modulo producer → Service Bus topic → Inbox nel modulo consumer; schema evento versionato |
| Anti-Corruption Layer | Adapter in `infrastructure/<contesto-esterno>/`, traduzione esplicita verso il `domain/` locale |
| Customer / Supplier | API interna HTTP con contratto OpenAPI e versioning; chiamata via repository del consumer |
| Shared Kernel | Pacchetto pnpm condiviso (`packages/shared-<nome>`) con solo tipi e value object, mai logica di business |

### Da ubiquitous language a naming

I termini del glossario si trasferiscono come tali:

- entita' e value object nel `domain/` portano il nome di dominio
  (`Order`, `OrderLine`, `Draft`, non `OrderEntity` o `OrdersDTO`);
- tabelle Postgres portano lo stesso nome al plurale (`orders.orders`,
  `orders.order_lines`);
- use case nell'`application/` portano il nome del comando di dominio
  (`ConfirmOrderCommand`, `CreateOrderDraftCommand`).

Se in codice compare un nome che non e' nel glossario, e' una di queste cose:
manca dal glossario (aggiungerlo), e' un sinonimo (rinominare), e' rumore
tecnico che non dovrebbe stare nel domain (spostarlo o eliminarlo).

## Segnali di confini sbagliati

Durante o dopo la discovery, questi segnali indicano che i confini vanno
rivisti:

- **Un comando attraversa sempre due contesti per completarsi.** Probabilmente
  e' un solo contesto travestito.
- **Stesso termine, stesso significato, in due contesti.** Uno dei due lo sta
  prendendo in prestito senza dichiararlo.
- **Un contesto non ha eventi propri, riceve solo da altri.** Forse e' una
  proiezione, non un contesto.
- **Tutti i moduli leggono da uno schema "comune".** Quel comune e' un
  contesto travestito da utility.
- **Il context map ha tutti contro tutti.** Probabilmente i confini sono
  troppo fini; si valuta consolidamento.

Quando uno di questi segnali emerge, si torna allo step rilevante e si rinomina
o si ridisegna prima di chiudere il documento.

## Output: `docs/domain-map.md`

Al termine della sessione, il dev scrive `docs/domain-map.md` nel repo del
prodotto, con struttura:

```markdown
# Domain map — <nome prodotto>

Versione: 1. Aggiornato: YYYY-MM-DD.

## Bounded context

### Orders
Responsabilita': gestione del ciclo di vita dell'ordine dalla bozza alla conferma.
Owner: SAT <nome>.
Modulo: apps/api/src/modules/orders.
Schema DB: orders.

Ubiquitous language:
- Ordine: ...
- Bozza: ...

### Shipments
...

## Context map

| Producer | Consumer | Relazione | Meccanismo |
| --- | --- | --- | --- |
| Orders | Shipments | Published Language | Evento `OrderConfirmed` via Service Bus |
| Orders | Inventory | Customer/Supplier | API interna `GET /internal/orders/:id` |
| MESAPPA-host | Orders | ACL | Adapter `infrastructure/mesappa/` |

## Decisioni aperte

- [ ] Confine tra Orders e Billing: in discussione con AET, vedi ADR-0004.
- [ ] Inventory: candidato a diventare bounded context separato quando arrivera' il caso d'uso multi-magazzino.
```

Il documento e' vivo: si aggiorna a ogni cambio di confine. Se il cambio e'
strutturale (es. split di un contesto in due, cambio del meccanismo di
integrazione), si produce un ADR.

## Anti-pattern

- Trasformare la lettura del prototipo in una discovery solitaria. Il codice
  prepara le domande; la decisione vive nella sessione con AF e domain expert.
- Usare i nomi delle tabelle del prototipo come nomi dei bounded context senza
  questionarli. I nomi del prototipo sono ipotesi, non vocabolario di dominio.
- Decidere i confini in base a "quanti microservizi voglio" invece che al
  dominio.
- Saltare lo step di ubiquitous language perche' "tanto i nomi li mettiamo
  dopo". I nomi sono **il** lavoro, non un dettaglio finale.
- Confondere modulo, microservizio e bounded context. Il modulo e' l'unita' di
  codice; il microservizio e' l'unita' di deploy; il bounded context e'
  l'unita' di significato. Iniziamo dal terzo.
- Dichiarare un bounded context "tecnico" (es. `notifications`, `audit`)
  quando in realta' e' una capability trasversale. Le capability trasversali
  stanno in `platform/` o in un modulo dedicato senza pretendere di essere
  domini.
- Trattare il `domain-map.md` come documentazione morta. Se non viene
  aggiornato a ogni cambio di confine, smette di essere utile in 6 mesi.
