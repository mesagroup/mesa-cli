# SAT product delivery documents

Stato: bozza v0.1, 2026-05-14.

Questa cartella raccoglie le prime linee guida operative per usare `mesa-cli`
nel nuovo modello a Stream Aligned Team (SAT). I documenti traducono in
pratica tre fonti gia' disponibili nel repository:

- la CLI e gli scaffold generati da `mesa init` e `mesa prototype`;
- le regole e le skill gia' iniettate negli scaffold (`.cursor/rules`,
  `.claude/skills`);
- i materiali organizzativi in `docsorg/` su SAT, ruolo AF, AET, custody e
  modello di gestione prodotto.

Le linee guida architetturali di codice e infrastruttura non sono ancora state
integrate. Quando saranno disponibili, questi documenti andranno aggiornati e
il lock architetturale dovra' diventare piu' prescrittivo.

## Documenti

1. [Linea guida AF per prototipazione vibecoded](./01-linea-guida-af-prototipazione.md)
2. [Linea guida dev per industrializzazione](./02-linea-guida-dev-industrializzazione.md)
3. [Ridefinizione scaffold e architecture lock](./03-scaffold-architecture-lock.md)
4. [Skills e documentazione da inserire negli scaffold](./04-skills-documentazione-scaffold.md)

## Principi comuni

- Il SAT e' l'unita' di delivery: analisi, prototipo, sviluppo, test e rilascio
  vivono nello stesso flusso operativo.
- L'AF governa il cosa: issue, criteri di accettazione, priorita', release e
  trasferimento di contesto.
- I dev governano la qualita' production-ready: architettura implementata,
  test, sicurezza, operabilita' e debito tecnico.
- AET entra sulle scelte strutturali, sui blocchi tecnici non sciolti in circa
  due giorni, sulle review greenfield e sulle decisioni cross-SAT.
- Claude/Cursor propongono e automatizzano, ma non decidono scope, priorita',
  trade-off architetturali o go/no-go.
- Ogni decisione che influenza prodotto, architettura, deploy o sicurezza deve
  lasciare traccia in GitHub, ADR o documentazione di prodotto.

