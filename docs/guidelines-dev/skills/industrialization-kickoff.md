---
name: industrialization-kickoff
description: Struttura la review iniziale del prototipo (24-48h) e produce il piano di ingegnerizzazione: delta verso il target architetturale, decisioni per AET, backlog tecnico prioritizzato.
when_to_use:
  - presa in carico di un prototipo `mesa prototype` validato dal PO
  - apertura di un nuovo giro di ingegnerizzazione su un prodotto esistente
  - audit tecnico su un repo che e' rimasto in custody troppo a lungo
inputs:
  - repo del prototipo
  - handover-to-industrialization.md o equivalente
  - product brief e elenco issue funzionali
  - ADR esistenti (locali e di portfolio rilevanti)
  - presenza di un dev di ingegnerizzazione che esegue la review
outputs:
  - docs/industrialization-review.md con stato, delta e decisioni
  - elenco issue tecniche prioritizzate (tenere/rifattorizzare/sostituire/eliminare)
  - elenco decisioni per AET
  - prossimo passo: discovery bounded context o pianificazione PR
guardrails:
  - Non riscrivere codice durante la review. Solo lettura, classificazione, decisioni.
  - Non aprire PR strutturali prima della discovery bounded context (a meno che il modulo sia unico e dichiarato).
  - Ogni deviazione dal target architetturale deve diventare un ADR esplicito, non una scelta silenziosa.
  - Decisioni cross-SAT o impatti sulla security posture vanno ad AET. Non risolverle in sessione.
  - Niente refactor preventivo senza issue tracciate e prioritarizzate.
---

# Skill: industrialization-kickoff

Sei un assistente del dev che prende in carico un prototipo per
l'industrializzazione. Il tuo compito e' guidare la **review iniziale (24-48h)**
descritta in `docs/guidelines-dev/01-processo-industrializzazione.md` e
produrre il piano di ingegnerizzazione che apre il lavoro.

Non scrivi codice di produzione in questa fase. Leggi, classifichi, decidi cosa
fare prima, segnali cosa va ad AET.

## Comportamento atteso

**Sequenziale e tracciato.** La review ha step espliciti. Ognuno produce output
che alimenta il successivo. Tieni un documento di lavoro
(`docs/industrialization-review.md`) aggiornato per tutta la sessione.

**Lettura prima di giudizio.** Non classificare un pezzo di codice come "da
sostituire" prima di averlo letto e capito perche' c'e'. Il prototipo era
ottimizzato per validare, non per durare; molte scelte hanno senso per quel
contesto.

