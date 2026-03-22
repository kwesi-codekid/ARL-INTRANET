/**
 * User Authentication API
 * Handles login, verify OTP, refresh token, and logout
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

// GET - Refresh token
export async function loader({ request }: LoaderFunctionArgs) {
  const { refreshUserToken } = await import("~/lib/services/user-auth.server");

  const result = await refreshUserToken(request);

  if (!result.success) {
    return Response.json(
      { error: result.message },
      { status: 401 }
    );
  }

  return Response.json(
    { success: true, message: result.message },
    { headers: result.headers }
  );
}

// POST - Login, verify OTP, logout
export async function action({ request }: ActionFunctionArgs) {
  const {
    requestUserPhoneOTP,
    requestUserEmailOTP,
    authenticateByPhoneOTP,
    authenticateByEmailOTP,
    createUserTokens,
    logoutUser,
    getClientIP,
    getUserAgent,
  } = await import("~/lib/services/user-auth.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { isValidGhanaPhone } = await import("~/lib/services/sms.server");
  const { isValidEmail } = await import("~/lib/services/email.server");

  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  // Request Phone OTP
  if (intent === "request-phone-otp") {
    const phone = formData.get("phone") as string;

    if (!phone || !isValidGhanaPhone(phone)) {
      return Response.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    const result = await requestUserPhoneOTP(phone);

    if (!result.success) {
      return Response.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      message: result.message,
    });
  }

  // Request Email OTP
  if (intent === "request-email-otp") {
    const email = formData.get("email") as string;

    if (!email || !isValidEmail(email)) {
      return Response.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const result = await requestUserEmailOTP(email);

    if (!result.success) {
      return Response.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      message: result.message,
    });
  }

  // Verify Phone OTP
  if (intent === "verify-phone-otp") {
    const phone = formData.get("phone") as string;
    const otp = formData.get("otp") as string;

    if (!phone || !otp) {
      return Response.json(
        { error: "Phone and OTP are required" },
        { status: 400 }
      );
    }

    const result = await authenticateByPhoneOTP(phone, otp, clientIP);

    if (!result.success || !result.user) {
      return Response.json(
        { error: result.message },
        { status: 401 }
      );
    }

    // Log successful login
    await logActivity({
      userId: result.user._id.toString(),
      action: "login",
      resource: "user_session",
      details: { method: "phone_otp", via: "api" },
      request,
    });

    // Create JWT tokens
    const { headers } = await createUserTokens(result.user, userAgent, clientIP);

    return Response.json(
      {
        success: true,
        message: "Authentication successful",
        user: {
          id: result.user._id.toString(),
          name: result.user.name,
          phone: result.user.phone,
          email: result.user.email,
          role: result.user.role,
          permissions: result.user.permissions,
        },
      },
      { headers }
    );
  }

  // Verify Email OTP
  if (intent === "verify-email-otp") {
    const email = formData.get("email") as string;
    const otp = formData.get("otp") as string;

    if (!email || !otp) {
      return Response.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const result = await authenticateByEmailOTP(email, otp, clientIP);

    if (!result.success || !result.user) {
      return Response.json(
        { error: result.message },
        { status: 401 }
      );
    }

    // Log successful login
    await logActivity({
      userId: result.user._id.toString(),
      action: "login",
      resource: "user_session",
      details: { method: "email_otp", via: "api" },
      request,
    });

    // Create JWT tokens
    const { headers } = await createUserTokens(result.user, userAgent, clientIP);

    return Response.json(
      {
        success: true,
        message: "Authentication successful",
        user: {
          id: result.user._id.toString(),
          name: result.user.name,
          phone: result.user.phone,
          email: result.user.email,
          role: result.user.role,
          permissions: result.user.permissions,
        },
      },
      { headers }
    );
  }

  // Logout
  if (intent === "logout") {
    const { getCurrentUser } = await import("~/lib/services/user-auth.server");

    const user = await getCurrentUser(request);
    if (user) {
      await logActivity({
        userId: user._id.toString(),
        action: "logout",
        resource: "user_session",
        request,
      });
    }

    const headers = await logoutUser(request);

    return Response.json(
      { success: true, message: "Logged out successfully" },
      { headers }
    );
  }

  return Response.json(
    { error: "Invalid action" },
    { status: 400 }
  );
}
