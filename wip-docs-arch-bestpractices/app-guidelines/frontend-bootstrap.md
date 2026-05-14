# Bootstrap frontend -- Guida per i team verticali

> Riferimento architetturale: ADB Cap. 10, STARTER_KIT Sez. 3.4, decisioni D-10, D-12, D-41

---

## Scopo

Questa guida descrive i passi obbligatori per configurare il frontend di una nuova app verticale
sopra il framework Seaside. Copre autenticazione, layout shell, theming, protezione rotte,
breadcrumb e accessibilita'.

Ogni app verticale **deve** implementare questi step prima di iniziare lo sviluppo delle feature
di dominio. Il risultato e' un'app funzionante con login, layout coerente e navigazione protetta.

> Se parti dallo starter kit (`dotnet new seaside-vertical`), questi step sono gia' implementati.
> Questa guida serve come riferimento e per chi costruisce un'app da zero o migra un'app esistente.

---

## Prerequisiti

| Dipendenza | Versione | Note |
|---|---|---|
| Angular | 21+ | Standalone components, signals |
| `@seaside/shell` | latest | Layout, navigazione, breadcrumb, route announcer |
| `@seaside/theming` | latest | Temi light/dark, design tokens |
| `@seaside/components` | latest | DataGrid, Dialog, Spinner, Notification |
| ng-zorro-antd | 21+ | Usato internamente dai wrapper Seaside |

### tsconfig.json -- Path mapping

Configurare i path alias per le librerie Seaside nel `tsconfig.json` dell'app:

```json
{
  "compilerOptions": {
    "paths": {
      "@seaside/shell": ["<percorso-relativo>/framework/src/Shared.UI/projects/shell/src/public-api.ts"],
      "@seaside/theming": ["<percorso-relativo>/framework/src/Shared.UI/projects/theming/src/public-api.ts"]
    }
  }
}
```

---

## Step 1: AuthService

Creare un servizio centralizzato per la gestione dell'autenticazione.

**File**: `src/app/services/auth.service.ts`

### Requisiti

- Esporre signals reattivi: `isAuthenticated` (`Signal<boolean>`) e `token` (`Signal<string | null>`)
- `login(username, password)`: chiama `POST /api/auth/login`, salva il JWT in `sessionStorage`, imposta `isAuthenticated` a `true`
- `logout()`: rimuove il token da `sessionStorage`, imposta `isAuthenticated` a `false`, naviga a `/login`
- `getToken()`: restituisce il token corrente
- `isTokenValid(token)`: decodifica base64 del payload JWT per controllare il campo `exp`
- Al costruttore: verifica presenza e validita' del token in `sessionStorage`, ripristina lo stato o rimuove token scaduti/malformati
- Usare `SeasidePlatformService.getSessionStorage()` da `@seaside/shell` per accesso SSR-safe

### Esempio

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, catchError, of } from 'rxjs';
import { SeasidePlatformService } from '@seaside/shell';

const STORAGE_KEY = '<nomeapp>_auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platform = inject(SeasidePlatformService);

  readonly isAuthenticated = signal(false);
  readonly token = signal<string | null>(null);

  constructor() {
    this.restoreSession();
  }

  login(username: string, password: string): Observable<boolean> {
    return this.http
      .post(`${BASE_URL}/auth/login`, { username, password }, { responseType: 'text' })
      .pipe(
        map(jwt => { this.storeToken(jwt); this.token.set(jwt); this.isAuthenticated.set(true); return true; }),
        catchError(() => of(false)),
      );
  }

  logout(): void {
    this.removeToken();
    this.token.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null { return this.token(); }

  isTokenValid(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(atob(parts[1]));
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch { return false; }
  }

  private restoreSession(): void {
    const storage = this.platform.getSessionStorage();
    if (!storage) return;
    const stored = storage.getItem(STORAGE_KEY);
    if (stored && this.isTokenValid(stored)) {
      this.token.set(stored); this.isAuthenticated.set(true);
    } else if (stored) { storage.removeItem(STORAGE_KEY); }
  }

  private storeToken(jwt: string): void { this.platform.getSessionStorage()?.setItem(STORAGE_KEY, jwt); }
  private removeToken(): void { this.platform.getSessionStorage()?.removeItem(STORAGE_KEY); }
}
```

---

## Step 2: Auth Guard

Creare un functional guard Angular per proteggere le rotte.

**File**: `src/app/guards/auth.guard.ts`

### Requisiti

- Tipo `CanActivateFn` (functional guard, pattern Angular 21)
- Se autenticato: consenti accesso (`true`)
- Se non autenticato: redirect a `/login?returnUrl=<url originale>`
- Preservare l'URL originale per il redirect post-login

### Esempio

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
```

