import crypto from "crypto";

type MicrosoftStatePayload = {
  agentId: string;
  userId: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
};

const STATE_LIFETIME_SECONDS = 10 * 60;

function getStateSecret(): string {
  const secret = process.env.MICROSOFT_STATE_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "Missing required environment variable: MICROSOFT_STATE_SECRET"
    );
  }

  return secret;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(encodedPayload: string): string {
  return crypto
    .createHmac("sha256", getStateSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createMicrosoftState(
  agentId: string,
  userId: string
): string {
  const issuedAt = Math.floor(Date.now() / 1000);

  const payload: MicrosoftStatePayload = {
    agentId,
    userId,
    issuedAt,
    expiresAt: issuedAt + STATE_LIFETIME_SECONDS,
    nonce: crypto.randomBytes(24).toString("hex"),
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyMicrosoftState(
  state: string
): MicrosoftStatePayload {
  const [encodedPayload, providedSignature, ...extraParts] =
    state.split(".");

  if (
    !encodedPayload ||
    !providedSignature ||
    extraParts.length > 0
  ) {
    throw new Error("Invalid Microsoft OAuth state.");
  }

  const expectedSignature = sign(encodedPayload);

  const providedBuffer = Buffer.from(
    providedSignature,
    "base64url"
  );

  const expectedBuffer = Buffer.from(
    expectedSignature,
    "base64url"
  );

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error("Microsoft OAuth state signature is invalid.");
  }

  let payload: MicrosoftStatePayload;

  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as MicrosoftStatePayload;
  } catch {
    throw new Error("Microsoft OAuth state payload is invalid.");
  }

  if (
    !payload.agentId ||
    !payload.userId ||
    !payload.issuedAt ||
    !payload.expiresAt ||
    !payload.nonce
  ) {
    throw new Error("Microsoft OAuth state is incomplete.");
  }

  const currentTime = Math.floor(Date.now() / 1000);

  if (payload.expiresAt < currentTime) {
    throw new Error("Microsoft OAuth state has expired.");
  }

  if (payload.issuedAt > currentTime + 60) {
    throw new Error("Microsoft OAuth state timestamp is invalid.");
  }

  return payload;
}