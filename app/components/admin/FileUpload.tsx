import { useState, useRef, useCallback } from "react";
import { Card, Button, Spinner, Progress } from "@heroui/react";
import { Upload, X, FileText, Image as ImageIcon, Check } from "lucide-react";

interface FileUploadProps {
  accept: "pdf" | "image" | "both";
  onUpload: (result: { url: string; type: "pdf" | "image" }) => void;
  onRemove?: () => void;
  currentUrl?: string;
  currentType?: "pdf" | "image";
  label?: string;
  description?: string;
  folder?: string;
}

export function FileUpload({
  accept,
  onUpload,
  onRemove,
  currentUrl,
  currentType,
  label,
  description,
  folder = "toolbox-talks",
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = accept === "pdf"
    ? ".pdf"
    : accept === "image"
      ? ".jpg,.jpeg,.png,.gif,.webp"
      : ".pdf,.jpg,.jpeg,.png,.gif,.webp";

  const acceptedMimes = accept === "pdf"
    ? ["application/pdf"]
    : accept === "image"
      ? ["image/jpeg", "image/png", "image/gif", "image/webp"]
      : ["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!acceptedMimes.includes(file.type)) {
      setError(`Invalid file type. Accepted: ${accept === "both" ? "PDF, JPG, PNG" : accept.toUpperCase()}`);
      return;
    }

    // Validate file size (20MB for PDF, 5MB for images)
    const maxSize = file.type === "application/pdf" ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File too large. Max: ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      // Simulate progress (since fetch doesn't support progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setUploadProgress(100);

      onUpload({
        url: data.url,
        type: file.type === "application/pdf" ? "pdf" : "image",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  }, [acceptedMimes, folder, onUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleRemove = () => {
    onRemove?.();
    setError(null);
  };

  // Show current file
  if (currentUrl && !isUploading) {
    return (
      <div className="space-y-2">
        {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
        <Card className="border-2 border-green-200 bg-green-50">
          <div className="flex items-center gap-3 p-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              {currentType === "pdf" ? (
                <FileText size={24} className="text-green-600" />
              ) : (
                <ImageIcon size={24} className="text-green-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {currentType === "pdf" ? "PDF uploaded" : "Image uploaded"}
                </span>
              </div>
              <p className="text-xs text-green-600 truncate">{currentUrl}</p>
            </div>
            {onRemove && (
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                color="danger"
                onPress={handleRemove}
              >
                <X size={16} />
              </Button>
            )}
          </div>
          {currentType === "image" && (
            <div className="px-3 pb-3">
              <img
                src={currentUrl}
                alt="Preview"
                className="h-32 w-full object-cover rounded-lg"
              />
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors
          ${isDragging
            ? "border-primary-500 bg-primary-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }
          ${isUploading ? "pointer-events-none" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="hidden"
        />

        {isUploading ? (
          <div className="space-y-3">
            <Spinner size="lg" color="primary" />
            <p className="text-sm text-gray-600">Uploading...</p>
            <Progress
              value={uploadProgress}
              color="primary"
              size="sm"
              className="max-w-xs mx-auto"
            />
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-2 mb-3">
              {(accept === "pdf" || accept === "both") && (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <FileText size={24} className="text-green-600" />
                </div>
              )}
              {(accept === "image" || accept === "both") && (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <ImageIcon size={24} className="text-blue-600" />
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? "Drop file here" : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {description || (
                accept === "pdf"
                  ? "PDF files up to 20MB"
                  : accept === "image"
                    ? "JPG, PNG, GIF, WebP up to 5MB"
                    : "PDF up to 20MB, Images up to 5MB"
              )}
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
