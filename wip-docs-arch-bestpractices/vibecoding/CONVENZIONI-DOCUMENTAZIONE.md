# Convenzioni di Documentazione per il Vibecoding

> Questo documento definisce le convenzioni da seguire **durante** lo sviluppo per rendere
> il codice tracciabile e ricostruibile dal team di architettura.
> Destinatari: business analyst e domain expert che usano Claude Code.

---

## 1. Perche' documentare durante lo sviluppo

Quando vibecodate un'applicazione, il codice prodotto da Claude Code funziona, ma senza
documentazione strutturata il team di architettura non puo':

- Capire **cosa** avete costruito senza leggere ogni riga di codice
- Verificare se il comportamento corrisponde ai requisiti di business
- Ricostruire l'applicazione con standard di produzione
- Identificare regole di business nascoste nel codice

Le convenzioni in questo documento risolvono il problema. Richiedono **pochi minuti** per
modulo e producono un enorme valore per chi deve lavorare sul vostro codice dopo di voi.

---

## 2. SPEC.md: il documento di specifica del modulo

Ogni modulo che create deve avere un file `SPEC.md` nella sua cartella principale.

### Dove si trova

```
src/Modules/
  Ordini/
    SPEC.md              <-- questo file
    Domain/
    Application/
    Infrastructure/
    Endpoints/
    DependencyInjection.cs
```

### Template da usare

Copiate questo template e compilatelo per ogni modulo. Potete chiedere a Claude Code
di crearlo per voi: *"Crea il SPEC.md per il modulo Ordini usando il template standard."*

```markdown
# [Nome Modulo]

> Ultima modifica: [data]
> Autore: [il vostro nome]

## Scopo

[Descrivete in 2-3 frasi cosa fa questo modulo. Quale problema di business risolve?]

## Attori

[Chi usa le funzionalita' di questo modulo? Elencate i ruoli coinvolti.]

| Attore | Cosa puo' fare |
|---|---|
| [Ruolo 1] | [Azioni consentite] |
| [Ruolo 2] | [Azioni consentite] |

## Flussi principali

[Descrivete i flussi di lavoro principali, passo per passo.]

### Flusso: [Nome del flusso]

1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

### Flusso: [Nome di un altro flusso]

1. [Passo 1]
2. ...

## Regole di business

[Elencate TUTTE le regole di business implementate in questo modulo.
Siate specifici: condizioni, limiti, vincoli, calcoli.]

| ID | Regola | Dettaglio |
|---|---|---|
| BR-01 | [Nome regola] | [Descrizione precisa] |
| BR-02 | [Nome regola] | [Descrizione precisa] |

## Dati gestiti

[Descrivete le entita' (i "concetti" del vostro business) e i loro campi.]

### Entita': [NomeEntita']

| Campo | Tipo | Obbligatorio | Note |
|---|---|---|---|
| [Nome campo] | Testo / Numero / Data / ... | Si/No | [Vincoli o note] |

### Entita': [AltraEntita']

| Campo | Tipo | Obbligatorio | Note |
|---|---|---|---|

## Endpoint esposti

[Elencate le operazioni che il frontend puo' chiamare.]

| Metodo | Percorso | Descrizione | Chi puo' usarlo |
|---|---|---|---|
| GET | /api/[modulo] | Elenca tutti gli elementi | [Ruolo] |
| GET | /api/[modulo]/{id} | Dettaglio di un elemento | [Ruolo] |
| POST | /api/[modulo] | Crea un nuovo elemento | [Ruolo] |
| PUT | /api/[modulo]/{id} | Aggiorna un elemento | [Ruolo] |
| DELETE | /api/[modulo]/{id} | Elimina un elemento | [Ruolo] |

## Schermate frontend

[Descrivete le pagine dell'interfaccia utente collegate a questo modulo.]

| Pagina | Percorso URL | Descrizione |
|---|---|---|
| Lista | /[modulo] | Tabella con tutti gli elementi, filtri, paginazione |
| Dettaglio | /[modulo]/:id | Visualizzazione e modifica di un singolo elemento |
| Creazione | /[modulo]/nuovo | Form per creare un nuovo elemento |

## Dipendenze da altri moduli

[Se questo modulo interagisce con altri moduli, descrivete come.]

| Modulo | Tipo di interazione | Descrizione |
|---|---|---|
| [NomeAltroModulo] | Integration Event | Riceve l'evento [NomeEvento] quando [cosa succede] |
| [NomeAltroModulo] | Shared Contract | Usa l'interfaccia [NomeContratto] per [cosa fa] |

Se non ci sono dipendenze: "Questo modulo e' completamente autonomo."

## Note e decisioni

[Annotate qui decisioni prese durante lo sviluppo, dubbi aperti,
compromessi, cose da migliorare.]

- [Nota 1]
- [Nota 2]
```

### Come mantenerlo aggiornato

- Createlo appena iniziate un nuovo modulo (anche con informazioni parziali)
- Aggiornatelo ogni volta che aggiungete una funzionalita' o una regola
- Dopo ogni sessione di lavoro, chiedete a Claude Code:
  *"Aggiorna il SPEC.md del modulo [Nome] con le modifiche che abbiamo fatto oggi."*

---

## 3. Commenti BUSINESS RULE nel codice

