/**
 * HQ Kiddo - Firestore database helpers
 * Syncs app data to cloud when user is logged in.
 */
(function () {
  "use strict";

  function getDb() {
    return window.FIREBASE_ENABLED && window.firebase ? firebase.firestore() : null;
  }

  function getUserId() {
    return window.HQAuth && HQAuth.getUserId ? HQAuth.getUserId() : null;
  }

  function userDoc(collection) {
    const db = getDb();
    const uid = getUserId();
    if (!db || !uid) return null;
    return db.collection("users").doc(uid).collection(collection);
  }

  window.HQDb = {
    async getNotes() {
      const col = userDoc("notes");
      if (!col) return null;
      const snap = await col.orderBy("date", "desc").get();
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    async saveNotes(notes) {
      const col = userDoc("notes");
      if (!col) return;
      const batch = getDb().batch();
      const existing = await col.get();
      existing.docs.forEach((d) => batch.delete(d.ref));
      notes.forEach((n) => {
        const ref = col.doc(n.id);
        batch.set(ref, { date: n.date, text: n.text, image: n.image });
      });
      await batch.commit();
    },

    async getMagnifying() {
      const db = getDb();
      const uid = getUserId();
      if (!db || !uid) return null;
      const doc = await db.collection("users").doc(uid).collection("data").doc("magnifying").get();
      return doc.exists ? doc.data() : null;
    },

    async saveMagnifying(data) {
      const db = getDb();
      const uid = getUserId();
      if (!db || !uid) return;
      await db.collection("users").doc(uid).collection("data").doc("magnifying").set(data);
    },

    async getPenguin() {
      const db = getDb();
      const uid = getUserId();
      if (!db || !uid) return null;
      const doc = await db.collection("users").doc(uid).collection("data").doc("penguin").get();
      const data = doc.exists ? doc.data() : null;
      if (data && data.ownedItems) data.ownedItems = new Set(data.ownedItems);
      return data;
    },

    async savePenguin(data) {
      const toSave = { ...data };
      if (toSave.ownedItems) toSave.ownedItems = Array.from(toSave.ownedItems);
      const db = getDb();
      const uid = getUserId();
      if (!db || !uid) return;
      await db.collection("users").doc(uid).collection("data").doc("penguin").set(toSave);
    },

    async getSettings() {
      const db = getDb();
      const uid = getUserId();
      if (!db || !uid) return null;
      const doc = await db.collection("users").doc(uid).collection("data").doc("settings").get();
      return doc.exists ? doc.data() : null;
    },

    async saveSettings(data) {
      const db = getDb();
      const uid = getUserId();
      if (!db || !uid) return;
      await db.collection("users").doc(uid).collection("data").doc("settings").set(data);
    },
  };
})();
