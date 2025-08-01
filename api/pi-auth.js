const { initializeApp, cert } = require('firebase-admin/app');
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
    privateKey = privateKey.replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
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
  // リクエストボディを手動で取得
  let rawBody = '';
  try {
    rawBody = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => {
        data += chunk;
      });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  } catch {
    res.status(400).json({ error: 'Failed to read request body' });
    return;
  }
  // JSONパースと UID 抽出
  let uid;
  if (rawBody) {
    try {
      const parsed = JSON.parse(rawBody);
      uid = parsed && parsed.uid;
    } catch {
      res.status(400).json({ error: 'Invalid JSON in request body' });
      return;
    }
  }
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
