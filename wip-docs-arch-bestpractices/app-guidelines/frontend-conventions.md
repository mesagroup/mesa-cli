# Convenzioni frontend -- Regole per i team verticali

> Riferimento architetturale: ADB Cap. 4, 10, decisioni D-10, D-11, D-80

---

## 1. Stack tecnologico

| Tecnologia | Versione | Note |
|---|---|---|
| Angular | 21+ | D-10 CONFERMATA |
| TypeScript | strict mode obbligatorio | |
| Component library | `@seaside/components` (wrapper) | **Mai** importare ng-zorro o Syncfusion direttamente |
| Theming | `@seaside/theming` | Vedi [theming.md](theming.md) |
| Shell | `@seaside/shell` | Layout, navigation, session handling |
| Unit test | Jest | D-80 CONFERMATA |
| E2E test | Playwright | D-80 CONFERMATA |

---

## 2. TypeScript

### 2.1 Strict mode

Il `tsconfig.json` del verticale deve estendere quello del framework con `strict: true`. Non disattivare:

```json
{
  "extends": "@seaside/tsconfig/base.json",
  "compilerOptions": {
    "strict": true
  }
}
```

### 2.2 No `any`

Non usare `any`. Alternative:

| Invece di | Usa |
|---|---|
| `any` | Il tipo specifico, un'interfaccia, o un generic `<T>` |
| `any[]` | `unknown[]` se il tipo non e' noto, poi type-guard |
| `(data: any) => void` | `(data: unknown) => void` con narrowing |

### 2.3 Naming

| Elemento | Convenzione | Esempio |
|---|---|---|
| Classi, interfacce, tipi | PascalCase | `UserProfile`, `DataGridConfig` |
| Variabili, funzioni | camelCase | `currentUser`, `loadData()` |
| File | kebab-case | `user-profile.component.ts` |
| Costanti | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

Le interfacce **non** hanno il prefisso `I` (convenzione Angular).

---

## 3. Componenti Angular

### 3.1 Standalone

Ogni componente e' standalone. Non creare NgModules:

```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [SeasideDataGridComponent, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-component.component.html',
})
export class MyComponentComponent { }
```

### 3.2 OnPush change detection

**Obbligatorio** per tutti i componenti. Usare `ChangeDetectionStrategy.OnPush`.

Conseguenze:
- Usare `async` pipe o Angular Signals per dati reattivi
- Non mutare oggetti/array in-place: creare copie (`[...array]`, `{...obj}`)
- Usare `signal()` e `computed()` dove appropriato

### 3.3 Signals

Usare Angular Signals per stato locale del componente:

```typescript
export class MyComponent {
  readonly items = signal<Item[]>([]);
  readonly selectedItem = signal<Item | null>(null);
  readonly itemCount = computed(() => this.items().length);
}
```

### 3.4 Lazy loading

Tutte le route del verticale devono essere lazy-loaded:

```typescript
export const routes: Routes = [
  {
    path: 'orders',
    loadComponent: () => import('./orders/order-list.component')
      .then(m => m.OrderListComponent),
  },
];
```

---

## 4. Componenti del framework

### 4.1 Usare solo `<seaside-*>`

I verticali usano **esclusivamente** i componenti wrapper del framework:

| Componente framework | Uso |
|---|---|
| `<seaside-data-grid>` | Tabelle dati con sorting, filtering, paginazione |
| `<seaside-form>` | Form con validazione, dirty state, salvataggio |
| `<seaside-dialog>` | Dialog/modal |
| `<seaside-select>` | Select dropdown |
| `<seaside-date-picker>` | Date picker |
| `<seaside-chart>` | Grafici (Syncfusion) |
| `<seaside-notification>` | Toast e notifiche |

### 4.2 Non importare le librerie sottostanti

Questi import sono **vietati** nel codice del verticale:

```typescript
// VIETATO
import { NzTableModule } from 'ng-zorro-antd/table';
import { GridModule } from '@syncfusion/ej2-angular-grids';

// CORRETTO
import { SeasideDataGridComponent } from '@seaside/components';
```

### 4.3 Non fare override di stili dei componenti framework

```scss
// VIETATO
::ng-deep seaside-data-grid .ant-table-header { ... }

// CORRETTO: usare i design token per influenzare il tema
:root {
  --seaside-color-primary: #2E7BAF;
}
```

---

## 5. Convenzioni UX

Il framework definisce standard UX che i verticali devono rispettare per coerenza tra app:

