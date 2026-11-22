# Atlante verificabile del workflow PolicyWatcher

Aprire `index.html`: è autonomo, funziona offline e non avvia scansioni, modelli o pubblicazioni. La panoramica interattiva accompagna sette diagrammi completi, una matrice di 28 gate e il rapporto sui cinque riscontri corretti.

- `workflow.md`: specifica completa e fonti del codice.
- `model.json`: diagrammi, riferimenti e limiti dichiarati.
- `*.mmd`: sorgenti Mermaid modificabili.
- `*.svg`: grafici vettoriali esportabili; `overview.png` è la versione raster della panoramica.
- [Rapporto dell’audit](../report/README.md): prove, riesami, pareri e limiti.

Rigenerazione dalla root del repository, con Python 3 e Graphviz installati:

```sh
python3 scripts/render-workflow-atlas.py
```

Il codice descritto è il candidato `3eabf9d8b420efb13debfcd8b6e378e81a2c4c61`. I successivi commit dei soli diagrammi non aggiornano quel motore. Le fonti sono verificabili nel checkpoint specifico. L’ER è selettivo e riguarda relazioni dichiarate in Prisma; non certifica i vincoli del database online.

Nessun rilascio o qualifica di fonti reali/500 policy al giorno deriva dall’atlante. Il pacchetto pubblico stabile e il codice privato restano distinti. Le viste illustrano anche capacità implementate ma disabilitate, con i relativi gate e limiti.
