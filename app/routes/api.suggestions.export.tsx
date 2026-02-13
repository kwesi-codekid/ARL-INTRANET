/**
 * Suggestion Export API Route
 * Exports suggestion data as CSV or Excel
 */

import type { LoaderFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/services/session.server";
import {
  getSuggestionsForExport,
  type ReportFilters,
} from "~/lib/services/suggestion-report.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);

  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "csv";

  // Parse date range
  const range = url.searchParams.get("range") || "30";
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  if (range === "custom") {
    const startParam = url.searchParams.get("start");
    const endParam = url.searchParams.get("end");
    startDate = startParam ? new Date(startParam) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    endDate = endParam ? new Date(endParam) : now;
  } else {
    const days = parseInt(range) || 30;
    startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  const filters: ReportFilters = {
    startDate,
    endDate,
    category: url.searchParams.get("category") || undefined,
    status: url.searchParams.get("status") || undefined,
  };

  const data = await getSuggestionsForExport(filters);

  const headers = [
    "Date",
    "Category",
    "Status",
    "Content",
    "Admin Notes",
    "Reviewed By",
    "Reviewed At",
  ];

  if (format === "xlsx") {
    const XLSX = await import("xlsx");
    const rows = data.map((row) => [
      row.date,
      row.category,
      row.status,
      row.content,
      row.adminNotes,
      row.reviewedBy,
      row.reviewedAt,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Set column widths
    ws["!cols"] = [
      { wch: 12 },
      { wch: 18 },
      { wch: 14 },
      { wch: 60 },
      { wch: 40 },
      { wch: 18 },
      { wch: 12 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Suggestions");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=suggestions-report-${startDate.toISOString().split("T")[0]}.xlsx`,
      },
    });
  }

  // CSV format
  const escapeCSV = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      [
        row.date,
        row.category,
        row.status,
        escapeCSV(row.content),
        escapeCSV(row.adminNotes),
        row.reviewedBy,
        row.reviewedAt,
      ].join(","),
    ),
  ];

  return new Response(csvRows.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=suggestions-report-${startDate.toISOString().split("T")[0]}.csv`,
    },
  });
}
