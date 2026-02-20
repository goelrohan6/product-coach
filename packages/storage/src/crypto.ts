import fs from "node:fs";
import path from "node:path";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual
} from "node:crypto";
import { resolveDbPath } from "./db.js";

const MASTER_KEY_FILE = "master.key";

type EncryptedSecret = {
  encrypted: string;
  iv: string;
  tag: string;
};

function dataDir(): string {
  return path.dirname(resolveDbPath());
}

function masterKeyPath(): string {
  return path.join(dataDir(), MASTER_KEY_FILE);
}

function ensureMasterKey(): Buffer {
  const filePath = masterKeyPath();

  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const key = randomBytes(32);
    fs.writeFileSync(filePath, key, { mode: 0o600 });
    return key;
  }

  return fs.readFileSync(filePath);
}

export function hashPasscode(passcode: string, salt?: string): { hash: string; salt: string } {
  const finalSalt = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(passcode, finalSalt, 64).toString("hex");
  return { hash, salt: finalSalt };
}

export function verifyPasscode(passcode: string, expectedHash: string, salt: string): boolean {
  const computed = scryptSync(passcode, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");
  if (computed.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(computed, expected);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashToken(token) };
}

function deriveSecretKey(passcodeHash: string): Buffer {
  const masterKey = ensureMasterKey();
  const hmac = createHmac("sha256", masterKey).update(passcodeHash).digest();
  return hmac.subarray(0, 32);
}

export function encryptApiKey(apiKey: string, passcodeHash: string): EncryptedSecret {
  const key = deriveSecretKey(passcodeHash);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64")
  };
}

export function decryptApiKey(payload: EncryptedSecret, passcodeHash: string): string {
  const key = deriveSecretKey(passcodeHash);
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const encrypted = Buffer.from(payload.encrypted, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
