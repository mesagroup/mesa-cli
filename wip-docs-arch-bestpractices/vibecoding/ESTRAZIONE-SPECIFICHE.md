# Estrazione Automatica delle Specifiche Funzionali

> Questo documento contiene i **prompt** da eseguire in Claude Code per generare
> automaticamente la documentazione funzionale della vostra applicazione.
> Destinatari: business analyst e domain expert che usano Claude Code.

---

## 1. Quando usare questi prompt

| Momento | Prompt da usare |
|---|---|
| Fine lavoro su un modulo | **Prompt 2**: estrazione per singolo modulo |
| Fine sprint / milestone | **Prompt 1**: estrazione globale |
| Prima di consegnare al team architettura | **Prompt 1** + **Prompt 3** (confronto) |
| Dubbio su cosa e' stato implementato | **Prompt 2** sul modulo in questione |

---

## 2. Prompt 1: Estrazione globale dell'applicazione

Copiate e incollate questo prompt in Claude Code quando volete generare il documento
completo di tutte le specifiche funzionali dell'applicazione.

### Il prompt

````
Analizza l'intera codebase di questa applicazione verticale Seaside e genera un documento
FUNCTIONAL-SPEC.md nella root del progetto. Il documento deve descrivere TUTTO cio' che
e' stato implementato, dal punto di vista funzionale (non tecnico).

Segui questa struttura esatta:

# Specifiche Funzionali - [Nome Applicazione]

> Documento generato automaticamente il [data odierna]
> Generato da: analisi automatica della codebase

## Panoramica applicazione

