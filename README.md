<p align="center">
  <img src="icons/icon-512.png" alt="Whisky Vault" width="140">
</p>

<h1 align="center">Whisky Vault</h1>

<p align="center">
  Dein privates Archiv für Sammlung, Degustationen und Kaufliste.<br>
  Statische Webseite für GitHub Pages, mit Konto, Cloud-Sync und Freunden über Firebase.
</p>

## Funktionen

- **Sammlung:** Flaschen mit Bild, Füllstand, Einstandspreis, Marktpreis, Note und Notizen.
- **Online-Abgleich:** Suche nach Name oder Barcode (Open Food Facts, UPCitemdb, Wikidata), Barcode-Scanner mit Kamera oder Foto.
- **Bild ausrichten:** Bild verschieben und zoomen, damit das Etikett im Rahmen sitzt.
- **Degustation:** Abende anlegen, Whiskys bewerten (Punkte, Nase, Gaumen, Abgang, Geschmacksrichtungen).
- **Kaufliste** und **Preisvergleich** über Links (Google Shopping, toppreise.ch, idealo.de, Whiskybase).
- **Freunde:** Sammlung per Freundescode teilen. Preise bleiben privat.
- **Als App installierbar:** Auf dem Handy «Zum Home-Bildschirm» wählen. Offline zeigt die App die zuletzt geladene Version.

## 1. Firebase einrichten (einmalig, ca. 10 Minuten)

1. <https://console.firebase.google.com> → **Projekt hinzufügen** (Google Analytics kann aus bleiben).
2. **Build → Authentication → Los geht's → Anmeldemethode**:
   - **E-Mail/Passwort** aktivieren.
   - **Google** aktivieren (Support-E-Mail wählen).
3. **Build → Firestore Database → Datenbank erstellen** (Produktionsmodus, Standort z. B. `eur3` oder `europe-west6` Zürich).
4. Reiter **Regeln**: den Inhalt von `firestore.rules` einfügen → **Veröffentlichen**. Ohne diese Regeln ist die App nicht geschützt.
5. **Projekteinstellungen (Zahnrad) → Allgemein → Deine Apps → Web (</>)**: App registrieren und die `firebaseConfig`-Werte kopieren.
6. In `index.html` im Skript den Block `firebaseConfig` mit diesen Werten ersetzen.
7. **Authentication → Einstellungen → Autorisierte Domains → Domain hinzufügen**: `<dein-name>.github.io`. Sonst scheitert die Google-Anmeldung.

Die Werte in `firebaseConfig` sind nicht geheim, der Schutz liegt in den Firestore-Regeln.

## 2. Auf GitHub Pages veröffentlichen

1. Alle Dateien dieses Repos auf den Branch `main` legen.
2. Settings → Pages → *Deploy from a branch* → `main` / `(root)`.
3. Nach ca. einer Minute: `https://<dein-name>.github.io/<repo>/`.
4. Optional: Settings → General → **Social preview** → `icons/social-preview.png` hochladen (Vorschaubild beim Teilen des Repos).

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | die ganze App |
| `manifest.webmanifest` | Name, Farben und Icons für die Installation als App |
| `sw.js` | Service Worker: lädt die App offline aus dem Zwischenspeicher, Updates kommen zuerst vom Netz |
| `icons/icon.svg` | Logo (Vektor), auch als Favicon |
| `icons/icon-192.png`, `icon-512.png` | App-Icons |
| `icons/icon-maskable-512.png` | Icon für runde und eckige Masken (Android) |
| `icons/apple-touch-icon.png` | Icon für den iPhone-Home-Bildschirm |
| `icons/favicon-32.png` | Favicon für ältere Browser |
| `icons/glass.svg` | Nur das Glas ohne Hintergrund |
| `icons/social-preview.png` | Vorschaubild 1280×640 für GitHub |

Das Logo ist ein Glencairn-Glas in den Farben der App (Fassholz `#17120e`, Kupfer `#c8813a`, Etikett `#efe6d2`).

## Datenmodell

| Pfad | Inhalt | Wer liest |
|---|---|---|
| `users/{uid}` | Einstellungen | nur du |
| `users/{uid}/bottles`, `sessions`, `tastings` | Flaschen (inkl. Preise), Degustationen, Bewertungen | nur du |
| `profiles/{uid}` | Anzeigename, Freundescode, Freigabe-Schalter | alle angemeldeten Nutzer |
| `profiles/{uid}/shared/{id}` | Kopie jeder Flasche **ohne Preise** | du und deine Freunde, wenn Freigabe an |
| `requests/{absender_empfänger}` | offene Freundschaftsanfragen | Absender und Empfänger |
| `friends/{uidA_uidB}` | bestätigte Freundschaften | die beiden Personen |

## Freunde

- Jede Person hat einen Freundescode (z. B. `K7QF-2MXP`) im Tab **Freunde**.
- Code des Freundes eingeben → Anfrage. Die andere Person nimmt an → ihr seid befreundet.
- Freunde sehen Name, Bild, Füllstand, Note und Notizen. **Einstandspreise, Marktpreise, Degustationen und Kaufliste bleiben privat.**
- Der Schalter «Freunde dürfen meine Sammlung sehen» sperrt die Freigabe sofort. Freundschaft beenden entzieht den Zugriff.
- Freunde werden bewusst nur per Code hinzugefügt, nicht per E-Mail-Suche. So lassen sich keine E-Mail-Adressen anderer Nutzer auslesen.

## Hinweise

- Offline-Betrieb: Firestore speichert lokal zwischen und synchronisiert, sobald wieder Internet da ist.
- Bilder werden verkleinert als Daten im Dokument gespeichert (Limit 1 MB pro Dokument, reicht problemlos). Es wird kein Firebase Storage benötigt.
- Die Online-Suche ist nur so gut wie die Datenbanken dahinter. Whisky ist dort nur lückenhaft erfasst. Wenn nichts gefunden wird, lassen sich alle Felder von Hand ausfüllen.
- Die automatische Preissuche nutzt Open Prices (Community-Preise, nur mit Barcode). Einen Live-«günstigster Händler»-Preis kann eine reine Browser-App nicht abrufen. Dafür gibt es die Vergleichslinks.
- Nach einem Update der App kann es einmal nötig sein, die Seite neu zu laden, damit die neue Version aktiv wird.
- Konto komplett löschen: in der Firebase-Konsole (Authentication). «Alle meine Whisky-Daten löschen» im Tab Konto entfernt Flaschen, Degustationen und Freigaben.