Ogni regola di business implementata nel codice deve essere preceduta da un commento
con il marcatore `BUSINESS RULE:`. Questo permette al team di architettura di trovare
tutte le regole rapidamente con una ricerca automatica.

### Come chiedere a Claude Code

Ogni volta che implementate una regola di business, dite:

```
Implementa questa regola e aggiungi un commento BUSINESS RULE prima della logica
che la implementa.
```

### Esempio nel codice

```csharp
// BUSINESS RULE: Un ordine non puo' essere confermato se non ha almeno un prodotto
if (ordine.Prodotti.Count == 0)
    return Result.Failure(OrdineErrors.NessunProdotto);

// BUSINESS RULE: L'importo totale non puo' superare il limite di credito del cliente
if (ordine.ImportoTotale > limiteCredito)
    return Result.Failure(OrdineErrors.SuperatoLimiteCredito);
```

```typescript
// BUSINESS RULE: L'utente non puo' modificare un ordine in stato "completato"
if (this.ordine().stato === 'completato') {
  this.notification.warning('Non e\' possibile modificare un ordine completato');
  return;
}
```

### Formato del commento

```
// BUSINESS RULE: [Descrizione breve della regola]
```

Regole:
- Sempre su una riga singola
- Sempre in italiano (e' documentazione di dominio)
- Sempre prima del codice che implementa la regola
- Il testo deve descrivere la regola, non il codice

---

## 4. Commenti INTEGRATION nel codice

Quando un modulo comunica con un altro tramite eventi, marcate il punto con `INTEGRATION:`.

### Esempio

```csharp
// INTEGRATION: Notifica gli altri moduli che un ordine e' stato confermato
// Consumato da: modulo Fatture (crea fattura automatica), modulo Magazzino (riserva stock)
await messageBus.PublishAsync(new OrdineConfermatoIntegrationEvent
{
    OrdineId = ordine.Id,
    ClienteId = ordine.ClienteId,
    ImportoTotale = ordine.ImportoTotale,
    DataConferma = DateTime.UtcNow
});
```

---

## 5. Naming: usate il linguaggio del business

I nomi nel codice devono riflettere il linguaggio che usate quotidianamente nel vostro lavoro,
non termini tecnici generici.

### Esempi

| Sbagliato (generico) | Corretto (dominio) |
|---|---|
| `Item` | `Ordine`, `Fattura`, `Prodotto` |
| `Data` | `DataConferma`, `DataScadenza`, `DataEmissione` |
| `Process()` | `ConfermaOrdine()`, `EmettiFattura()` |
| `Status` | `StatoOrdine`, `StatoFattura` |
| `Type` | `TipoProdotto`, `CategoriaCliente` |
| `Value` | `ImportoTotale`, `PrezzoUnitario` |
| `List1`, `List2` | `OrdiniAttivi`, `FattureScadute` |
| `HandleData()` | `CalcolaImportoTotale()`, `VerificaDisponibilita()` |

### Come chiedere a Claude Code

```
Usa nomi in italiano che riflettano il linguaggio del dominio di business.
Ad esempio: "Ordine" invece di "Order", "ConfermaOrdine" invece di "ProcessItem",
"ImportoTotale" invece di "Value".
```

**Eccezione**: i nomi tecnici del framework restano in inglese (es. `Endpoint`, `Handler`,
`Repository`, `DbContext`). Solo i nomi di dominio sono in italiano.

---

## 6. SPEC.md per il frontend

Se il modulo ha una parte frontend significativa, aggiungete una sezione dedicata nel
SPEC.md oppure create un file `SPEC.md` separato nella cartella della feature frontend.

```
src/Frontend/src/app/features/
  ordini/
    SPEC.md              <-- specifiche del frontend per gli ordini
    pages/
    services/
    ordini.routes.ts
```

### Template frontend

```markdown
# Frontend: [Nome Feature]

## Pagine

### [Nome Pagina]

- **URL**: /[percorso]
- **Descrizione**: [cosa mostra la pagina]
- **Dati mostrati**: [quali informazioni sono visibili]
- **Azioni disponibili**: [cosa puo' fare l'utente]
- **Componenti Seaside usati**: [lista componenti <seaside-*> utilizzati]

## Flussi utente

### [Nome Flusso]

1. L'utente [azione]
2. Il sistema [reazione]
3. ...

## Validazioni lato frontend

| Campo | Regola | Messaggio di errore |
|---|---|---|
| [Campo] | [Regola] | [Messaggio mostrato] |
```

---

## 7. Checklist di documentazione

Prima di considerare un modulo completato, verificate:

- [ ] Il file `SPEC.md` esiste nella root del modulo backend
- [ ] Tutti i flussi principali sono descritti
- [ ] Tutte le regole di business sono elencate nella tabella e marcate con `BUSINESS RULE:` nel codice
- [ ] Tutte le entita' sono descritte con i loro campi
- [ ] Tutti gli endpoint sono elencati
- [ ] Le dipendenze da altri moduli sono documentate
- [ ] I punti di integrazione sono marcati con `INTEGRATION:` nel codice
- [ ] I nomi nel codice riflettono il linguaggio del business
- [ ] Se c'e' un frontend, le pagine e i flussi utente sono descritti
