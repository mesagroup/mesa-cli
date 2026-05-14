# Linea guida AF per prototipazione vibecoded

Stato: bozza v0.1. Audience: Analista Funzionale, Tester funzionale, PO e dev
di prototipazione nel SAT.

## Obiettivo

Questa guida descrive come un AF avvia e governa un nuovo prototipo partendo da
uno scaffold della CLI. Il prototipo non e' un esperimento isolato: e' il primo
pezzo tracciabile del prodotto, destinato a essere validato, rifinito e poi
industrializzato dal SAT.

Il principio operativo e' semplice: Claude propone, l'AF decide. La CLI crea il
perimetro tecnico iniziale; l'AF mantiene allineati backlog, criteri di
accettazione, manuale funzionale, decisioni PO e readiness per i dev.

## Quando usare quale scaffold

| Caso | Comando consigliato | Uso |
| --- | --- | --- |
| Nuovo prodotto web greenfield | `mesa prototype <nome> -y` | Default per prototipi Next.js + Hono + Neon + Drizzle + Blob + auth, con Aspire e deploy Azure via GitHub Actions preconfigurate |
| Prototipo greenfield senza creazione repo GitHub | `mesa prototype <nome> -y --no-github` | Utile in esplorazione locale o quando il repo viene creato a parte |
| Plugin MESAPPA on-prem | `mesa init <nome> --type pluginonprem` | Plugin Express + Angular + SQL Server + Aspire |
| Plugin MESAPPA SaaS | `mesa init <nome> --type pluginsaas` | Azure Functions + Angular + Azure SQL |

Regola pratica: per nuovi prodotti prototipati dal SAT, partire da
`mesa prototype`. Gli scaffold plugin servono quando il vincolo MESAPPA on-prem
o SaaS e' gia' noto.

## Prima del comando

Prima di generare il repo, l'AF prepara un minimo di contesto tracciabile:

- nome prodotto in kebab-case;
- SAT proprietario e modalita' prodotto: stream, custody, maintenance o sunset;
- PO di riferimento e canale operativo del SAT;
- obiettivo del prototipo in una frase;
- utenti o ruoli coinvolti;
- 3-7 casi d'uso iniziali;
- vincoli noti su dati, integrazioni, privacy, clienti, ambienti;
- criteri di successo della demo;
- rischi o decisioni da portare ad AET.

Per iniziative greenfield, va prevista una review AET prima del kick-off tecnico
se lo scaffold standard non copre il caso oppure se esistono integrazioni,
vincoli dati o scelte infrastrutturali strutturali.

## Flusso operativo

1. Genera lo scaffold:

   ```bash
   mesa prototype <nome-prodotto> -y
   ```

2. Apri o fai aprire il repo GitHub. Il prodotto deve avere un repo principale:
   codice, manuali, configurazioni, issue e decisioni operative vivono li'.

3. Crea le prime issue funzionali usando il body standard:

   - `## In sintesi`
   - `## Obiettivo`
   - `## Contesto`
   - `## Decisioni vincolanti`
   - `## Comportamento funzionale`
   - `## Acceptance Criteria`
   - `## Casi di test`
   - `## Out of scope`
   - `## Definition of Done`
   - `## Collegamenti`

4. Per ogni sessione di vibecoding, lavora issue per issue. Il prompt deve dare
   a Claude/Cursor un confine preciso:

   ```text
   Implementa solo la issue #123. Rispetta gli Acceptance Criteria e non
   modificare parti fuori scope. Aggiorna test e documentazione toccati dalla
   modifica. Prima di chiudere, esegui build/test disponibili e segnala eventuali
   limiti.
   ```

5. Dopo ogni iterazione, l'AF valida il comportamento, non la bellezza del codice.
   I dev o AET entrano quando emergono decisioni tecniche strutturali.

6. Se la issue cambia un comportamento utente, aggiorna nello stesso giro il
   manuale funzionale o almeno lascia una issue docs collegata.

7. Prima della demo, prepara una release candidata con issue incluse, issue
   escluse, rischi noti e casi di test eseguiti.

## Definition of Ready del prototipo

Un prototipo e' pronto per essere lavorato quando:

- esiste un repo generato da CLI;
- le issue iniziali hanno Acceptance Criteria e casi di test;
- i dati necessari sono fittizi o autorizzati;
- gli env richiesti sono documentati in `.env.example`;
- le decisioni PO prese fuori da GitHub sono riportate nel repo;
- i vincoli architetturali non standard sono stati esplicitati ad AET.

## Definition of Done del prototipo

Un prototipo e' pronto per la validazione del SAT quando:

- i casi d'uso concordati sono dimostrabili;
- `README.md` spiega come avviare il progetto;
- `.env.example` e la documentazione env non contengono segreti reali;
- il backlog distingue issue done, aperte, bloccate e fuori scope;
- i test minimi o manuali sono tracciati;
- `mesa verify --cwd <repo>` e' stato eseguito dove applicabile;
- il debito noto e' scritto, non solo raccontato a voce.

## Passaggio AF-prototipo verso industrializzazione

Il passaggio non e' un handoff secco. L'AF resta custode del contesto
funzionale mentre i dev trasformano il prototipo in prodotto robusto.

Il pacchetto minimo per i dev include:

- repo aggiornato;
- elenco issue chiuse, aperte, bloccate e fuori scope;
- product brief sintetico;
- criteri di successo validati dal PO;
- ADR o note decisionali gia' prese;
- elenco integrazioni e dati usati;
- matrice env senza segreti;
- rischi, debito noto e scelte provvisorie;
- evidenza di build/test/verify eseguiti;
- manuale funzionale o issue docs collegate.

## Errori da evitare

- Lasciare decidere a Claude scope, priorita' o classificazione.
- Prototipare fuori dalle issue e poi ricostruire il backlog dopo.
- Tenere decisioni PO solo in Teams o in call.
- Committare `.env`, token, dataset reali o PII.
- Sostituire AET con decisioni architetturali improvvisate.
- Considerare il prototipo "quasi prodotto" senza test, env, deploy e runbook.
- Fare partire i dev senza una lista chiara di debito e scelte provvisorie.
