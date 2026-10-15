import React, { useRef, useState } from 'react';

interface ImageUploaderProps {
  selectedFiles: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  selectedFiles,
  onFilesChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateAndAddFiles = (newFiles: FileList | File[]) => {
    setValidationError(null);
    const valid: File[] = [];
    let errorMsg: string | null = null;

    Array.from(newFiles).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        errorMsg = `File "${file.name}" is not a supported format (PNG, JPEG, WEBP allowed).`;
      } else if (file.size > MAX_SIZE_BYTES) {
        errorMsg = `File "${file.name}" exceeds the 10 MB size limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
      } else {
        valid.push(file);
      }
    });

    if (errorMsg) {
      setValidationError(errorMsg);
    }

    if (valid.length > 0) {
      // Avoid duplicate filenames
      const existingNames = new Set(selectedFiles.map((f) => f.name));
      const filtered = valid.filter((f) => !existingNames.has(f.name));
      onFilesChange([...selectedFiles, ...filtered]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  return (
    <div className="uploader-container">
      <div
        className={`dropzone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload property listing images"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png, image/jpeg, image/jpg, image/webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        <div className="dropzone-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </div>
        <div className="dropzone-text">
          <strong>Drag & drop property listing images</strong> or <span className="browse-link">browse files</span>
        </div>
        <div className="dropzone-hint">PNG, JPEG, or WEBP • Up to 10 MB per file</div>
      </div>

      {validationError && (
        <div className="validation-error">
          {validationError}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="thumbnails-grid">
          <div className="thumbnails-header">
            <span>Selected Images ({selectedFiles.length})</span>
            <button
              className="btn-text"
              onClick={() => onFilesChange([])}
              disabled={disabled}
            >
              Clear all
            </button>
          </div>
          <div className="thumbnails-wrapper">
            {selectedFiles.map((file, idx) => {
              const previewUrl = URL.createObjectURL(file);
              return (
                <div className="thumbnail-card" key={`${file.name}-${idx}`}>
                  <img src={previewUrl} alt={file.name} className="thumbnail-img" />
                  <div className="thumbnail-info">
                    <span className="thumbnail-name" title={file.name}>
                      {file.name}
                    </span>
                    <span className="thumbnail-size">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  {!disabled && (
                    <button
                      className="btn-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      title="Remove file"
                      aria-label={`Remove ${file.name}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
