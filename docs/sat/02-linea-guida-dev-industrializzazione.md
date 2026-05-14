# Linea guida dev per industrializzazione

Stato: bozza v0.1. Audience: dev di ingegnerizzazione, dev di prototipazione,
AF, Tester funzionale e AET.

## Obiettivo

Questa guida descrive come prendere in carico un prototipo generato con
`mesa-cli` e trasformarlo in un prodotto industrializzabile. Il prototipo serve
a validare il comportamento; l'industrializzazione deve rendere quel
comportamento manutenibile, testabile, sicuro e rilasciabile.

## Input atteso

Prima di iniziare, il dev deve ricevere dall'AF:

- repo del prototipo;
- issue funzionali con Acceptance Criteria e casi di test;
- product brief e decisioni PO rilevanti;
- elenco debito tecnico e funzionale noto;
- env richiesti, senza segreti reali;
- esito di demo o validazione PO;
- eventuali decisioni AET gia' prese.

Se questi elementi mancano, non si blocca tutto per formalismo: si apre una
issue di completamento contesto e si chiarisce con AF cosa serve prima delle
scelte irreversibili.

## Review iniziale

Nelle prime 24-48 ore il dev fa una review tecnica esplicita:

1. esegue install, build e test disponibili;
2. esegue `mesa verify --cwd <repo>` dove applicabile;
3. legge `.cursor/rules`, `.claude/skills`, `README.md` e `.env.example`;
4. classifica il codice in quattro categorie: tenere, rifattorizzare,
   sostituire, eliminare;
5. identifica decisioni strutturali da portare ad AET;
6. apre o aggiorna ADR per le decisioni non banali.

La review produce una lista breve di issue tecniche prioritarie, non una
riscrittura preventiva del prototipo.

## Lock architetturale di partenza

Per `mesa prototype`, lo stack iniziale atteso e':

- frontend Next.js 15 App Router;
- API Hono montata in Next.js;
- database Neon Postgres;
- ORM Drizzle;
- storage Vercel Blob;
- auth username/password con hash bcryptjs e JWT jose;
- deploy Vercel tramite GitHub Actions manuale (`workflow_dispatch`);
- ambienti preview e production separati.

Il dev puo' proporre deviazioni solo con una ragione scritta e review AET.
Il lock serve a proteggere il carico cognitivo del SAT e a ridurre drift tra
prodotti.

## Tracce di industrializzazione

### Architettura applicativa

- Routes sottili: parsing input, chiamata a service, risposta JSON.
- Business logic in `services/`.
- Accesso dati in repository, ORM o modulo DB dedicato.
- REST come default: risorse al plurale, metodi HTTP coerenti, errori JSON.
- Nessuna GraphQL o alternativa strutturale senza approvazione AET.

### Dati e migrazioni

- Niente SQLite per nuovi prodotti.
- Schema versionato tramite Drizzle o tooling previsto dallo scaffold.
- Migrazioni provate su branch o ambiente preview prima della produzione.
- Dati reali e PII fuori dal repo.

### Sicurezza

- Nessun segreto in source.
- `.env.example` documenta le variabili, non i valori reali.
- Input esterno validato con Zod o meccanismo equivalente nello scaffold.
- Password solo hashate.
- JWT validato su ogni endpoint protetto.
- Errori client senza stack trace o dettagli interni.

### Deploy e ambienti

- Preview e production sono ambienti distinti.
- Deploy automatico su push/PR disabilitato, salvo decisione AET diversa.
- Il go/no-go di release resta governato dal SAT.
- I segreti sono scoping per ambiente in Vercel/GitHub/Azure, non duplicati nel
  codice.

### Test

- Unit test per regole di business pure.
- Integration test per route principali: happy path, validazione, auth, errori.
- Test funzionali manuali o E2E sui journey critici.
- Nessuna issue passa a done se gli Acceptance Criteria non hanno evidenza di
  test.

### Operabilita'

- Health endpoint sempre presente.
- Runbook minimo per avvio locale, deploy, rollback e debug env.
- Logging senza token, password o PII.
- Errori ricorrenti e debito operativo trasformati in issue.

## Collaborazione nel SAT

- AF: chiarisce comportamento, priorita', out of scope e criteri di rilascio.
- Dev: decide implementazione ordinaria, test tecnici e qualita' production.
- Tester: verifica end-to-end rispetto agli Acceptance Criteria.
- AET: entra su scelte strutturali, blocchi tecnici non sciolti in circa due
  giorni, review greenfield e pattern cross-SAT.
- PO: decide priorita' strategiche e casi limite di business.

Le code review ordinarie restano nel SAT. Le decisioni che cambiano stack,
deployment, dati, sicurezza o pattern condivisi vanno ad AET.

## Definition of Done per industrializzazione

Una feature o un incremento e' industrializzato quando:

- gli Acceptance Criteria sono soddisfatti;
- test automatici o manuali sono tracciati;
- build e test passano;
- `mesa verify` passa o le eccezioni sono motivate;
- env e segreti sono documentati correttamente;
- eventuali migrazioni sono versionate e provate;
- README/runbook/manuale funzionale sono aggiornati;
- debito residuo e' scritto in issue, con priorita' e owner.

## Anti-pattern

- Riscrivere tutto prima di aver misurato il debito reale.
- Accettare scelte provvisorie del prototipo come architettura di produzione.
- Aprire PR grandi che mischiano refactor, feature e migrazioni.
- Usare AET come code review ordinaria.
- Mettere deploy, env o segreti "a mano" senza documentazione.
- Chiudere una issue funzionale senza coinvolgere il tester quando previsto.

