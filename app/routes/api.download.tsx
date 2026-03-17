/**
 * File Download Proxy
 * Serves files with proper Content-Disposition headers so the browser
 * triggers a real download instead of navigating or displaying inline.
 *
 * Usage: /api/download?url=<file-url>&name=<filename>
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const reqUrl = new URL(request.url);
  const fileUrl = reqUrl.searchParams.get("url");
  const fileName = reqUrl.searchParams.get("name") || "document.pdf";

  if (!fileUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  const isCloudinary = fileUrl.startsWith("https://res.cloudinary.com/");
  const isLocalUpload = fileUrl.startsWith("/uploads/");

  if (!isCloudinary && !isLocalUpload) {
    return new Response("Invalid file URL", { status: 403 });
  }

  try {
    let body: ArrayBuffer;
    let contentType = "application/octet-stream";

    if (isLocalUpload) {
      // Read directly from the public directory
      const filePath = path.join(process.cwd(), "public", fileUrl);
      const realPath = path.resolve(filePath);

      // Prevent path traversal
      if (!realPath.startsWith(path.resolve(process.cwd(), "public", "uploads"))) {
        return new Response("Invalid file path", { status: 403 });
      }

      if (!fs.existsSync(realPath)) {
        return new Response("File not found", { status: 404 });
      }

      const buffer = fs.readFileSync(realPath);
      body = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

      // Determine content type from extension
      if (fileName.endsWith(".pdf")) contentType = "application/pdf";
      else if (fileName.endsWith(".csv")) contentType = "text/csv";
      else if (fileName.endsWith(".xlsx"))
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else {
      // Fetch from Cloudinary
      const response = await fetch(fileUrl);
      if (!response.ok) {
        return new Response("File not found", { status: 404 });
      }
      contentType = response.headers.get("content-type") || contentType;
      body = await response.arrayBuffer();
    }

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(body.byteLength),
      },
    });
  } catch {
    return new Response("Download failed", { status: 500 });
  }
}
