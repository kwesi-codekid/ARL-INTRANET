import type { PaginatedContacts } from "~/lib/services/contact.server";

/**
 * Company Directory Listing
 * Task: 1.1.4.2.1
 */

import { useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, Form, useOutletContext } from "react-router";
import {
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Avatar,
  Chip,
  Button,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import {
  Search,
  Phone,
  Mail,
  Building2,
  AlertTriangle,
  User,
  MapPin,
  Crown,
  Users,
} from "lucide-react";
import { MainLayout } from "~/components/layout";
import type { PublicOutletContext } from "~/routes/_public";

import type { IContact, IDepartment, ContactLocation } from "~/lib/db/models/contact.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireUserAuth } = await import("~/lib/services/user-auth.server");
  const { getContacts, getDepartments, getContactLetters } = await import("~/lib/services/contact.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  // Require user authentication to access directory
  await requireUserAuth(request);

  await connectDB();

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const department = url.searchParams.get("department") || "";
  const letter = url.searchParams.get("letter") || "";
  const location = url.searchParams.get("location") as ContactLocation | "" || "";
  const role = url.searchParams.get("role") || ""; // "management" or "staff"
  const emergency = url.searchParams.get("emergency") === "true";
  const page = parseInt(url.searchParams.get("page") || "1");

  // Determine isManagement filter based on role
  let isManagement: boolean | undefined = undefined;
  if (role === "management") {
    isManagement = true;
  } else if (role === "staff") {
    isManagement = false;
  }

  const [contactsResult, departments, availableLetters] = await Promise.all([
    getContacts({
      search: search || undefined,
      department: department || undefined,
      letter: letter || undefined,
      location: location || undefined,
      isManagement,
      isEmergencyContact: emergency || undefined,
      page,
      limit: 24,
    }),
    getDepartments(),
    getContactLetters(),
  ]);

  return Response.json({
    contacts: JSON.parse(JSON.stringify(contactsResult.contacts)),
    total: contactsResult.total,
    page: contactsResult.page,
    totalPages: contactsResult.totalPages,
    departments: JSON.parse(JSON.stringify(departments)),
    availableLetters,
    filters: { search, department, letter, location, role, emergency },
  });
}

// All letters A-Z for the navigation
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function DirectoryPage() {
  const { contacts, total, page, totalPages, departments, availableLetters, filters } =
    useLoaderData<typeof loader>();
  const { portalUser } = useOutletContext<PublicOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedContact, setSelectedContact] = useState<IContact | null>(null);

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

  const handleEmergencyToggle = () => {
    const params = new URLSearchParams(searchParams);
    if (filters.emergency) {
      params.delete("emergency");
    } else {
      params.set("emergency", "true");
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

  const handleRoleChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("role", value);
    } else {
      params.delete("role");
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

  const hasFilters = filters.search || filters.department || filters.letter || filters.location || filters.role || filters.emergency;

  return (
    <MainLayout user={portalUser}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Company Directory</h1>
          <p className="mt-2 text-gray-600">
            Find contact information for ARL employees and departments
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardBody className="gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Input
                placeholder="Search by name, position, or phone..."
                startContent={<Search size={18} className="text-gray-400" />}
                defaultValue={filters.search}
                onValueChange={handleSearch}
                className="flex-1"
                classNames={{ inputWrapper: "bg-gray-50" }}
              />

              <Select
                placeholder="All Departments"
                selectedKeys={filters.department ? [filters.department] : []}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full sm:w-48"
                classNames={{ trigger: "bg-gray-50" }}
              >
                {departments.map((dept: IDepartment) => (
                  <SelectItem key={dept._id.toString()} textValue={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </Select>

              <Select
                placeholder="All Locations"
                selectedKeys={filters.location ? [filters.location] : []}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full sm:w-40"
                classNames={{ trigger: "bg-gray-50" }}
                startContent={<MapPin size={16} className="text-gray-400" />}
              >
                <SelectItem key="head-office" textValue="Head Office (Accra)">
                  Head Office (Accra)
                </SelectItem>
                <SelectItem key="site" textValue="Site">
                  Site
                </SelectItem>
              </Select>

              <Select
                placeholder="All Roles"
                selectedKeys={filters.role ? [filters.role] : []}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full sm:w-36"
                classNames={{ trigger: "bg-gray-50" }}
                startContent={<Users size={16} className="text-gray-400" />}
              >
                <SelectItem key="management" textValue="Management">
                  Management
                </SelectItem>
                <SelectItem key="staff" textValue="Staff">
                  Staff
                </SelectItem>
              </Select>

              <Button
                variant={filters.emergency ? "solid" : "bordered"}
                color={filters.emergency ? "warning" : "default"}
                startContent={<AlertTriangle size={18} />}
                onPress={handleEmergencyToggle}
                className="shrink-0"
              >
                Emergency
              </Button>
            </div>

            {hasFilters && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Active filters:</span>
                {filters.search && (
                  <Chip size="sm" onClose={() => handleSearch("")}>
                    Search: {filters.search}
                  </Chip>
                )}
                {filters.department && (
                  <Chip size="sm" onClose={() => handleDepartmentChange("")}>
                    {departments.find((d: IDepartment) => d._id.toString() === filters.department)?.name}
                  </Chip>
                )}
                {filters.letter && (
                  <Chip size="sm" color="primary" onClose={() => handleLetterClick(filters.letter)}>
                    Letter: {filters.letter}
                  </Chip>
                )}
                {filters.location && (
                  <Chip size="sm" color="secondary" onClose={() => handleLocationChange("")}>
                    {filters.location === "head-office" ? "Head Office" : "Site"}
                  </Chip>
                )}
                {filters.role && (
                  <Chip
                    size="sm"
                    color={filters.role === "management" ? "success" : "default"}
                    onClose={() => handleRoleChange("")}
                  >
                    {filters.role === "management" ? "Management" : "Staff"}
                  </Chip>
                )}
                {filters.emergency && (
                  <Chip size="sm" color="warning" onClose={handleEmergencyToggle}>
                    Emergency Only
                  </Chip>
                )}
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={clearFilters}
                >
                  Clear All
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Alphabetical Navigation */}
        <Card className="mb-6">
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

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {contacts.length} of {total} contacts
            {filters.letter && ` starting with "${filters.letter}"`}
          </p>
        </div>

        {/* Contact Table */}
        {contacts.length > 0 ? (
          <>
            <Card className="shadow-sm">
              <CardBody className="p-0">
                <Table
                  aria-label="Company Directory"
                  selectionMode="single"
                  onRowAction={(key) => {
                    const contact = contacts.find((c: IContact) => c._id.toString() === key);
                    if (contact) setSelectedContact(contact);
                  }}
                  classNames={{
                    wrapper: "shadow-none",
                    tr: "cursor-pointer hover:bg-gray-50",
                  }}
                >
                  <TableHeader>
                    <TableColumn>NAME</TableColumn>
                    <TableColumn>POSITION</TableColumn>
                    <TableColumn>DEPARTMENT</TableColumn>
                    <TableColumn>PHONE</TableColumn>
                    <TableColumn>EXT</TableColumn>
                    <TableColumn className="hidden md:table-cell">EMAIL</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact: IContact) => (
                      <TableRow key={contact._id.toString()}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={contact.name}
                              src={contact.photo}
                              size="sm"
                              classNames={{
                                base: "bg-primary-100 text-primary-700 font-semibold",
                              }}
                            />
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {contact.name}
                              </span>
                              {contact.isManagement && (
                                <Crown
                                  size={14}
                                  className="shrink-0 text-amber-500"
                                />
                              )}
                              {contact.isEmergencyContact && (
                                <AlertTriangle
                                  size={14}
                                  className="shrink-0 text-warning-500"
                                />
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
                          <div className="flex items-center gap-1">
                            <Phone size={14} className="text-gray-400" />
                            <span className="text-gray-700">{contact.phone}</span>
                          </div>
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
                        <TableCell className="hidden md:table-cell">
                          {contact.email ? (
                            <div className="flex items-center gap-1">
                              <Mail size={14} className="text-gray-400" />
                              <span className="text-gray-700 truncate max-w-[200px]">
                                {contact.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  total={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  showControls
                  color="primary"
                />
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardBody className="py-12 text-center">
              <User size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">
                No contacts found
              </h3>
              <p className="mt-1 text-gray-500">
                {hasFilters
                  ? "Try adjusting your filters"
                  : "The directory is empty"}
              </p>
              {hasFilters && (
                <Button
                  variant="light"
                  color="primary"
                  className="mt-4"
                  onPress={clearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </CardBody>
          </Card>
        )}

        {/* Contact Detail Modal */}
        <Modal
          isOpen={!!selectedContact}
          onClose={() => setSelectedContact(null)}
          size="lg"
        >
          <ModalContent>
            {selectedContact && (
              <>
                <ModalHeader className="flex items-center gap-4">
                  <Avatar
                    name={selectedContact.name}
                    src={selectedContact.photo}
                    size="lg"
                    classNames={{
                      base: "bg-primary-100 text-primary-700 font-semibold",
                    }}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold">
                        {selectedContact.name}
                      </h2>
                      {selectedContact.isManagement && (
                        <Chip size="sm" color="success" variant="flat" startContent={<Crown size={12} />}>
                          Management
                        </Chip>
                      )}
                      {selectedContact.isEmergencyContact && (
                        <Chip size="sm" color="warning" variant="flat">
                          Emergency
                        </Chip>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedContact.position}
                    </p>
                  </div>
                </ModalHeader>

                <ModalBody>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                      <Building2 size={20} className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Department</p>
                        <p className="font-medium">
                          {(selectedContact.department as IDepartment)?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                      <MapPin size={20} className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">
                          {selectedContact.location === "head-office"
                            ? "Head Office (Accra)"
                            : "Site"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                      <Phone size={20} className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <a
                          href={`tel:${selectedContact.phone}`}
                          className="font-medium text-primary-600 hover:underline"
                        >
                          {selectedContact.phone}
                          {selectedContact.phoneExtension && (
                            <span className="text-gray-500">
                              {" "}ext. {selectedContact.phoneExtension}
                            </span>
                          )}
                        </a>
                      </div>
                    </div>

                    {selectedContact.email && (
                      <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                        <Mail size={20} className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <a
                            href={`mailto:${selectedContact.email}`}
                            className="font-medium text-primary-600 hover:underline"
                          >
                            {selectedContact.email}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </ModalBody>

                <ModalFooter>
                  <Button
                    variant="light"
                    onPress={() => setSelectedContact(null)}
                  >
                    Close
                  </Button>
                  <Button
                    color="primary"
                    as="a"
                    href={`tel:${selectedContact.phone}`}
                    startContent={<Phone size={16} />}
                  >
                    Call
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </MainLayout>
  );
}
