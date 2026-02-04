/**
 * User Authentication Service
 * Handles regular user (employee) authentication with JWT
 * Supports both phone OTP (primary) and email OTP (backup)
 */

import { redirect } from "react-router";
import { User, type IUser } from "~/lib/db/models/user.server";
import { connectDB } from "~/lib/db/connection.server";
import {
  generateTokenPair,
  verifyAccessToken,
  refreshAccessToken,
  blacklistToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  getTokenExpiries,
} from "./jwt.server";
import { requestOTP, verifyOTP } from "./otp.server";
import { requestEmailOTP, verifyEmailOTP } from "./email-otp.server";
import { formatGhanaPhone, isValidGhanaPhone } from "./sms.server";
import { isValidEmail, normalizeEmail } from "./email.server";

// Cookie names for user auth (separate from admin session)
const ACCESS_TOKEN_COOKIE = "__arl_user_access";
const REFRESH_TOKEN_COOKIE = "__arl_user_refresh";

interface AuthResult {
  success: boolean;
  message: string;
  user?: IUser;
}

interface TokenResult {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Check if user exists by phone number
 */
export async function userExistsByPhone(phone: string): Promise<boolean> {
  if (!isValidGhanaPhone(phone)) return false;

  await connectDB();
  const formattedPhone = formatGhanaPhone(phone);
  const user = await User.findOne({ phone: formattedPhone, isActive: true });
  return !!user;
}

/**
 * Check if user exists by email
 */
export async function userExistsByEmail(email: string): Promise<boolean> {
  if (!isValidEmail(email)) return false;

  await connectDB();
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail, isActive: true });
  return !!user;
}

/**
 * Request phone OTP for user login
 */
export async function requestUserPhoneOTP(phone: string): Promise<AuthResult> {
  if (!isValidGhanaPhone(phone)) {
    return { success: false, message: "Invalid Ghana phone number" };
  }

  const exists = await userExistsByPhone(phone);
  if (!exists) {
    return { success: false, message: "Phone number not registered" };
  }

  const result = await requestOTP(phone);
  return {
    success: result.success,
    message: result.message,
  };
}

/**
 * Request email OTP for user login
 */
export async function requestUserEmailOTP(email: string): Promise<AuthResult> {
  if (!isValidEmail(email)) {
    return { success: false, message: "Invalid email address" };
  }

  const exists = await userExistsByEmail(email);
  if (!exists) {
    return { success: false, message: "Email not registered" };
  }

  const result = await requestEmailOTP(email);
  return {
    success: result.success,
    message: result.message,
  };
}

/**
 * Authenticate user by phone OTP
 */
export async function authenticateByPhoneOTP(
  phone: string,
  otp: string,
  ipAddress?: string
): Promise<AuthResult> {
  if (!isValidGhanaPhone(phone)) {
    return { success: false, message: "Invalid phone number" };
  }

  // Verify OTP
  const otpResult = await verifyOTP(phone, otp);
  if (!otpResult.success) {
    return { success: false, message: otpResult.message };
  }

  await connectDB();
  const formattedPhone = formatGhanaPhone(phone);

  // Find and update user
  const user = await User.findOneAndUpdate(
    { phone: formattedPhone, isActive: true },
    {
      lastLogin: new Date(),
      lastLoginIP: ipAddress,
      isVerified: true,
      $inc: { loginCount: 1 },
    },
    { new: true }
  );

  if (!user) {
    return { success: false, message: "User not found or inactive" };
  }

  return { success: true, message: "Authentication successful", user };
}

/**
 * Authenticate user by email OTP
 */
export async function authenticateByEmailOTP(
  email: string,
  otp: string,
  ipAddress?: string
): Promise<AuthResult> {
  if (!isValidEmail(email)) {
    return { success: false, message: "Invalid email address" };
  }

  // Verify OTP
  const otpResult = await verifyEmailOTP(email, otp);
  if (!otpResult.success) {
    return { success: false, message: otpResult.message };
  }

  await connectDB();
  const normalizedEmail = normalizeEmail(email);

  // Find and update user
  const user = await User.findOneAndUpdate(
    { email: normalizedEmail, isActive: true },
    {
      lastLogin: new Date(),
      lastLoginIP: ipAddress,
      emailVerified: true,
      $inc: { loginCount: 1 },
    },
    { new: true }
  );

  if (!user) {
    return { success: false, message: "User not found or inactive" };
  }

  return { success: true, message: "Authentication successful", user };
}

