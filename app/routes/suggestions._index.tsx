/**
 * Public Anonymous Suggestion Box Page
 * Task: 1.3.2.2 - Public Suggestion UI
 */

import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Textarea,
  Select,
  SelectItem,
  Progress,
} from "@heroui/react";
import { Send, Shield, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, Form } from "react-router";
import { MainLayout } from "~/components/layout";

type LoaderData = {
  categories: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  rateLimit: {
    allowed: boolean;
    remaining: number;
  };
};

type ActionData = {
  success: boolean;
  message?: string;
  remaining?: number;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { getActiveCategories, createSuggestion, hashIP, checkRateLimit } = await import("~/lib/services/suggestion.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await connectDB();

  const categories = await getActiveCategories();

  // Check rate limit for current user
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const ip =
    cfConnectingIp?.trim() ||
    realIp?.trim() ||
    forwarded?.split(",")[0]?.trim() ||
    "127.0.0.1";
  const ipHash = hashIP(ip);
  const rateLimit = await checkRateLimit(ipHash);

  return Response.json({
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      description: c.description,
    })),
    rateLimit: {
      allowed: rateLimit.allowed,
      remaining: rateLimit.remainingSubmissions,
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { getActiveCategories, createSuggestion, hashIP, checkRateLimit } = await import("~/lib/services/suggestion.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await connectDB();

  // Get client IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const ip =
    cfConnectingIp?.trim() ||
    realIp?.trim() ||
    forwarded?.split(",")[0]?.trim() ||
    "127.0.0.1";
  const ipHash = hashIP(ip);

  // Check rate limit
  const rateLimit = await checkRateLimit(ipHash);
  if (!rateLimit.allowed) {
    return Response.json({
      success: false,
      error: "You have reached the submission limit. Please try again in an hour.",
    });
  }

  const formData = await request.formData();
  const content = formData.get("content") as string;
  const categoryId = formData.get("categoryId") as string;

  // Honeypot check
  const honeypot = formData.get("website") as string;
  if (honeypot) {
    return Response.json({ success: true, message: "Thank you for your suggestion!" });
  }

  // Validation
  if (!content || content.trim().length < 10) {
    return Response.json({
      success: false,
      error: "Your suggestion must be at least 10 characters long.",
    });
  }

  if (content.length > 2000) {
    return Response.json({
      success: false,
      error: "Your suggestion must be less than 2000 characters.",
    });
  }

  if (!categoryId) {
    return Response.json({
      success: false,
      error: "Please select a category for your suggestion.",
    });
  }

  try {
    await createSuggestion({
      content: content.trim(),
      categoryId,
      ipHash,
    });

    return Response.json({
      success: true,
      message: "Thank you! Your suggestion has been submitted anonymously.",
      remaining: rateLimit.remainingSubmissions - 1,
    });
  } catch (error) {
    console.error("Failed to create suggestion:", error);
    return Response.json({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  }
}

export default function SuggestionsPage() {
  const { categories, rateLimit } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const characterCount = content.length;
  const maxCharacters = 2000;
  const minCharacters = 10;

  useEffect(() => {
    if (actionData?.success) {
      setContent("");
      setSelectedCategory("");
    }
  }, [actionData?.success]);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <MessageSquare size={32} className="text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Suggestion Box</h1>
          <p className="text-gray-600">
            Share your ideas, feedback, or concerns anonymously
          </p>
        </div>

        {/* Anonymity Assurance */}
        <Card className="mb-6 border-l-4 border-l-green-500">
          <CardBody className="flex flex-row items-start gap-3">
            <Shield className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-green-700">Your privacy is protected</p>
              <p className="text-sm text-gray-600">
                All suggestions are submitted anonymously. We do not collect any personal
                information that could identify you. Your feedback goes directly to
                management for review.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Success Message */}
        {actionData?.success && actionData.message && (
          <Card className="mb-6 bg-green-50 border border-green-200">
            <CardBody className="flex flex-row items-center gap-3">
              <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
              <div>
                <p className="font-medium text-green-700">{actionData.message}</p>
                {actionData.remaining !== undefined && (
                  <p className="text-sm text-green-600">
                    You can submit {actionData.remaining} more suggestion(s) this hour.
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Error Message */}
        {!actionData?.success && actionData?.error && (
          <Card className="mb-6 bg-red-50 border border-red-200">
            <CardBody className="flex flex-row items-center gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
              <p className="text-red-700">{actionData.error}</p>
            </CardBody>
          </Card>
        )}

        {/* Rate Limit Warning */}
        {!rateLimit.allowed && (
          <Card className="mb-6 bg-amber-50 border border-amber-200">
            <CardBody className="flex flex-row items-center gap-3">
              <AlertCircle className="text-amber-500 flex-shrink-0" size={24} />
              <p className="text-amber-700">
                You have reached the submission limit. Please try again in an hour.
              </p>
            </CardBody>
          </Card>
        )}

        {/* Suggestion Form */}
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <h2 className="text-lg font-semibold">Submit Your Suggestion</h2>
          </CardHeader>
          <CardBody>
            <Form method="post" className="space-y-6">
              <input type="hidden" name="categoryId" value={selectedCategory} />
              <textarea className="hidden" name="content" value={content} readOnly />

              {/* Honeypot field - hidden from users, bots will fill it */}
              <input
                type="text"
                name="website"
                className="absolute opacity-0 pointer-events-none"
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Category Selection */}
              <div>
                <Select
                  label="Category"
                  placeholder="Select a category"
                  selectedKeys={selectedCategory ? [selectedCategory] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedCategory(selected);
                  }}
                  isRequired
                  isDisabled={!rateLimit.allowed || isSubmitting}
                >
                  {categories.map((category: LoaderData["categories"][number]) => (
                    <SelectItem key={category.id} textValue={category.name}>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-gray-500">{category.description}</p>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Suggestion Content */}
              <div>
                <Textarea
                  label="Your Suggestion"
                  placeholder="Share your idea, feedback, or concern..."
                  value={content}
                  onValueChange={setContent}
                  minRows={5}
                  maxRows={10}
                  isRequired
                  isDisabled={!rateLimit.allowed || isSubmitting}
                  description={
                    <div className="flex justify-between items-center mt-1">
                      <span>
                        {characterCount < minCharacters
                          ? `At least ${minCharacters - characterCount} more characters needed`
                          : "Your suggestion will be reviewed by management"}
                      </span>
                      <span
                        className={
                          characterCount > maxCharacters
                            ? "text-red-500"
                            : characterCount > maxCharacters * 0.9
                              ? "text-amber-500"
                              : ""
                        }
                      >
                        {characterCount}/{maxCharacters}
                      </span>
                    </div>
                  }
                />
              </div>

              {/* Character Progress */}
              {characterCount > 0 && (
                <Progress
                  size="sm"
                  value={(characterCount / maxCharacters) * 100}
                  color={
                    characterCount > maxCharacters
                      ? "danger"
                      : characterCount > maxCharacters * 0.9
                        ? "warning"
                        : "primary"
                  }
                  className="max-w-full"
                />
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full"
                startContent={!isSubmitting && <Send size={18} />}
                isLoading={isSubmitting}
                isDisabled={
                  !rateLimit.allowed ||
                  characterCount < minCharacters ||
                  characterCount > maxCharacters ||
                  !selectedCategory
                }
              >
                {isSubmitting ? "Submitting..." : "Submit Anonymously"}
              </Button>
            </Form>
          </CardBody>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Have an urgent safety concern?{" "}
            <a href="/alerts" className="text-primary-600 hover:underline">
              Report it immediately
            </a>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
