/**
 * Admin FAQ Management Page
 * Task: 1.4.1.2.5 - Create admin FAQ management interface
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Switch,
} from "@heroui/react";
import { Plus, Edit2, Trash2, HelpCircle, Search } from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, Form } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getFAQs, getFAQCategories, createFAQ, updateFAQ, deleteFAQ } = await import("~/lib/services/chat.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const [faqs, categories] = await Promise.all([
    getFAQs(),
    getFAQCategories(),
  ]);

  return Response.json({
    faqs: faqs.map((f) => ({
      id: f._id.toString(),
      question: f.question,
      answer: f.answer,
      category: f.category,
      keywords: f.keywords,
      isActive: f.isActive,
      order: f.order,
    })),
    categories,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getFAQs, getFAQCategories, createFAQ, updateFAQ, deleteFAQ } = await import("~/lib/services/chat.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create") {
    const question = formData.get("question") as string;
    const answer = formData.get("answer") as string;
    const category = formData.get("category") as string;
    const keywordsStr = formData.get("keywords") as string;

    const keywords = keywordsStr
      ? keywordsStr.split(",").map((k) => k.trim().toLowerCase())
      : [];

    await createFAQ({ question, answer, category, keywords });
    return Response.json({ success: true, message: "FAQ created" });
  }

  if (intent === "update") {
    const id = formData.get("id") as string;
    const question = formData.get("question") as string;
    const answer = formData.get("answer") as string;
    const category = formData.get("category") as string;
    const keywordsStr = formData.get("keywords") as string;
    const isActive = formData.get("isActive") === "true";

    const keywords = keywordsStr
      ? keywordsStr.split(",").map((k) => k.trim().toLowerCase())
      : [];

    await updateFAQ(id, { question, answer, category, keywords, isActive });
    return Response.json({ success: true, message: "FAQ updated" });
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await deleteFAQ(id);
    return Response.json({ success: true, message: "FAQ deleted" });
  }

  if (intent === "toggle-active") {
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";
    await updateFAQ(id, { isActive });
    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminFAQsPage() {
  const { faqs, categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    keywords: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const openCreateModal = () => {
    setEditingFaq(null);
    setFormData({ question: "", answer: "", category: "", keywords: "" });
    onOpen();
  };

  const openEditModal = (faq: any) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      keywords: faq.keywords?.join(", ") || "",
    });
    onOpen();
  };

  const handleClose = () => {
    setEditingFaq(null);
    setFormData({ question: "", answer: "", category: "", keywords: "" });
    onClose();
  };

  // Filter FAQs
  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      !searchTerm ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || faq.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedFaqs = filteredFaqs.reduce(
    (acc, faq) => {
      if (!acc[faq.category]) acc[faq.category] = [];
      acc[faq.category].push(faq);
      return acc;
    },
    {} as Record<string, typeof faqs>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ Management</h1>
          <p className="text-sm text-gray-500">Manage chatbot knowledge base</p>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={openCreateModal}>
          Add FAQ
        </Button>
      </div>

      {/* Messages */}
      {actionData?.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {actionData.message}
        </div>
      )}

      {/* Filters */}
      <Card className="shadow-sm">
        <CardBody>
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Search FAQs..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<Search size={16} className="text-gray-400" />}
              className="max-w-xs"
              isClearable
              onClear={() => setSearchTerm("")}
            />
            <div className="flex gap-2">
              <Chip
                variant={filterCategory === "" ? "solid" : "flat"}
                color="primary"
                className="cursor-pointer"
                onClick={() => setFilterCategory("")}
              >
                All
              </Chip>
              {categories.map((cat) => (
                <Chip
                  key={cat}
                  variant={filterCategory === cat ? "solid" : "flat"}
                  color="primary"
                  className="cursor-pointer"
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat}
                </Chip>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* FAQs List */}
      {Object.keys(groupedFaqs).length > 0 ? (
        Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
          <Card key={category} className="shadow-sm">
            <CardHeader>
              <h2 className="font-semibold">{category}</h2>
              <Chip size="sm" variant="flat" className="ml-2">
                {categoryFaqs.length}
              </Chip>
            </CardHeader>
            <CardBody className="space-y-3">
              {categoryFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`p-4 border rounded-lg ${
                    faq.isActive ? "bg-white" : "bg-gray-50 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{faq.question}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{faq.answer}</p>
                      {faq.keywords?.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {faq.keywords.slice(0, 5).map((kw: string) => (
                            <Chip key={kw} size="sm" variant="flat">
                              {kw}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Form method="post">
                        <input type="hidden" name="intent" value="toggle-active" />
                        <input type="hidden" name="id" value={faq.id} />
                        <input type="hidden" name="isActive" value={(!faq.isActive).toString()} />
                        <Switch size="sm" isSelected={faq.isActive} onChange={() => {}} />
                      </Form>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        onPress={() => openEditModal(faq)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Form method="post">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="id" value={faq.id} />
                        <Button
                          isIconOnly
                          size="sm"
                          color="danger"
                          variant="flat"
                          type="submit"
                          onPress={(e) => {
                            if (!confirm("Delete this FAQ?")) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </Form>
                    </div>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        ))
      ) : (
        <Card className="shadow-sm">
          <CardBody className="text-center py-12">
            <HelpCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No FAQs found</p>
            <p className="text-sm text-gray-400">Add FAQs to train the chatbot</p>
          </CardBody>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
        <ModalContent>
          <Form method="post">
            <input type="hidden" name="intent" value={editingFaq ? "update" : "create"} />
            {editingFaq && <input type="hidden" name="id" value={editingFaq.id} />}
            {editingFaq && (
              <input type="hidden" name="isActive" value={editingFaq.isActive.toString()} />
            )}

            <ModalHeader>{editingFaq ? "Edit FAQ" : "Add FAQ"}</ModalHeader>
            <ModalBody className="space-y-4">
              <Input
                label="Question"
                name="question"
                value={formData.question}
                onValueChange={(v) => setFormData({ ...formData, question: v })}
                placeholder="What is the company's safety policy?"
                isRequired
              />
              <Textarea
                label="Answer"
                name="answer"
                value={formData.answer}
                onValueChange={(v) => setFormData({ ...formData, answer: v })}
                placeholder="Detailed answer to the question..."
                minRows={4}
                isRequired
              />
              <Input
                label="Category"
                name="category"
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
                placeholder="e.g., Safety, HR, IT"
                isRequired
              />
              <Input
                label="Keywords"
                name="keywords"
                value={formData.keywords}
                onValueChange={(v) => setFormData({ ...formData, keywords: v })}
                placeholder="safety, policy, guidelines (comma-separated)"
                description="Keywords help the chatbot find this FAQ"
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                isLoading={isSubmitting}
                isDisabled={!formData.question || !formData.answer || !formData.category}
              >
                {editingFaq ? "Update" : "Create"}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}
