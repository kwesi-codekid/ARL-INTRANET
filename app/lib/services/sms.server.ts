/**
 * SMS Service for smsonlinegh.com
 * Task: 1.1.2.1.1
 */

interface SMSResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

interface SMSConfig {
  apiKey: string;
  senderId: string;
  baseUrl: string;
}

const config: SMSConfig = {
  apiKey: process.env.SMS_API_KEY || "",
  senderId: process.env.SMS_SENDER_ID || "ARL",
  baseUrl: process.env.SMS_BASE_URL || "https://api.smsonlinegh.com/v5/message/sms/send",
};

/**
 * Send SMS via smsonlinegh.com API
 */
export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<SMSResponse> {
  if (!config.apiKey) {
    console.warn("SMS_API_KEY not set, logging to console instead");
    console.log(`SMS to ${phoneNumber}: ${message}`);
    return {
      success: true,
      message: "SMS logged to console (no API key)",
      messageId: `dev-${Date.now()}`,
    };
  }

  try {
    const response = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `key ${config.apiKey}`,
        Host: "api.smsonlinegh.com",
      },
      body: JSON.stringify({
        sender: config.senderId,
        type: 0, // Plain text
        destinations: [phoneNumber],
        text: message,
      }),
    });

    const data = await response.json();

    // Check for rejected sender
    const destination = data?.data?.destinations?.[0];
    if (destination?.status?.label === "DS_REJECTED_SENDER_UNREGISTERED") {
      console.error("SMS rejected: Unregistered sender", config.senderId);
      return {
        success: false,
        message: "Failed to send SMS: Unregistered sender",
      };
    }

    if (response.ok) {
      console.log("SMS delivery:", destination);
      return {
        success: true,
        message: "SMS sent successfully",
        messageId: data.messageId,
      };
    }

    return {
      success: false,
      message: data.message || "Failed to send SMS",
    };
  } catch (error) {
    console.error("SMS sending error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "SMS service error",
    };
  }
}

/**
 * Send OTP SMS
 */
export async function sendOTP(phoneNumber: string, otp: string): Promise<SMSResponse> {
  const message = `Your ARL Intranet verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
  return sendSMS(phoneNumber, message);
}

/**
 * Format phone number to Ghana format
 * Accepts: 0241234567, 241234567, +233241234567, 233241234567
 * Returns: 233241234567
 */
export function formatGhanaPhone(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // If starts with 0, replace with 233
  if (cleaned.startsWith("0")) {
    cleaned = "233" + cleaned.slice(1);
  }

  // If doesn't start with 233, add it
  if (!cleaned.startsWith("233")) {
    cleaned = "233" + cleaned;
  }

  return cleaned;
}

/**
 * Validate Ghana phone number
 */
export function isValidGhanaPhone(phone: string): boolean {
  const formatted = formatGhanaPhone(phone);
  // Ghana numbers: 233 + 9 digits (total 12 digits)
  return /^233[0-9]{9}$/.test(formatted);
}
