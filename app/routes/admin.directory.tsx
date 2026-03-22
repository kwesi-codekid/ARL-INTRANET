import type { CSVContactRow } from "~/lib/services/contact.server";

/**
 * Admin Contact Directory Management
 * Task: 1.1.4.3.1
 */

import { useState, useRef } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, Form, useNavigation, useActionData } from "react-router";
import {
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Button,
  Chip,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Avatar,
  Switch,
  Textarea,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Upload,
  Phone,
  Mail,
  AlertTriangle,
  Users,
  Camera,
  X,
  Download,
  Crown,
  Building2,
  MapPin,
} from "lucide-react";

import type { IContact, IDepartment, ContactLocation } from "~/lib/db/models/contact.server";

// Type definitions
interface ContactStats {
  total: number;
  emergency: number;
  management: number;
  siteContacts: number;
  headOfficeContacts: number;
}

interface LoaderData {
  contacts: IContact[];
  total: number;
  page: number;
  totalPages: number;
  departments: IDepartment[];
  stats: ContactStats;
  availableLetters: string[];
  filters: { search: string; department: string; management: string; location: string; letter: string };
}

interface ActionData {
  success?: boolean;
  message?: string;
  error?: string;
  imported?: number;
  skipped?: number;
  errors?: string[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getContacts, getDepartments, getContactStats, getContactLetters } = await import("~/lib/services/contact.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const department = url.searchParams.get("department") || "";
  const management = url.searchParams.get("management") || "";
  const location = url.searchParams.get("location") || "";
  const letter = url.searchParams.get("letter") || "";
  const page = parseInt(url.searchParams.get("page") || "1");

  const [contactsResult, departments, stats, availableLetters] = await Promise.all([
    getContacts({
      search: search || undefined,
      department: department || undefined,
      isManagement: management === "true" ? true : undefined,
      location: location as ContactLocation || undefined,
      letter: letter || undefined,
      includeInactive: true,
      page,
      limit: 20,
    }),
    getDepartments({ includeInactive: true }),
    getContactStats(),
    getContactLetters(),
  ]);

  return Response.json({
    contacts: JSON.parse(JSON.stringify(contactsResult.contacts)),
    total: contactsResult.total,
    page: contactsResult.page,
    totalPages: contactsResult.totalPages,
    departments: JSON.parse(JSON.stringify(departments)),
    stats,
    availableLetters,
    filters: { search, department, management, location, letter },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { createContact, updateContact, deleteContact, importContactsFromCSV } = await import("~/lib/services/contact.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const sessionData = await getSessionData(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Create Contact
  if (intent === "create") {
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      phoneExtension: formData.get("phoneExtension") as string || undefined,
      email: formData.get("email") as string || undefined,
      department: formData.get("department") as string,
      position: formData.get("position") as string,
      photo: formData.get("photo") as string || undefined,
      isEmergencyContact: formData.get("isEmergencyContact") === "true",
      isManagement: formData.get("isManagement") === "true",
      location: (formData.get("location") as ContactLocation) || "site",
      isActive: true,
    };

    if (!data.name || !data.phone || !data.department || !data.position) {
      return Response.json({ error: "All required fields must be filled" });
    }

    const contact = await createContact(data);

    await logActivity({
      userId: sessionData?.userId,
      action: "create",
      resource: "contact",
      resourceId: contact._id.toString(),
      details: { name: data.name },
      request,
    });

    return Response.json({ success: true, message: "Contact created successfully" });
  }

  // Update Contact
  if (intent === "update") {
    const id = formData.get("id") as string;
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      phoneExtension: formData.get("phoneExtension") as string || undefined,
      email: formData.get("email") as string || undefined,
      department: formData.get("department") as string,
      position: formData.get("position") as string,
      photo: formData.get("photo") as string || undefined,
      isEmergencyContact: formData.get("isEmergencyContact") === "true",
      isManagement: formData.get("isManagement") === "true",
      location: (formData.get("location") as ContactLocation) || "site",
      isActive: formData.get("isActive") === "true",
    };

    await updateContact(id, data);

    await logActivity({
      userId: sessionData?.userId,
      action: "update",
      resource: "contact",
      resourceId: id,
      details: { name: data.name },
      request,
    });

    return Response.json({ success: true, message: "Contact updated successfully" });
  }

  // Delete Contact
  if (intent === "delete") {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;

    await deleteContact(id);

    await logActivity({
      userId: sessionData?.userId,
      action: "delete",
      resource: "contact",
      resourceId: id,
      details: { name },
      request,
    });

    return Response.json({ success: true, message: "Contact deleted successfully" });
  }

  // Import CSV
  if (intent === "import") {
    const csvData = formData.get("csvData") as string;

    try {
      const lines = csvData.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

      const rows: CSVContactRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        const row: CSVContactRow = {
          name: values[headers.indexOf("name")] || "",
          phone: values[headers.indexOf("phone")] || "",
          phoneExtension: values[headers.indexOf("extension")] || values[headers.indexOf("ext")] || "",
          email: values[headers.indexOf("email")] || "",
          departmentCode: values[headers.indexOf("department")] || values[headers.indexOf("dept")] || "",
          position: values[headers.indexOf("position")] || values[headers.indexOf("title")] || "",
          isEmergencyContact: values[headers.indexOf("emergency")] || "",
          isManagement: values[headers.indexOf("management")] || "",
          location: values[headers.indexOf("location")] || "",
        };
        rows.push(row);
      }

      const result = await importContactsFromCSV(rows);

      await logActivity({
        userId: sessionData?.userId,
        action: "create",
        resource: "contact",
        details: {
          type: "csv_import",
          success: result.success,
          failed: result.failed,
        },
        request,
      });

      return Response.json({
        success: true,
        message: `Imported ${result.success} contacts. ${result.failed} failed.`,
        importResult: result,
      });
    } catch (error) {
      return Response.json({
        error: error instanceof Error ? error.message : "Failed to parse CSV",
      });
    }
  }

  return Response.json({ error: "Invalid action" });
}

// Alphabet for navigation
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Get 2 initials from a name (first and last)
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function AdminDirectory() {
  const { contacts, total, page, totalPages, departments, stats, availableLetters, filters } =
    useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editContact, setEditContact] = useState<IContact | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<IContact | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [createPhoto, setCreatePhoto] = useState<string>("");
  const [editPhoto, setEditPhoto] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const createFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Photo upload handler
  const handlePhotoUpload = async (
    file: File,
    setPhoto: (url: string) => void
  ) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subdir", "photos");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.url) {
        setPhoto(result.url);
      } else {
        alert(result.error || "Upload failed");
      }
    } catch (error) {
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateClose = () => {
    setIsCreateOpen(false);
    setCreatePhoto("");
  };

  const handleEditOpen = (contact: IContact) => {
    setEditContact(contact);
    setEditPhoto(contact.photo || "");
  };

  const handleEditClose = () => {
    setEditContact(null);
    setEditPhoto("");
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handleDepartmentChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("department", value);
    } else {
      params.delete("department");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handleManagementChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("management", value);
    } else {
      params.delete("management");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handleLocationChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("location", value);
    } else {
      params.delete("location");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handleLetterClick = (letter: string) => {
    const params = new URLSearchParams(searchParams);
    if (filters.letter === letter) {
      params.delete("letter");
    } else {
      params.set("letter", letter);
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasFilters = filters.search || filters.department || filters.management || filters.location || filters.letter;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardBody className="flex flex-row items-center gap-3 p-4">
            <div className="rounded-lg bg-primary-100 p-2.5">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-100 p-2.5">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Management</p>
              <p className="text-xl font-bold">{stats.management}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Head Office</p>
              <p className="text-xl font-bold">{stats.headOfficeContacts}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-3 p-4">
            <div className="rounded-lg bg-green-100 p-2.5">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Site</p>
              <p className="text-xl font-bold">{stats.siteContacts}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-3 p-4">
            <div className="rounded-lg bg-warning-100 p-2.5">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Emergency</p>
              <p className="text-xl font-bold">{stats.emergency}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardBody className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap gap-3">
              <Input
                placeholder="Search by name, position, phone..."
                startContent={<Search size={18} className="text-gray-400" />}
                defaultValue={filters.search}
                onValueChange={handleSearch}
                className="w-full sm:max-w-xs"
                classNames={{ inputWrapper: "bg-gray-50" }}
              />

              <Select
                placeholder="All Departments"
                selectedKeys={filters.department ? [filters.department] : []}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full sm:w-44"
                classNames={{ trigger: "bg-gray-50" }}
              >
                {departments.map((dept: IDepartment) => (
                  <SelectItem key={dept._id.toString()} textValue={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </Select>

              <Select
                placeholder="All Staff"
                selectedKeys={filters.management ? [filters.management] : []}
                onChange={(e) => handleManagementChange(e.target.value)}
                className="w-full sm:w-36"
                classNames={{ trigger: "bg-gray-50" }}
              >
                <SelectItem key="true" textValue="Management Only">
                  <div className="flex items-center gap-2">
                    <Crown size={14} className="text-amber-500" />
                    Management
                  </div>
                </SelectItem>
              </Select>

              <Select
                placeholder="All Locations"
                selectedKeys={filters.location ? [filters.location] : []}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full sm:w-40"
                classNames={{ trigger: "bg-gray-50" }}
              >
                <SelectItem key="head-office" textValue="Head Office (Accra)">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-blue-500" />
                    Head Office
                  </div>
                </SelectItem>
                <SelectItem key="site" textValue="Site">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-green-500" />
                    Site
                  </div>
                </SelectItem>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="bordered"
                startContent={<Upload size={18} />}
                onPress={() => setIsImportOpen(true)}
              >
                Import CSV
              </Button>
              <Button
                color="primary"
                startContent={<Plus size={18} />}
                onPress={() => setIsCreateOpen(true)}
              >
                Add Contact
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              {filters.search && (
                <Chip size="sm" onClose={() => handleSearch("")}>
                  Search: {filters.search}
                </Chip>
              )}
              {filters.department && (
                <Chip size="sm" color="primary" onClose={() => handleDepartmentChange("")}>
                  {departments.find((d: IDepartment) => d._id.toString() === filters.department)?.name}
                </Chip>
              )}
              {filters.management && (
                <Chip size="sm" color="warning" onClose={() => handleManagementChange("")}>
                  Management Only
                </Chip>
              )}
              {filters.location && (
                <Chip size="sm" color="secondary" onClose={() => handleLocationChange("")}>
                  {filters.location === "head-office" ? "Head Office" : "Site"}
                </Chip>
              )}
              {filters.letter && (
                <Chip size="sm" color="success" onClose={() => handleLetterClick(filters.letter)}>
                  Letter: {filters.letter}
                </Chip>
              )}
              <Button size="sm" variant="light" color="danger" onPress={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Alphabetical Navigation */}
      <Card>
        <CardBody className="py-3">
          <div className="flex flex-wrap items-center justify-center gap-1">
            <span className="mr-2 text-sm font-medium text-gray-600">Jump to:</span>
            {ALPHABET.map((letter) => {
              const hasContacts = availableLetters.includes(letter);
              const isActive = filters.letter === letter;
              return (
                <Button
                  key={letter}
                  size="sm"
                  variant={isActive ? "solid" : "light"}
                  color={isActive ? "primary" : "default"}
                  isDisabled={!hasContacts}
                  onPress={() => handleLetterClick(letter)}
                  className={`min-w-8 h-8 px-0 font-semibold ${
                    !hasContacts ? "opacity-30" : ""
                  }`}
                >
                  {letter}
                </Button>
              );
            })}
            {filters.letter && (
              <Button
                size="sm"
                variant="flat"
                color="danger"
                onPress={() => handleLetterClick(filters.letter)}
                className="ml-2"
              >
                Clear
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Success/Error Messages */}
      {actionData?.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {actionData.message}
        </div>
      )}
      {actionData?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {actionData.error}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {contacts.length} of {total} contacts
          {filters.letter && ` starting with "${filters.letter}"`}
        </p>
      </div>

      {/* Contacts Table */}
      {contacts.length > 0 ? (
        <Card className="shadow-sm">
          <CardBody className="p-0">
            <Table
              aria-label="Contact Directory"
              classNames={{
                wrapper: "shadow-none",
                tr: "border-b last:border-0 border-warning/40 hover:bg-gray-50",
              }}
            >
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>POSITION</TableColumn>
                <TableColumn>DEPARTMENT</TableColumn>
                <TableColumn>PHONE</TableColumn>
                <TableColumn>EXT</TableColumn>
                <TableColumn className="hidden lg:table-cell">EMAIL</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn className="text-right">ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {contacts.map((contact: IContact) => (
                  <TableRow key={contact._id.toString()} className={!contact.isActive ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={getInitials(contact.name)}
                          src={contact.photo}
                          size="sm"
                          classNames={{
                            base: contact.isManagement
                              ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 ring-2 ring-amber-300"
                              : "bg-primary-100 text-primary-700 font-semibold",
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {contact.name}
                          </span>
                          {contact.isManagement && (
                            <Crown size={14} className="shrink-0 text-amber-500" />
                          )}
                          {contact.isEmergencyContact && (
                            <AlertTriangle size={14} className="shrink-0 text-warning-500" />
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">{contact.position}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Chip size="sm" variant="flat" color="primary">
                          {(contact.department as IDepartment)?.name}
                        </Chip>
                        {contact.location === "head-office" && (
                          <Chip size="sm" variant="flat" color="secondary" className="text-xs">
                            Accra
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1 text-gray-700 hover:text-primary-600"
                      >
                        <Phone size={14} className="text-gray-400" />
                        {contact.phone}
                      </a>
                    </TableCell>
                    <TableCell>
                      {contact.phoneExtension ? (
                        <span className="text-gray-700 font-medium">
                          {contact.phoneExtension}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-1 text-gray-700 hover:text-primary-600"
                        >
                          <Mail size={14} className="text-gray-400" />
                          <span className="truncate max-w-[180px]">{contact.email}</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.isActive ? (
                        <Chip size="sm" variant="flat" color="success">Active</Chip>
                      ) : (
                        <Chip size="sm" variant="flat" color="default">Inactive</Chip>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          onPress={() => handleEditOpen(contact)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          color="danger"
                          onPress={() => setDeleteConfirm(contact)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="py-12 text-center text-gray-500">
            <Users className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">No contacts found</h3>
            <p className="mt-1 text-gray-500">
              {hasFilters ? "Try adjusting your filters" : "Add your first contact to get started"}
            </p>
            {hasFilters && (
              <Button variant="light" color="primary" className="mt-4" onPress={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardBody>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={page}
            onChange={handlePageChange}
            showControls
            color="primary"
          />
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={handleCreateClose} size="2xl">
        <ModalContent>
          <Form method="post" onSubmit={handleCreateClose}>
            <ModalHeader>Add New Contact</ModalHeader>
            <ModalBody>
              <input type="hidden" name="intent" value="create" />
              <input type="hidden" name="photo" value={createPhoto} />
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-2 sm:col-span-2">
                  <div className="relative">
                    <Avatar
                      name="Photo"
                      src={createPhoto}
                      size="lg"
                      className="h-24 w-24"
                      classNames={{
                        base: "bg-gray-100 text-gray-400",
                      }}
                    />
                    {createPhoto && (
                      <button
                        type="button"
                        onClick={() => setCreatePhoto("")}
                        className="absolute -right-1 -top-1 rounded-full bg-danger-500 p-1 text-white hover:bg-danger-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <input
                    ref={createFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file, setCreatePhoto);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<Camera size={14} />}
                    onPress={() => createFileRef.current?.click()}
                    isLoading={isUploading}
                  >
                    {createPhoto ? "Change Photo" : "Add Photo"}
                  </Button>
                </div>

                <Input
                  name="name"
                  label="Full Name"
                  placeholder="e.g., John Doe"
                  isRequired
                  className="sm:col-span-2"
                />
                <Input
                  name="phone"
                  label="Phone"
                  placeholder="e.g., 0241234567"
                  isRequired
                />
                <Input
                  name="phoneExtension"
                  label="Extension"
                  placeholder="e.g., 101"
                />
                <Input
                  name="email"
                  type="email"
                  label="Email"
                  placeholder="email@arl.com"
                />
                <Select
                  name="department"
                  label="Department"
                  placeholder="Select department"
                  isRequired
                >
                  {departments
                    .filter((d: IDepartment) => d.isActive)
                    .map((dept: IDepartment) => (
                      <SelectItem key={dept._id.toString()} textValue={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                </Select>
                <Input
                  name="position"
                  label="Position"
                  placeholder="e.g., Senior Engineer"
                  isRequired
                />
                <Select
                  name="location"
                  label="Location"
                  placeholder="Select location"
                  defaultSelectedKeys={["site"]}
                >
                  <SelectItem key="site" textValue="Site">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-green-500" />
                      Site
                    </div>
                  </SelectItem>
                  <SelectItem key="head-office" textValue="Head Office (Accra)">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-blue-500" />
                      Head Office (Accra)
                    </div>
                  </SelectItem>
                </Select>
                <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <Switch name="isManagement" value="true" />
                    <span className="text-sm flex items-center gap-1">
                      <Crown size={14} className="text-amber-500" />
                      Management
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch name="isEmergencyContact" value="true" />
                    <span className="text-sm flex items-center gap-1">
                      <AlertTriangle size={14} className="text-warning-500" />
                      Emergency Contact
                    </span>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={handleCreateClose}>
                Cancel
              </Button>
              <Button type="submit" color="primary" isLoading={isSubmitting}>
                Create Contact
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editContact} onClose={handleEditClose} size="2xl">
        <ModalContent>
          {editContact && (
            <Form method="post" onSubmit={handleEditClose}>
              <ModalHeader>Edit Contact</ModalHeader>
              <ModalBody>
                <input type="hidden" name="intent" value="update" />
                <input type="hidden" name="id" value={editContact._id.toString()} />
                <input type="hidden" name="photo" value={editPhoto} />
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Photo Upload */}
                  <div className="flex flex-col items-center gap-2 sm:col-span-2">
                    <div className="relative">
                      <Avatar
                        name={getInitials(editContact.name)}
                        src={editPhoto}
                        size="lg"
                        className="h-24 w-24"
                        classNames={{
                          base: "bg-primary-100 text-primary-700",
                        }}
                      />
                      {editPhoto && (
                        <button
                          type="button"
                          onClick={() => setEditPhoto("")}
                          className="absolute -right-1 -top-1 rounded-full bg-danger-500 p-1 text-white hover:bg-danger-600"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <input
                      ref={editFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file, setEditPhoto);
                      }}
                    />
                    <Button
                      size="sm"
                      variant="flat"
                      startContent={<Camera size={14} />}
                      onPress={() => editFileRef.current?.click()}
                      isLoading={isUploading}
                    >
                      {editPhoto ? "Change Photo" : "Add Photo"}
                    </Button>
                  </div>

                  <Input
                    name="name"
                    label="Full Name"
                    defaultValue={editContact.name}
                    isRequired
                    className="sm:col-span-2"
                  />
                  <Input
                    name="phone"
                    label="Phone"
                    defaultValue={editContact.phone}
                    isRequired
                  />
                  <Input
                    name="phoneExtension"
                    label="Extension"
                    defaultValue={editContact.phoneExtension || ""}
                  />
                  <Input
                    name="email"
                    type="email"
                    label="Email"
                    defaultValue={editContact.email || ""}
                  />
                  <Select
                    name="department"
                    label="Department"
                    defaultSelectedKeys={[(editContact.department as IDepartment)?._id?.toString() || ""]}
                    isRequired
                  >
                    {departments
                      .filter((d: IDepartment) => d.isActive)
                      .map((dept: IDepartment) => (
                        <SelectItem key={dept._id.toString()} textValue={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                  </Select>
                  <Input
                    name="position"
                    label="Position"
                    defaultValue={editContact.position}
                    isRequired
                  />
                  <Select
                    name="location"
                    label="Location"
                    defaultSelectedKeys={[editContact.location || "site"]}
                  >
                    <SelectItem key="site" textValue="Site">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-green-500" />
                        Site
                      </div>
                    </SelectItem>
                    <SelectItem key="head-office" textValue="Head Office (Accra)">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-blue-500" />
                        Head Office (Accra)
                      </div>
                    </SelectItem>
                  </Select>
                  <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        name="isManagement"
                        value="true"
                        defaultSelected={editContact.isManagement}
                      />
                      <span className="text-sm flex items-center gap-1">
                        <Crown size={14} className="text-amber-500" />
                        Management
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        name="isEmergencyContact"
                        value="true"
                        defaultSelected={editContact.isEmergencyContact}
                      />
                      <span className="text-sm flex items-center gap-1">
                        <AlertTriangle size={14} className="text-warning-500" />
                        Emergency
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        name="isActive"
                        value="true"
                        defaultSelected={editContact.isActive}
                      />
                      <span className="text-sm">Active</span>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={handleEditClose}>
                  Cancel
                </Button>
                <Button type="submit" color="primary" isLoading={isSubmitting}>
                  Save Changes
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <ModalContent>
          {deleteConfirm && (
            <Form method="post" onSubmit={() => setDeleteConfirm(null)}>
              <ModalHeader>Delete Contact</ModalHeader>
              <ModalBody>
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={deleteConfirm._id.toString()} />
                <input type="hidden" name="name" value={deleteConfirm.name} />
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button type="submit" color="danger" isLoading={isSubmitting}>
                  Delete
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>

      {/* Import CSV Modal */}
      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} size="2xl">
        <ModalContent>
          <Form method="post" onSubmit={() => setIsImportOpen(false)}>
            <ModalHeader>Import Contacts from CSV</ModalHeader>
            <ModalBody>
              <input type="hidden" name="intent" value="import" />
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4 text-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">CSV Format:</p>
                      <code className="mt-2 block text-xs">
                        Name,Phone,Extension,Email,Department,Position,Emergency,Management,Location
                      </code>
                      <p className="mt-2 text-gray-600">
                        Department: code (e.g., MINING, HR, IT). Emergency/Management: &quot;yes&quot; or &quot;no&quot;.
                        Location: &quot;site&quot; or &quot;head-office&quot; (or &quot;accra&quot;).
                      </p>
                    </div>
                    <Button
                      as="a"
                      href="/api/csv-template"
                      download
                      size="sm"
                      variant="bordered"
                      startContent={<Download size={14} />}
                    >
                      Template
                    </Button>
                  </div>
                </div>
                <Textarea
                  name="csvData"
                  label="CSV Data"
                  placeholder="Paste your CSV data here..."
                  value={csvData}
                  onValueChange={setCsvData}
                  minRows={10}
                  isRequired
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={() => setIsImportOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                isLoading={isSubmitting}
                isDisabled={!csvData.trim()}
              >
                Import
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}
