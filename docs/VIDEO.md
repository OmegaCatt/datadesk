# DataDesk: video ukázka

**[Stáhnout MP4 — 0:47, bez zvuku](https://raw.githubusercontent.com/OmegaCatt/datadesk/main/docs/videos/datadesk.mp4)** · [Soubor na GitHubu](https://github.com/OmegaCatt/datadesk/blob/main/docs/videos/datadesk.mp4)

Nález, původní řádky, kontrolní poznámka a pětilistý Excel report.

## Co ve videu uvidíte

- Otevření konkrétního nálezu a jeho původních řádků.
- Zapsání kontrolní poznámky bez změny zdrojových dat.
- Stažení skutečného Excel reportu s pěti listy.

Video zachycuje skutečnou aplikaci nad izolovanými fiktivními daty. Má rozlišení **1920 × 1080**, **25 snímků/s**, přibližně **4.1 MB** a české titulky přímo v obrazu. Pohyb myši i kliknutí jsou viditelné. **Neobsahuje zvukovou stopu.**

Odkaz stáhne video MP4. Po stažení jej otevřete v běžném přehrávači videa. Ukázka nepotřebuje instalaci aplikace. Pro vlastní vyzkoušení pokračujte [návodem ke spuštění](../README.md#spuštění-krok-za-krokem-windows).

## Jak byl záznam ověřen

Při pořizování proběhl skutečný HTTP/browser scénář s kontrolami výsledků. AI API nebylo volané. Ověřeno celé dekódování výsledného MP4, H.264/yuv420p, rozlišení, absence audio stopy, samostatné přehrání/posun a obrazové snímky titulkových úseků a kliknutí. Jde o ověření konkrétní ukázky; záznam neměří obecnou přesnost AI ani produkční připravenost aplikace.

[Metadata záznamu](videos/datadesk-recording.json) obsahují kontrolované výsledky, zdrojový commit `84b5d5cdd1d52408954b21cc6b44a7a92f7b7036` a otisky nahrávacích skriptů. SHA-256 MP4: `d0b3013d20192c2c210b0ca5589b883b691d5362329dda69ebbc2aa5536e9002`. Časy kroků v metadatech jsou orientační; titulky jsou přímo v obrazu.

Scénář: [scripts/record-demo.mjs](../scripts/record-demo.mjs). Nahrávací vrstva: [scripts/recording.mjs](../scripts/recording.mjs). Při vývojovém zopakování je potřeba Playwright a plný FFmpeg s libx264 (`PORTFOLIO_FFMPEG`); běžné přehrání videa je nevyžaduje.

## English

**[Download the silent Full HD demo (0:47)](https://raw.githubusercontent.com/OmegaCatt/datadesk/main/docs/videos/datadesk.mp4).** Open the downloaded MP4 in a standard video player. Czech captions are burned into the image; the pointer and actual clicks are visible. Recorded from the real application using isolated fictional data, with result assertions and no AI API calls. Full decoding, playback, seeking and absence of audio were verified. [Run the application locally](../README.md#spuštění-krok-za-krokem-windows).
