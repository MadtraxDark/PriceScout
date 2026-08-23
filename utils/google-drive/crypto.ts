import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function keyFromEnvironment(value: string): Buffer {
  const decoded = Buffer.from(value, "base64");
  if (decoded.length === 32) return decoded;
  const hex = Buffer.from(value, "hex");
  if (hex.length === 32) return hex;
  throw new Error("GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY deve conter 32 bytes em base64 ou hexadecimal.");
}

export function encryptRefreshToken(value: string, keyValue: string): string {
  const key = keyFromEnvironment(keyValue);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((item) => item.toString("base64url")).join(".");
}

export function decryptRefreshToken(value: string, keyValue: string): string {
  const [ivValue, tagValue, ciphertextValue] = value.split(".");
  if (!ivValue || !tagValue || !ciphertextValue) throw new Error("Token Google Drive armazenado em formato inválido.");
  const decipher = createDecipheriv("aes-256-gcm", keyFromEnvironment(keyValue), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, "base64url")), decipher.final()]).toString("utf8");
}

type OAuthState = { userId: string; nonce: string; expiresAt: number };

export function createOAuthState(payload: Omit<OAuthState, "nonce">, secret: string): string {
  const body = Buffer.from(JSON.stringify({ ...payload, nonce: randomBytes(18).toString("base64url") })).toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyOAuthState(value: string, secret: string): OAuthState | null {
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", secret).update(body).digest();
  const received = Buffer.from(signature, "base64url");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OAuthState;
    if (!parsed.userId || !parsed.nonce || parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}