---

## Step 3: Auth Interceptor

Creare un functional interceptor HTTP per aggiungere il token alle richieste.

**File**: `src/app/interceptors/auth.interceptor.ts`

### Requisiti

- Tipo `HttpInterceptorFn` (functional interceptor)
- Aggiungere header `Authorization: Bearer <token>` a tutte le richieste tranne quelle verso l'endpoint di login
- Se la risposta e' 401: eseguire logout e redirect a `/login`

### Esempio

```typescript
import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (req.url.includes('/api/auth/login')) return next(req);

  const token = auth.getToken();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse && err.status === 401) auth.logout();
      return throwError(() => err);
    }),
  );
};
```

---

## Step 4: Login Page

Creare la pagina di login come componente standalone.

**File**: `src/app/pages/login/login-page.component.ts`

### Requisiti

- Layout a pagina intera, **senza** la Shell (nessuna sidebar o header)
- Form con campi username e password (entrambi required)
- Al submit: chiama `AuthService.login()`, in caso di successo naviga al `returnUrl` (da query params) o a `/`
- In caso di errore: mostra messaggio descrittivo, non reindirizza
- Durante il submit: pulsante disabilitato + indicatore di caricamento
- Usare componenti ng-zorro-antd per il form (tramite wrapper `@seaside/components` dove disponibili)
- Usare `ReactiveFormsModule` con `FormBuilder`
- Usare signals per `loading` e `errorMessage`

### Pattern

```typescript
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, /* ng-zorro form components */],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>{{ appTitle }}</h1>
        @if (errorMessage()) {
          <!-- alert di errore -->
        }
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <!-- campi username e password -->
          <button type="submit" [disabled]="loginForm.invalid || loading()">Accedi</button>
        </form>
      </div>
    </div>
  `,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const { username, password } = this.loginForm.getRawValue();
    this.auth.login(username, password).subscribe({
      next: success => {
        if (success) {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
          this.router.navigateByUrl(returnUrl);
        } else {
          this.errorMessage.set('Credenziali non valide.');
          this.loading.set(false);
        }
      },
      error: () => { this.errorMessage.set('Errore di connessione.'); this.loading.set(false); },
    });
  }
}
```

---

## Step 5: Shell Wrapper

Creare un componente wrapper che compone il layout shell con la configurazione specifica dell'app.

**File**: `src/app/layout/shell-wrapper.component.ts`

### Perche' un wrapper e non usare `SeasideShellLayoutComponent` direttamente?

Il `SeasideShellLayoutComponent` include un proprio `<router-outlet>` e non proietta contenuto
nell'area azioni della header. Il wrapper compone manualmente `SeasideHeaderComponent` e
`SeasideSidebarComponent` per avere pieno controllo su:

- Pulsante toggle tema proiettato nella header
- Pulsante logout nella header
- Breadcrumb sopra il contenuto
- Annunci di navigazione per screen reader

### Requisiti

- Comporre `SeasideHeaderComponent` e `SeasideSidebarComponent` da `@seaside/shell`
- Titolo dell'app nella header (es. "MiaApp 1.0")
- Configurare `SeasideNavigationService` con le voci di navigazione dell'app
- Inizializzare `SeasideThemingService` con tema `light` come predefinito
- Pulsante toggle tema nell'area azioni della header con `aria-label` descrittivo
- Pulsante logout nell'area azioni della header
- Sottoscrivere eventi `Router` (`NavigationEnd`) per annunciare i cambi pagina tramite `SeasideRouteAnnouncerService`
- Visualizzare i breadcrumb da `SeasideBreadcrumbService.items()` sopra il `<router-outlet>`
- Include "Skip to content" link come primo elemento focusabile
- Layout grid responsive (sidebar nascosta sotto 768px)

### Pattern template

```html
<a class="seaside-skip-link" href="#seaside-main-content">Skip to content</a>
<div class="seaside-shell" [class.seaside-shell--collapsed]="sidebarCollapsed()">
  <seaside-header [title]="'MiaApp 1.0'" [collapsed]="sidebarCollapsed()" (toggleSidebar)="toggleSidebar()">
    <!-- Contenuto proiettato nell'area azioni della header -->
    <button (click)="toggleTheme()" [attr.aria-label]="themeLabel()">{{ themeIcon() }}</button>
    <button (click)="logout()" aria-label="Esci">🚪</button>
  </seaside-header>
  <seaside-sidebar [items]="navItems" [collapsed]="sidebarCollapsed()" />
  <main id="seaside-main-content" class="seaside-shell__content" role="main">
    @if (breadcrumbs().length > 0) {
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <!-- render breadcrumb items -->
      </nav>
    }
    <router-outlet />
  </main>
