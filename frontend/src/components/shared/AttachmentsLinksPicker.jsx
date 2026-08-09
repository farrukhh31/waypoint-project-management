import { useRef, useState } from 'react';
import { Paperclip, Link2, X, Loader2, UploadCloud } from 'lucide-react';
import api from '../../lib/api';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { fileVisual, formatFileSize } from '../../utils/fileIcon';

// Lets a submission (or a comment) carry structured deliverables — actual
// uploaded files, plus links to things that live elsewhere (a repo, a
// staging URL, a Drive folder). Both are genuinely multi: pick/drop as many
// files as needed across as many selections as needed, and add as many
// links as needed — nothing here caps it below the backend's own 10-files-
// per-request ceiling. Files are uploaded immediately on selection via
// POST /api/uploads; the parent only ever holds back the resulting
// { name, url, size, mimeType } metadata, same shape the backend stores on
// the discussion entry.
export default function AttachmentsLinksPicker({ attachments, onAttachmentsChange, links, onLinksChange }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [linkDraft, setLinkDraft] = useState({ label: '', url: '' });
  const [error, setError] = useState('');

  async function uploadFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const { data } = await api.post('/uploads', formData);
      onAttachmentsChange([...attachments, ...data.data.files]);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload one or more files.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removeAttachment(index) {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  }

  function addLink() {
    if (!linkDraft.url.trim()) return;
    let url = linkDraft.url.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    onLinksChange([...links, { label: linkDraft.label.trim() || url, url }]);
    setLinkDraft({ label: '', url: '' });
  }

  function removeLink(index) {
    onLinksChange(links.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Uploaded files */}
      {attachments.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {attachments.map((a, i) => {
            const { icon: Icon, className } = fileVisual(a.mimeType);
            return (
              <li
                key={`${a.url}-${i}`}
                className="flex items-center gap-2.5 rounded-lg border border-line bg-paper px-2.5 py-2 text-xs"
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${className}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-ink-soft">{a.name}</span>
                {a.size != null && <span className="shrink-0 text-ink-muted">{formatFileSize(a.size)}</span>}
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="shrink-0 rounded p-0.5 text-ink-muted hover:bg-line/60 hover:text-danger-600"
                  aria-label={`Remove ${a.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Links */}
      {links.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {links.map((l, i) => (
            <li
              key={`${l.url}-${i}`}
              className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50/50 px-2.5 py-1.5 text-xs"
            >
              <Link2 className="h-3.5 w-3.5 shrink-0 text-sky-600" />
              <span className="min-w-0 flex-1 truncate text-sky-700">{l.label}</span>
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="shrink-0 rounded p-0.5 text-ink-muted hover:bg-line/60 hover:text-danger-600"
                aria-label={`Remove ${l.label}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add a link — label on its own row, URL + button share a row (with
          min-w-0 on the URL field so it actually shrinks instead of
          pushing the button off-screen and forcing horizontal scroll). */}
      <div className="flex flex-col gap-1.5">
        <Input
          value={linkDraft.label}
          onChange={(e) => setLinkDraft({ ...linkDraft, label: e.target.value })}
          placeholder="Label (optional)"
          className="!h-9 w-full text-xs"
        />
        <div className="flex items-center gap-1.5">
          <Input
            value={linkDraft.url}
            onChange={(e) => setLinkDraft({ ...linkDraft, url: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLink();
              }
            }}
            placeholder="https://…  (repo, drive, staging link)"
            className="!h-9 min-w-0 flex-1 text-xs"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={addLink}
            disabled={!linkDraft.url.trim()}
            className="shrink-0"
          >
            <Link2 className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </div>

      {/* Add files — click or drag-and-drop, any number of files/selections */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          uploadFiles(e.dataTransfer.files);
        }}
        className={`flex items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2.5 transition-colors ${
          dragOver ? 'border-route-400 bg-route-50/60' : 'border-line bg-paper/60'
        }`}
      >
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
        <div className="flex min-w-0 items-center gap-2 text-xs text-ink-muted">
          <UploadCloud className="h-4 w-4 shrink-0" />
          <span className="truncate">Drag files here, or</span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
          {uploading ? 'Uploading…' : 'Browse files'}
        </Button>
      </div>
      <span className="-mt-1.5 text-[11px] text-ink-muted">Up to 25MB each — attach as many files and links as you need.</span>

      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}