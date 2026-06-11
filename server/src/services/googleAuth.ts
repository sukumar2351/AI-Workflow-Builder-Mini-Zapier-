import { OAuth2Client } from 'google-auth-library';

const getGoogleClientID = () => process.env.GOOGLE_CLIENT_ID || '';

export async function verifyGoogleToken(token: string) {
  const clientId = getGoogleClientID();
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured on the server.');
  }

  const client = new OAuth2Client(clientId);

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid token payload.');
    }

    return {
      googleId: payload.sub,
      email: payload.email || '',
      name: payload.name || '',
      avatar: payload.picture || '',
    };
  } catch (error: any) {
    console.error('Error verifying Google ID token:', error.message);
    throw new Error('Invalid Google token.');
  }
}
