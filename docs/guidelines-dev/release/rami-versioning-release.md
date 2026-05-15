# Rami, versioning e release

Stato: bozza v0.1, 2026-05-15. Audience: dev di ingegnerizzazione, AF, AET.

## Obiettivo

Questo documento descrive come il SAT gestisce rami Git, versioning del prodotto
e chiusura di una versione, fino al push dell'immagine Docker su GitHub
Container Registry (GHCR). Vale per prodotti standalone e, salvo annotazione
esplicita, per i plugin MESAPPA.

## Scope

In scope:

- strategia di branching per fase del prodotto;
- convenzioni operative (naming, commit, PR, merge);
- versioning SemVer e tagging;
- compatibilita' host per plugin MESAPPA;
- pre-tag changelog (vedi skill `changelog-generation`);
- pipeline di build e push immagine su GHCR alla chiusura versione.

Out of scope (per ora):

- **Deploy verso istanza cliente**: viene gestito con IT in una fase
  successiva. Lato SAT si chiude alla pubblicazione dell'immagine su GHCR.
- **Distribuzione plugin per tipologia**: il meccanismo di consegna del
  plugin al MESAPPA host cambia per tipo di plugin; verra' approfondito con
  esempi concreti in un giro successivo.

## Principi

- **Una sola linea di sviluppo: `main` + tag.** Niente release branch, niente
  develop. Le versioni sono materializzate da tag SemVer, non da rami.
- **Il SAT si auto-disciplina.** Nessuna branch protection formale su `main`;
  il rigore (review, CI verde, lint) e' responsabilita' del SAT.
- **Il tag e' il contratto di rilascio.** Solo i tag SemVer stabili producono
  artefatti per i clienti. I tag pre-release esistono ma non vanno mai in
  registry produzione.
- **Il changelog si scrive prima del tag.** L'AF redige (con la skill
  `changelog-generation`), il dev rivede tecnicamente. Solo dopo si tagga.
- **Squash merge come default.** Storia di `main` leggibile, ogni squash e'
  un'unita' atomica.

## Strategia di branching per fase del prodotto

### Fase prototipo (vibecoding AF)

- Lavoro direttamente su `main`. Commit frequenti, niente PR obbligatoria.
- Nessun tag formale: la versione e' lo SHA del commit.
- L'AF chiude la fase quando il PO valida il comportamento; a quel punto
  comincia l'industrializzazione.

### Fase industrializzazione

- Si introduce il flusso PR: ogni cambiamento non banale passa da feature
  branch + PR + review nel SAT.
- Tag possibili a partire da `v0.1.0`, incrementati con buon senso ma senza
  ossessione (l'API e' instabile per definizione fino a `v1.0.0`).
- I tag pre-release sono ammessi per validazione interna su preview
  (`v0.5.0-rc.1`). Non producono immagine in registry.

### Fase prodotto a regime

- PR review obbligatoria de facto nel SAT (no branch protection formale, ma
  niente push diretti a `main`).
- CI verde (build, test, lint, `dependency-cruiser`, `mesa verify` se
  applicabile) come precondizione di merge.
- Cutover a `v1.0.0` al primo go-live presso un cliente. Da li' in poi SemVer
  rigoroso.
- Hotfix come patch increment su `main` (vedi sezione dedicata).

### Fase custody / maintenance / sunset

- Solo hotfix branch per bug critici, niente feature.
- Tag patch incrementali (`v1.4.3` → `v1.4.4`).
- Sunset: niente nuovi tag; il repo viene archiviato GitHub dopo l'ultima
  release annunciata.

## Convenzioni operative

### Naming dei rami

Prefisso per tipo, kebab-case, breve:

| Prefisso | Uso | Esempio |
|---|---|---|
| `feat/` | Nuova funzionalita' | `feat/export-pdf-distinte` |
| `fix/` | Bugfix | `fix/login-redirect-loop` |
| `chore/` | Build, dipendenze, refactor invisibile al cliente | `chore/bump-drizzle-0.32` |
| `docs/` | Solo documentazione | `docs/runbook-deploy` |
| `hotfix/` | Fix urgente in produzione | `hotfix/order-creation-500` |
| `spike/` | Esplorazione, non destinato a merge | `spike/auth-js-v5` |

Riferimento alla issue quando esiste: `feat/123-export-pdf-distinte`.

### Commit message

- **Conventional Commits suggeriti** dalla fase di industrializzazione
  (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `BREAKING
  CHANGE:`). Non obbligatori, ma aiutano la skill `changelog-generation`.
