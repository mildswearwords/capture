const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (ensure your service account is configured)
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'NewScraper-460202', // Replace with your Firebase project ID
});

// Get a Firestore reference
const db = admin.firestore();

// Example Firestore query
async function queryFirestore() {
  const snapshot = await db.collection('urls').get();

  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

queryFirestore().catch(console.error);
