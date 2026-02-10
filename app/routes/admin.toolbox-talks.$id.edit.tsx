/**
 * Admin PSI Talk Edit Page
 * Task: 1.2.1.4.5
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Select,
  SelectItem,
  Chip,
  Divider,
} from "@heroui/react";
import { ArrowLeft, Save, Calendar, Trash2, Eye, FileText, Image as ImageIcon } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, useSearchParams, Form, Link, redirect } from "react-router";
import { FileUpload } from "~/components/admin";

interface EditLoaderData {
  talk: {
    id: string;
    title: string;
    slug: string;
    week: number;
    month: number;
    year: number;
    status: string;
    tags: string[];
    pdfUrl: string;
    pdfFileName: string;
    coverImageUrl: string;
    views: number;
  };
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { getToolboxTalkById, serializeToolboxTalk } = await import("~/lib/services/toolbox-talk.server");

  await requireAuth(request);
  await connectDB();

  const talk = await getToolboxTalkById(params.id!);

  if (!talk) {
    throw new Response("Not Found", { status: 404 });
  }

  // Serialize and format for edit form
  const serialized = serializeToolboxTalk(talk);

  const data: EditLoaderData = {
    talk: {
      id: serialized.id,
      title: serialized.title,
      slug: serialized.slug,
      week: serialized.week,
      month: serialized.month,
      year: serialized.year,
      status: serialized.status,
      tags: serialized.tags || [],
      pdfUrl: serialized.featuredMedia?.url || "",
      pdfFileName: serialized.featuredMedia?.fileName || "",
      coverImageUrl: serialized.featuredMedia?.thumbnail || "",
      views: serialized.views,
    },
  };

  return Response.json(data);
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { updateToolboxTalk, deleteToolboxTalk } = await import("~/lib/services/toolbox-talk.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Handle delete using service
  if (intent === "delete") {
    const deleted = await deleteToolboxTalk(params.id!);
    if (deleted) {
      return redirect("/admin/toolbox-talks?deleted=true");
    }
    return Response.json({ error: "Failed to delete" }, { status: 400 });
  }

  const title = formData.get("title") as string;
  const week = parseInt(formData.get("week") as string);
  const month = parseInt(formData.get("month") as string);
  const year = parseInt(formData.get("year") as string);
  const status = formData.get("status") as "draft" | "published" | "archived";
  const tagsStr = formData.get("tags") as string;
  const pdfUrl = formData.get("pdfUrl") as string;
  const pdfFileName = formData.get("pdfFileName") as string;
  const coverImageUrl = formData.get("coverImageUrl") as string;

  // Validation
  if (!title || !week || !month || !year) {
    return Response.json(
      { error: "Title, week, month, and year are required" },
      { status: 400 }
    );
  }

  // Create a scheduledDate from week/month/year
  const { getDateFromWeek } = await import("~/lib/services/toolbox-talk.server");
  const scheduledDate = getDateFromWeek(week, month, year);

  // Parse tags
  const tags = tagsStr
    ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  // Build featured media object for PDF
  const featuredMedia = pdfUrl
    ? {
        type: "pdf" as const,
        url: pdfUrl,
        ...(pdfFileName && { fileName: pdfFileName }),
        ...(coverImageUrl && { thumbnail: coverImageUrl }),
      }
    : undefined;

  // Update PSI talk using service
  const updated = await updateToolboxTalk(params.id!, {
    title,
    content: title,
    summary: title,
    scheduledDate,
    week,
    month,
    year,
    status,
    tags,
    featuredMedia,
  });

  if (!updated) {
    return Response.json({ error: "Failed to update talk" }, { status: 400 });
  }

  return Response.json({ success: true, message: "Talk updated successfully" });
}

export default function AdminToolboxTalkEditPage() {
  const { talk } = useLoaderData<EditLoaderData>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";

  const [tags, setTags] = useState<string[]>(talk.tags);
  const [tagInput, setTagInput] = useState("");
  const [pdfUrl, setPdfUrl] = useState(talk.pdfUrl);
  const [pdfFileName, setPdfFileName] = useState(talk.pdfFileName);
  const [coverImageUrl, setCoverImageUrl] = useState(talk.coverImageUrl);

  // Week/month/year state
  const [selectedWeek, setSelectedWeek] = useState(talk.week);
  const [selectedMonth, setSelectedMonth] = useState(talk.month);
  const [selectedYear, setSelectedYear] = useState(talk.year);

  const currentYear = new Date().getFullYear();
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = [currentYear - 1, currentYear, currentYear + 1];
  const weeks = [1, 2, 3, 4, 5];

  // Show success message on URL param
  useEffect(() => {
    if (searchParams.get("success") === "created") {
      // Could show a toast here if addToast is available
    }
  }, [searchParams]);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this PSI talk? This action cannot be undone.")) {
      const form = document.createElement("form");
      form.method = "post";
      form.innerHTML = `<input type="hidden" name="intent" value="delete" />`;
      document.body.appendChild(form);
      form.submit();
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/toolbox-talks"
            className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit PSI Talk</h1>
            <p className="text-sm text-gray-500">{talk.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            as={Link}
            to={`/toolbox-talk/${talk.slug}`}
            target="_blank"
            variant="flat"
            startContent={<Eye size={16} />}
          >
            View
          </Button>
          <Button
            color="danger"
            variant="flat"
            startContent={<Trash2 size={16} />}
            onPress={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>

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

      <Form method="post">
        <input type="hidden" name="tags" value={tags.join(",")} />
        <input type="hidden" name="pdfUrl" value={pdfUrl} />
        <input type="hidden" name="pdfFileName" value={pdfFileName} />
        <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
        <input type="hidden" name="week" value={selectedWeek} />
        <input type="hidden" name="month" value={selectedMonth} />
        <input type="hidden" name="year" value={selectedYear} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* PDF Upload */}
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-green-600" />
                  <h2 className="font-semibold">PDF Document</h2>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <FileUpload
                  accept="pdf"
                  label="Upload PDF File *"
                  description="PDF files up to 20MB"
                  folder="toolbox-talks"
                  currentUrl={pdfUrl}
                  currentType="pdf"
                  onUpload={(result) => {
                    setPdfUrl(result.url);
                  }}
                  onRemove={() => {
                    setPdfUrl("");
                    setPdfFileName("");
                  }}
                />

                {pdfUrl && (
                  <Input
                    value={pdfFileName}
                    onValueChange={setPdfFileName}
                    label="Display Name (Optional)"
                    placeholder="Week 5 - Working at Heights Safety Talk.pdf"
                    description="Name shown to users when downloading"
                    classNames={{ inputWrapper: "bg-gray-50" }}
                  />
                )}
              </CardBody>
            </Card>

            {/* Cover Image */}
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ImageIcon size={20} className="text-blue-600" />
                  <h2 className="font-semibold">Cover Image (Optional)</h2>
                </div>
              </CardHeader>
              <CardBody>
                <FileUpload
                  accept="image"
                  label="Upload Cover Image"
                  description="JPG, PNG, GIF, WebP up to 5MB - Shown as thumbnail in lists"
                  folder="toolbox-talks"
                  currentUrl={coverImageUrl}
                  currentType="image"
                  onUpload={(result) => {
                    setCoverImageUrl(result.url);
                  }}
                  onRemove={() => {
                    setCoverImageUrl("");
                  }}
                />
              </CardBody>
            </Card>

            {/* Tags */}
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Tags</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onValueChange={setTagInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a tag (press Enter)"
                    classNames={{ inputWrapper: "bg-gray-50" }}
                    className="flex-1"
                  />
                  <Button onPress={addTag} isDisabled={!tagInput.trim()}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Chip
                        key={tag}
                        onClose={() => removeTag(tag)}
                        variant="flat"
                        color="warning"
                      >
                        {tag}
                      </Chip>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-amber-600" />
                  <h2 className="font-semibold">Schedule & Status</h2>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  name="title"
                  label="Title"
                  placeholder="e.g., Working at Heights Safety"
                  defaultValue={talk.title}
                  isRequired
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <Divider />

                {/* Week-based scheduling */}
                <Select
                  label="Week"
                  selectedKeys={[selectedWeek.toString()]}
                  onSelectionChange={(keys) => setSelectedWeek(Number(Array.from(keys)[0]))}
                  classNames={{ trigger: "bg-gray-50" }}
                  isRequired
                >
                  {weeks.map((w) => (
                    <SelectItem key={w.toString()}>Week {w}</SelectItem>
                  ))}
                </Select>

                <Select
                  label="Month"
                  selectedKeys={[selectedMonth.toString()]}
                  onSelectionChange={(keys) => setSelectedMonth(Number(Array.from(keys)[0]))}
                  classNames={{ trigger: "bg-gray-50" }}
                  isRequired
                >
                  {months.map((m) => (
                    <SelectItem key={m.value.toString()}>{m.label}</SelectItem>
                  ))}
                </Select>

                <Select
                  label="Year"
                  selectedKeys={[selectedYear.toString()]}
                  onSelectionChange={(keys) => setSelectedYear(Number(Array.from(keys)[0]))}
                  classNames={{ trigger: "bg-gray-50" }}
                  isRequired
                >
                  {years.map((y) => (
                    <SelectItem key={y.toString()}>{y}</SelectItem>
                  ))}
                </Select>

                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                  <strong>Scheduled for:</strong> Week {selectedWeek} of {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </div>

                <Divider />

                <Select
                  name="status"
                  label="Status"
                  defaultSelectedKeys={[talk.status]}
                  classNames={{ trigger: "bg-gray-50" }}
                >
                  <SelectItem key="draft">Draft</SelectItem>
                  <SelectItem key="published">Published</SelectItem>
                  <SelectItem key="archived">Archived</SelectItem>
                </Select>

                <Divider />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    color="primary"
                    className="flex-1"
                    isLoading={isSubmitting}
                    startContent={!isSubmitting && <Save size={16} />}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Statistics</h2>
              </CardHeader>
              <CardBody>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{talk.views}</p>
                  <p className="text-sm text-gray-500">Views</p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
