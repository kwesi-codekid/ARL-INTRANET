/**
 * Admin PSI Talk Creation Page
 * Task: 1.2.1.4.2-4, 1.2.1.2.4 (Video thumbnail auto-generation)
 */

import { useState } from "react";
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
import { ArrowLeft, Save, Calendar, FileText, Image as ImageIcon } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useActionData, useNavigation, Form, Link, redirect } from "react-router";
import { FileUpload } from "~/components/admin";

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  await requireAuth(request);
  return Response.json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { generateUniqueSlug, createToolboxTalk } = await import("~/lib/services/toolbox-talk.server");

  await requireAuth(request);
  const sessionData = await getSessionData(request);
  await connectDB();

  const formData = await request.formData();

  const title = formData.get("title") as string;
  const week = parseInt(formData.get("week") as string);
  const month = parseInt(formData.get("month") as string);
  const year = parseInt(formData.get("year") as string);
  const status = formData.get("status") as "draft" | "published";
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

  // Create a scheduledDate from week/month/year (first day of that week)
  const { getDateFromWeek } = await import("~/lib/services/toolbox-talk.server");
  const scheduledDate = getDateFromWeek(week, month, year);

  // Generate unique slug
  const slug = await generateUniqueSlug(title);

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

  // Create PSI talk using service
  const talk = await createToolboxTalk({
    title,
    slug,
    content: title,
    summary: title,
    author: sessionData?.userId || "",
    scheduledDate,
    week,
    month,
    year,
    status,
    tags,
    featuredMedia,
  });

  return redirect(`/admin/toolbox-talks/${talk._id}/edit?success=created`);
}

export default function AdminToolboxTalkNewPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  // Week/month/year state - default to current week
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  // Calculate current week of month
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayOfWeek = firstDay.getDay();
  const currentWeek = Math.ceil((today.getDate() + firstDayOfWeek) / 7);

  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/toolbox-talks"
          className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-gray-50"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create PSI Talk</h1>
          <p className="text-sm text-gray-500">Upload the weekly safety talk PDF</p>
        </div>
      </div>

      {actionData?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {actionData.error}
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
                <p className="text-xs text-gray-500">
                  Common tags: Safety, PPE, Hazards, Emergency, Best Practices
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-amber-600" />
                  <h2 className="font-semibold">Schedule</h2>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  name="title"
                  label="Title"
                  placeholder="e.g., Working at Heights Safety"
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
                  defaultSelectedKeys={["draft"]}
                  classNames={{ trigger: "bg-gray-50" }}
                >
                  <SelectItem key="draft">Draft</SelectItem>
                  <SelectItem key="published">Published</SelectItem>
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
                    Save Talk
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Tips</h2>
              </CardHeader>
              <CardBody className="text-sm text-gray-600">
                <ul className="list-inside list-disc space-y-2">
                  <li>Schedule talks in advance for each week</li>
                  <li>Upload the safety PDF document</li>
                  <li>Add a cover image for better visibility</li>
                  <li>Use tags to categorize by safety topics</li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