- Soggetto in inglese o italiano (scelta SAT), max 72 caratteri,
  imperativo presente.
- Corpo opzionale per spiegare il **perche'**, non il cosa.

### PR

- **Dimensione**: una PR copre una sola cosa logica. Se mischia feature,
  refactor e migrazioni, va spezzata.
- **Review**: almeno una persona del SAT diversa dall'autore. AET non e'
  reviewer ordinario.
- **Merge strategy**: **squash merge** come default. Rebase ammesso per chi
  sa cosa fa. Merge commit solo per merge di rami long-lived (raro).
- **CI**: build, test, lint verdi prima del merge. Il SAT decide se
  rinviare in caso di rosso evidente.

### Pulizia rami stale

- Branch mergiati: cancellati automaticamente al merge (impostazione repo).
- Branch aperti senza attivita' da 30 giorni: il SAT triage settimanale
  decide se rilanciarli o chiuderli.
- Tag: non si cancellano mai. Anche un tag "sbagliato" resta, si tagga una
  nuova patch.

## Versioning SemVer

### Schema

`MAJOR.MINOR.PATCH`, opzionalmente seguito da pre-release `-rc.N` (o
`-beta.N`, `-alpha.N`).

| Incremento | Quando |
|---|---|
| `MAJOR` | Breaking change visibile al consumer (cliente, plugin host, API) |
| `MINOR` | Nuova funzionalita' retrocompatibile |
| `PATCH` | Bugfix, miglioramento interno senza cambi di contratto |
| `-rc.N` | Pre-release per validazione interna su preview; non produce artefatti per il cliente |

### Quando incrementare cosa

- **Industrializzazione (0.x.y)**: l'API e' instabile per definizione. Si
  incrementa `MINOR` per cambi visibili, `PATCH` per fix. `MAJOR` resta a 0.
- **Primo go-live**: cutover a `1.0.0`. Da quel tag in poi, SemVer rigoroso.
- **Breaking change**: incremento di `MAJOR` **e** sezione Breaking Changes
  obbligatoria nel changelog.

### Pre-release: niente artefatti per il cliente

I tag pre-release (`v1.2.0-rc.1`, `v1.2.0-beta.2`, ...) esistono per
testare internamente su preview ambiente. La pipeline di push GHCR
**non** li deve elaborare. L'enforcement avviene a livello di trigger del
workflow (vedi sezione pipeline).

## Plugin MESAPPA: compatibilita' host

I plugin seguono SemVer standard sul plugin stesso. La compatibilita' con
versioni del MESAPPA host **non sta nel tag** ma in un manifest separato
nel repo del plugin.

File proposto: `plugin-manifest.yml` (o equivalente accettato dal MESAPPA
loader).

```yaml
name: my-plugin
version: 1.2.0
host-compatibility:
  min: 3.4.0
  max: 3.999.x
```

Regole:

- Il tag plugin e' SemVer puro: `v1.2.0`. Niente suffissi host nel tag.
- Il manifest dichiara l'intervallo di host supportati.
- Cambi nell'intervallo `host-compatibility` (es. drop del supporto a un
  host vecchio) **sono un breaking change**: richiedono incremento `MAJOR`.
- La pipeline plugin valida il manifest in CI (presenza, range valido, min
  <= max).

> Il meccanismo concreto di distribuzione del plugin al MESAPPA host
> dipende dal tipo di plugin (on-prem vs SaaS) e verra' descritto in un
> documento successivo con esempi reali.

## Tag e release flow

Sequenza completa per chiudere una versione:

1. **Pre-tag: changelog.** L'AF avvia la skill `changelog-generation` (vedi
   `../skills/changelog-generation.md`). La skill estrae commit/PR/issue
   nel range, propone una bozza bilingue (IT + EN) in linguaggio business.
   AF rivede tono e completezza; dev rivede accuratezza tecnica
   (in particolare i breaking change). Si committa `CHANGELOG.md`
   aggiornato su `main`.

2. **Tag.** Si tagga il commit di `main` con il tag SemVer:

   ```bash
   git tag -a v1.2.0 -m "Release 1.2.0"
   git push origin v1.2.0
   ```

   Convenzione: **prefisso `v`** nel tag Git (`v1.2.0`). Nell'immagine
   Docker si usa il SemVer **senza prefisso** (`1.2.0`) — convenzione OCI.

3. **GitHub Release.** Si crea la Release GitHub corrispondente al tag.
   Il body della Release contiene la sezione changelog della versione
   (la skill prepara anche questo testo). La Release puo' essere creata
   manualmente o automatizzata da workflow.

