import { Link2, Download, ExternalLink } from 'lucide-react';
import { fileVisual, formatFileSize } from '../../utils/fileIcon';

// Renders the files/links carried by a discussion entry (a submission, a
// review decision, or a regular comment). Nothing renders if the entry has
// neither — most comments won't. Files render as a small icon+name+size
// grid (type-aware icon/tint), links as a distinct chip row.
export default function DiscussionAttachments({ attachments = [], links = [] }) {
  if (attachments.length === 0 && links.length === 0) return null;

  return (
    <div className="mt-2.5 flex flex-col gap-2">
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {attachments.map((a, i) => {
            const { icon: Icon, className } = fileVisual(a.mimeType);
            return (
              <a
                key={`${a.url}-${i}`}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                download={a.name}
                className="group/file flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-route-200 hover:shadow-card"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${className}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink-soft group-hover/file:text-route-700">
                    {a.name}
                  </span>
                  {a.size != null && <span className="block text-[11px] text-ink-muted">{formatFileSize(a.size)}</span>}
                </span>
                <Download className="h-3.5 w-3.5 shrink-0 text-ink-muted transition-colors group-hover/file:text-route-600" />
              </a>
            );
          })}
        </div>
      )}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {links.map((l, i) => (
            <a
              key={`${l.url}-${i}`}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="group/link inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50/60 px-3 py-1.5 text-xs font-medium text-sky-700 transition-all duration-150 hover:-translate-y-0.5 hover:bg-sky-100 hover:shadow-card"
            >
              <Link2 className="h-3.5 w-3.5 shrink-0" />
              <span className="max-w-[220px] truncate">{l.label}</span>
              <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover/link:opacity-100" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
