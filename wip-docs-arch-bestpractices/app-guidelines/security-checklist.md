# Sicurezza -- Checklist per i team verticali

> Riferimento architetturale: ADB Cap. 7, decisioni D-41..D-47

---

## 1. Cosa il framework fornisce automaticamente

Queste misure sono attive di default e **non devono essere disattivate**:

| Misura | Fornita da | Dettaglio |
|---|---|---|
| BFF pattern | `@seaside/shell` + Host | Il JWT non raggiunge mai il browser. Il browser usa httpOnly cookie |
| CSRF protection | Host middleware | Anti-forgery token automatico su POST/PUT/DELETE |
| Session management | Host + Redis/in-memory | Idle timeout, sliding expiration, max duration |
| Security headers | `UseSeasideSecurityHeaders()` | CSP, X-Frame-Options, HSTS, nosniff, Referrer-Policy, Permissions-Policy |
| Rate limiting | Host middleware | Globale per IP + aggressivo su endpoint auth |
| Input sanitization | `IHtmlSanitizer` (BB Security) | Sanitizzazione HTML per rich text |
| SQL injection prevention | EF Core + repository pattern | Nessuna query raw senza parametri |

---

## 2. Cosa deve fare il team verticale

### 2.1 Autenticazione

- **Non implementare un sistema auth custom**. Usare il framework (`BuildingBlocks.Security`)
- **Non salvare token/credenziali** nel frontend (localStorage, sessionStorage, cookie custom)
- **Non bypassare l'auth middleware** con endpoint anonimi se non strettamente necessario
- Se serve un endpoint anonimo: documentare il motivo e limitare lo scope

### 2.2 Autorizzazione

Il framework usa permission-based RBAC (D-42). Il verticale deve:

```csharp
// Proteggere ogni endpoint con i permessi richiesti
app.MapGet("/api/orders", handler)
   .RequirePermission("Orders.Read");

app.MapPost("/api/orders", handler)
   .RequirePermission("Orders.Create");

app.MapDelete("/api/orders/{id}", handler)
   .RequirePermission("Orders.Delete");
```

- **Ogni endpoint** deve avere un controllo di autorizzazione
- Non usare `[AllowAnonymous]` senza giustificazione documentata
- I permessi seguono il pattern `{Modulo}.{Azione}` (es. `Orders.Read`, `Orders.Create`)

### 2.3 Input validation

Ogni command/query deve avere un validator FluentValidation:

```csharp
public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Amount)
            .GreaterThan(0);
    }
}
```

Il mediator pipeline esegue la validazione automaticamente prima dell'handler.

**Regole**:
- Non fidarsi mai dell'input utente, nemmeno se il frontend ha gia' validato
- Validare lunghezze massime, range, formati
- Per rich text (HTML dall'utente): usare `IHtmlSanitizer` del framework prima di persistere

### 2.4 CORS

In produzione con BFF, CORS e' irrilevante (frontend e API stessa origin).

Se il verticale espone API a sistemi esterni:

```json
{
  "Seaside": {
    "Security": {
      "Cors": {
        "AllowedOrigins": ["https://partner.example.com"]
      }
    }
  }
}
```

- **Mai** usare `AllowAnyOrigin` in produzione
- **Mai** combinare `AllowAnyOrigin` con `AllowCredentials`

### 2.5 CSP personalizzazione

Se il verticale ha bisogno di origini aggiuntive (CDN, iframe, etc.):

```json
{
  "Seaside": {
    "Security": {
      "Csp": {
        "AdditionalScriptSrc": ["https://cdn.trusted.com"],
        "AdditionalImgSrc": ["https://images.trusted.com"],
        "AdditionalFrameSrc": ["https://embed.trusted.com"]
      }
    }
  }
}
```

- Si possono **aggiungere** origini, non **rimuovere** le restrizioni base
- Non aggiungere `'unsafe-eval'` a script-src
- Documentare il motivo di ogni origine aggiuntiva

### 2.6 Rate limiting custom

Il framework applica rate limiting globale. Il verticale puo' aggiungere limiti specifici:

```csharp
// Endpoint con rate limit specifico
app.MapPost("/api/reports/generate", handler)
   .RequireRateLimiting("heavy-operation");
```

Configurare in `appsettings.json` sotto `Seaside:Security:RateLimiting`.

---

## 3. Cosa NON fare

| Violazione | Rischio |
|---|---|
| Salvare JWT o token in localStorage/sessionStorage | XSS puo' esfiltrare il token |
| Disattivare anti-forgery su endpoint mutanti | CSRF attack |
| Usare `[AllowAnonymous]` senza motivo | Endpoint esposti a chiunque |
| Query SQL raw senza parametri (`FromSqlRaw("SELECT ... " + input)`) | SQL injection |
| Loggare dati sensibili (password, token, PII) | Leak di credenziali nei log |
| Hardcodare connection string, API key, secret nel codice | Credenziali nel repository |
| Disattivare security headers del framework | Apertura a XSS, clickjacking, etc. |
| Rendere pubblico un endpoint di upload senza validazione tipo/dimensione file | DoS, upload malevoli |

---

## 4. Secrets e configurazione

- **Mai** hardcodare secret nel codice o in `appsettings.json` committato
- Usare `appsettings.Development.json` (nel `.gitignore`) per secret di sviluppo
- In produzione: Azure Key Vault (D-46) gestito dal framework
- Connection string: via Aspire resource binding, non hardcoded

---

## 5. File upload

Se il verticale gestisce upload di file:

- Validare il tipo MIME (whitelist, non blacklist)
- Validare la dimensione massima
- Non salvare file con il nome originale (rinominare con UUID)
- Scansione antivirus se i file sono accessibili ad altri utenti
- Non servire file uploadati dallo stesso dominio dell'app senza Content-Disposition

---

## 6. Checklist per code review

- [ ] Ogni endpoint ha controllo di autorizzazione (`RequirePermission`)
- [ ] Ogni command/query ha un validator FluentValidation
- [ ] Nessun secret hardcoded nel codice
- [ ] Nessun `[AllowAnonymous]` senza giustificazione
- [ ] Rich text sanitizzato con `IHtmlSanitizer` prima di persistere
- [ ] Nessuna query SQL raw senza parametri
- [ ] Nessun dato sensibile nei log
- [ ] File upload: tipo, dimensione, nome validati
- [ ] CORS: nessun `AllowAnyOrigin` in produzione
