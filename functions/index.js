/* Whisky Vault: Push-Mitteilungen
   Cloud Functions (2. Generation). Sie senden Web-Push an die Geräte, die in
   users/{uid}/push gespeichert sind. Einrichtung: functions/README.md */
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret, defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');
const webpush = require('web-push');

admin.initializeApp();
const db = admin.firestore();

const VAPID_PRIVATE = defineSecret('VAPID_PRIVATE_KEY');
const VAPID_PUBLIC = defineString('VAPID_PUBLIC_KEY');
const VAPID_SUBJECT = defineString('VAPID_SUBJECT', { default: 'mailto:admin@example.com' });

// Region der Funktionen. Sie muss zum Standort der Firestore-Datenbank passen
// (eur3 -> europe-west1, europe-west6 -> europe-west6).
const REGION = 'europe-west1';
const OPTS = { region: REGION, secrets: [VAPID_PRIVATE] };

/** Sendet eine Mitteilung an alle Geräte einer Person, wenn sie diese Art nicht abgeschaltet hat. */
async function send(uid, kind, payload) {
  if (!uid) return;
  const user = await db.doc(`users/${uid}`).get();
  if (user.exists && user.data()?.settings?.notify?.[kind] === false) return;
  const subs = await db.collection(`users/${uid}/push`).get();
  if (subs.empty) return;
  webpush.setVapidDetails(VAPID_SUBJECT.value(), VAPID_PUBLIC.value(), VAPID_PRIVATE.value());
  const body = JSON.stringify(payload);
  await Promise.all(subs.docs.map(async (d) => {
    const s = d.data();
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, body, { TTL: 60 * 60 * 24 });
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) await d.ref.delete(); // Gerät hat sich abgemeldet
      else console.warn('Push fehlgeschlagen', uid, e.statusCode || e.message);
    }
  }));
}

// Freundschaftsanfrage erhalten
exports.onFriendRequest = onDocumentCreated({ ...OPTS, document: 'requests/{rid}' }, async (e) => {
  const r = e.data && e.data.data();
  if (!r) return;
  await send(r.to, 'friendReq', {
    title: 'Freundschaftsanfrage',
    body: `${r.fromName || 'Jemand'} möchte dein Freund sein.`,
    tag: 'req:' + e.params.rid,
    url: './?go=freunde'
  });
});

// Anfrage wurde angenommen: Die Person, die angenommen hat, steht in "by"
exports.onFriendAccepted = onDocumentCreated({ ...OPTS, document: 'friends/{pid}' }, async (e) => {
  const f = e.data && e.data.data();
  if (!f || !f.by || !Array.isArray(f.members)) return;
  const other = f.members.find((m) => m !== f.by);
  const me = (await db.doc(`profiles/${f.by}`).get()).data();
  await send(other, 'friendAccepted', {
    title: 'Neuer Freund',
    body: `${(me && me.name) || 'Jemand'} ist jetzt dein Freund.`,
    tag: 'fr:' + e.params.pid,
    url: './?go=freunde'
  });
});

// Einladung zu einer gemeinsamen Degustation
exports.onInvite = onDocumentCreated({ ...OPTS, document: 'invites/{iid}' }, async (e) => {
  const i = e.data && e.data.data();
  if (!i) return;
  await send(i.to, 'invite', {
    title: 'Einladung zur Degustation',
    body: `${i.fromName || 'Ein Freund'} lädt dich zu «${i.name}» ein.`,
    tag: 'inv:' + e.params.iid,
    url: './?go=degustation'
  });
});

// Freund hat einen Whisky hinzugefügt (nur wenn er seine Sammlung freigegeben hat)
exports.onFriendActivity = onDocumentCreated({ ...OPTS, document: 'profiles/{uid}/activity/{eid}' }, async (e) => {
  const a = e.data && e.data.data();
  if (!a) return;
  const uid = e.params.uid;
  const profile = (await db.doc(`profiles/${uid}`).get()).data();
  if (profile && profile.share === false) return;
  const friends = await db.collection('friends').where('members', 'array-contains', uid).get();
  await Promise.all(friends.docs.map((d) => {
    const to = d.data().members.find((m) => m !== uid);
    return send(to, 'friendNew', {
      title: (profile && profile.name) || 'Ein Freund',
      body: `hat «${a.name}» hinzugefügt.`,
      tag: 'act:' + e.params.eid,
      url: './?go=freunde'
    });
  }));
});
