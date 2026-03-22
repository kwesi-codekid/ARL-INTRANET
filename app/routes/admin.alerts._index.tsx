/**
 * Admin Alerts Listing Page
 * Task: 1.2.3.4.1 - Create admin alerts listing page
 * Task: 1.2.3.4.4 - Add quick activate/deactivate toggle
 * Task: 1.2.3.4.6 - Create alert edit and delete functionality
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Select,
  SelectItem,
  Switch,
} from "@heroui/react";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
} from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, Link, Form, useSubmit } from "react-router";
import type { SerializedAlert, AlertSeverity } from "~/lib/services/alert.server";

const ITEMS_PER_PAGE = 10;

interface LoaderData {
  alerts: SerializedAlert[];
  stats: {
    total: number;
    active: number;
    critical: number;
    warning: number;
    info: number;
    scheduled: number;
  };
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  currentSeverity: string;
  searchQuery: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getAlerts, getAlertStats, deleteAlert, toggleAlertStatus, serializeAlert } = await import("~/lib/services/alert.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const severity = url.searchParams.get("severity") || "";

  const [result, stats] = await Promise.all([
    getAlerts({
      severity: severity ? (severity as AlertSeverity) : undefined,
      includeAll: true,
      page,
      limit: ITEMS_PER_PAGE,
    }),
    getAlertStats(),
  ]);

  return Response.json({
    alerts: result.alerts.map(serializeAlert),
    stats,
    pagination: {
      page: result.page,
      totalPages: result.totalPages,
      total: result.total,
    },
    currentSeverity: severity,
    searchQuery: "",
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getAlerts, getAlertStats, deleteAlert, toggleAlertStatus, serializeAlert } = await import("~/lib/services/alert.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id") as string;

  if (intent === "delete" && id) {
    await deleteAlert(id);
  } else if (intent === "toggle-status" && id) {
    await toggleAlertStatus(id);
  }

  return Response.json({ success: true });
}

const severityConfig = {
  critical: { color: "danger" as const, icon: AlertTriangle },
  warning: { color: "warning" as const, icon: AlertCircle },
  info: { color: "primary" as const, icon: Info },
};

export default function AdminAlertsPage() {
  const { alerts, stats, pagination, currentSeverity } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();

  const handleSeverityChange = (severity: string) => {
    const params = new URLSearchParams(searchParams);
    if (severity) {
      params.set("severity", severity);
    } else {
      params.delete("severity");
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Safety Alerts</h1>
          <p className="text-gray-500">Manage safety and incident alerts</p>
        </div>
        <Button
          as={Link}
          to="/admin/alerts/new"
          color="danger"
          startContent={<Plus size={18} />}
        >
          Create Alert
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Bell size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Eye size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.critical}</p>
              <p className="text-xs text-gray-500">Critical</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.warning}</p>
              <p className="text-xs text-gray-500">Warning</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Info size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.info}</p>
              <p className="text-xs text-gray-500">Info</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Select
            placeholder="Severity"
            selectedKeys={currentSeverity ? [currentSeverity] : []}
            onChange={(e) => handleSeverityChange(e.target.value)}
            className="w-full sm:w-40"
          >
            <SelectItem key="">All Severities</SelectItem>
            <SelectItem key="critical">Critical</SelectItem>
            <SelectItem key="warning">Warning</SelectItem>
            <SelectItem key="info">Info</SelectItem>
          </Select>
          <div className="flex-1 text-right text-sm text-gray-500">
            {pagination.total} alerts found
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardBody className="overflow-x-auto p-0">
          <Table aria-label="Alerts table" removeWrapper className="min-w-[600px]">
            <TableHeader>
              <TableColumn>ALERT</TableColumn>
              <TableColumn>SEVERITY</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>VIEWS</TableColumn>
              <TableColumn align="end">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No alerts found">
              {alerts.map((alert) => {
                const config = severityConfig[alert.severity];
                const Icon = config.icon;

                return (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full bg-${config.color}-100`}
                        >
                          <Icon size={18} className={`text-${config.color}-600`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">
                            {alert.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" color={config.color} variant="flat">
                        {alert.severity.toUpperCase()}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {alert.type}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Form method="post">
                        <input type="hidden" name="intent" value="toggle-status" />
                        <input type="hidden" name="id" value={alert.id} />
                        <Switch
                          size="sm"
                          isSelected={alert.isActive}
                          onChange={() => {
                            const formData = new FormData();
                            formData.set("intent", "toggle-status");
                            formData.set("id", alert.id);
                            submit(formData, { method: "post" });
                          }}
                        />
                      </Form>
                    </TableCell>
                    <TableCell>{alert.views}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          as={Link}
                          to={`/alerts/${alert.id}`}
                          isIconOnly
                          variant="light"
                          size="sm"
                        >
                          <Eye size={18} />
                        </Button>
                        <Button
                          as={Link}
                          to={`/admin/alerts/${alert.id}/edit`}
                          isIconOnly
                          variant="light"
                          size="sm"
                        >
                          <Edit size={18} />
                        </Button>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly variant="light" size="sm">
                              <MoreVertical size={18} />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Actions">
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              onPress={() => {
                                if (confirm("Are you sure you want to delete this alert?")) {
                                  const formData = new FormData();
                                  formData.set("intent", "delete");
                                  formData.set("id", alert.id);
                                  submit(formData, { method: "post" });
                                }
                              }}
                            >
                              Delete
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={pagination.totalPages}
            page={pagination.page}
            onChange={(page) => {
              const params = new URLSearchParams(searchParams);
              params.set("page", page.toString());
              setSearchParams(params);
            }}
            color="danger"
          />
        </div>
      )}
    </div>
  );
}