4. **Pipeline GHCR.** Il push del tag stabile triggera la pipeline che
   builda l'immagine e la pusha su GHCR (vedi sezione successiva).

5. **Chiusura SAT.** A immagine pubblicata, il SAT chiude il ciclo. Il
   deploy verso il cliente prosegue out of scope, gestito con IT.

## Pipeline di build e push immagine GHCR

Pipeline GitHub Actions che fa build e push solo per tag SemVer stabili.

### Trigger

Il trigger filtra a livello di tag pattern, escludendo i pre-release:

```yaml
on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'
```

Tag come `v1.2.0-rc.1` non matchano e non scatenano la pipeline. E' il modo
piu' robusto per garantire "no artefatto da RC": l'esclusione e' al livello
piu' basso possibile, non un check post-trigger che si puo' dimenticare.

### Build e push

Sketch della pipeline (file suggerito: `.github/workflows/release.yml`):

```yaml
name: Release

on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'

permissions:
  contents: read
  packages: write

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Derive version
        id: version
        run: echo "version=${GITHUB_REF_NAME#v}" >> "$GITHUB_OUTPUT"

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/${{ github.event.repository.name }}:${{ steps.version.outputs.version }}
            ghcr.io/${{ github.repository_owner }}/${{ github.event.repository.name }}:latest
```

### Convenzioni di naming

- Registry host: `ghcr.io`.
- Path: `ghcr.io/<owner>/<repo>:<version>` (niente segmenti SAT-specifici
  intermedi).
- Tag immagine: SemVer puro senza prefisso `v` (`1.2.0`).
- Tag `:latest` aggiornato a ogni release stabile.
- Retention: tutte le versioni stabili restano nel registry. Si pulisce solo
  con politica esplicita (raro). I pre-release non finiscono in registry,
  quindi non c'e' nulla da pulire.

### Visibilita'

Default: pacchetto **privato**. Accesso lettura concesso per credenziali
gestite con IT in fase di setup deploy cliente (out of scope di questo
documento). Mai pacchetto pubblico per default — anche per prodotti senza
PII, evita esfiltrazioni accidentali.

### Cosa la pipeline NON fa

- Non triggera deploy verso cliente (gestione separata con IT).
- Non manipola il tag Git (l'umano tagga e pusha; la pipeline reagisce).
- Non rigenera changelog (gia' prodotto pre-tag con la skill).

## Hotfix

Senza release branch, una hotfix segue questo flusso:

1. Branch `hotfix/<descrizione-breve>` da `main`.
2. Fix minimo, test mirato.
3. PR + review SAT (rapida ma reale, no skip).
4. Squash merge su `main`.
5. Bump della **patch** (es. `v1.2.0` → `v1.2.1`).
6. Changelog generato con la skill (categoria Bugfix).
7. Tag e pipeline come una release normale.

Casi che questo flusso **non** copre:

- Cliente fermo a `v1.0.x` con bug, ma `main` e' gia' a `v2.x` con breaking
  change: questo richiederebbe un release branch per la 1.x. Per ora non
  prevediamo questo scenario; quando capitera', si aggiungera' una sezione
  con le regole specifiche.

## Anti-pattern

- Aprire release branch "preventivi". Solo `main` e tag.
- Tag manuali senza changelog precedente.
- Push tag senza review tecnica del changelog dal dev: rischio di descrivere
  al cliente cose che non sono in quella versione.
- Far passare un artefatto da tag pre-release in registry produzione. La
  pipeline lo blocca; non aggirare il pattern di trigger.
- Cancellare o riscrivere un tag pubblicato. Si tagga una nuova patch.
- Inserire suffissi host nel tag plugin (`v1.2.0-host-3.4.0`). Il tag e'
  SemVer puro; la compatibilita' host vive nel manifest.
- Push diretti a `main` salvo per il prototipo in vibecoding. In
  industrializzazione e in regime, sempre via PR.
- Force push su `main`. Mai.

## Da approfondire in giri successivi

- **Deploy verso istanza cliente** (con IT): chi pulla, quali credenziali,
  approvazione tra registry e attivazione cliente, retention versioni
  presso cliente, rollback.
- **Distribuzione plugin per tipologia**: formato e flusso di consegna al
  MESAPPA host. Si scrive con esempio concreto da un plugin esistente.
- **Release branch per multi-version support**: regole se in futuro
  dovremo supportare versioni in parallelo presso clienti diversi.