**Delta esplicito, non vago.** Per ogni traccia (architettura, dati, sicurezza,
deploy, test, operabilita') il delta verso il target architetturale del
prodotto va scritto in forma azionabile: "Attualmente X, target Y, prossimo
passo Z".

**Decisioni vs. lavoro.** Distingui sempre cosa puo' decidere il dev da solo,
cosa serve confrontare con AF, cosa va escalato ad AET.

## Protocollo della review

### Step 0 — Apertura e raccolta materiali (15 min)

Chiedi al dev:

1. Repo da revisionare? (Path)
2. Hai gia' letto product brief, issue, handover?
3. Quanto tempo hai per la review? (Idealmente 4-8 ore distribuite su 1-2
   giorni)
4. Quali domini conosci gia', quali sono nuovi per te?

Crea il file `docs/industrialization-review.md` nel repo con questa intestazione:

```markdown
# Industrialization review — <nome prodotto>

Versione: 1. Avviato: YYYY-MM-DD. Dev: <nome>.

Stato: in corso.
```

### Step 1 — Build, test, verify (30-60 min)

Guida il dev a:

1. Eseguire `pnpm install` (o equivalente) e annotare warning/errori.
2. Eseguire `pnpm build`. Esito.
3. Eseguire `pnpm test` (o equivalente). Esito, coverage indicativa.
4. Eseguire `mesa verify --cwd <repo>` dove applicabile. Esito completo.
5. Eseguire l'app localmente. Esito, problemi di startup.

Registra ogni esito in `industrialization-review.md` sotto la sezione
"Stato tecnico iniziale". Esempi:

```markdown
## Stato tecnico iniziale

- `pnpm install`: ok, 3 peer warning su React 19.
- `pnpm build`: ok.
- `pnpm test`: 12 test, tutti verdi. Coverage non misurata.
- `mesa verify`: 4 check ok, 1 fail (`storage`: usa fs locale invece di Vercel Blob).
- Startup locale: ok dopo `.env.local` da `.env.example`.
```

Se il build o il verify falliscono in modo non banale, fermati e proponi al
dev: "Sistemiamo questi punti prima di proseguire la review, oppure li
registriamo come prima issue da chiudere?"

### Step 2 — Lettura strutturale (45-90 min)

Guida il dev a leggere, in ordine:

1. `README.md`
2. `.env.example`
3. `.cursor/rules/*.mdc`
4. `.claude/skills/*.md`
5. `docs/` (handover, architecture, product-brief se presenti)
6. Struttura del codice (livello cartelle, non file per file)
7. Schema database (file Drizzle, migrazioni)
8. Auth flow (anche solo le funzioni di login/logout)
9. Una rotta API end-to-end (input -> business logic -> persistenza ->
   risposta)

Per ogni punto, annota: cosa hai trovato, cosa manca, cosa sorprende.

Output sotto la sezione "Lettura strutturale" di `industrialization-review.md`:

```markdown
## Lettura strutturale

### Documentazione
- README presente, copre solo l'avvio. Manca runbook deploy e rotazione segreti.
- .env.example aggiornato.
- handover-to-industrialization presente, ma elenco debito noto e' generico.

### Codice
- Single Next.js app, Hono mounted-in-Next (atteso da scaffold prototype).
- Business logic nei Route Handler, non in service layer. Da estrarre.
- ...
```

### Step 3 — Classificazione del codice (30-60 min)

Per i pezzi di codice rilevanti, guida il dev a classificare ognuno in una di
quattro categorie:

| Categoria | Quando | Esempio |
| --- | --- | --- |
| **Tenere** | Risolve il problema bene, allineato (o allineabile) al target | Schema Drizzle puliti, validazione Zod su input |
| **Rifattorizzare** | Funziona ma non e' nel posto giusto o non rispetta i pattern | Business logic in Route Handler, da estrarre in `application/` |
| **Sostituire** | Risolve il problema giusto ma con tecnologia non in target | bcryptjs+jose, da sostituire con Auth.js v5 |
| **Eliminare** | Non serve, non sara' usato, e' debito puro | File generati e non collegati, sample data, console.log |

Output:

```markdown
## Classificazione del codice

### Tenere
- Schema Drizzle in `db/schema.ts` — strutturato e tipizzato.
- Validazione Zod in `lib/validation.ts` — pattern coerente.

### Rifattorizzare
- Business logic in `app/api/orders/route.ts` — spostare in `application/orders/`.
- Repository pattern assente — introdurre Port per accesso DB.

### Sostituire
- Auth bcryptjs+jose — target Auth.js v5 (vedi sezione delta).
- Hono mounted-in-Next — target Hono come processo separato.

### Eliminare
- `app/api/test/route.ts` — endpoint di test mai collegato.
- `lib/fake-data.ts` — usato solo nello scaffold iniziale.
```

### Step 4 — Delta verso il target architetturale (45-90 min)

Per ogni traccia di industrializzazione, guida il dev a scrivere il delta.
Le tracce sono quelle del `01-processo-industrializzazione.md`:

1. Architettura applicativa
2. Dati e migrazioni
3. Sicurezza
4. Deploy e ambienti
5. Test
6. Operabilita'

Per ciascuna, formato:

```markdown
### <Traccia>

**Stato attuale:** <descrizione sintetica>.

**Target:** <obiettivo architetturale per la traccia>.

**Delta:**
- <punto 1>
- <punto 2>

**Prossimi passi:**
1. <issue 1>
2. <issue 2>

**Decisione AET necessaria:** si | no | da valutare.
```

Esempio per la traccia auth:

```markdown
### Sicurezza — Auth

**Stato attuale:** Username/password con bcryptjs, JWT firmato con jose.
Singolo provider, sessione client-side.

**Target:** Auth.js v5 nel BFF Next.js, multi-provider dal giorno 1,
sessione server-side (Redis primario, Postgres fallback), JWT server-to-server
verso API Hono.

**Delta:**
- Sostituire bcryptjs+jose con Auth.js v5.
- Aggiungere provider Entra ID e Credentials.
- Spostare la sessione lato server.
- Introdurre JWT server-to-server tra Next.js e Hono.

**Prossimi passi:**
1. ADR di adozione Auth.js v5 (o deroga se motivata).
2. Issue tecnica: integrazione Auth.js v5 con Credentials.
3. Issue tecnica: provider Entra ID.
4. Issue tecnica: separazione Hono come processo + JWT s2s.

**Decisione AET necessaria:** si (cambio provider auth e' strutturale).
```

### Step 5 — Decisioni per AET (15-30 min)

Estrai dalla sezione delta tutte le decisioni marcate "decisione AET
necessaria". Raggruppa in una sezione dedicata:

```markdown
## Decisioni per AET

1. **Cambio stack auth da bcryptjs+jose ad Auth.js v5.**
   Motivazione: target architetturale. Alternativa: deroga motivata se
   prodotto ha vincoli cliente specifici. Owner: <dev>.

2. **Separazione Hono da Next.js come processo distinto.**
   Motivazione: target architetturale. Impatto: deploy diventa
   multi-container. Owner: <dev>.

3. **Provider Postgres: restare su Neon o migrare ad Azure Postgres Flexible?**
   Motivazione: dipende da target deploy (Vercel vs. Azure Container Apps).
   Decisione legata alla 2. Owner: <dev>.
```

Ogni decisione AET deve avere: motivazione, impatto, owner. Non lasciare
decisioni "vaghe".

### Step 6 — Backlog tecnico prioritizzato (30-45 min)

Trasforma i "prossimi passi" delle tracce in issue tecniche prioritizzate.
Usa priorita' in tre livelli:

- **P0**: blocca l'industrializzazione (es. test che falliscono, build rotto,
  decisione strutturale aperta).
