import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  FileVideo,
  FileAudio,
  FileCode,
  File as FileGeneric,
} from 'lucide-react';

// Maps an uploaded attachment's mimeType to a distinct icon + tint so a
// submission's file list reads at a glance (screenshots vs. docs vs. zips)
// instead of every attachment looking identical.
export function fileVisual(mimeType = '') {
  if (mimeType.startsWith('image/')) return { icon: FileImage, className: 'text-teal-600 bg-teal-50' };
  if (mimeType.startsWith('video/')) return { icon: FileVideo, className: 'text-route-600 bg-route-50' };
  if (mimeType.startsWith('audio/')) return { icon: FileAudio, className: 'text-accent-600 bg-accent-50' };
  if (mimeType === 'application/pdf') return { icon: FileText, className: 'text-danger-600 bg-danger-50' };
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv') || mimeType.includes('excel'))
    return { icon: FileSpreadsheet, className: 'text-success-600 bg-success-50' };
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('tar'))
    return { icon: FileArchive, className: 'text-ink-soft bg-ink-muted/10' };
  if (
    mimeType.includes('json') ||
    mimeType.includes('javascript') ||
    mimeType.includes('xml') ||
    mimeType.includes('html') ||
    mimeType.includes('css')
  )
    return { icon: FileCode, className: 'text-sky-600 bg-sky-50' };
  if (mimeType.startsWith('text/') || mimeType.includes('word') || mimeType.includes('document'))
    return { icon: FileText, className: 'text-route-600 bg-route-50' };
  return { icon: FileGeneric, className: 'text-ink-muted bg-ink-muted/10' };
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
