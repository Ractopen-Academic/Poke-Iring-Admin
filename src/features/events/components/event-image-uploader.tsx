"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EventImageUploaderProps {
  id: string;
  kind: "logo" | "banner";
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
}

const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function EventImageUploader({
  id,
  kind,
  label,
  hint,
  value,
  onChange,
}: EventImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const maxBytes = kind === "banner" ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
  const maxLabel = kind === "banner" ? "5 MB" : "2 MB";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadError(null);

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setUploadError("Only PNG, JPG, and WebP images are supported.");
      return;
    }

    if (file.size > maxBytes) {
      setUploadError(`Image exceeds maximum ${maxLabel} limit.`);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("kind", kind);
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.url) {
        setUploadError(payload.error || "Upload failed.");
        return;
      }

      onChange(payload.url);
    } catch {
      setUploadError("Network error while uploading image.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label htmlFor={id} className="text-xs font-medium text-neutral-200">
            {label}
          </Label>
          <p className="text-[11px] text-neutral-500">{hint}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="h-7 gap-1.5 px-2.5 text-xs"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange("")}
              className="h-7 w-7 text-neutral-400 hover:text-red-400"
              title="Clear image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {value && (
        <div
          className={
            kind === "banner"
              ? "relative h-24 w-full overflow-hidden rounded-md border border-neutral-800 bg-neutral-900"
              : "flex items-center gap-3 pt-1"
          }
        >
          {kind === "banner" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Event banner preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Event logo preview"
                className="h-11 w-11 rounded-lg border border-neutral-800 bg-neutral-900 object-cover"
              />
              <span className="text-[11px] text-neutral-400">
                Logo badge preview
              </span>
            </div>
          )}
        </div>
      )}

      <Input
        id={id}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste https:// image URL..."
        className="h-8 text-xs font-mono"
      />

      {uploadError && (
        <p className="text-[11px] text-red-400">{uploadError}</p>
      )}
    </div>
  );
}