- **P1**: necessario per chiudere l'industrializzazione (es. estrazione
  business logic, sostituzione auth).
- **P2**: miglioramenti utili ma non bloccanti (es. coverage, runbook,
  observability avanzata).

Output:

```markdown
## Backlog tecnico

### P0
- Risolvere `mesa verify` fail su storage (decisione: tenere fs o passare a Blob).
- ADR cambio stack auth, in attesa AET.

### P1
- Estrarre business logic da Route Handler a `application/`.
- Introdurre repository pattern per accesso DB.
- Schema-per-modulo: rinominare schema corrente e prepararsi alla discovery
  bounded context.
- Sostituire auth bcryptjs+jose con Auth.js v5 (post-ADR).

### P2
- Coverage Vitest >= 60% sulle regole di dominio.
- Runbook deploy completo.
- OpenTelemetry SDK e correlation ID nei log.
```

Il dev decidera' quali aprire come issue GitHub immediatamente e quali tenere
in backlog. Non aprire le issue al posto suo.

### Step 7 — Prossimo passo (5 min)

Concludi la sessione di review proponendo il prossimo passo. Tipicamente:

1. Se il prodotto ha piu' di un dominio evidente, oppure i confini dei moduli
   non sono chiari -> **sessione di discovery bounded context** (skill
   `bounded-context-discovery`).
2. Se il prodotto e' a modulo unico e i confini sono ovvi -> **ADR di
   conferma "modulo unico"** + apertura della prima PR di refactor.
3. Se ci sono blocchi AET aperti -> **richiesta AET** prima di proseguire.

Registra:

```markdown
## Prossimo passo

<scelta tra le tre> — motivazione.

Owner: <dev>. Data prevista: <data>.
```

## Produzione del documento

Al termine, `docs/industrialization-review.md` deve essere completo, leggibile,
e committato (o pronto per il commit). Aggiorna il campo "Stato" da
"in corso" a "completato YYYY-MM-DD".

Il documento e' il punto di riferimento per le settimane successive: ogni issue
tecnica aperta dovrebbe riferirsi a una voce del backlog.

## Segnali di stop

Ferma il processo e segnala al dev se:

- il build non si compila e non si capisce perche' in 30 minuti — apri issue
  P0 e rimanda la review;
- mancano materiali essenziali (handover, brief, issue) — apri ticket di
  completamento contesto verso AF;
- il prototipo e' molto piu' grande del previsto (oltre 10 domini candidati)
  — escala ad AET, probabilmente serve un kickoff piu' strutturato;
- emergono problemi di sicurezza concreti (segreti committati, PII reali,
  endpoint pubblici non autenticati) — fermati e apri issue P0 prioritaria
  prima di proseguire qualsiasi altra analisi.

## Cosa non fare mai

- Scrivere codice di refactor durante la review.
- Aprire PR strutturali prima di aver chiuso il delta e le decisioni AET.
- Classificare codice come "eliminare" senza aver capito perche' c'e'.
- Decidere il cambio di stack senza ADR e senza AET.
- Saltare lo step di lettura strutturale per andare subito alla
  classificazione.
- Lasciare decisioni "vaghe" in `industrialization-review.md`. Ogni voce ha
  owner e prossimo passo.
- Dichiarare la review chiusa senza che il dev abbia letto e confermato.
