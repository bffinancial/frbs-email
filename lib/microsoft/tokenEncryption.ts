import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const value =
    process.env.MICROSOFT_TOKEN_ENCRYPTION_KEY?.trim();

  if (!value) {
    throw new Error(
      "Missing required environment variable: MICROSOFT_TOKEN_ENCRYPTION_KEY"
    );
  }

  if (!/^[a-fA-F0-9]{64}$/.test(value)) {
    throw new Error(
      "MICROSOFT_TOKEN_ENCRYPTION_KEY must be a 64-character hexadecimal value."
    );
  }

  return Buffer.from(value, "hex");
}

export function encryptMicrosoftTokenCache(
  plaintext: string
): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    getEncryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptMicrosoftTokenCache(
  encryptedValue: string
): string {
  const [version, ivValue, authTagValue, ciphertextValue] =
    encryptedValue.split(".");

  if (
    version !== "v1" ||
    !ivValue ||
    !authTagValue ||
    !ciphertextValue
  ) {
    throw new Error(
      "The Microsoft token cache has an invalid format."
    );
  }

  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getEncryptionKey(),
      Buffer.from(ivValue, "base64url")
    );

    decipher.setAuthTag(
      Buffer.from(authTagValue, "base64url")
    );

    const decrypted = Buffer.concat([
      decipher.update(
        Buffer.from(ciphertextValue, "base64url")
      ),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    throw new Error(
      "Unable to decrypt the Microsoft token cache."
    );
  }
}