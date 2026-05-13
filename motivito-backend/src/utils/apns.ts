import apn from 'apn';

let provider: apn.Provider | null = null;

export function initApns() {
  const keyId    = process.env.APNS_KEY_ID;
  const teamId   = process.env.APNS_TEAM_ID;
  const bundleId = process.env.APNS_BUNDLE_ID || 'org.reactjs.native.example.AmazingMotivito';

  // يدعم base64 (Railway) أو نص عادي مع \n
  const keyB64 = process.env.APNS_KEY_B64;
  const keyRaw = process.env.APNS_KEY;
  const keyBuffer = keyB64
    ? Buffer.from(keyB64, 'base64')
    : keyRaw
    ? Buffer.from(keyRaw.replace(/\\n/g, '\n'))
    : null;

  if (!keyId || !teamId || !keyBuffer) {
    console.warn('⚠️  APNs not configured — push notifications disabled');
    return;
  }

  provider = new apn.Provider({
    token: {
      key: keyBuffer,
      keyId,
      teamId,
    },
    production: process.env.APNS_PRODUCTION === 'true',
  });

  console.log('✅ APNs provider initialized');
}

export async function sendApnsNotification(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (!provider) return;

  const bundleId = process.env.APNS_BUNDLE_ID || 'org.reactjs.native.example.AmazingMotivito';

  const note = new apn.Notification();
  note.expiry     = Math.floor(Date.now() / 1000) + 3600;
  note.badge      = 1;
  note.sound      = 'default';
  note.alert      = { title, body };
  note.topic      = bundleId;
  note.payload    = data || {};

  try {
    console.log(`📤 Sending APNs to token: ${deviceToken.substring(0, 10)}... title: "${title}"`);
    const result = await provider.send(note, deviceToken);
    if (result.failed.length > 0) {
      console.error('❌ APNs failed:', JSON.stringify(result.failed[0]));
    } else {
      console.log(`✅ APNs sent successfully (${result.sent.length} sent)`);
    }
  } catch (e: any) {
    console.error('❌ APNs error:', e.message);
  }
}