/**
 * Generate JWT tokens and create Set-Cookie headers
 */
export async function createUserTokens(
  user: IUser,
  deviceInfo?: string,
  ipAddress?: string
): Promise<{ headers: Headers }> {
  const tokens = await generateTokenPair(user, deviceInfo, ipAddress);
  const { accessTokenMaxAge, refreshTokenMaxAge } = getTokenExpiries();

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = `HttpOnly; Path=/; SameSite=Strict${isProduction ? "; Secure" : ""}`;

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `${ACCESS_TOKEN_COOKIE}=${tokens.accessToken}; Max-Age=${accessTokenMaxAge}; ${cookieOptions}`
  );
  headers.append(
    "Set-Cookie",
    `${REFRESH_TOKEN_COOKIE}=${tokens.refreshToken}; Max-Age=${refreshTokenMaxAge}; ${cookieOptions}`
  );

  return { headers };
}

/**
 * Get access token from request cookies
 */
export function getAccessToken(request: Request): string | null {
  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.match(new RegExp(`${ACCESS_TOKEN_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}

/**
 * Get refresh token from request cookies
 */
export function getRefreshToken(request: Request): string | null {
  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.match(new RegExp(`${REFRESH_TOKEN_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}

/**
 * Get current user from JWT
 */
export async function getCurrentUser(request: Request): Promise<IUser | null> {
  const accessToken = getAccessToken(request);
  if (!accessToken) return null;

  const payload = await verifyAccessToken(accessToken);
  if (!payload) return null;

  await connectDB();
  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) return null;

  return user;
}

/**
 * Require user authentication - redirects to login if not authenticated
 */
export async function requireUserAuth(
  request: Request,
  redirectTo: string = "/login"
): Promise<IUser> {
  const user = await getCurrentUser(request);

  if (!user) {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams([["redirectTo", url.pathname]]);
    throw redirect(`${redirectTo}?${searchParams}`);
  }

  return user;
}

/**
 * Refresh access token and update cookie
 */
export async function refreshUserToken(
  request: Request
): Promise<{ success: boolean; headers?: Headers; message: string }> {
  const refreshToken = getRefreshToken(request);
  if (!refreshToken) {
    return { success: false, message: "No refresh token" };
  }

  const result = await refreshAccessToken(refreshToken);
  if (!result) {
    return { success: false, message: "Invalid or expired refresh token" };
  }

  const { accessTokenMaxAge } = getTokenExpiries();
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = `HttpOnly; Path=/; SameSite=Strict${isProduction ? "; Secure" : ""}`;

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `${ACCESS_TOKEN_COOKIE}=${result.accessToken}; Max-Age=${accessTokenMaxAge}; ${cookieOptions}`
  );

  return { success: true, headers, message: "Token refreshed" };
}

/**
 * Logout user - blacklist tokens and clear cookies
 */
export async function logoutUser(request: Request): Promise<Headers> {
  const accessToken = getAccessToken(request);
  const refreshToken = getRefreshToken(request);

  // Blacklist access token
  if (accessToken) {
    await blacklistToken(accessToken);
  }

  // Revoke refresh token
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  // Clear cookies
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `${ACCESS_TOKEN_COOKIE}=; Max-Age=0; Path=/; HttpOnly`
  );
  headers.append(
    "Set-Cookie",
    `${REFRESH_TOKEN_COOKIE}=; Max-Age=0; Path=/; HttpOnly`
  );

  return headers;
}

/**
 * Logout user from all devices
 */
export async function logoutUserFromAllDevices(userId: string): Promise<void> {
  await revokeAllUserTokens(userId);
}

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || undefined;
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get("user-agent") || undefined;
}
