"use client";

import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import styles from "./FileUploadDropzone.module.scss";

interface FileUploadDropzoneProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  onFilesChange: (files: File[]) => void;
  currentFiles?: File[];
  label?: string;
  hint?: string;
  showPreview?: boolean;
  previewType?: "image" | "document";
  className?: string;
  error?: string;
  onError?: (error: string) => void;
}

const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  accept = "image/*",
  multiple = false,
  maxFiles = 10,
  maxSizeMB = 10,
  onFilesChange,
  currentFiles = [],
  label,
  hint,
  showPreview = true,
  previewType = "image",
  className = "",
  error = "",
  onError,
}) => {
  const { t } = useTranslation("common");
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateFiles = (files: File[]): { valid: File[]; error?: string } => {
    // Check file count
    if (files.length > maxFiles) {
      return {
        valid: [],
        error: t("fileUpload.tooManyFiles", { max: maxFiles }),
      };
    }

    // Check file size
    const oversizedFiles = files.filter((file) => file.size > maxSizeMB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      return {
        valid: [],
        error: t("fileUpload.fileTooLarge", { max: maxSizeMB }),
      };
    }

    // Check file type if accept is specified
    if (accept) {
      const acceptedTypes = accept.split(",").map((type) => type.trim());
      const invalidFiles = files.filter((file) => {
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
        const mimeType = file.type;
        
        return !acceptedTypes.some((acceptType) => {
          if (acceptType.startsWith(".")) {
            return fileExtension === acceptType.toLowerCase();
          }
          if (acceptType.includes("*")) {
            const baseType = acceptType.split("/")[0];
            return mimeType.startsWith(baseType);
          }
          return mimeType === acceptType;
        });
      });

      if (invalidFiles.length > 0) {
        return {
          valid: [],
          error: t("fileUpload.invalidFileType"),
        };
      }
    }

    return { valid: files };
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const { valid, error: validationError } = validateFiles(files);

    if (validationError) {
      if (onError) {
        onError(validationError);
      }
      return;
    }

    onFilesChange(valid);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const { valid, error: validationError } = validateFiles(files);

      if (validationError) {
        if (onError) {
          onError(validationError);
        }
        return;
      }

      onFilesChange(valid);
    }
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    onFilesChange(updatedFiles);
  };

  const inputId = `file-upload-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`${styles.dropzoneContainer} ${className}`}>
      {label && <label className={styles.dropzoneMainLabel}>{label}</label>}
      
      <div
        className={`${styles.uploadArea} ${isDragging ? styles.uploadAreaDragging : ""} ${
          error ? styles.uploadAreaError : ""
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className={styles.uploadInput}
          id={inputId}
        />
        <label htmlFor={inputId} className={styles.uploadLabel}>
          {previewType === "image" ? (
            <svg className={styles.uploadIcon} stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg className={styles.uploadIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          )}
          <p className={styles.uploadText}>
            <span className={styles.uploadTextLink}>{t("fileUpload.clickToUpload")}</span>{" "}
            {t("fileUpload.orDragDrop")}
          </p>
          {hint && <p className={styles.uploadHint}>{hint}</p>}
        </label>
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}

      {showPreview && currentFiles.length > 0 && (
        <div className={styles.previewContainer}>
          <p className={styles.previewTitle}>
            {t("fileUpload.selectedFiles")}: {currentFiles.length}
          </p>
          <div className={styles.previewGrid}>
            {currentFiles.map((file, index) => (
              <div key={index} className={styles.previewItem}>
                {previewType === "image" && file.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className={styles.previewImage}
                  />
                ) : (
                  <div className={styles.previewDocument}>
                    <svg className={styles.documentIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className={styles.documentName}>{file.name}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className={styles.removeButton}
                  title={t("fileUpload.removeFile")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadDropzone;

