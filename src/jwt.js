import { createPrivateKey, sign } from 'node:crypto';

const b64 = (x) => Buffer.from(x).toString('base64url');

/** App Store Connect token: ES256, valid 15 minutes (Apple allows up to 20). */
export function makeToken({ keyId, issuerId, privateKey, now = Date.now() }) {
  const head = b64(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }));
  const iat = Math.floor(now / 1000);
  const body = b64(JSON.stringify({ iss: issuerId, iat, exp: iat + 15 * 60, aud: 'appstoreconnect-v1' }));
  const signature = sign('sha256', Buffer.from(`${head}.${body}`), { key: createPrivateKey(privateKey), dsaEncoding: 'ieee-p1363' });
  return `${head}.${body}.${b64(signature)}`;
}
