# Další SQL analýzy

`python analysis/analyze.py after.json --before before.json --output-dir analytics-output`

Vyžaduje Python 3.13 a Node.js 24 (`DATADESK_NODE` může zvolit spustitelný soubor). Oba vstupy jsou uložené DataDesk případy, ne volně upravitelné reporty. Node ověří otisk a znovu spustí stejný engine jako UI. Python vytváří paměťovou SQLite databázi s parametrizovanými vstupy a provede samostatné čitelné SQL soubory. Původní `report.py`/`coverage.sql` zůstává nezávislou ukázkou pouze pro Python.

- `monthly.sql`: jednoznačné objednávky podle obchodu, normalizovaného měsíce a měny. Částky jsou celé menší jednotky. Duplicitní klíče, neplatné datum/částka a neznámá měna se vyloučí; nejde o účetní výkaz.
- `queue.sql`: neprověřené nálezy podle obchodu a období. Jeden nález se počítá jednou uvnitř skupiny, ale může zasahovat více skupin. Součet skupin není globální počet nálezů. Neurčitelné období je `Unknown`.
- `transitions.sql`: nové, zmizelé, nezměněné nálezy a změny prověření mezi dvěma případy. Identita používá pravidlo a původní obchodní záznamy bez fyzického čísla řádku. Opakované shodné nálezy zachovají násobnost. Pouhé přeuspořádání zdroje tak nevyrábí vyřešené chyby. Prověření není oprava dat.

CSV jsou v UTF-8, chrání textové buňky proti vzorcům. `report.json` uvádí otisky obou ověřených vstupů. Datumové formáty se přebírají z explicitních metadat případu; původní hodnoty se nemění. Výsledky jsou snímky, obnovují se opětovným spuštěním CLI. Zdrojové datum neprokazuje včasnost doručení.
