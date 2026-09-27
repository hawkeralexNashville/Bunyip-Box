import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

const KEY_LENGTH = 64;
const SCRYPT_COST = 131_072;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const MAX_PASSWORD_BYTES = 128;

function scrypt(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validatePassword(password: string): string | null {
  const length = Buffer.byteLength(password, "utf8");

  if (length < 12) return "Password must be at least 12 characters.";
  if (length > MAX_PASSWORD_BYTES) return "Password is too long.";
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: 256 * 1024 * 1024,
  });

  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [algorithm, cost, blockSize, parallelization, saltValue, hashValue] =
    storedHash.split("$");

  if (
    algorithm !== "scrypt" ||
    !cost ||
    !blockSize ||
    !parallelization ||
    !saltValue ||
    !hashValue
  ) {
    return false;
  }

  const expected = Buffer.from(hashValue, "base64url");
  if (expected.length !== KEY_LENGTH) return false;

  try {
    const actual = await scrypt(
      password,
      Buffer.from(saltValue, "base64url"),
      expected.length,
      {
        N: Number(cost),
        r: Number(blockSize),
        p: Number(parallelization),
        maxmem: 256 * 1024 * 1024,
      },
    );

    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
