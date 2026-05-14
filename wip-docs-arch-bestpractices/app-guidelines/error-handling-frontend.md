# Error Handling Frontend -- Regole per i team verticali

> Riferimento architetturale: ADB Cap. 5.6 (D-22 CONFERMATA), BuildingBlocks.ErrorHandling

---

## 1. Come funziona

Il backend ritorna errori in formato **Problem Details (RFC 9457)**. Ogni errore HTTP ha questa struttura:

```json
{
  "type": "https://seaside.dev/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "One or more validation errors occurred.",
  "errors": {
    "Title": ["Il campo e' obbligatorio."],
    "Amount": ["Il valore deve essere maggiore di 0."]
  }
}
```

Il framework fornisce in `@seaside/shell` un **interceptor HTTP globale** che gestisce automaticamente i casi piu' comuni. I verticali gestiscono i casi specifici della propria app.

---

## 2. Cosa il framework gestisce automaticamente

Questi comportamenti sono attivi di default e **non devono essere reimplementati** dai verticali:

| Status code | Comportamento | Fornito da |
|---|---|---|
| **401 Unauthorized** | Popup modale bloccante "Sessione scaduta" → redirect a login | `@seaside/shell` `SessionExpiredInterceptor` |
| **403 Forbidden** | Redirect a pagina "Accesso negato" standard | `@seaside/shell` `ForbiddenInterceptor` |
| **500+ Server Error** | Toast di errore generico "Si e' verificato un errore. Riprova." | `@seaside/shell` `ServerErrorInterceptor` |
| **0 (network error)** | Toast "Connessione al server non disponibile." | `@seaside/shell` `ServerErrorInterceptor` |
| **404 su navigazione** | Pagina 404 standard del framework | `@seaside/shell` routing config |

---

## 3. Cosa deve fare il team verticale

### 3.1 Errori di validazione (422)

Gli errori di validazione **non** sono gestiti dall'interceptor globale. Il verticale deve mapparli sul form:

```typescript
// Nel componente, dopo il submit
this.myService.createOrder(data).subscribe({
  next: (result) => {
    this.notificationService.success($localize`:@@order.created:Ordine creato`);
  },
  error: (err: HttpErrorResponse) => {
    if (err.status === 422 && err.error?.errors) {
      // Mappa errori sui campi del form
      this.applyServerErrors(err.error.errors);
    }
  }
});
```

Il pattern per mappare errori server sui campi del form:

```typescript
applyServerErrors(errors: Record<string, string[]>): void {
  for (const [field, messages] of Object.entries(errors)) {
    const control = this.form.get(field.toLowerCase());
    if (control) {
      control.setErrors({ server: messages[0] });
      control.markAsTouched();
    }
  }
}
```

Nel template, mostrare l'errore inline sotto il campo:

```html
@if (control.hasError('server')) {
  <span class="seaside-field-error">{{ control.getError('server') }}</span>
}
```

### 3.2 Errori di business (409 Conflict, 400 Bad Request)

Per errori di business (es. "Ordine gia' esistente", "Operazione non consentita in questo stato"):

```typescript
error: (err: HttpErrorResponse) => {
  if (err.status === 409 || err.status === 400) {
    // Mostra il messaggio dal ProblemDetails
    this.notificationService.error(err.error?.detail ?? $localize`:@@errors.generic:Operazione non riuscita`);
  }
}
```

### 3.3 Errori specifici di dominio (404 su risorse)

Quando una risorsa non viene trovata in un'operazione (non navigazione):

```typescript
error: (err: HttpErrorResponse) => {
  if (err.status === 404) {
    this.notificationService.warning(
      $localize`:@@errors.notfound:La risorsa richiesta non esiste o e' stata eliminata.`
    );
    this.router.navigate(['/orders']);
  }
}
```

### 3.4 Pattern consigliato: service layer

Non gestire errori HTTP direttamente nei componenti. Usare un service layer che traduce gli errori:

```typescript
@Injectable({ providedIn: 'root' })
export class OrderService {
  createOrder(data: CreateOrderRequest): Observable<Result<OrderId>> {
    return this.http.post<OrderId>('/api/orders', data).pipe(
      map(id => ({ success: true, value: id }) as Result<OrderId>),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 422) {
          return of({ success: false, validationErrors: err.error.errors } as Result<OrderId>);
        }
        if (err.status === 409) {
          return of({ success: false, error: err.error.detail } as Result<OrderId>);
        }
        return throwError(() => err); // errori non gestiti → interceptor globale
      })
    );
  }
}
```

---

## 4. Mapping status code → UI

| Status code | Tipo di errore | UI consigliata |
|---|---|---|
| **422** Validation | Errori di campo | Inline sotto ogni campo (rosso) |
| **400** Bad Request | Errore di business | Toast di errore con messaggio dal `detail` |
| **404** Not Found | Risorsa non trovata | Toast di warning + redirect alla lista |
| **409** Conflict | Conflitto di stato | Toast di errore con messaggio dal `detail` |
| **429** Too Many Requests | Rate limiting | Toast "Troppe richieste. Riprova tra qualche secondo." |
| **401** Unauthorized | Sessione scaduta | Gestito dal framework (popup → login) |
| **403** Forbidden | Permessi insufficienti | Gestito dal framework (pagina 403) |
| **500+** Server Error | Errore server | Gestito dal framework (toast generico) |

---

## 5. Retry

Il framework **non** implementa retry automatici sulle chiamate API (a parte le policy Polly configurate in `ServiceDefaults` per resilienza HTTP server-to-server).

Se il verticale vuole implementare retry lato frontend:
- Solo per operazioni **idempotenti** (GET, PUT con same payload)
- **Mai** retry automatico su POST (rischio duplicazione)
- Mostrare feedback all'utente: "Riprova" come azione esplicita, non automatica
- Per operazioni lunghe: usare un `SeasideSpinner` + timeout ragionevole

---

## 6. Loading e feedback

| Operazione | Pattern |
|---|---|
| **Caricamento pagina** | `SeasideSpinner` overlay sul content area |
| **Submit form** | Bottone in stato `loading` (disabilitato, con spinner inline) |
| **Azione su riga tabella** | Spinner inline sulla riga |
| **Successo** | Toast (notifica temporanea, success) |
| **Errore** | Inline (validazione) o toast (business/server) |

---

## 7. Cosa NON fare

| Violazione | Rischio |
|---|---|
| Mostrare stack trace o dettagli tecnici all'utente | UX pessima, potenziale leak di informazioni interne |
| Swallare errori silenziosamente (`catchError(() => EMPTY)`) | L'utente non sa che l'operazione e' fallita |
| Reimplementare la gestione 401/403/500 nel verticale | Inconsistenza, conflitto con gli interceptor del framework |
| Retry automatico su POST | Rischio di operazioni duplicate |
| Mostrare errori in `alert()` nativo | Rompe l'esperienza utente, non accessibile |
| Loggare errori nella console senza feedback utente | L'utente non ha visibilita' sul problema |

---

## 8. Checklist per code review

- [ ] Errori di validazione (422) mappati inline sui campi del form
- [ ] Errori di business (409, 400) mostrati come toast con messaggio leggibile
- [ ] Nessun `catchError` che swalla errori silenziosamente
- [ ] Nessuna reimplementazione della gestione 401/403/500
- [ ] Loading state visibile durante operazioni asincrone
- [ ] Messaggi di errore internazionalizzati (i18n)
- [ ] Nessun dettaglio tecnico esposto all'utente
