/**
 * File Upload API Route
 * Task: 1.1.4.3.3
 * Supports image and PDF uploads to Cloudinary
 */

import type { ActionFunctionArgs } from "react-router";
import { uploadImage, uploadPdf } from "~/lib/services/upload.server";
import { requireAuth } from "~/lib/services/session.server";

export async function action({ request }: ActionFunctionArgs) {
  await requireAuth(request);

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || (formData.get("subdir") as string) || "uploads";

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    let result;
    let fileType: "image" | "pdf";

    // Handle PDF uploads
    if (file.type === "application/pdf") {
      result = await uploadPdf(file, folder);
      fileType = "pdf";
    }
    // Handle image uploads
    else if (file.type.startsWith("image/")) {
      result = await uploadImage(file, folder);
      fileType = "image";
    }
    // Unsupported type
    else {
      return Response.json(
        { error: "Invalid file type. Only PDF and images are allowed." },
        { status: 400 }
      );
    }

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ url: result.url, type: fileType });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
