'use client';

import { useRef, useState } from 'react';
import { borrowerApi } from '@/lib/borrowerApi';
import { useSubmitError } from '@/lib/formErrors';
import { formatFileSize } from '@/lib/format';
import type { SalarySlipInfo } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { StepNav } from './StepNav';
import { CheckIcon } from '@/components/ui/icons';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const ACCEPT_ATTR = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

/** Quick checks before uploading; the server re-checks the real file type and size. */
function checkFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return 'Upload a PDF, JPG or PNG file.';
  }
  if (file.size > MAX_BYTES) return `This file is ${formatFileSize(file.size)}. The limit is 5 MB.`;
  return null;
}

interface UploadStepProps {
  current: SalarySlipInfo | null;
  onUploaded: (slip: SalarySlipInfo) => void;
  onBack: () => void;
  onContinue: () => void;
}

/** Step 3: salary slip upload with drag-and-drop, progress, and a Replace option. */
export function UploadStep({ current, onUploaded, onBack, onContinue }: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  /** Problem with the chosen file, shown under the drop zone. Other failures go to a toast. */
  const [fileError, setFileError] = useState<string | null>(null);
  const showSubmitError = useSubmitError();
  const [dragging, setDragging] = useState(false);

  const uploading = progress !== null;
  const browse = () => inputRef.current?.click();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setFileError(null);
    const problem = checkFile(file);
    if (problem) {
      setFileError(problem);
      return;
    }
    setProgress(0);
    try {
      const { salarySlip } = await borrowerApi.uploadSalarySlip(file, setProgress);
      onUploaded(salarySlip);
    } catch (err) {
      showSubmitError(err, {
        fields: ['file'],
        setErrors: (errors) => setFileError(errors.file ?? null),
        fallback: 'Upload failed. Please try again.',
      });
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-5">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        aria-label="Salary slip file"
        className="sr-only"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {current && !uploading ? (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-success/30 bg-success/5 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success text-white">
            <CheckIcon />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{current.originalName}</p>
            <p className="text-sm text-muted">{formatFileSize(current.size)} · uploaded</p>
          </div>
          <Button variant="secondary" onClick={browse}>
            Replace
          </Button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={uploading ? -1 : 0}
          aria-disabled={uploading}
          onClick={() => !uploading && browse()}
          onKeyDown={(e) => {
            if (!uploading && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              browse();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!uploading) void handleFile(e.dataTransfer.files[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
            dragging
              ? 'border-primary bg-primary/5'
              : fileError
                ? 'border-danger/60 hover:border-danger'
                : 'border-border hover:border-primary/50'
          }`}
        >
          {uploading ? (
            <div className="w-full max-w-xs space-y-2">
              <p className="text-sm font-medium">Uploading… {progress}%</p>
              <div className="h-2 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <p className="font-medium">Drop your latest salary slip here, or click to browse</p>
              <p className="text-sm text-muted">PDF, JPG or PNG · up to 5 MB</p>
            </>
          )}
        </div>
      )}
      {fileError && (
        <p role="alert" className="-mt-3 px-1 text-xs text-danger">
          {fileError}
        </p>
      )}

      <StepNav
        onPrevious={uploading ? undefined : onBack}
        nextLabel="Next"
        onNext={onContinue}
        nextDisabled={!current || uploading}
      />
    </div>
  );
}
