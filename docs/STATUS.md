# DD-3, DD-5, DD-6, DD-7 – XLSX a report

Hotovo místně: XLSX import ve workeru, výběr listu/hlavičky, omezení skutečné dekomprese, zachování formátovaných ID, odmítnutí vzorců a chybných buněk, Excel export s pěti listy a vzorci, opakovatelné CLI obnovení a fyzické řádky zdroje.

Ověření: 43 Node testů a 4 Python testy. Browser QA používá skutečný server s CSP: dva sešity, výběr listů a hlavičky 2, mapování, čistý výsledek, řádek zdroje 3, stažení Excel reportu, odmítnutí vzorce bez ztráty předchozího případu a mobilní šířka 390 px. SQL/JS metrika pokrytí se shodla; vzorec podílu se v nezávislém tabulkovém nástroji změnil po úpravě vstupu a vrátil po obnovení. Desktopový Excel nebyl spouštěn.

Benchmark XLSX, jeden místní běh Node 24.22.1: 20 000 řádků, komprimovaně 1 818 858 B, rozbaleně 7 337 642 B; kontrola archivu 157 ms, čtení 1 122 ms. Report pro 20 000 objednávek + 20 000 zásilek: 3 821 516 B, vytvoření 1 858 ms. Nejde o časový příslib pro jiné zařízení. Výstupní report může přesahovat vstupní limit 2 MB; není určen k opětovnému importu celého reportu jako exportu z firemního systému.

Zbývá: ruční nastavení datumových formátů/CSV oddělovače, další SQL analýzy a veřejná dostupnost dema. Automatické formáty zůstávají striktní, nejednoznačné hodnoty se neodhadují. CI je připravené; vzdálený úspěch dosud není doložený.
