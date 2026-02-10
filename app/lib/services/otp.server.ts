/**
 * OTP Generation and Verification Service
 * Task: 1.1.2.1.2
 */

import { OTP } from "~/lib/db/models/otp.server";
import { sendOTP, formatGhanaPhone, isValidGhanaPhone } from "./sms.server";

const OTP_LENGTH = 4;
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 60; // Minimum time between OTP requests

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
 * Request a new OTP for a phone number
 */
export async function requestOTP(phone: string): Promise<OTPResult> {
  // Validate phone number
  if (!isValidGhanaPhone(phone)) {
    return {
      success: false,
      message: "Invalid Ghana phone number",
    };
  }

  const formattedPhone = formatGhanaPhone(phone);

  // Check for rate limiting (cooldown)
  const recentOTP = await OTP.findOne({
    phone: formattedPhone,
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

  // Delete any existing OTPs for this phone
  await OTP.deleteMany({ phone: formattedPhone });

  // Generate new OTP
  const otpCode = generateOTPCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // DEV ONLY: Log OTP to console for testing (remove in production)
  console.log(`\n========================================`);
  console.log(`DEV OTP for ${formattedPhone}: ${otpCode}`);
  console.log(`========================================\n`);

  // Save OTP to database
  await OTP.create({
    phone: formattedPhone,
    otp: otpCode,
    attempts: 0,
    expiresAt,
  });

  // Send OTP via SMS
  const smsResult = await sendOTP(formattedPhone, otpCode);

  if (!smsResult.success) {
    // Clean up on SMS failure
    await OTP.deleteMany({ phone: formattedPhone });
    return {
      success: false,
      message: "Failed to send verification code. Please try again.",
    };
  }

  return {
    success: true,
    message: "Verification code sent successfully",
    expiresAt,
  };
}

/**
 * Verify an OTP code
 */
export async function verifyOTP(
  phone: string,
  code: string
): Promise<OTPResult> {
  if (!isValidGhanaPhone(phone)) {
    return {
      success: false,
      message: "Invalid phone number",
    };
  }

  const formattedPhone = formatGhanaPhone(phone);

  // Find the OTP record
  const otpRecord = await OTP.findOne({
    phone: formattedPhone,
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
    await OTP.deleteMany({ phone: formattedPhone });
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
  await OTP.deleteMany({ phone: formattedPhone });

  return {
    success: true,
    message: "Verification successful",
  };
}

/**
 * Check if a phone number has an active OTP (for resend cooldown)
 */
export async function getOTPStatus(phone: string): Promise<{
  hasActiveOTP: boolean;
  canResend: boolean;
  expiresAt?: Date;
  cooldownRemaining?: number;
}> {
  const formattedPhone = formatGhanaPhone(phone);

  const otpRecord = await OTP.findOne({
    phone: formattedPhone,
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
