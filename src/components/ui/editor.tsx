"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState, useEffect } from "react";
import "react-quill-new/dist/quill.snow.css";
import { uploadFiles } from "@/lib/uploadthing";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditorProps {
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  className?: string;
}

export const Editor = ({
  onChange,
  value,
  disabled,
  placeholder,
  minRows,
  maxRows,
  className,
}: EditorProps) => {
  const quillRef = useRef<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // [SỬA] Import từ "react-quill-new" thay vì "react-quill"
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill-new"), { ssr: false }) as any,
    []
  );

  // Thêm style cho toolbar sticky và editor scrollable
  useEffect(() => {
    const styleId = "quill-editor-sticky-toolbar";
    // Kiểm tra xem style đã tồn tại chưa để tránh duplicate
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .ql-container {
        max-height: 400px;
        overflow-y: auto;
      }
      .ql-toolbar {
        position: sticky !important;
        top: 0 !important;
        z-index: 10 !important;
        background: white !important;
        border-bottom: 1px solid #e5e7eb !important;
      }
      .dark .ql-toolbar {
        background: #171717 !important;
        border-bottom-color: #404040 !important;
      }
      .ql-editor {
        min-height: 200px;
        max-height: 400px;
      }
    `;
    document.head.appendChild(style);
    // Không cleanup style vì nó là global style cho tất cả Editor
  }, []);

  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      try {
        setIsUploading(true);
        const res = await uploadFiles("imageUploader", {
          files: [file],
        });

        if (res && res.length > 0) {
          const url = res[0].ufsUrl || res[0].url;
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection();
          quill.insertEmbed(range.index, "image", url);
        }
      } catch (error: any) {
        toast.error(`Image upload failed: ${error.message}`);
      } finally {
        setIsUploading(false);
      }
    };
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          [{ color: [] }, { background: [] }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    }),
    []
  );

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 relative">
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-white/50 dark:bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-medium text-primary">
              Uploading image...
            </span>
          </div>
        </div>
      )}
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        readOnly={disabled || isUploading}
        placeholder={placeholder}
        minRows={minRows}
        maxRows={maxRows}
        className="editor-wrapper"
      />
    </div>
  );
};
