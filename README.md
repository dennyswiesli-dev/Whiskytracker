# Whisky Vault (mit Konto, Cloud-Sync und Freunden)

Statische Webseite für GitHub Pages. Anmeldung (E-Mail/Passwort und Google), Datenbank und Freundesfunktion laufen über Firebase (Spark-Plan, kostenlos).

## 1. Firebase einrichten (einmalig, ca. 10 Minuten)

1. <https://console.firebase.google.com> → **Projekt hinzufügen** (Google Analytics kann aus bleiben).
2. **Build → Authentication → Los geht's → Anmeldemethode**:
   - **E-Mail/Passwort** aktivieren.
   - **Google** aktivieren (Support-E-Mail wählen).
3. **Build → Firestore Database → Datenbank erstellen** (Produktionsmodus, Standort z. B. `eur3` oder `europe-west6` Zürich).
4. Reiter **Regeln**: kompletten Inhalt von `firestore.rules` einfügen → **Veröffentlichen**. Ohne diese Regeln ist die App nicht geschützt.
5. **Projekteinstellungen (Zahnrad) → Allgemein → Deine Apps → Web (</>)**: App registrieren und die `firebaseConfig`-Werte kopieren.
6. In `index.html` oben im Skript den Block `firebaseConfig` mit diesen Werten ersetzen.
7. **Authentication → Einstellungen → Autorisierte Domains → Domain hinzufügen**: `<dein-name>.github.io`. Sonst scheitert die Google-Anmeldung.

Die Werte in `firebaseConfig` sind nicht geheim, der Schutz liegt in den Firestore-Regeln.

## 2. Auf GitHub Pages veröffentlichen

1. Neues Repo, `index.html`, `firestore.rules` und `README.md` hochladen.
2. Settings → Pages → *Deploy from a branch* → `main` / `(root)`.
3. Nach ca. einer Minute: `https://<dein-name>.github.io/<repo>/`.

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
- Alte lokale Daten der Version ohne Konto werden erkannt und lassen sich im Tab **Konto** übernehmen.
- Die automatische Preissuche nutzt Open Prices (Community-Preise, nur mit Barcode). Einen Live-«günstigster Händler»-Preis kann eine reine Browser-App nicht zuverlässig abrufen. Dafür gibt es Vergleichslinks.
- Konto komplett löschen: aktuell in der Firebase-Konsole (Authentication). «Alle meine Whisky-Daten löschen» im Tab Konto entfernt Flaschen, Degustationen und Freigaben.
