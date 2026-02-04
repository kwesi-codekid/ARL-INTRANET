/**
 * Admin News Sources Management
 * Task: 1.4.3.3 - Admin News Source Management
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Switch,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import {
  Plus,
  Edit2,
  Trash2,
  Rss,
  RefreshCw,
  Globe,
  MapPin,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, Form } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getNewsSources, createNewsSource, updateNewsSource, deleteNewsSource, fetchAllNews, getNewsStats } = await import("~/lib/services/gold-news.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const [sources, stats] = await Promise.all([
    getNewsSources(),
    getNewsStats(),
  ]);

  return Response.json({
    sources: sources.map((s) => ({
      id: s._id.toString(),
      name: s.name,
      url: s.url,
      type: s.type,
      region: s.region,
      category: s.category,
      isActive: s.isActive,
      lastFetched: s.lastFetched,
      lastError: s.lastError,
      fetchInterval: s.fetchInterval,
    })),
    stats,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getNewsSources, createNewsSource, updateNewsSource, deleteNewsSource, fetchAllNews, getNewsStats } = await import("~/lib/services/gold-news.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create") {
    const name = formData.get("name") as string;
    const url = formData.get("url") as string;
    const type = formData.get("type") as "rss" | "api";
    const region = formData.get("region") as "ghana" | "world";
    const category = (formData.get("category") as string) || "general";

    await createNewsSource({ name, url, type, region, category });
    return Response.json({ success: true, message: "News source added" });
  }

  if (intent === "update") {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const url = formData.get("url") as string;
    const type = formData.get("type") as "rss" | "api";
    const region = formData.get("region") as "ghana" | "world";
    const category = formData.get("category") as string;

    await updateNewsSource(id, { name, url, type, region, category });
    return Response.json({ success: true, message: "News source updated" });
  }

  if (intent === "toggle-active") {
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";
    await updateNewsSource(id, { isActive });
    return Response.json({ success: true });
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await deleteNewsSource(id);
    return Response.json({ success: true, message: "News source deleted" });
  }

  if (intent === "fetch-all") {
    const result = await fetchAllNews();
    return Response.json({
      success: true,
      message: `Fetched ${result.total} new articles`,
      errors: result.errors,
    });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminNewsSourcesPage() {
  const { sources, stats } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingSource, setEditingSource] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    type: "rss" as "rss" | "api",
    region: "world" as "ghana" | "world",
    category: "general",
  });

  const openCreateModal = () => {
    setEditingSource(null);
    setFormData({ name: "", url: "", type: "rss", region: "world", category: "general" });
    onOpen();
  };

  const openEditModal = (source: any) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      url: source.url,
      type: source.type,
      region: source.region,
      category: source.category,
    });
    onOpen();
  };

  const handleClose = () => {
    setEditingSource(null);
    onClose();
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">News Sources</h1>
          <p className="text-sm text-gray-500">Manage gold industry news feeds</p>
        </div>
        <div className="flex gap-2">
          <Form method="post">
            <input type="hidden" name="intent" value="fetch-all" />
            <Button
              type="submit"
              variant="flat"
              startContent={<RefreshCw size={16} />}
              isLoading={isSubmitting}
            >
              Fetch Now
            </Button>
          </Form>
          <Button color="primary" startContent={<Plus size={16} />} onPress={openCreateModal}>
            Add Source
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Articles</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
            <p className="text-xs text-gray-500">Today</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900">{stats.sources}</p>
            <p className="text-xs text-gray-500">Total Sources</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-green-600">{stats.activeSources}</p>
            <p className="text-xs text-gray-500">Active Sources</p>
          </CardBody>
        </Card>
      </div>

      {/* Messages */}
      {actionData?.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {actionData.message}
          {actionData.errors?.length > 0 && (
            <ul className="mt-2 list-disc list-inside text-red-600">
              {actionData.errors.map((err: string, i: number) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sources List */}
      <Card className="shadow-sm">
        <CardHeader>
          <h2 className="font-semibold">News Sources ({sources.length})</h2>
        </CardHeader>
        <CardBody>
          {sources.length > 0 ? (
            <div className="space-y-3">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    source.isActive ? "bg-white" : "bg-gray-50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        source.isActive ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      <Rss
                        size={20}
                        className={source.isActive ? "text-green-600" : "text-gray-400"}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{source.name}</p>
                        <Chip
                          size="sm"
                          color={source.region === "ghana" ? "success" : "primary"}
                          variant="flat"
                          startContent={
                            source.region === "ghana" ? (
                              <MapPin size={12} />
                            ) : (
                              <Globe size={12} />
                            )
                          }
                        >
                          {source.region}
                        </Chip>
                        <Chip size="sm" variant="flat">
                          {source.type.toUpperCase()}
                        </Chip>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate max-w-md">{source.url}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span>Last fetched: {formatDate(source.lastFetched)}</span>
                        {source.lastError && (
                          <span className="flex items-center gap-1 text-red-500">
                            <AlertCircle size={12} />
                            Error
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Form method="post">
                      <input type="hidden" name="intent" value="toggle-active" />
                      <input type="hidden" name="id" value={source.id} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={(!source.isActive).toString()}
                      />
                      <Switch size="sm" isSelected={source.isActive} onChange={() => {}} />
                    </Form>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() => openEditModal(source)}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Form method="post">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={source.id} />
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="flat"
                        type="submit"
                        onPress={(e) => {
                          if (!confirm("Delete this news source?")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </Form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Rss size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No news sources configured</p>
              <p className="text-sm text-gray-400">Add RSS feeds or API sources</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Suggested Sources */}
      <Card className="shadow-sm bg-amber-50 border border-amber-200">
        <CardHeader>
          <h3 className="font-semibold text-amber-800">Suggested RSS Feeds</h3>
        </CardHeader>
        <CardBody>
          <div className="text-sm text-amber-700 space-y-2">
            <p>Consider adding these gold/mining news sources:</p>
            <ul className="list-disc list-inside space-y-1 text-amber-600">
              <li>Mining.com - https://www.mining.com/feed/</li>
              <li>Kitco News - https://www.kitco.com/rss/gold.xml</li>
              <li>Ghana Business News - https://www.ghanabusinessnews.com/feed/</li>
              <li>Mining Weekly - https://www.miningweekly.com/rss</li>
            </ul>
          </div>
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalContent>
          <Form method="post">
            <input type="hidden" name="intent" value={editingSource ? "update" : "create"} />
            {editingSource && <input type="hidden" name="id" value={editingSource.id} />}

            <ModalHeader>{editingSource ? "Edit Source" : "Add News Source"}</ModalHeader>
            <ModalBody className="space-y-4">
              <Input
                label="Name"
                name="name"
                value={formData.name}
                onValueChange={(v) => setFormData({ ...formData, name: v })}
                placeholder="Mining.com"
                isRequired
              />
              <Input
                label="Feed URL"
                name="url"
                value={formData.url}
                onValueChange={(v) => setFormData({ ...formData, url: v })}
                placeholder="https://example.com/feed.xml"
                isRequired
              />
              <Select
                label="Type"
                name="type"
                selectedKeys={[formData.type]}
                onSelectionChange={(keys) =>
                  setFormData({ ...formData, type: Array.from(keys)[0] as "rss" | "api" })
                }
              >
                <SelectItem key="rss">RSS Feed</SelectItem>
                <SelectItem key="api">API</SelectItem>
              </Select>
              <Select
                label="Region"
                name="region"
                selectedKeys={[formData.region]}
                onSelectionChange={(keys) =>
                  setFormData({ ...formData, region: Array.from(keys)[0] as "ghana" | "world" })
                }
              >
                <SelectItem key="ghana">Ghana</SelectItem>
                <SelectItem key="world">World</SelectItem>
              </Select>
              <Input
                label="Category"
                name="category"
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
                placeholder="general"
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
                isDisabled={!formData.name || !formData.url}
              >
                {editingSource ? "Update" : "Add"}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}
