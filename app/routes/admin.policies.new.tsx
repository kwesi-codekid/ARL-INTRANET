/**
 * Admin Policy Creation Page
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
} from "@heroui/react";
import { ArrowLeft, Save, FileUp, X } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import {
  useLoaderData,
  useActionData,
  useNavigation,
  Form,
  Link,
  redirect,
} from "react-router";
import { RichTextEditor } from "~/components/admin";
import { requireAuth, getSessionData } from "~/lib/services/session.server";
import { connectDB } from "~/lib/db/connection.server";
import { getPolicyCategories, createPolicy } from "~/lib/services/policy.server";
import { uploadPdf } from "~/lib/services/upload.server";
import { logActivity } from "~/lib/services/activity-log.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  await connectDB();

  const categories = await getPolicyCategories({ activeOnly: true });

  return Response.json({
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
    })),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAuth(request);
  const sessionData = await getSessionData(request);
  await connectDB();

  const formData = await request.formData();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const excerpt = formData.get("excerpt") as string;
  const categoryId = formData.get("category") as string;
  const effectiveDate = formData.get("effectiveDate") as string;
  const version = formData.get("version") as string;
  const status = formData.get("status") as "draft" | "published";
  const isFeatured = formData.get("isFeatured") === "true";

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

  // Create policy
  const policy = await createPolicy({
    title,
    content,
    excerpt: excerpt || (content ? content.substring(0, 200) : ""),
    category: categoryId,
    pdfUrl,
    pdfFileName,
    effectiveDate,
    version,
    status,
    isFeatured,
    createdBy: sessionData?.userId!,
  });

  await logActivity({
    userId: sessionData?.userId,
    action: "create",
    resource: "policy",
    resourceId: policy._id.toString(),
    details: { title },
    request,
  });

  return redirect(`/admin/policies/${policy._id}/edit?success=created`);
}

interface LoaderData {
  categories: Array<{ id: string; name: string }>;
}

interface ActionData {
  error?: string;
}

export default function AdminPolicyNewPage() {
  const { categories } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFileName(file.name);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/policies"
          className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-gray-50"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Policy</h1>
          <p className="text-sm text-gray-500">Add a new company policy</p>
        </div>
      </div>

      {actionData?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {actionData.error}
        </div>
      )}

      <Form method="post" encType="multipart/form-data">
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
                  isRequired
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <Textarea
                  name="excerpt"
                  label="Summary"
                  placeholder="Brief summary of the policy (optional)"
                  maxLength={500}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <RichTextEditor
                  name="content"
                  label="Policy Content"
                  placeholder="Write the full policy content here (or upload a PDF below)..."
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
                  Upload a PDF version of the policy. Users can download this file.
                </p>
                {pdfFileName ? (
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <FileUp size={24} className="text-primary-500" />
                      <span className="text-sm font-medium">{pdfFileName}</span>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="light"
                      onPress={() => {
                        setPdfFileName(null);
                        if (pdfInputRef.current) pdfInputRef.current.value = "";
                      }}
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
                  defaultSelectedKeys={["draft"]}
                  classNames={{ trigger: "bg-gray-50" }}
                >
                  <SelectItem key="draft">Draft</SelectItem>
                  <SelectItem key="published">Published</SelectItem>
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
                  Save Policy
                </Button>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Category</h2>
              </CardHeader>
              <CardBody>
                <Select
                  label="Policy Category"
                  placeholder="Choose a category"
                  isRequired
                  classNames={{ trigger: "bg-gray-50" }}
                  selectedKeys={selectedCategory ? [selectedCategory] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedCategory(selected || "");
                  }}
                >
                  {categories.map((cat) => (
                    <SelectItem key={cat.id}>{cat.name}</SelectItem>
                  ))}
                </Select>
                <input type="hidden" name="category" value={selectedCategory} />
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
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />
                <Input
                  name="effectiveDate"
                  label="Effective Date"
                  type="date"
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />
              </CardBody>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
