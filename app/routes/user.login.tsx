/**
 * User Login Page
 * Supports phone OTP (primary) and email OTP (backup) authentication
 */

import { useState, useEffect } from "react";
import { Input, Button, Divider, Tabs, Tab, InputOtp } from "@heroui/react";
import { Phone, Mail, KeyRound, ArrowRight, RefreshCw, Users } from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useNavigation, redirect } from "react-router";

// Loader - redirect if already logged in
export async function loader({ request }: LoaderFunctionArgs) {
  const { getCurrentUser } = await import("~/lib/services/user-auth.server");

  const user = await getCurrentUser(request);
  if (user) {
    return redirect("/");
  }

  return Response.json({});
}

// Action - handle form submissions
export async function action({ request }: ActionFunctionArgs) {
  const {
    requestUserPhoneOTP,
    requestUserEmailOTP,
    authenticateByPhoneOTP,
    authenticateByEmailOTP,
    createUserTokens,
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
  const authMethod = formData.get("authMethod") as "phone" | "email";

  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  // Request Phone OTP
  if (intent === "request-phone-otp") {
    const phone = formData.get("phone") as string;

    if (!phone) {
      return Response.json({ error: "Phone number is required", step: "phone", authMethod: "phone" });
    }

    if (!isValidGhanaPhone(phone)) {
      return Response.json({ error: "Invalid Ghana phone number", step: "phone", authMethod: "phone" });
    }

    const result = await requestUserPhoneOTP(phone);

    if (!result.success) {
      return Response.json({ error: result.message, step: "phone", authMethod: "phone" });
    }

    return Response.json({
      success: true,
      message: result.message,
      step: "otp",
      authMethod: "phone",
      identifier: phone,
    });
  }

  // Request Email OTP
  if (intent === "request-email-otp") {
    const email = formData.get("email") as string;

    if (!email) {
      return Response.json({ error: "Email is required", step: "email", authMethod: "email" });
    }

    if (!isValidEmail(email)) {
      return Response.json({ error: "Invalid email address", step: "email", authMethod: "email" });
    }

    const result = await requestUserEmailOTP(email);

    if (!result.success) {
      return Response.json({ error: result.message, step: "email", authMethod: "email" });
    }

    return Response.json({
      success: true,
      message: result.message,
      step: "otp",
      authMethod: "email",
      identifier: email,
    });
  }

  // Verify Phone OTP
  if (intent === "verify-phone-otp") {
    const phone = formData.get("phone") as string;
    const otp = formData.get("otp") as string;

    if (!phone || !otp) {
      return Response.json({ error: "Phone and OTP are required", step: "otp", authMethod: "phone", identifier: phone });
    }

    if (!/^\d{6}$/.test(otp)) {
      return Response.json({ error: "OTP must be 6 digits", step: "otp", authMethod: "phone", identifier: phone });
    }

    const result = await authenticateByPhoneOTP(phone, otp, clientIP);

    if (!result.success || !result.user) {
      return Response.json({ error: result.message, step: "otp", authMethod: "phone", identifier: phone });
    }

    // Log successful login
    await logActivity({
      userId: result.user._id.toString(),
      action: "login",
      resource: "user_session",
      details: { method: "phone_otp" },
      request,
    });

    // Create JWT tokens
    const { headers } = await createUserTokens(result.user, userAgent, clientIP);

    // Redirect to home or requested page
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get("redirectTo") || "/";

    return redirect(redirectTo, { headers });
  }

  // Verify Email OTP
  if (intent === "verify-email-otp") {
    const email = formData.get("email") as string;
    const otp = formData.get("otp") as string;

    if (!email || !otp) {
      return Response.json({ error: "Email and OTP are required", step: "otp", authMethod: "email", identifier: email });
    }

    if (!/^\d{6}$/.test(otp)) {
      return Response.json({ error: "OTP must be 6 digits", step: "otp", authMethod: "email", identifier: email });
    }

    const result = await authenticateByEmailOTP(email, otp, clientIP);

    if (!result.success || !result.user) {
      return Response.json({ error: result.message, step: "otp", authMethod: "email", identifier: email });
    }

    // Log successful login
    await logActivity({
      userId: result.user._id.toString(),
      action: "login",
      resource: "user_session",
      details: { method: "email_otp" },
      request,
    });

    // Create JWT tokens
    const { headers } = await createUserTokens(result.user, userAgent, clientIP);

    // Redirect to home or requested page
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get("redirectTo") || "/";

    return redirect(redirectTo, { headers });
  }

  return Response.json({ error: "Invalid action", step: "phone", authMethod: "phone" });
}

export default function UserLogin() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"identifier" | "otp">("identifier");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Handle action response
  useEffect(() => {
    if (actionData?.step === "otp") {
      setStep("otp");
      if (actionData.authMethod === "phone" && actionData.identifier) {
        setPhone(actionData.identifier);
      }
      if (actionData.authMethod === "email" && actionData.identifier) {
        setEmail(actionData.identifier);
      }
      if (actionData.authMethod) {
        setAuthMethod(actionData.authMethod);
      }
      if (actionData.success) {
        setCooldown(60);
      }
    } else if (actionData?.step === "phone" || actionData?.step === "email") {
      setStep("identifier");
      if (actionData.authMethod) {
        setAuthMethod(actionData.authMethod);
      }
    }
  }, [actionData]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const resetToIdentifier = () => {
    setStep("identifier");
    setOtp("");
  };

  const handleTabChange = (key: React.Key) => {
    setAuthMethod(key as "phone" | "email");
    setStep("identifier");
    setOtp("");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Illustration/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1B365D] via-[#234170] to-[#2A4D82] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-primary-500/10" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <img src="/images/logo.png" alt="Adamus Resources" className="h-24 object-contain" />
          </div>

          {/* Illustration */}
          <div className="relative w-80 h-80 mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/10">
                <div className="text-center">
                  <Users size={80} className="mx-auto mb-4 text-primary-400" />
                  <div className="w-48 h-3 bg-primary-500/40 rounded-full mb-3" />
                  <div className="w-36 h-3 bg-primary-500/20 rounded-full mx-auto" />
                </div>
              </div>
            </div>
            {/* Floating elements */}
            <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-primary-500/30 backdrop-blur-sm animate-pulse" />
            <div className="absolute bottom-8 left-4 w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm" />
          </div>

          {/* Text */}
          <h2 className="text-3xl font-bold mb-3">ARL Intranet</h2>
          <p className="text-white/80 text-center max-w-sm">
            Employee portal for Adamus Resources Limited
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/images/logo.png" alt="Adamus Resources" className="h-16 object-contain" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === "identifier" ? "Welcome!" : "Verify Your Identity"}
            </h1>
            <p className="text-gray-500">
              {step === "identifier"
                ? "Sign in to access the employee portal"
                : `Enter the 6-digit code sent to your ${authMethod}`}
            </p>
          </div>

          {/* Error Message */}
          {actionData?.error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
              {actionData.error}
            </div>
          )}

          {/* Identifier Step */}
          {step === "identifier" ? (
            <div className="space-y-6">
              <Tabs
                selectedKey={authMethod}
                onSelectionChange={handleTabChange}
                variant="bordered"
                fullWidth
                classNames={{
                  tabList: "bg-white",
                }}
              >
                <Tab
                  key="phone"
                  title={
                    <div className="flex items-center gap-2">
                      <Phone size={16} />
                      <span>Phone</span>
                    </div>
                  }
                >
                  <Form method="post" className="space-y-6 pt-4">
                    <input type="hidden" name="intent" value="request-phone-otp" />
                    <input type="hidden" name="authMethod" value="phone" />

                    <Input
                      name="phone"
                      type="tel"
                      label="Phone Number"
                      placeholder="0241234567"
                      value={phone}
                      onValueChange={setPhone}
                      startContent={<Phone size={18} className="text-gray-400" />}
                      size="lg"
                      variant="bordered"
                      classNames={{
                        inputWrapper: "bg-white shadow-sm",
                        label: "text-gray-600",
                      }}
                    />

                    <Button
                      type="submit"
                      color="primary"
                      className="w-full font-semibold shadow-lg shadow-primary-500/30"
                      size="lg"
                      isLoading={isSubmitting}
                      endContent={!isSubmitting && <ArrowRight size={18} />}
                    >
                      {isSubmitting ? "Sending Code..." : "Get Verification Code"}
                    </Button>
                  </Form>
                </Tab>

                <Tab
                  key="email"
                  title={
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <span>Email</span>
                    </div>
                  }
                >
                  <Form method="post" className="space-y-6 pt-4">
                    <input type="hidden" name="intent" value="request-email-otp" />
                    <input type="hidden" name="authMethod" value="email" />

                    <Input
                      name="email"
                      type="email"
                      label="Email Address"
                      placeholder="name@arl.com"
                      value={email}
                      onValueChange={setEmail}
                      startContent={<Mail size={18} className="text-gray-400" />}
                      size="lg"
                      variant="bordered"
                      classNames={{
                        inputWrapper: "bg-white shadow-sm",
                        label: "text-gray-600",
                      }}
                    />

                    <Button
                      type="submit"
                      color="primary"
                      className="w-full font-semibold shadow-lg shadow-primary-500/30"
                      size="lg"
                      isLoading={isSubmitting}
                      endContent={!isSubmitting && <ArrowRight size={18} />}
                    >
                      {isSubmitting ? "Sending Code..." : "Get Verification Code"}
                    </Button>
                  </Form>
                </Tab>
              </Tabs>

              <Divider className="my-4" />

              <p className="text-center text-sm text-gray-500">
                Use your registered phone number or email to sign in
              </p>
            </div>
          ) : (
            /* OTP Step */
            <Form method="post" className="space-y-6">
              <input
                type="hidden"
                name="intent"
                value={authMethod === "phone" ? "verify-phone-otp" : "verify-email-otp"}
              />
              <input type="hidden" name="authMethod" value={authMethod} />
              {authMethod === "phone" ? (
                <input type="hidden" name="phone" value={phone} />
              ) : (
                <input type="hidden" name="email" value={email} />
              )}
              <input type="hidden" name="otp" value={otp} />

              {/* Identifier info */}
              <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    {authMethod === "phone" ? (
                      <Phone size={18} className="text-primary-600" />
                    ) : (
                      <Mail size={18} className="text-primary-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Code sent to</p>
                    <p className="font-semibold text-gray-900">
                      {authMethod === "phone" ? phone : email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="light"
                  size="sm"
                  onPress={resetToIdentifier}
                  className="text-primary-500 font-medium"
                >
                  Change
                </Button>
              </div>

              {/* OTP Input */}
              <div className="flex justify-center">
                <InputOtp
                  length={6}
                  value={otp}
                  onValueChange={setOtp}
                  size="lg"
                  variant="bordered"
                  color="primary"
                  autoFocus
                />
              </div>

              {/* Verify Button */}
              <Button
                type="submit"
                color="primary"
                className="w-full font-semibold shadow-lg shadow-primary-500/30"
                size="lg"
                isLoading={isSubmitting}
                isDisabled={otp.length !== 6}
                endContent={!isSubmitting && <KeyRound size={18} />}
              >
                {isSubmitting ? "Verifying..." : "Verify & Sign In"}
              </Button>

              {/* Resend */}
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Didn't receive the code?</p>
                <Form method="post" className="inline">
                  <input
                    type="hidden"
                    name="intent"
                    value={authMethod === "phone" ? "request-phone-otp" : "request-email-otp"}
                  />
                  <input type="hidden" name="authMethod" value={authMethod} />
                  {authMethod === "phone" ? (
                    <input type="hidden" name="phone" value={phone} />
                  ) : (
                    <input type="hidden" name="email" value={email} />
                  )}
                  <Button
                    type="submit"
                    variant="light"
                    size="sm"
                    isDisabled={cooldown > 0 || isSubmitting}
                    startContent={<RefreshCw size={14} />}
                    className="text-primary-500 font-medium"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
                  </Button>
                </Form>
              </div>
            </Form>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">Secure login powered by OTP verification</p>
          </div>
        </div>
      </div>
    </div>
  );
}
