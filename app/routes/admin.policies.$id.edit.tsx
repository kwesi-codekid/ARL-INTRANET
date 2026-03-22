/**
 * Admin Policy Edit Page
 */

import { useState, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Button,
  Select,
  SelectItem,
  Switch,
  Divider,
  Chip,
} from "@heroui/react";
import { ArrowLeft, Save, FileUp, X, Download, Trash2 } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import {
  useLoaderData,
  useActionData,
  useNavigation,
  useSearchParams,
  Form,
  Link,
  redirect,
} from "react-router";
import { RichTextEditor } from "~/components/admin";

// Type definitions for loader data
interface PolicyCategory {
  _id: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
}

interface Policy {
  _id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  category: PolicyCategory | string;
  pdfUrl?: string;
  pdfFileName?: string;
  effectiveDate?: string;
  version?: string;
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  views: number;
  createdBy: { _id: string; name: string } | string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
}

interface LoaderData {
  policy: Policy;
  categories: Category[];
}

interface ActionData {
  success?: boolean;
  message?: string;
  error?: string;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { getPolicyCategories, getPolicyById, updatePolicy, deletePolicy, serializePolicy } = await import("~/lib/services/policy.server");
  const { uploadPdf } = await import("~/lib/services/upload.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const policyId = params.id;
  if (!policyId) {
    throw new Response("Policy ID is required", { status: 400 });
  }

  const [policy, categories] = await Promise.all([
    getPolicyById(policyId),
    getPolicyCategories({ activeOnly: true }),
  ]);

  if (!policy) {
    throw new Response("Policy not found", { status: 404 });
  }

  return Response.json({
    policy: serializePolicy(policy),
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
    })),
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { getPolicyCategories, getPolicyById, updatePolicy, deletePolicy, serializePolicy } = await import("~/lib/services/policy.server");
  const { uploadPdf } = await import("~/lib/services/upload.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  const sessionData = await getSessionData(request);
  await connectDB();

  const policyId = params.id;
  if (!policyId) {
    return Response.json({ error: "Policy ID is required" }, { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Handle delete
  if (intent === "delete") {
    await deletePolicy(policyId);
    await logActivity({
      userId: sessionData?.userId,
      action: "delete",
      resource: "policy",
      resourceId: policyId,
      details: {},
      request,
    });
    return redirect("/admin/policies");
  }

  // Handle update
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const excerpt = formData.get("excerpt") as string;
  const categoryId = formData.get("category") as string;
  const effectiveDate = formData.get("effectiveDate") as string;
  const version = formData.get("version") as string;
  const status = formData.get("status") as "draft" | "published" | "archived";
  const isFeatured = formData.get("isFeatured") === "true";
  const removePdf = formData.get("removePdf") === "true";

  // Validation
  if (!title || !categoryId) {
    return Response.json(
      { error: "Title and category are required" },
      { status: 400 }
    );
  }

  // Handle PDF upload
  let pdfUrl: string | undefined;
  let pdfFileName: string | undefined;

  const pdfFile = formData.get("pdfFile") as File | null;
  if (pdfFile && pdfFile.size > 0) {
    const pdfResult = await uploadPdf(pdfFile, "policies");
    if (pdfResult.success && pdfResult.url) {
      pdfUrl = pdfResult.url;
      pdfFileName = pdfFile.name;
    } else {
      return Response.json(
        { error: pdfResult.error || "Failed to upload PDF" },
        { status: 400 }
      );
    }
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    title,
    content,
    excerpt: excerpt || (content ? content.substring(0, 200) : ""),
    category: categoryId,
    effectiveDate,
    version,
    status,
    isFeatured,
    updatedBy: sessionData?.userId,
  };

  // Handle PDF removal or update
  if (removePdf) {
    updateData.pdfUrl = null;
    updateData.pdfFileName = null;
  } else if (pdfUrl) {
    updateData.pdfUrl = pdfUrl;
    updateData.pdfFileName = pdfFileName;
  }

  await updatePolicy(policyId, updateData as Parameters<typeof updatePolicy>[1]);

  await logActivity({
    userId: sessionData?.userId,
    action: "update",
    resource: "policy",
    resourceId: policyId,
    details: { title },
    request,
  });

  return Response.json({ success: true, message: "Policy updated" });
}

export default function AdminPolicyEditPage() {
  const { policy, categories } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";

  const [isFeatured, setIsFeatured] = useState(policy.isFeatured);
  const [pdfFileName, setPdfFileName] = useState<string | null>(
    policy.pdfFileName || null
  );
  const [removePdf, setRemovePdf] = useState(false);
  const [newPdfSelected, setNewPdfSelected] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const showSuccess = searchParams.get("success") === "created";

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFileName(file.name);
      setNewPdfSelected(true);
      setRemovePdf(false);
    }
  };

  const handleRemovePdf = () => {
    setRemovePdf(true);
    setPdfFileName(null);
    setNewPdfSelected(false);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const getCategoryId = () => {
    if (typeof policy.category === "object" && policy.category) {
      return policy.category._id;
    }
    return policy.category;
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/policies"
            className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Policy</h1>
            <p className="text-sm text-gray-500">Update policy details</p>
          </div>
        </div>
        <Chip
          color={
            policy.status === "published"
              ? "success"
              : policy.status === "draft"
                ? "warning"
                : "default"
          }
          variant="flat"
        >
          {policy.status}
        </Chip>
      </div>

      {showSuccess && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          Policy created successfully!
        </div>
      )}

      {actionData?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {actionData.error}
        </div>
      )}

      {actionData?.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {actionData.message}
        </div>
      )}

      <Form method="post" encType="multipart/form-data">
        <input type="hidden" name="removePdf" value={removePdf.toString()} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Policy Details</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  name="title"
                  label="Policy Title"
                  placeholder="e.g., Employee Code of Conduct"
                  defaultValue={policy.title}
                  isRequired
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <Textarea
                  name="excerpt"
                  label="Summary"
                  placeholder="Brief summary of the policy (optional)"
                  defaultValue={policy.excerpt || ""}
                  maxLength={500}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <RichTextEditor
                  name="content"
                  label="Policy Content"
                  placeholder="Write the full policy content here..."
                  initialContent={policy.content || ""}
                  minHeight="300px"
                />
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">PDF Document</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <p className="text-sm text-gray-500">
                  Upload a PDF version of the policy. Users can download this
                  file.
                </p>
                {pdfFileName && !removePdf ? (
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <FileUp size={24} className="text-primary-500" />
                      <span className="text-sm font-medium">{pdfFileName}</span>
                      {!newPdfSelected && policy.pdfUrl && (
                        <a
                          href={policy.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-500 hover:underline"
                        >
                          <Download size={16} />
                        </a>
                      )}
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="light"
                      onPress={handleRemovePdf}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="pdfFile"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-primary-500 hover:bg-primary-50"
                  >
                    <FileUp size={40} className="mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">Click to upload PDF</p>
                    <p className="mt-1 text-xs text-gray-400">PDF up to 20MB</p>
                  </label>
                )}
                <input
                  ref={pdfInputRef}
                  id="pdfFile"
                  type="file"
                  name="pdfFile"
                  accept=".pdf"
                  className="hidden"
                  onChange={handlePdfChange}
                />
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Publish</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Select
                  name="status"
                  label="Status"
                  defaultSelectedKeys={[policy.status]}
                  classNames={{ trigger: "bg-gray-50" }}
                >
                  <SelectItem key="draft">Draft</SelectItem>
                  <SelectItem key="published">Published</SelectItem>
                  <SelectItem key="archived">Archived</SelectItem>
                </Select>

                <Divider />

                <div className="flex items-center justify-between">
                  <span className="text-sm">Featured Policy</span>
                  <Switch
                    isSelected={isFeatured}
                    onValueChange={setIsFeatured}
                    size="sm"
                  />
                </div>
                <input
                  type="hidden"
                  name="isFeatured"
                  value={isFeatured.toString()}
                />

                <Divider />

                <Button
                  type="submit"
                  color="primary"
                  className="w-full"
                  isLoading={isSubmitting}
                  startContent={!isSubmitting && <Save size={16} />}
                >
                  Save Changes
                </Button>

                <Button
                  type="button"
                  color="danger"
                  variant="flat"
                  className="w-full"
                  startContent={<Trash2 size={16} />}
                  onPress={() => {
                    if (confirm("Are you sure you want to delete this policy?")) {
                      const form = document.createElement("form");
                      form.method = "post";
                      form.innerHTML = `<input type="hidden" name="intent" value="delete" />`;
                      document.body.appendChild(form);
                      form.submit();
                    }
                  }}
                >
                  Delete Policy
                </Button>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Category</h2>
              </CardHeader>
              <CardBody>
                <Select
                  name="category"
                  label="Policy Category"
                  placeholder="Choose a category"
                  defaultSelectedKeys={[getCategoryId()]}
                  isRequired
                  classNames={{ trigger: "bg-gray-50" }}
                >
                  {categories.map((cat) => (
                    <SelectItem key={cat.id}>{cat.name}</SelectItem>
                  ))}
                </Select>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Version Info</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  name="version"
                  label="Version"
                  placeholder="e.g., 1.0"
                  defaultValue={policy.version || ""}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />
                <Input
                  name="effectiveDate"
                  label="Effective Date"
                  type="date"
                  defaultValue={formatDateForInput(policy.effectiveDate)}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardBody className="text-sm text-gray-500">
                <p>Views: {policy.views}</p>
                <p>
                  Created:{" "}
                  {new Date(policy.createdAt).toLocaleDateString("en-GB")}
                </p>
                <p>
                  Updated:{" "}
                  {new Date(policy.updatedAt).toLocaleDateString("en-GB")}
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
