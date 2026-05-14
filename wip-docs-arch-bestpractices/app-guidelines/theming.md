# Theming -- Regole per i team verticali

> Riferimento architetturale: ADB Cap. 10.3 (D-12 CONFERMATA)

---

## 1. Come funziona il theming

Il framework pubblica il pacchetto `@seaside/theming` che definisce **design tokens** come CSS custom properties.
I token sono organizzati su due livelli:

| Livello | Chi lo definisce | Sovrascrivibile? |
|---|---|---|
| **Foundation tokens** | Team framework | **NO** |
| **Theme tokens** | Team verticale | Si, entro vincoli |

---

## 2. Token non sovrascrivibili (foundation)

Questi token definiscono la struttura del design system. Le app **non devono** sovrascriverli:

- **Spacing scale**: `--seaside-spacing-xs` .. `--seaside-spacing-xxl`
- **Typography scale**: `--seaside-font-size-*`, `--seaside-line-height-*`, `--seaside-font-weight-*`
- **Border radius**: `--seaside-radius-sm`, `--seaside-radius-md`, `--seaside-radius-lg`
- **Shadow system**: `--seaside-shadow-sm`, `--seaside-shadow-md`, `--seaside-shadow-lg`
- **Breakpoints**: `--seaside-breakpoint-sm`, `--seaside-breakpoint-md`, `--seaside-breakpoint-lg`
- **Z-index scale**: `--seaside-z-index-*`
- **Animazioni/transizioni**: durate e easing standard

### Enforcement

I foundation token sono definiti in `@seaside/theming/tokens/_foundation.scss` e importati automaticamente.

**Enforcement tecnico**: i foundation token sono dichiarati con nomi specifici del framework (`--seaside-*`).
I componenti `@seaside/components` li usano internamente. Non esiste un meccanismo tecnico che impedisca
a un verticale di fare `:root { --seaside-spacing-md: 42px !important; }`.

**Enforcement organizzativo**: la violazione viene rilevata da:

1. **Code review**: ogni PR del verticale deve essere verificata per override non consentiti
2. **Lint rule custom**: il framework fornisce una regola `stylelint` che segnala come errore
   qualsiasi ridichiarazione di un `--seaside-` foundation token al di fuori dei file del framework
3. **Visual regression test**: se configurati, rilevano cambiamenti visivi non attesi

> **Onesta'**: l'enforcement e' prevalentemente organizzativo. CSS custom properties sono sovrascrivibili
> per design. La disciplina del team e le code review sono la vera barriera.

---

## 3. Token personalizzabili (theme)

Le app possono sovrascrivere questi token per personalizzare il branding:

### 3.1 Palette colori

```scss
:root {
  --seaside-color-primary: #2E7BAF;     // colore brand principale
  --seaside-color-accent: #AF7B2E;      // colore secondario
  --seaside-color-success: #52c41a;
  --seaside-color-warning: #faad14;
  --seaside-color-error: #f5222d;
  --seaside-color-neutral-*: ...;       // scala grigi
}
```

### 3.2 Logo e branding

- Logo nell'header: fornito come asset statico, referenziato via configurazione
- Favicon: asset statico dell'app
- Titolo app: configurazione `Seaside:App:Title`

### 3.3 Dark mode

Il framework fornisce il meccanismo di switch (toggle nel profilo utente, persistenza preferenza).
L'app sceglie se abilitarlo:

```json
{
  "Seaside": {
    "Theme": {
      "DarkModeEnabled": true
    }
  }
}
```

Se abilitato, il framework applica la classe `.seaside-dark` su `<html>` e carica i token dark.
I componenti framework gestiscono il dark mode automaticamente.

**Vincolo per i componenti custom**: se l'app ha componenti custom, deve definire le varianti dark
usando i token del framework, non colori hardcoded.

### 3.4 Densita'

Tre livelli disponibili: `compact` | `default` | `comfortable`.

```scss
:root {
  --seaside-density: default;
}
```

L'app sceglie il livello. Il framework adatta padding, altezze righe, spacing dei componenti.

---

## 4. Come creare il tema dell'app

Nel vertical repo, creare un file di tema:

```scss
// Frontend/src/themes/mia-app-theme.scss
@use '@seaside/theming/tokens/theme-contract' as theme;

:root {
  // Solo token consentiti
  --seaside-color-primary: #2E7BAF;
  --seaside-color-accent: #AF7B2E;
  --seaside-density: compact;
}
```

Non importare `_foundation.scss` manualmente: viene importato automaticamente dal framework.

---

## 5. Cosa NON fare

| Violazione | Perche' e' vietata |
|---|---|
| Sovrascrivere foundation token (`--seaside-spacing-*`, `--seaside-font-size-*`, etc.) | Rompe la coerenza del design system tra app |
| Usare colori hardcoded (`color: #ff0000`) | Rompe dark mode, theming, accessibilita' |
| Usare `!important` su token del framework | Rompe l'ereditarieta' del design system |
| Fare override di stili interni dei componenti `<seaside-*>` con `::ng-deep` | I componenti sono opinati, non personalizzabili nella struttura |
| Importare direttamente `ng-zorro-antd` o `@syncfusion/*` nei fogli di stile | Tutto passa dal wrapper `@seaside/components` |

---

## 6. Checklist per code review

- [ ] Nessun colore hardcoded nei CSS/SCSS (tutto via token `--seaside-*`)
- [ ] Nessun override di foundation token
- [ ] Componenti custom usano i token per spacing, colori, tipografia
- [ ] Se dark mode abilitato: componenti custom hanno varianti dark con i token framework
- [ ] Nessun `::ng-deep` su componenti `<seaside-*>`
- [ ] Nessun import diretto di `ng-zorro-antd` o `@syncfusion/*` nei CSS
