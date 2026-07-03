/**
 * Document upload form for landlord/agent verification.
 *
 * Uploads both files to Storage, then writes the verificationRequests doc.
 * Calls `onSubmitted` so the parent can refetch the request status.
 */
import { type FormEvent, useState } from 'react';
import { FileText, Loader2, Upload } from 'lucide-react';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
import {
  MAX_DOC_BYTES,
  submitVerificationRequest,
  uploadVerificationDoc,
  VerificationDocError,
} from './api';
import type { AppUser } from '@/types/user';

interface Props {
  user: AppUser;
  /** Optional context shown above the form (e.g. a rejection reason). */
  onSubmitted: () => void;
}

const ACCEPT = 'image/png,image/jpeg,image/webp,application/pdf';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** A single labelled file picker. */
function FilePicker({
  label,
  hint,
  file,
  onPick,
}: {
  label: string;
  hint: string;
  file: File | null;
  onPick: (f: File | null) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-text">{label}</p>
      <p className="mt-0.5 text-xs text-text-muted">{hint}</p>
      <label
        className={clsx(
          'mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors',
          file
            ? 'border-verified bg-verified/5'
            : 'border-border bg-bg hover:border-primary hover:bg-primary/5',
        )}
      >
        {file ? (
          <FileText className="h-5 w-5 shrink-0 text-verified" />
        ) : (
          <Upload className="h-5 w-5 shrink-0 text-text-muted" />
        )}
        <span className="min-w-0 flex-1 truncate text-sm">
          {file ? (
            <>
              <span className="font-medium text-text">{file.name}</span>
              <span className="ml-2 text-text-muted">{formatBytes(file.size)}</span>
            </>
          ) : (
            <span className="text-text-muted">Tap to choose a file (image or PDF)</span>
          )}
        </span>
        <input
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}

export default function VerificationForm({ user, onSubmitted }: Props) {
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [propertyDoc, setPropertyDoc] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!idDoc) return 'Please add your government ID document.';
    if (!propertyDoc) return 'Please add a property ownership or management document.';
    for (const f of [idDoc, propertyDoc]) {
      if (f.size > MAX_DOC_BYTES) {
        return `"${f.name}" is too large. Each file must be under 10 MB.`;
      }
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const [idDocUrl, propertyDocUrl] = await Promise.all([
        uploadVerificationDoc(user.uid, 'id', idDoc!),
        uploadVerificationDoc(user.uid, 'property', propertyDoc!),
      ]);
      await submitVerificationRequest({
        uploaderId: user.uid,
        displayName: user.displayName,
        role: user.role === 'agent' ? 'agent' : 'landlord', // VerifyPage blocks non-landlord/agent roles upstream
        idDocUrl,
        propertyDocUrl,
        note: note.trim() || undefined,
      });
      onSubmitted();
    } catch (err) {
      console.error('[VerificationForm] submit failed', err);
      setError(
        err instanceof VerificationDocError
          ? err.message
          : 'Upload failed. Check your connection and try again.',
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FilePicker
        label="Government ID"
        hint="National ID card, passport, or driver's licence — clear photo or scan."
        file={idDoc}
        onPick={setIdDoc}
      />
      <FilePicker
        label="Property document"
        hint="Land title, rental agreement, or a letter authorising you to manage the property."
        file={propertyDoc}
        onPick={setPropertyDoc}
      />

      <div>
        <label htmlFor="verify-note" className="text-sm font-semibold text-text">
          Note for the reviewer <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <textarea
          id="verify-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Anything that helps us verify you faster…"
          className="mt-2 w-full resize-none rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-700">{error}</p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={submitting}
        leftIcon={submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : undefined}
      >
        {submitting ? 'Uploading documents…' : 'Submit for verification'}
      </Button>
      <p className="text-center text-2xs text-text-subtle">
        Your documents are private — only the HostelHub admin team can view them.
      </p>
    </form>
  );
}
