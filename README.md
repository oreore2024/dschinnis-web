# dschinnis.fun

Website der **Bregenzer Dschinnis**. Reines HTML/CSS/JS, kein Baukasten, kein WordPress.
Veröffentlicht über GitHub Pages.

## Termine ändern (das Einzige, was regelmäßig zu tun ist)

1. Auf GitHub die Datei **`termine.txt`** öffnen.
2. Rechts oben auf den **Stift** (Edit) klicken.
3. Zeile hinzufügen, ändern oder löschen. Eine Zeile = ein Termin:

   ```
   09.02.2027 | 10:30 | Faschingsfinale | Landhaus Bregenz |
   ```

   | Feld    | Inhalt                                               |
   |---------|------------------------------------------------------|
   | Datum   | `TT.MM.JJJJ`                                         |
| Uhrzeit | `HH:MM`, `HH:MM-HH:MM` (von–bis) oder leer = ganztägig |
   | Titel   | Name des Termins; `*` davor hebt ihn hervor           |
   | Ort     | leer = kein Kartenlink                                |
   | Info    | optional, kurzer Hinweis                             |

4. Unten auf **Commit changes** klicken. Nach ca. 1 Minute ist die Seite aktuell.

Vergangene Termine verschwinden automatisch. Der Countdown oben zeigt immer den nächsten Termin.
Die Kalenderdateien (`termine.ics` zum Abonnieren, `ics/…` pro Termin) erzeugt GitHub dabei automatisch.

## Dateien

| Datei               | Zweck                                  |
|---------------------|----------------------------------------|
| `index.html`        | Startseite                             |
| `termine.txt`       | Termine (siehe oben)                   |
| `impressum.html`    | Impressum                              |
| `datenschutz.html`  | Datenschutzerklärung                   |
| `assets/style.css`  | Design (Farben ganz oben in `:root`)   |
| `assets/app.js`     | Termine anzeigen, Kalender-Export      |
| `assets/fonts/`     | Schriften lokal (DSGVO, kein Google)   |
| `CNAME`             | Domain für GitHub Pages                |
| `tools/build_ics.py`| erzeugt die Kalenderdateien           |
| `.github/workflows/`| veröffentlicht die Seite bei jedem Speichern |

## Lokal ansehen

```
python3 tools/build_ics.py .
python3 -m http.server 8000
```
dann http://localhost:8000 öffnen (direkt per Doppelklick lädt `termine.txt` nicht).