[Descrivi in 3-5 frasi cosa fa l'applicazione nel suo complesso, basandoti sui moduli presenti]

## Moduli implementati

[Per ogni cartella sotto src/Modules/, crea una sezione con:]

### Modulo: [Nome]

#### Scopo
[Descrivi cosa fa il modulo basandoti sulle entita', gli handler e gli endpoint]

#### Entita' e dati gestiti
[Per ogni classe nella cartella Domain/Entities/, elenca:]
- Nome entita'
- Campi (nome, tipo, se obbligatorio)
- Relazioni con altre entita' dello stesso modulo

#### Regole di business
[Cerca TUTTI i commenti "BUSINESS RULE:" nel codice del modulo e riportali qui.
Cerca anche regole implementate nei Validator e negli Handler anche se non hanno il commento.]

| ID | Regola | File sorgente |
|---|---|---|
| BR-01 | [testo della regola] | [percorso del file] |

#### Operazioni disponibili (endpoint)
[Per ogni file nella cartella Endpoints/, descrivi:]

| Operazione | Metodo HTTP | Percorso | Cosa fa | Validazioni |
|---|---|---|---|---|
| [Nome] | GET/POST/PUT/DELETE | /api/... | [descrizione] | [regole di validazione] |

#### Eventi pubblicati
[Cerca le classi che terminano con IntegrationEvent o Event nel modulo e in Contracts/]

| Evento | Quando viene pubblicato | Dati contenuti |
|---|---|---|

#### Eventi consumati
[Cerca gli EventHandler nel modulo]

| Evento ricevuto | Cosa fa quando lo riceve |
|---|---|

## Frontend

[Per ogni cartella sotto src/Frontend/src/app/features/, descrivi:]

### Feature: [Nome]

#### Pagine
| Pagina | URL | Descrizione | Componenti Seaside usati |
|---|---|---|---|

#### Flussi utente
[Descrivi i flussi utente principali osservando i template HTML e la logica dei componenti]

#### Validazioni frontend
[Elenca le validazioni presenti nei form]

## Mappa delle dipendenze tra moduli

[Crea una tabella che mostra quali moduli comunicano tra loro e come:]

| Modulo sorgente | Modulo destinazione | Tipo comunicazione | Evento/Contratto |
|---|---|---|---|

## Stato del database

[Per ogni DbContext trovato, elenca:]
- Nome del DbContext
- Tabelle gestite
- Numero di migrazioni presenti

## Riepilogo quantitativo

| Metrica | Valore |
|---|---|
| Numero moduli | [conta] |
| Numero entita' totali | [conta] |
| Numero endpoint totali | [conta] |
| Numero regole di business documentate | [conta] |
| Numero eventi di integrazione | [conta] |
| Numero pagine frontend | [conta] |

---

Istruzioni aggiuntive:
- Scrivi tutto in italiano
- Descrivi le funzionalita' dal punto di vista dell'utente, non del programmatore
- Se trovi codice senza SPEC.md o senza commenti BUSINESS RULE, analizza comunque
  il codice e deduci le regole dalla logica implementata
- Segnala alla fine eventuali incongruenze trovate (es. endpoint senza frontend,
  entita' senza endpoint, regole nel codice non documentate nel SPEC.md)
````

### Cosa produce

Un file `FUNCTIONAL-SPEC.md` nella root del progetto che il team di architettura puo'
leggere per capire esattamente cosa avete costruito.

---

## 3. Prompt 2: Estrazione per singolo modulo

Usate questo prompt quando volete estrarre le specifiche di un solo modulo.

### Il prompt

````
Analizza il modulo [NOME_MODULO] che si trova in src/Modules/[NOME_MODULO]/ e
aggiorna (o crea) il file SPEC.md nella root del modulo.

Procedi cosi':

1. Leggi il SPEC.md esistente (se presente) come punto di partenza
2. Analizza TUTTO il codice del modulo:
   - Domain/Entities/ -> entita' e campi
   - Domain/ValueObjects/ -> value objects
   - Domain/Events/ -> domain events
   - Domain/Abstractions/ -> interfacce (ports)
   - Application/ -> handler, command, query, validator
   - Infrastructure/ -> implementazioni, DbContext, migrazioni
   - Endpoints/ -> API esposte
3. Cerca TUTTI i commenti "BUSINESS RULE:" e "INTEGRATION:"
4. Analizza anche la parte frontend correlata in:
   src/Frontend/src/app/features/[nome-feature-correlata]/
5. Produci il SPEC.md aggiornato usando il template standard (vedi sotto)

Il template standard per SPEC.md e' definito in docs/vibecoding/CONVENZIONI-DOCUMENTAZIONE.md.
Se non riesci a leggerlo, usa questa struttura:
- Scopo
- Attori
- Flussi principali
- Regole di business (tabella con ID, regola, dettaglio)
- Dati gestiti (entita' con campi)
- Endpoint esposti
- Schermate frontend
- Dipendenze da altri moduli
- Note e decisioni

IMPORTANTE:
- Se trovi regole nel codice che non erano nel SPEC.md precedente, aggiungile
  e segnalale con "[NUOVA]" nella colonna note
- Se trovi voci nel SPEC.md precedente che non corrispondono al codice,
  segnalale con "[DA VERIFICARE]"
- Scrivi tutto in italiano
````

---

## 4. Prompt 3: Confronto SPEC.md vs codice

Usate questo prompt prima della consegna per verificare che la documentazione
corrisponda a cio' che e' effettivamente nel codice.

### Il prompt

````
Esegui un confronto completo tra i file SPEC.md e il codice effettivamente
implementato in questa applicazione.

Per ogni modulo in src/Modules/:

1. Leggi il SPEC.md del modulo
2. Analizza il codice del modulo
3. Produci un report di confronto

Genera un file CONFRONTO-SPEC.md nella root del progetto con questa struttura:

# Confronto Specifiche vs Implementazione

> Generato il [data odierna]

## Modulo: [Nome]

### Regole di business

| ID da SPEC.md | Presente nel codice? | Note |
|---|---|---|
| BR-01: [regola] | SI / NO / PARZIALE | [dettaglio] |

### Regole nel codice ma non in SPEC.md

| Regola trovata | File | Riga |
|---|---|---|
| [descrizione] | [percorso] | [numero riga] |

### Endpoint

| Endpoint da SPEC.md | Presente nel codice? | Note |
|---|---|---|
| GET /api/... | SI / NO | [dettaglio] |

### Endpoint nel codice ma non in SPEC.md

| Endpoint trovato | File |
|---|---|
| [metodo + percorso] | [percorso file] |

### Entita'

| Entita' da SPEC.md | Presente nel codice? | Campi corrispondono? |
|---|---|---|
| [Nome] | SI / NO | SI / PARZIALE / NO |

### Pagine frontend

| Pagina da SPEC.md | Presente nel codice? |
|---|---|
| [Nome pagina] | SI / NO |

---

## Riepilogo

| Metrica | Valore |
|---|---|
| Moduli con SPEC.md | [N] su [totale] |
| Regole documentate e implementate | [N] |
| Regole documentate ma non implementate | [N] |
| Regole implementate ma non documentate | [N] |
| Endpoint documentati e implementati | [N] |
| Endpoint non documentati | [N] |

## Azioni richieste

[Elenca le azioni necessarie per allineare documentazione e codice]

1. [Azione 1]
2. [Azione 2]
````

### Come interpretare il risultato

- **Regole documentate ma non implementate**: forse le avete descritte nel SPEC.md ma non
  le avete ancora chieste a Claude Code. Implementatele o rimuovetele dal SPEC.md.
- **Regole implementate ma non documentate**: Claude Code ha aggiunto logica che non avete
  documentato. Aggiungetele al SPEC.md.
- **Endpoint non documentati**: pagine o API che esistono nel codice ma non nel SPEC.md.

---

## 5. Prompt 4: Generazione del documento di consegna

Usate questo prompt quando dovete consegnare il lavoro al team di architettura.

### Il prompt

````
Genera un documento di consegna completo per il team di architettura.
Scrivi il file CONSEGNA.md nella root del progetto.

Il documento deve contenere:

# Documento di Consegna

> Applicazione: [Nome]
> Data: [data odierna]
> Autore: [chiedimi il nome]

## 1. Panoramica

[Descrivi in un paragrafo cosa fa l'applicazione]

## 2. Moduli implementati

[Per ogni modulo, riassumi in 3-5 righe: scopo, entita' principali, operazioni chiave]

## 3. Architettura rispettata

Verifica e riporta per ogni punto:

| Regola architetturale | Rispettata? | Note |
|---|---|---|
| Struttura hexagonal (Domain/Application/Infrastructure/Endpoints) | SI/NO | |
| Nessun riferimento diretto tra moduli | SI/NO | |
| Componenti frontend solo @seaside/* | SI/NO | |
| File di framework non modificati | SI/NO | |
| Integration Events per comunicazione tra moduli | SI/NO | |
| SPEC.md presente per ogni modulo | SI/NO | |
| Commenti BUSINESS RULE presenti | SI/NO | |

Per verificare:
- Controlla che nessun file in Directory.Build.props, Directory.Packages.props,
  global.json, nuget.config sia stato modificato rispetto al template originale
- Controlla che non ci siano import di ng-zorro-antd o @syncfusion/* nel codice
  del verticale (devono passare tutti da @seaside/components)
- Controlla che nessun modulo abbia un ProjectReference verso un altro modulo

## 4. Regole di business complete

[Raccogli TUTTE le regole di business da tutti i SPEC.md e dal codice
(commenti BUSINESS RULE) in un'unica tabella ordinata per modulo]

| Modulo | ID | Regola | Implementata |
|---|---|---|---|

## 5. Mappa delle integrazioni

[Diagramma delle comunicazioni tra moduli]

## 6. Istruzioni per l'esecuzione locale

```
dotnet run --project src/AppHost
cd src/Frontend && npm install && npx ng serve
```

- Dashboard Aspire: https://localhost:18888
- Swagger API: http://localhost:5100/swagger
- Frontend: http://localhost:4200

## 7. Problemi noti e decisioni aperte

[Elenca eventuali problemi, compromessi, cose lasciate incomplete,
decisioni che richiedono input dal team architettura]

## 8. Prossimi passi suggeriti

[Cosa manca, cosa andrebbe migliorato, cosa andrebbe rivisto]
````

---

## 6. Riepilogo dei prompt

| # | Nome | Quando usarlo | File prodotto |
|---|---|---|---|
| 1 | Estrazione globale | Fine sprint, consegna | `FUNCTIONAL-SPEC.md` |
| 2 | Estrazione modulo | Fine lavoro su un modulo | `src/Modules/[Nome]/SPEC.md` |
| 3 | Confronto | Prima della consegna | `CONFRONTO-SPEC.md` |
| 4 | Documento di consegna | Consegna al team architettura | `CONSEGNA.md` |

### Ordine consigliato prima della consegna

1. Per ogni modulo, eseguite il **Prompt 2** (estrazione per modulo)
2. Eseguite il **Prompt 1** (estrazione globale)
3. Eseguite il **Prompt 3** (confronto) e risolvete le incongruenze
4. Eseguite il **Prompt 4** (documento di consegna)
5. Committate tutto e pushate

---

## 7. Cosa consegnare al team di architettura

Al termine del lavoro, il vostro repository deve contenere:

```
MioProdotto/
  FUNCTIONAL-SPEC.md         <-- generato dal Prompt 1
  CONSEGNA.md                <-- generato dal Prompt 4
  src/
    Modules/
      Ordini/
        SPEC.md              <-- mantenuto durante lo sviluppo + aggiornato dal Prompt 2
        ...
      Clienti/
        SPEC.md
        ...
    Frontend/
      src/app/features/
        ordini/
          SPEC.md            <-- opzionale, per feature frontend complesse
        ...
```

Il team di architettura usera' questi documenti per:

1. **Validare** che il comportamento corrisponda ai requisiti
2. **Ricostruire** l'applicazione con standard di produzione
3. **Identificare** le regole di business per i test automatici
4. **Pianificare** il lavoro di refactoring e hardening
