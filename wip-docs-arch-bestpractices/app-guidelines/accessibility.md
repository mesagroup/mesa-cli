# Accessibilita' (a11y) -- Regole per i team verticali

> Riferimento architetturale: ADB Cap. 10.5
> Target: **WCAG 2.1 livello AA**

---

## 1. Principio

L'accessibilita' e' un **vincolo non negoziabile**. Tutti i componenti -- sia quelli del framework
sia quelli custom delle app -- devono rispettare WCAG 2.1 AA.

Il framework fornisce 4 livelli di enforcement. I verticali **ereditano** i primi 2 livelli
automaticamente e sono **responsabili** di applicare i livelli 3 e 4 ai propri componenti custom.

---

## 2. Cosa il framework fornisce gratis

I componenti `@seaside/components` (`<seaside-data-grid>`, `<seaside-form>`, `<seaside-dialog>`, etc.)
includono:

- ARIA roles, labels, attributi gia' integrati
- Keyboard navigation (Tab, Enter, Escape, frecce)
- Focus management: focus trapping nei dialog/modal, focus restore alla chiusura
- Live regions (`aria-live`) per feedback dinamico (toast, errori, loading)
- Skip links nella shell per navigazione rapida

Se l'app usa **solo** componenti framework, l'a11y base e' coperta senza sforzo aggiuntivo.

---

## 3. Cosa deve fare il team verticale

### 3.1 Componenti custom

Ogni componente custom dell'app deve rispettare:

#### Requisiti obbligatori

| Requisito | Dettaglio | WCAG |
|---|---|---|
| **Label per ogni input** | Ogni `<input>`, `<select>`, `<textarea>` ha un `<label>` associato via `for`/`id` o `aria-label` | 1.3.1, 4.1.2 |
| **Alt text per immagini** | Ogni `<img>` ha `alt` (vuoto `alt=""` per immagini decorative) | 1.1.1 |
| **Contrasto testo** | Ratio minimo 4.5:1 per testo normale, 3:1 per testo grande (>18pt o >14pt bold) | 1.4.3 |
| **Contrasto UI** | Ratio minimo 3:1 per bordi, icone, controlli interattivi vs sfondo | 1.4.11 |
| **Keyboard navigabile** | Ogni elemento interattivo raggiungibile e attivabile da tastiera | 2.1.1 |
| **Focus visibile** | L'indicatore di focus deve essere visibile (non nascondere `outline`) | 2.4.7 |
| **No trappole di focus** | Il focus non deve mai rimanere intrappolato (eccezione: dialog modali con focus trapping esplicito) | 2.1.2 |
| **Heading gerarchia** | Usare `<h1>`-`<h6>` in ordine logico, senza salti | 1.3.1 |
| **Lingua** | `lang` attribute su `<html>`. Se un blocco e' in lingua diversa, `lang` sul blocco | 3.1.1, 3.1.2 |

#### Click events

Ogni `(click)` su un elemento non-nativo (non `<button>`, non `<a>`) deve avere:
- `(keydown.enter)` e/o `(keydown.space)` equivalente
- `role="button"` o il ruolo ARIA appropriato
- `tabindex="0"` per renderlo focusabile

Oppure, preferibilmente: usare `<button>` o `<a>` nativi.

#### Tabindex

- **Mai** usare `tabindex` positivo (`tabindex="1"`, `tabindex="5"`, etc.)
- Usare `tabindex="0"` per aggiungere un elemento al tab order naturale
- Usare `tabindex="-1"` per rendere un elemento focusabile programmaticamente ma non nel tab order

### 3.2 Form

Per form custom (non generate dal framework `<seaside-form>`):

| Requisito | Dettaglio |
|---|---|
| Label associata | Ogni campo ha `<label for="...">` |
| Errori associati | `aria-describedby` che punta al messaggio di errore |
| Errori annunciati | Il contenitore errori ha `aria-live="polite"` per annunciare a screen reader |
| Campo obbligatorio | `aria-required="true"` + indicatore visivo (non solo asterisco) |
| Raggruppamenti | `<fieldset>` + `<legend>` per gruppi logici (es. radio buttons, sezioni) |
| Stato invalido | `aria-invalid="true"` su campi con errore |

### 3.3 SPA navigation

Angular non gestisce automaticamente il focus al cambio route. Il verticale deve:

1. Spostare il focus al contenuto principale dopo navigazione (o al titolo della pagina)
2. Annunciare il cambio pagina tramite `aria-live` region (il framework fornisce un servizio
   `RouteAnnouncerService` in `@seaside/shell` -- usarlo)
