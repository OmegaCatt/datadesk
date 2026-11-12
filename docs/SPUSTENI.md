# DataDesk: když se spuštění nedaří

Základní postup s přesným příkazem a adresou je na [začátku README](../README.md#spuštění-krok-za-krokem-windows). Pro rychlé posouzení projektu stačí [veřejná ukázka](https://omegacatt.github.io/datadesk/portfolio/#datadesk).

- **„Příkaz nebyl rozpoznán“:** nainstalujte Node.js 24 nebo novější a otevřete nové okno Terminálu. Node ověříte příkazem `node --version`, Python příkazem `py -3 --version`. Pokud máte více verzí Pythonu, zkontrolujte, že vybraná má alespoň 3.13.
- **Soubor server.py / server.mjs nebyl nalezen:** Terminál je v jiné složce. Zavřete ho, v Průzkumníku otevřete rozbalenou složku projektu a z jejího adresního řádku znovu spusťte `powershell`. ZIP musí být rozbalený.
- **„Adresa je již používána“ / EADDRINUSE:** pravděpodobně už běží druhé okno aplikace. Otevřete uvedenou adresu, nebo původní běh ukončete v jeho Terminálu pomocí Ctrl+C. Není potřeba mazat data.
- **Stránka se nenačte:** zkontrolujte, že Terminál zůstal otevřený a neskončil chybou. Adresu napište včetně `http://`; nejde o vyhledávání na internetu ani o `https://`.
- **Kde zůstávají data:** jde o místní ukázku s fiktivními vstupy. Konkrétní ukládání a jeho limity popisuje README. Nepoužívejte skutečné personální či zákaznické soubory.
- **Mac nebo Linux:** ve složce projektu otevřete Terminal. U Python aplikací použijte `python3` místo `py -3` a virtuální Python `.venv/bin/python` místo `.\.venv\Scripts\python.exe`; u ReleaseGuardu použijte `npm`/`npx` místo `.cmd`. Ostatní příkazy a adresa zůstávají stejné. Primární ověřovaný postup je Windows.

## English quick start

View the [existing public portfolio preview](https://omegacatt.github.io/datadesk/portfolio/#datadesk) without installing anything. Server-based projects are demonstrated through stored results; this is not a public live backend. For the full local application, download and extract this repository's ZIP, install Node.js 24+, open a terminal in the extracted project directory and follow the commands at the top of the README. Keep that terminal running and open http://127.0.0.1:4173. Stop with Ctrl+C. The demonstration uses fictional data; the basic prepared-data demo requires no paid AI calls. Detailed developer tests remain separate from the basic walkthrough.
