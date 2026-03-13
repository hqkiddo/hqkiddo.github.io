/**
 * Firebase configuration for HQ Kiddo.
 *
 * To enable login and cloud sync:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a project (or use existing)
 * 3. Enable Authentication → Sign-in method → Email/Password
 * 4. Create Firestore Database (Start in test mode for development)
 * 5. Add a Web app and copy the config below
 * 6. Replace the placeholder values with your real config
 *
 * Firestore rules (in Firebase Console → Firestore → Rules):
 *
 *   rules_version = '2';
 *   service cloud.firestore {
 *     match /databases/{database}/documents {
 *       match /users/{userId}/{document=**} {
 *         allow read, write: if request.auth != null && request.auth.uid == userId;
 *       }
 *     }
 *   }
 */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Set to true once you've added your real config
const FIREBASE_ENABLED = false;

if (FIREBASE_ENABLED && typeof firebase !== "undefined" && !firebaseConfig.apiKey.startsWith("YOUR_")) {
  firebase.initializeApp(firebaseConfig);
}
window.FIREBASE_ENABLED = FIREBASE_ENABLED;
