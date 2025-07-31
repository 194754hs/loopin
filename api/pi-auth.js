/*
 * Vercel Serverless Function: PI authentication to Firebase custom token
 *
 * This function receives a POST request with a Pi user's `uid` in the body.
 * It uses Firebase Admin SDK to generate a custom token for that UID and
 * returns the token as JSON. You must set the following environment
 * variables in your Vercel project:
 *
 *   - FIREBASE_PROJECT_ID
 *   - FIREBASE_CLIENT_EMAIL
 *   - FIREBASE_PRIVATE_KEY (replace newlines with \n)
 *
 * These values come from your Firebase service account JSON. Do not commit
 * the private key to your repository. Configure them in the Vercel dashboard
 * under Project Settings → Environment Variables.
 */

const { initializeApp, cert, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

let firebaseInitialized = false;

function initFirebase() {
  if (!firebaseInitialized) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase environment variables are not set');
    }
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    firebaseInitialized = true;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    initFirebase();
  } catch (err) {
    res.status(500).json({ error: err.message });
    return;
  }

  const { uid } = req.body || {};
  if (!uid) {
    res.status(400).json({ error: 'UID is required' });
    return;
  }
  try {
    const token = await getAuth().createCustomToken(uid);
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