</div>
```

### CSS grid layout

```scss
.seaside-shell {
  display: grid;
  grid-template-areas: "sidebar header" "sidebar content";
  grid-template-columns: var(--seaside-sidebar-width, 240px) 1fr;
  grid-template-rows: var(--seaside-header-height, 56px) 1fr;
  min-height: 100vh;
}
.seaside-shell--collapsed {
  grid-template-columns: var(--seaside-sidebar-collapsed-width, 48px) 1fr;
}
.seaside-shell__content {
  grid-area: content;
  padding: var(--seaside-spacing-lg, 24px);
  overflow-y: auto;
  background: var(--seaside-color-bg-layout, #f0f2f5);
}
@media (max-width: 767px) {
  .seaside-shell, .seaside-shell--collapsed { grid-template-columns: 0 1fr; }
}
```

---

## Step 6: Configurazione rotte

Aggiornare `app.routes.ts` con la struttura a layout condizionale.

**File**: `src/app/app.routes.ts`

### Pattern

```typescript
import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login/login-page.component';
import { ShellWrapperComponent } from './layout/shell-wrapper.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },           // Senza guard, senza shell
  {
    path: '',
    component: ShellWrapperComponent,                          // Layout shell
    canActivate: [authGuard],                                  // Protetto
    children: [
      // Qui le rotte dell'app (lazy-loaded dove possibile)
      { path: '', loadComponent: () => import('./features/home').then(m => m.HomeComponent) },
    ],
  },
];
```

### Regole

- La rotta `/login` e' **fuori** dalla shell e **senza** guard
- Tutte le altre rotte sono **dentro** la shell e **protette** dal guard
- Usare lazy loading per le feature routes (vedi [frontend-conventions.md](frontend-conventions.md) Sez. 3.4)

---

## Step 7: Configurazione AppConfig

Aggiornare `app.config.ts` con tutti i provider necessari.

**File**: `src/app/app.config.ts`

### Pattern

```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
  ],
};
```

### Checklist provider

- [x] `provideRouter(routes)` con le rotte che includono login e guard
- [x] `provideHttpClient(withInterceptors([authInterceptor]))` per il token automatico
- [x] `provideAnimationsAsync()` per le animazioni dei componenti ng-zorro e della shell

---

## Step 8: AppComponent semplificato

Il root component deve contenere solo `<router-outlet>`. Il layout e' gestito dal `ShellWrapperComponent`.

**File**: `src/app/app.component.ts`

```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {}
```

---

## Step 9: Breadcrumb nelle pagine

Ogni pagina imposta i breadcrumb tramite `SeasideBreadcrumbService` nel proprio `ngOnInit` o dopo il caricamento dei dati.

### Pattern

```typescript
import { SeasideBreadcrumbService } from '@seaside/shell';

export class MyPageComponent implements OnInit {
  private breadcrumbService = inject(SeasideBreadcrumbService);

  ngOnInit() {
    this.breadcrumbService.set([
      { label: 'Home', path: '/' },
      { label: 'La mia pagina' },  // Senza path = pagina corrente, non cliccabile
    ]);
  }
}
```

### Convenzioni breadcrumb

| Pagina | Breadcrumb |
|---|---|
| Home / Lista principale | `[Home]` |
| Dettaglio entita' | `[Home, <titolo entita'>]` |
| Sotto-pagina | `[Home, <titolo entita'>, <titolo sotto-pagina>]` |

L'ultimo elemento **non** ha `path` (rappresenta la pagina corrente).

---

## Checklist finale

- [ ] `AuthService` con signals, login/logout, validazione token, sessionStorage SSR-safe
- [ ] `authGuard` funzionale con preservazione returnUrl
- [ ] `authInterceptor` funzionale con Bearer token e gestione 401
- [ ] `LoginPageComponent` a pagina intera, senza shell, con form reattivo
- [ ] `ShellWrapperComponent` con header, sidebar, breadcrumb, toggle tema, logout
- [ ] Rotte con layout condizionale (login fuori, tutto il resto dentro la shell con guard)
- [ ] `appConfig` con interceptor e animazioni
- [ ] `AppComponent` semplificato a solo `<router-outlet>`
- [ ] Breadcrumb impostati in ogni pagina
- [ ] Skip link e route announcer per accessibilita'
- [ ] Path mapping `@seaside/shell` e `@seaside/theming` in `tsconfig.json`
