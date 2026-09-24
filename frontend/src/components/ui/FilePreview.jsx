// FilePreview: in-browser preview for uploads (PDF via iframe, images
// natively) with download fallback for docs/archives.
// Uses authenticated blob requests to ensure tokens never leak in query parameters.
import { useState, useEffect } from 'react';
import { Download, Eye, EyeOff, FileText, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { cn } from '../../system/tokens';

const kindOf = (fileUrl = '') => {
  const ext = String(fileUrl).split('?')[0].split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
};

export function FilePreview({ fileUrl, fileName }) {
  const [open, setOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const kind = kindOf(fileUrl);
  const displayName = fileName || String(fileUrl || '').split('/').pop() || 'file';

  useEffect(() => {
    let active = true;
    let objectUrl = null;

    if (open && fileUrl && kind !== 'other') {
      setLoading(true);
      setError(null);

      api.get(fileUrl, { responseType: 'blob' })
        .then((res) => {
          if (!active) return;
          objectUrl = URL.createObjectURL(res.data);
          setBlobUrl(objectUrl);
        })
        .catch(() => {
          if (!active) return;
          setError('Failed to load preview');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [open, fileUrl, kind]);

  if (!fileUrl) return null;

  const handleDownload = async (e) => {
    if (blobUrl) return; // Native link download handles it
    e.preventDefault();
    try {
      const res = await api.get(fileUrl, { responseType: 'blob' });
      const tempUrl = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = tempUrl;
      a.download = displayName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(tempUrl);
    } catch {
      // fallback
    }
  };

  return (
    <div className="mt-2 rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-surface)]/60 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <FileText size={14} className="shrink-0 text-[var(--cf-ink-mute)]" aria-hidden />
        <span className="truncate text-xs font-medium flex-1">{displayName}</span>
        {kind !== 'other' && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#D86D3E] dark:text-[#F5B08A] hover:underline underline-offset-4"
          >
            {loading ? <Loader2 size={13} className="animate-spin" aria-hidden /> : open ? <EyeOff size={13} aria-hidden /> : <Eye size={13} aria-hidden />}
            {open ? 'Hide' : 'Preview'}
          </button>
        )}
        <a
          href={blobUrl || fileUrl}
          download={displayName}
          onClick={handleDownload}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)]"
        >
          <Download size={13} aria-hidden /> Save
        </a>
      </div>
      {open && (
        <div className="border-t border-[var(--cf-line)]">
          {loading && (
            <div className="flex items-center justify-center py-8 text-xs text-[var(--cf-ink-mute)]">
              <Loader2 size={16} className="animate-spin mr-2" /> Loading preview...
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center py-8 text-xs text-rose-500">
              {error}
            </div>
          )}
          {!loading && !error && blobUrl && kind === 'image' && (
            <img src={blobUrl} alt={displayName} className="w-full max-h-96 object-contain bg-black/[0.03] dark:bg-white/[0.03]" loading="lazy" />
          )}
          {!loading && !error && blobUrl && kind === 'pdf' && (
            <iframe src={blobUrl} title={displayName} className={cn('w-full h-96 bg-white')} loading="lazy" />
          )}
        </div>
      )}
    </div>
  );
}

export default FilePreview;
