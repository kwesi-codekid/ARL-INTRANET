/**
 * JWT Service - Token Generation, Validation, and Blacklisting
 * Uses native Node.js crypto for JWT handling (no external library needed)
 */

import { createHmac, randomUUID } from "crypto";
import { TokenBlacklist } from "~/lib/db/models/token-blacklist.server";
import { RefreshToken } from "~/lib/db/models/refresh-token.server";
import type { IUser } from "~/lib/db/models/user.server";

const JWT_SECRET = process.env.JWT_SECRET || "arl-jwt-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

interface JWTPayload {
  sub: string; // User ID
  phone: string;
  email?: string;
  name: string;
  role: string;
  permissions: string[];
  jti: string; // JWT ID for blacklisting
  iat: number; // Issued at
  exp: number; // Expiration
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
}

/**
 * Parse duration string to milliseconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // Default 15 minutes

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000;
  }
}

/**
 * Base64URL encode
 */
function base64URLEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Base64URL decode
 */
function base64URLDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Create HMAC SHA256 signature
 */
function createSignature(data: string): string {
  return createHmac("sha256", JWT_SECRET)
    .update(data)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Create a JWT token
 */
function createJWT(payload: Omit<JWTPayload, "iat" | "exp" | "jti">, expiresInMs: number): { token: string; jti: string; exp: Date } {
  const jti = randomUUID();
  const iat = Math.floor(Date.now() / 1000);
  const exp = Math.floor((Date.now() + expiresInMs) / 1000);

  const fullPayload: JWTPayload = {
    ...payload,
    jti,
    iat,
    exp,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64URLEncode(JSON.stringify(header));
  const encodedPayload = base64URLEncode(JSON.stringify(fullPayload));
  const signature = createSignature(`${encodedHeader}.${encodedPayload}`);

  return {
    token: `${encodedHeader}.${encodedPayload}.${signature}`,
    jti,
    exp: new Date(exp * 1000),
  };
}

/**
 * Verify and decode a JWT token
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;

    // Verify signature
    const expectedSignature = createSignature(`${encodedHeader}.${encodedPayload}`);
    if (signature !== expectedSignature) return null;

    // Decode payload
    const payload = JSON.parse(base64URLDecode(encodedPayload)) as JWTPayload;

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Generate access and refresh token pair
 */
export async function generateTokenPair(
  user: IUser,
  deviceInfo?: string,
  ipAddress?: string
): Promise<TokenPair> {
  const accessExpiresMs = parseDuration(JWT_EXPIRES_IN);
  const refreshExpiresMs = parseDuration(JWT_REFRESH_EXPIRES_IN);

  const payload = {
    sub: user._id.toString(),
    phone: user.phone,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
  };

  const { token: accessToken, exp: accessTokenExpiry } = createJWT(payload, accessExpiresMs);
  const { token: refreshToken, jti: refreshJti, exp: refreshTokenExpiry } = createJWT(payload, refreshExpiresMs);

  // Store refresh token in database
  await RefreshToken.create({
    userId: user._id,
    token: refreshJti, // Store the JTI, not the full token
    deviceInfo,
    ipAddress,
    expiresAt: refreshTokenExpiry,
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiry,
    refreshTokenExpiry,
  };
}

/**
 * Verify access token and check blacklist
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  const payload = verifyJWT(token);
  if (!payload) return null;

  // Check if token is blacklisted
  const isBlacklisted = await TokenBlacklist.exists({ jti: payload.jti });
  if (isBlacklisted) return null;

  return payload;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; accessTokenExpiry: Date } | null> {
  const payload = verifyJWT(refreshToken);
  if (!payload) return null;

  // Find refresh token in database and verify it's not revoked
  const storedToken = await RefreshToken.findOne({
    token: payload.jti,
    isRevoked: false,
  });

  if (!storedToken) return null;

  // Generate new access token with same payload
  const accessExpiresMs = parseDuration(JWT_EXPIRES_IN);
  const { token: accessToken, exp: accessTokenExpiry } = createJWT(
    {
      sub: payload.sub,
      phone: payload.phone,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      permissions: payload.permissions,
    },
    accessExpiresMs
  );

  return { accessToken, accessTokenExpiry };
}

/**
 * Blacklist an access token (for logout)
 */
export async function blacklistToken(token: string): Promise<boolean> {
  const payload = verifyJWT(token);
  if (!payload) return false;

  try {
    await TokenBlacklist.create({
      jti: payload.jti,
      expiresAt: new Date(payload.exp * 1000),
    });
    return true;
  } catch {
    // Token might already be blacklisted
    return true;
  }
}

/**
 * Revoke refresh token
 */
export async function revokeRefreshToken(refreshToken: string): Promise<boolean> {
  const payload = verifyJWT(refreshToken);
  if (!payload) return false;

  const result = await RefreshToken.updateOne(
    { token: payload.jti },
    { isRevoked: true, revokedAt: new Date() }
  );

  return result.modifiedCount > 0;
}

/**
 * Revoke all refresh tokens for a user (force logout from all devices)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await RefreshToken.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true, revokedAt: new Date() }
  );
}

/**
 * Get token expiry times for cookie settings
 */
export function getTokenExpiries(): {
  accessTokenMaxAge: number;
  refreshTokenMaxAge: number;
} {
  return {
    accessTokenMaxAge: Math.floor(parseDuration(JWT_EXPIRES_IN) / 1000),
    refreshTokenMaxAge: Math.floor(parseDuration(JWT_REFRESH_EXPIRES_IN) / 1000),
  };
}