3. Aggiornare il `<title>` della pagina ad ogni route change

### 3.4 Contenuto dinamico

Per aggiornamenti asincroni (loading, notifiche, aggiornamenti dati):

- Usare `aria-live="polite"` per aggiornamenti non urgenti (dati caricati, successo)
- Usare `aria-live="assertive"` solo per errori critici o timeout
- Loading spinner/skeleton: aggiungere `aria-busy="true"` sul contenitore e annunciare "Caricamento in corso"
- Quando il caricamento finisce: annunciare "Contenuto caricato" o il risultato

---

## 4. Dark mode e contrasto

Se l'app ha dark mode abilitato:

- **Tutti** i colori custom devono garantire WCAG AA in entrambi i temi
- Non usare colori hardcoded: usare i token `--seaside-color-*` che si adattano automaticamente
- Immagini con trasparenza: verificare che funzionino su sfondo chiaro e scuro
- Loghi: fornire variante light/dark, o usare un logo che funziona su entrambi

### Come verificare il contrasto

- In sviluppo: usare le DevTools del browser (Chrome Accessibility pane mostra il ratio)
- Strumenti: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Il framework fornira' una utility per validare i token di tema al build time

---

## 5. Zoom 200%

Il layout dell'app deve essere usabile con zoom al 200% (WCAG 1.4.4):

- Nessun contenuto tagliato o sovrapposto
- Nessun scroll orizzontale a 320px CSS (equivalente a zoom 400% su viewport 1280px -- WCAG 1.4.10)
- Testare su viewport 1280x1024 con zoom 200%

---

## 6. Test richiesti

### 6.1 Test automatici (CI -- obbligatori)

Ogni componente custom deve avere un test `expectAccessible()`:

```typescript
import { expectAccessible } from '@seaside/testing';

it('should be accessible', async () => {
  const fixture = TestBed.createComponent(MyCustomComponent);
  fixture.componentInstance.data = mockData;
  fixture.detectChanges();
  await expectAccessible(fixture);
});
```

Questo esegue axe-core e fallisce per violazioni WCAG AA.

### 6.2 Lint (CI -- obbligatorio)

Le regole `@angular-eslint` a11y sono gia' configurate nel pacchetto ESLint del framework e sono **errori**:

- `accessibility-alt-text`
- `accessibility-elements-content`
- `accessibility-label-for`
- `accessibility-table-scope`
- `click-events-have-key-events`
- `no-positive-tabindex`
- `accessibility-valid-aria`

Il verticale **non puo' disattivare** queste regole.

### 6.3 Lighthouse CI (CI -- obbligatorio)

La CI include un check Lighthouse che misura l'accessibility score. Soglia minima: **90/100**.

> **Nota**: Lighthouse copre un sottoinsieme di WCAG. Score 90 non garantisce accessibilita' completa.
> I livelli 6.4 e 6.5 colmano il gap.

### 6.4 Test manuali con screen reader (raccomandato)

Per ogni release, testare i flussi principali con almeno un screen reader:

| OS | Screen reader |
|---|---|
| Windows | NVDA (gratuito) |
| macOS | VoiceOver (integrato) |

Flussi da testare:
- Login
- Navigazione menu principale
- Apertura e compilazione form
- Lettura di una tabella dati
- Ricezione notifica

### 6.5 Test con keyboard-only (raccomandato)

Navigare l'intera app senza mouse. Verificare:
- Tutti gli elementi interattivi sono raggiungibili con Tab
- L'ordine di focus e' logico (segue l'ordine visivo)
- Dialog e dropdown sono utilizzabili (Escape per chiudere, frecce per navigare)
- Nessun focus trap involontario

---

## 7. Checklist per code review

- [ ] Ogni `<img>` ha `alt`
- [ ] Ogni input ha label associata
- [ ] Nessun `tabindex` positivo
- [ ] Ogni `(click)` su non-button ha `(keydown)` + `role` + `tabindex="0"`
- [ ] Heading in ordine logico (h1 > h2 > h3, senza salti)
- [ ] `aria-live` per aggiornamenti asincroni
- [ ] Focus gestito dopo navigazione route
- [ ] Nessun `outline: none` senza alternativa visibile
- [ ] Contrasto verificato in tema chiaro e scuro
- [ ] Test `expectAccessible()` presente per ogni componente custom
- [ ] Colori via token, non hardcoded
