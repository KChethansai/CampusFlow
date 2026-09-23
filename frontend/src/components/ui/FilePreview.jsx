// FilePreview: in-browser preview for uploads (PDF via iframe, images
// natively) with download fallback for docs/archives. Works for local
// /uploads/* paths and absolute Cloudinary URLs alike.
import { useState } from 'react';
import { Download, Eye, EyeOff, FileText } from 'lucide-react';
import api from '../../api/axios';
import { cn } from '../../system/tokens';

const fullUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (/^https?:\/\//.test(fileUrl)) return fileUrl; // Cloudinary/CDN URL
  const base = (api.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');
  return `${base}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
};

const kindOf = (fileUrl = '') => {
  const ext = String(fileUrl).split('?')[0].split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
};

export function FilePreview({ fileUrl, fileName }) {
  const [open, setOpen] = useState(false);
  if (!fileUrl) return null;
  const url = fullUrl(fileUrl);
  const kind = kindOf(fileUrl);
  return (
    <div className="mt-2 rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-surface)]/60 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <FileText size={14} className="shrink-0 text-[var(--cf-ink-mute)]" aria-hidden />
        <span className="truncate text-xs font-medium flex-1">{fileName || String(fileUrl).split('/').pop()}</span>
        {kind !== 'other' && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#D86D3E] dark:text-[#F5B08A] hover:underline underline-offset-4"
          >
            {open ? <EyeOff size={13} aria-hidden /> : <Eye size={13} aria-hidden />}
            {open ? 'Hide' : 'Preview'}
          </button>
        )}
        <a
          href={url}
          download
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)]"
        >
          <Download size={13} aria-hidden /> Save
        </a>
      </div>
      {open && kind === 'image' && (
        <img src={url} alt={fileName || 'Submission attachment'} className="w-full max-h-96 object-contain bg-black/[0.03] dark:bg-white/[0.03]" loading="lazy" />
      )}
      {open && kind === 'pdf' && (
        <iframe src={url} title={fileName || 'PDF preview'} className={cn('w-full h-96 bg-white')} loading="lazy" />
      )}
    </div>
  );
}

export default FilePreview;
