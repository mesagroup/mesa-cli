# Seaside -- Linee guida per i team verticali

Questa cartella contiene le regole e le convenzioni che ogni team verticale **deve** rispettare
quando costruisce un'applicazione sopra il framework Seaside.

Le regole qui documentate sono **vincolanti** e verificate automaticamente dove possibile
(lint, architecture test, CI pipeline). I punti che non possono essere verificati automaticamente
richiedono code review.

> **Fonte di verita' architetturale**: `docs/architecture/ARCHITECTURE_DECISION_BOOK.md`.
> Questo folder e' un complemento operativo rivolto a chi sviluppa le app, non una duplicazione dell'ADB.

---

## Indice

| File | Contenuto |
|---|---|
| [theming.md](theming.md) | Design tokens, personalizzazione consentita, enforcement, dark mode, densita' |
| [accessibility.md](accessibility.md) | WCAG AA, checklist componenti, test richiesti, screen reader, dark mode e contrasto |
| [frontend-conventions.md](frontend-conventions.md) | TypeScript strict, Angular standalone, componenti framework, i18n, state management |
| [security-checklist.md](security-checklist.md) | BFF, CORS, CSP, CSRF, auth, token, rate limiting, input validation |
| [error-handling-frontend.md](error-handling-frontend.md) | Gestione errori lato frontend, mapping ProblemDetails, retry, loading/feedback |
| [packaging-and-versioning.md](packaging-and-versioning.md) | Come consumare i pacchetti NuGet/npm, upgrade policy, breaking changes |
| [frontend-bootstrap.md](frontend-bootstrap.md) | Setup obbligatorio frontend: auth, shell, theming, rotte, breadcrumb, accessibilita' |

---

## A chi si rivolge

Questa documentazione e' per i team che lavorano nei **vertical repo** (le applicazioni business).
Non e' per il team framework -- per quello c'e' l'ADB e i file sotto `tasks/agents/`.

## Principio chiave

> Se un dubbio non e' coperto da queste linee guida, verifica nell'ADB.
> Se l'ADB non risponde, chiedi al team framework.
