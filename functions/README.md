# Push-Mitteilungen einrichten (Cloud Functions)

Ohne diese Einrichtung funktionieren die Benachrichtigungen trotzdem: Die Glocke in der App und Meldungen, solange die App offen oder im Hintergrund ist. **Mitteilungen bei geschlossener App** brauchen einen kleinen Server, der sie verschickt. Dafür sind diese Cloud Functions da.

Sie reagieren auf vier Ereignisse und senden Web-Push an die Geräte, die Push eingeschaltet haben (Tab *Konto*):

| Ereignis | Mitteilung an |
|---|---|
| neue Freundschaftsanfrage (`requests`) | Empfänger der Anfrage |
| Anfrage angenommen (`friends`) | Absender der Anfrage |
| Einladung zu einer Degustation (`invites`) | eingeladene Person |
| Freund fügt einen Whisky hinzu (`profiles/{uid}/activity`) | alle Freunde, wenn die Sammlung freigegeben ist |

Wer eine Art im Tab *Konto* abschaltet, bekommt sie auch als Push nicht mehr.

## Voraussetzungen

- Das Firebase-Projekt braucht den **Blaze-Tarif** (Pay as you go). Cloud Functions lassen sich im Spark-Tarif nicht bereitstellen. Für eine kleine Freundesgruppe bleibt der Verbrauch im kostenlosen Kontingent. Richte trotzdem unter *Nutzung und Abrechnung* ein Budget mit E-Mail-Warnung ein.
- Node.js 20 und die Firebase CLI: `npm install -g firebase-tools`, dann `firebase login`.

## Schritte

1. **Schlüssel erzeugen** (einmalig):
   ```
   npx web-push generate-vapid-keys
   ```
   Du erhältst einen öffentlichen und einen privaten Schlüssel. Den privaten Schlüssel nirgends veröffentlichen.
2. **Öffentlichen Schlüssel in die App eintragen:** In `index.html` die Zeile `const VAPID_PUBLIC_KEY='';` mit dem öffentlichen Schlüssel füllen und die Änderung auf `main` bringen.
3. **Region prüfen:** In `functions/index.js` steht `REGION = 'europe-west1'`. Sie muss zum Standort deiner Firestore-Datenbank passen (`eur3` → `europe-west1`, `europe-west6` → `europe-west6`). Den Standort zeigt die Firebase-Konsole unter *Firestore Database*.
4. **Abhängigkeiten installieren:**
   ```
   cd functions
   npm install
   cd ..
   ```
5. **Privaten Schlüssel als Secret speichern:**
   ```
   firebase functions:secrets:set VAPID_PRIVATE_KEY
   ```
   Den privaten Schlüssel einfügen, wenn danach gefragt wird.
6. **Bereitstellen:**
   ```
   firebase deploy --only functions
   ```
   Die CLI fragt nach `VAPID_PUBLIC_KEY` (der öffentliche Schlüssel) und `VAPID_SUBJECT` (z. B. `mailto:deine@adresse.ch`).
7. **Firestore-Regeln** für `invites` und `activity` müssen veröffentlicht sein (Abschnitt im Pull Request zu Version 1.8.0).

## Testen

1. App auf dem Handy öffnen. Auf dem iPhone zuerst über *Teilen → Zum Home-Bildschirm* installieren und von dort starten (Apple erlaubt Push nur für installierte Web-Apps, ab iOS 16.4).
2. Tab *Konto* → **Push auf diesem Gerät einschalten** und die Berechtigung erlauben.
3. Die App schliessen. Von einem zweiten Konto aus eine Freundschaftsanfrage schicken. Nach wenigen Sekunden erscheint die Mitteilung.

## Fehlersuche

- `firebase functions:log` zeigt die Protokolle der Funktionen.
- Erscheint nichts, prüfen: Ist unter `users/{uid}/push` in Firestore ein Eintrag für das Gerät? Ist die Region richtig? Hat die Person die Art der Mitteilung im Tab *Konto* nicht abgeschaltet?
- Abgelaufene Geräte (Fehler 404 oder 410) werden automatisch aus `users/{uid}/push` entfernt.