| Pattern | Standard |
|---|---|
| **Form** | Validazione inline (errore sotto il campo), dirty state tracking, conferma uscita se modifiche non salvate |
| **Tabelle/Grid** | Paginazione server-side, sorting per colonna, filtering, selezione righe, export CSV |
| **Feedback successo** | Toast (notifica temporanea in alto a destra) |
| **Conferme distruttive** | Dialog modale con testo esplicito ("Sei sicuro di voler eliminare X?") |
| **Errori di campo** | Messaggio inline sotto il campo (rosso) |
| **Loading** | **Spinner** per tutte le operazioni di caricamento. Skeleton screen come evoluzione futura |
| **Empty states** | Messaggio descrittivo + azione suggerita ("Nessun ordine trovato. Crea il primo ordine.") |
| **Errori pagina** | Pagine standard 404, 500, 403 fornite dal framework |
| **Navigazione** | Breadcrumb automatico, menu laterale, deep linking |

---

## 6. I18n

### 6.1 Nessun testo hardcoded

Tutti i testi visibili all'utente devono essere esternalizzati per la traduzione,
anche se al momento l'app e' solo in una lingua.

Il framework usa **Angular built-in i18n** (`@angular/localize`).

**Nei template**, usare l'attributo `i18n`:

```html
<!-- VIETATO -->
<button>Salva</button>

<!-- CORRETTO -->
<button i18n="@@actions.save">Salva</button>
```

**Nel codice TypeScript**, usare `$localize`:

```typescript
const label = $localize`:@@actions.save:Salva`;
```

**Pluralizzazione** con ICU message format nativo:

```html
<span i18n>
  {count, plural, =0 {Nessun elemento} one {1 elemento} other {{{count}} elementi}}
</span>
```

### 6.2 Formattazione

- Date: usare `DatePipe` con locale Angular (non moment.js, non formattazione manuale)
- Numeri: usare `DecimalPipe` con locale
- Valute: usare `CurrencyPipe` con locale
- Plurali: ICU message format nativo di Angular (vedi sopra)

### 6.3 RTL

Il framework supporta lingue RTL (arabo, ebraico). Per i componenti custom:
- Usare CSS logical properties (`margin-inline-start` invece di `margin-left`)
- Non hardcodare direzione (no `text-align: left`, usare `text-align: start`)
- Testare i componenti con `dir="rtl"` su `<html>`

---

## 7. State management

**Decisione confermata**: servizi Angular con Signals (ADB Cap. 10.13).

| Tipo di stato | Dove | Come |
|---|---|---|
| Stato locale componente | Nel componente | `signal()`, `computed()` |
| Stato condiviso tra componenti | Servizio Angular `@Injectable` | `signal()` nel servizio, esposto come `readonly` |
| Stato server (dati API) | Fetch on navigate | Chiamata API ad ogni navigazione |
| Stato persistente (preferenze) | `localStorage` via `SeasideStorageService` | Lingua, density, sidebar state |

**Regole:**
- **Nessuna libreria di state management** (NgRx, Akita, NGXS) senza approvazione del team framework
- Preferire **Signals** rispetto a `BehaviorSubject` per nuovo codice
- Minimizzare lo stato globale: preferire dati freschi dal server (fetch on navigate)
- I servizi espongono solo Signals `readonly` — le mutazioni avvengono tramite metodi del servizio

---

## 8. Test

### 8.1 Unit test (Jest)

- Ogni componente custom ha almeno un test di rendering
- Ogni servizio ha test per i metodi pubblici
- Naming: `should [comportamento atteso] when [condizione]`
- Copertura target: > 80%

### 8.2 E2E test (Playwright)

- Almeno un test per ogni flusso critico dell'app (login, CRUD principale, navigazione)
- Test di accessibilita' con `@axe-core/playwright` su pagine principali

### 8.3 Test a11y

Vedi [accessibility.md](accessibility.md) Sez. 6.

---

## 9. Checklist per code review

- [ ] TypeScript strict, zero `any`
- [ ] Tutti i componenti standalone + OnPush
- [ ] Nessun import diretto di ng-zorro / Syncfusion
- [ ] Nessun `::ng-deep` su componenti `<seaside-*>`
- [ ] Route lazy-loaded
- [ ] Testi esternalizzati con `i18n` / `$localize` (Angular built-in i18n)
- [ ] Colori e spacing via design token
- [ ] Test presenti per componenti e servizi custom
- [ ] Convenzioni UX rispettate (loading, empty states, feedback)
