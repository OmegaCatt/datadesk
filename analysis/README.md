# Obnovitelný SQL report

1. V DataDesku otevřete scénář nebo namapujte CSV a zvolte **Uložit případ**.
2. Spusťte `python analysis/report.py datadesk_pripad.json --output coverage.csv`.
3. V Excelu použijte **Data → Z textu/CSV**, UTF-8, středník. Nastavte `shop` jako text. Uložte dotaz v sešitu; po nahrazení souboru stejnou cestou použijte **Aktualizovat vše**.

Report je skutečný samostatně spustitelný SQL výpočet, ne screenshot dashboardu. Python standardní knihovna vytvoří dočasnou SQLite databázi, parametrizovaně vloží identifikátory a spustí čitelný `coverage.sql`. Nic se neodesílá do sítě. Report neobnovuje prověření ani nepovažuje obsah JSON za autentický auditní záznam.

## Definice

- `unique_orders`: objednávky s neprázdným obchodem a ID, které je v tomto obchodě právě jednou. Duplicitní skupiny nejsou vybrány ani sloučeny.
- `matched_orders`: jedinečné objednávky, na které odkazuje alespoň jedna zásilka ze stejného obchodu. Více zásilek nezvyšuje počet objednávek.
- `without_shipment`: ostatní jedinečné objednávky. Chybějící záznam neprokazuje zpoždění.
- Součet posledních dvou sloupců se rovná prvnímu. Nejde o ověření množství, ceny, správnosti ostatních polí ani včasnosti dodání; tyto kontroly provádí původní engine a jeho nálezy.

Testy: `python -m unittest discover -s analysis -v`.
