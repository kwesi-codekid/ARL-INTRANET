/**
 * Email OTP Generation and Verification Service
 * Similar to phone OTP but for email-based authentication
 */

import { EmailOTP } from "~/lib/db/models/email-otp.server";
import { sendOTPEmail, normalizeEmail, isValidEmail } from "./email.server";

const OTP_LENGTH = 4;
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 60; // Minimum time between OTP requests
const HOURLY_RATE_LIMIT = 5; // Max OTP requests per hour

interface OTPResult {
  success: boolean;
  message: string;
  expiresAt?: Date;
}

/**
 * Generate a random 4-digit OTP
 */
function generateOTPCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Check hourly rate limit for email OTP requests
 */
async function checkHourlyRateLimit(email: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await EmailOTP.countDocuments({
    email,
    createdAt: { $gte: oneHourAgo },
  });
  return count < HOURLY_RATE_LIMIT;
}

/**
 * Request a new OTP for an email address
 */
export async function requestEmailOTP(email: string): Promise<OTPResult> {
  // Validate email
  if (!isValidEmail(email)) {
    return {
      success: false,
      message: "Invalid email address",
    };
  }

  const normalizedEmail = normalizeEmail(email);

  // Check hourly rate limit
  const withinLimit = await checkHourlyRateLimit(normalizedEmail);
  if (!withinLimit) {
    return {
      success: false,
      message: "Too many OTP requests. Please try again later.",
    };
  }

  // Check for cooldown
  const recentOTP = await EmailOTP.findOne({
    email: normalizedEmail,
    createdAt: { $gte: new Date(Date.now() - COOLDOWN_SECONDS * 1000) },
  });

  if (recentOTP) {
    const waitTime = Math.ceil(
      (COOLDOWN_SECONDS * 1000 - (Date.now() - recentOTP.createdAt.getTime())) / 1000
    );
    return {
      success: false,
      message: `Please wait ${waitTime} seconds before requesting a new code`,
    };
  }

  // Delete any existing OTPs for this email
  await EmailOTP.deleteMany({ email: normalizedEmail });

  // Generate new OTP
  const otpCode = generateOTPCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // DEV ONLY: Log OTP to console for testing
  console.log(`\n========================================`);
  console.log(`DEV EMAIL OTP for ${normalizedEmail}: ${otpCode}`);
  console.log(`========================================\n`);

  // Save OTP to database
  await EmailOTP.create({
    email: normalizedEmail,
    otp: otpCode,
    attempts: 0,
    expiresAt,
  });

  // Send OTP via email
  const emailResult = await sendOTPEmail(normalizedEmail, otpCode);

  if (!emailResult.success) {
    // Clean up on email failure
    await EmailOTP.deleteMany({ email: normalizedEmail });
    return {
      success: false,
      message: "Failed to send verification code. Please try again.",
    };
  }

  return {
    success: true,
    message: "Verification code sent to your email",
    expiresAt,
  };
}

/**
 * Verify an email OTP code
 */
export async function verifyEmailOTP(
  email: string,
  code: string
): Promise<OTPResult> {
  if (!isValidEmail(email)) {
    return {
      success: false,
      message: "Invalid email address",
    };
  }

  const normalizedEmail = normalizeEmail(email);

  // Find the OTP record
  const otpRecord = await EmailOTP.findOne({
    email: normalizedEmail,
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    return {
      success: false,
      message: "Verification code expired or not found. Please request a new code.",
    };
  }

  // Check attempts
  if (otpRecord.attempts >= MAX_ATTEMPTS) {
    await EmailOTP.deleteMany({ email: normalizedEmail });
    return {
      success: false,
      message: "Too many failed attempts. Please request a new code.",
    };
  }

  // Verify the code
  if (otpRecord.otp !== code) {
    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    const remainingAttempts = MAX_ATTEMPTS - otpRecord.attempts;
    return {
      success: false,
      message: `Invalid code. ${remainingAttempts} attempts remaining.`,
    };
  }

  // OTP verified - delete it
  await EmailOTP.deleteMany({ email: normalizedEmail });

  return {
    success: true,
    message: "Verification successful",
  };
}

/**
 * Check if an email has an active OTP (for resend cooldown)
 */
export async function getEmailOTPStatus(email: string): Promise<{
  hasActiveOTP: boolean;
  canResend: boolean;
  expiresAt?: Date;
  cooldownRemaining?: number;
}> {
  const normalizedEmail = normalizeEmail(email);

  const otpRecord = await EmailOTP.findOne({
    email: normalizedEmail,
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    return {
      hasActiveOTP: false,
      canResend: true,
    };
  }

  const timeSinceCreation = Date.now() - otpRecord.createdAt.getTime();
  const canResend = timeSinceCreation >= COOLDOWN_SECONDS * 1000;
  const cooldownRemaining = canResend
    ? 0
    : Math.ceil((COOLDOWN_SECONDS * 1000 - timeSinceCreation) / 1000);

  return {
    hasActiveOTP: true,
    canResend,
    expiresAt: otpRecord.expiresAt,
    cooldownRemaining,
  };
}
