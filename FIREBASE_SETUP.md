# Firebase Setup for Login & Cloud Sync

To enable login and save progress across devices:

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** (or use an existing one)
3. Follow the setup steps

## 2. Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click **Get started**
3. Under **Sign-in method**, enable **Email/Password**

## 3. Create Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development) or **Production mode** with rules
4. Pick a location

## 4. Add Firestore security rules

In Firestore → **Rules**, use:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This lets each user read/write only their own data.

## 5. Add a Web app

1. In Project settings (gear icon), under **Your apps**
2. Click the **Web** icon (`</>`)
3. Register the app (e.g. name it "HQ Kiddo")
4. Copy the `firebaseConfig` object

## 6. Update firebase-config.js

Open `firebase-config.js` and replace the placeholder values with your config:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};

const FIREBASE_ENABLED = true;  // ← Change this to true!
```

## Done

After this, the **Log in** and **Sign up** buttons will appear on the menu. Users can create accounts and their progress (notes, Magnifying Quest gems, Penguin Miner progress, theme) will sync across devices.
