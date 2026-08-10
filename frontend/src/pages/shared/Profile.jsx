import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Copy,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  ShieldCheck,
  CalendarDays,
  UserCog,
  BadgeCheck,
  Briefcase,
  ImagePlus,
  Loader2,
  X as XIcon,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS, ROLES } from '../../config/roles';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Input, { Field, Textarea } from '../../components/ui/Input.jsx';
import PasswordInput from '../../components/ui/PasswordInput.jsx';
import Button from '../../components/ui/Button.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import InlineMessage from '../../components/ui/InlineMessage.jsx';
import EmailResetCard from '../../components/security/EmailResetCard.jsx';
import TwoFactorCard from '../../components/security/TwoFactorCard.jsx';
import { formatDate } from '../../utils/formatDate';

const ROLE_TONE = {
  [ROLES.ADMIN]: { accent: 'danger', badge: 'bg-danger-50 text-danger-600' },
  [ROLES.PROJECT_MANAGER]: { accent: 'route', badge: 'bg-route-100 text-route-700' },
  [ROLES.TEAM_MEMBER]: { accent: 'teal', badge: 'bg-teal-50 text-teal-700' },
};

const BIO_MAX = 280;

// Prefixes a bare "linkedin.com/in/x" with https:// so it's a working link —
// people rarely type the protocol when filling in a form field like this.
function toHref(url) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// Small floating card anchored to the avatar for picking a photo from disk —
// kept as an inline popover rather than a full Modal so editing a photo
// feels like a one-click, in-place action instead of a context switch.
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function AvatarEditPopover({ currentUrl, onClose, onUpload, onRemove, saving }) {
  const ref = useRef(null);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [onClose]);

  function handleFile(file) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please choose a JPG, PNG, WEBP, or GIF image.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Image must be 5MB or smaller.');
      return;
    }
    setError(null);
    onUpload(file);
  }

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-30 mt-3 w-72 max-w-[85vw] rounded-xl border border-line bg-surface p-4 shadow-pop animate-[fade-in-up_0.15s_ease-out]"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Update photo</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-ink-muted hover:bg-paper hover:text-ink"
          aria-label="Close"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = ''; // lets the same file be picked again later
        }}
      />

      <button
        type="button"
        disabled={saving}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={
          'flex w-full flex-col items-center gap-1.5 rounded-lg border-2 border-dashed px-3 py-5 text-center transition-colors ' +
          (dragOver ? 'border-route-500 bg-route-50' : 'border-line hover:border-route-300 hover:bg-paper')
        }
      >
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin text-route-500" />
        ) : (
          <ImagePlus className="h-5 w-5 text-ink-muted" />
        )}
        <span className="text-xs font-medium text-ink">{saving ? 'Uploading…' : 'Choose a file or drag it here'}</span>
        <span className="text-[11px] text-ink-muted">JPG, PNG, WEBP or GIF — up to 5MB</span>
      </button>

      {error && <p className="mt-2 text-xs text-danger-600">{error}</p>}

      {currentUrl && (
        <Button variant="ghost" size="sm" onClick={onRemove} loading={saving} className="mt-3 w-full">
          Remove photo
        </Button>
      )}
    </div>
  );
}

// One row in the "contact info" summary — shows the value with an icon when
// set, or a muted "Not added yet" placeholder so the layout doesn't jump
// around depending on which fields a person has filled in.
function ContactRow({ icon: Icon, label, value, href }) {
  const content = value ? (
    href ? (
      <a href={href} target="_blank" rel="noreferrer" className="truncate text-ink hover:text-route-600 hover:underline">
        {value}
      </a>
    ) : (
      <span className="truncate text-ink">{value}</span>
    )
  ) : (
    <span className="truncate text-ink-muted">Not added yet</span>
  );

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-line bg-paper/50 px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-ink-muted" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</p>
        <div className="text-sm">{content}</div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, refreshMe } = useAuth();
  const tone = ROLE_TONE[user.role] || ROLE_TONE[ROLES.TEAM_MEMBER];

  const [tab, setTab] = useState('overview');

  const initialForm = {
    name: user.name || '',
    email: user.email || '',
    currentPassword: '',
    jobTitle: user.jobTitle || '',
    phone: user.phone || '',
    location: user.location || '',
    linkedinUrl: user.linkedinUrl || '',
    bio: user.bio || '',
  };
  const [form, setForm] = useState(initialForm);
  // Snapshot of the last-saved (or initially-loaded) form values. Compared
  // against `form` below to gate the Save button — kept in a ref rather
  // than state since updating it should never itself trigger a re-render.
  const savedFormRef = useRef(initialForm);
  const emailChanged = form.email.trim().toLowerCase() !== user.email.toLowerCase();
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedFormRef.current),
    [form]
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  const [avatarPopoverOpen, setAvatarPopoverOpen] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  const [emailCopied, setEmailCopied] = useState(false);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const payload = { ...form };
      if (!emailChanged) {
        delete payload.email;
        delete payload.currentPassword;
      }
      await api.patch('/users/me/profile', payload);
      await refreshMe();
      setForm((f) => {
        const next = { ...f, currentPassword: '' };
        savedFormRef.current = next;
        return next;
      });
      setProfileMessage({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.response?.data?.message || 'Could not update profile.' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAvatarUpload(file) {
    setSavingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await api.post('/users/me/avatar', formData);
      await refreshMe();
      setAvatarPopoverOpen(false);
    } catch {
      // Popover stays open so the person can see the error and retry.
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handleAvatarRemove() {
    setSavingAvatar(true);
    try {
      await api.delete('/users/me/avatar');
      await refreshMe();
      setAvatarPopoverOpen(false);
    } catch {
      // Popover stays open so the person can retry.
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordMessage(null);
    try {
      await api.patch('/users/me/password', passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      setPasswordMessage({ type: 'success', text: 'Password changed.' });
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.message || 'Could not change password.' });
    } finally {
      setSavingPassword(false);
    }
  }

  function copyEmail() {
    navigator.clipboard?.writeText(user.email).then(() => {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 1600);
    });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Hero */}
      <Card>
        <div className="relative h-16 overflow-hidden rounded-t-lg bg-gradient-to-r from-route-600 via-route-500 to-accent-400">
          <div className="animate-glow-pulse absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="absolute -left-8 -bottom-10 h-24 w-24 rounded-full bg-accent-200/20 blur-2xl" aria-hidden="true" />
        </div>

        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative w-fit shrink-0">
              <Avatar
                name={user.name}
                src={user.avatarUrl}
                size="lg"
                className="h-20 w-20 text-xl ring-4 ring-surface shadow-pop"
              />
              <button
                type="button"
                onClick={() => setAvatarPopoverOpen((o) => !o)}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-route-500 text-white shadow-pop ring-2 ring-surface transition-transform hover:scale-105 hover:bg-route-600"
                aria-label="Change photo"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              {avatarPopoverOpen && (
                <AvatarEditPopover
                  currentUrl={user.avatarUrl}
                  saving={savingAvatar}
                  onClose={() => setAvatarPopoverOpen(false)}
                  onUpload={handleAvatarUpload}
                  onRemove={handleAvatarRemove}
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-lg font-semibold text-ink">{user.name}</p>
                <span className={'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ' + tone.badge}>
                  <BadgeCheck className="h-3 w-3" /> {ROLE_LABELS[user.role]}
                </span>
              </div>
              {user.jobTitle && <p className="mt-0.5 text-sm text-ink-muted">{user.jobTitle}</p>}
              <button
                type="button"
                onClick={copyEmail}
                className="group mt-1.5 flex items-center gap-1.5 text-sm text-ink-muted hover:text-route-600"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
                {emailCopied ? (
                  <Check className="h-3 w-3 shrink-0 text-success-500" />
                ) : (
                  <Copy className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </button>
              {user.bio && <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">{user.bio}</p>}
            </div>
          </div>

          {/* Contact info */}
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <ContactRow icon={Phone} label="Phone" value={user.phone} />
            <ContactRow icon={MapPin} label="Location" value={user.location} />
            <ContactRow icon={Linkedin} label="LinkedIn" value={user.linkedinUrl} href={toHref(user.linkedinUrl)} />
          </div>

          {/* Quick stats */}
          <div className="mt-2.5 grid grid-cols-2 gap-3 pt-3 sm:grid-cols-3">
            <StatCard label="Role" value={ROLE_LABELS[user.role]} icon={ShieldCheck} accent={tone.accent} />
            <StatCard label="Member since" value={formatDate(user.createdAt)} icon={CalendarDays} accent="sky" />
            {user.role === ROLES.PROJECT_MANAGER ? (
              <StatCard
                label="Invite permission"
                value={user.canInviteMembers ? 'Granted' : 'Not granted'}
                icon={UserCog}
                accent={user.canInviteMembers ? 'success' : 'accent'}
              />
            ) : (
              <StatCard
                label="Account status"
                value={user.isActive ? 'Active' : 'Inactive'}
                icon={UserCog}
                accent={user.isActive ? 'success' : 'danger'}
              />
            )}
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-full border border-line bg-surface p-1 shadow-card">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'security', label: 'Security' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors ' +
              (tab === t.id ? 'bg-route-500 text-white shadow-sm' : 'text-ink-soft hover:bg-paper')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <Card className="card-sheen animate-[fade-in-up_0.2s_ease-out]">
          <CardBody>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-route-100 text-route-600">
                <UserCog className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-ink">Edit profile</h3>
                <p className="text-xs text-ink-muted">This appears across every project you're on.</p>
              </div>
            </div>
            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="name">
                  <Input id="name" value={form.name} onChange={(e) => setField('name', e.target.value)} />
                </Field>
                <Field label="Email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    icon={Mail}
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                  />
                </Field>
                {emailChanged && (
                  <div className="sm:col-span-2">
                    <Field label="Current password (to confirm your new email)" htmlFor="currentPassword">
                      <PasswordInput
                        id="currentPassword"
                        autoComplete="current-password"
                        value={form.currentPassword}
                        onChange={(e) => setField('currentPassword', e.target.value)}
                      />
                    </Field>
                  </div>
                )}
                <Field label="Job title" htmlFor="jobTitle">
                  <Input
                    id="jobTitle"
                    icon={Briefcase}
                    placeholder="e.g. Senior Product Designer"
                    value={form.jobTitle}
                    onChange={(e) => setField('jobTitle', e.target.value)}
                  />
                </Field>
                <Field label="Phone" htmlFor="phone">
                  <Input
                    id="phone"
                    type="tel"
                    icon={Phone}
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                  />
                </Field>
                <Field label="Location" htmlFor="location">
                  <Input
                    id="location"
                    icon={MapPin}
                    placeholder="e.g. Karachi, Pakistan"
                    value={form.location}
                    onChange={(e) => setField('location', e.target.value)}
                  />
                </Field>
                <Field label="LinkedIn" htmlFor="linkedinUrl">
                  <Input
                    id="linkedinUrl"
                    icon={Linkedin}
                    placeholder="linkedin.com/in/yourname"
                    value={form.linkedinUrl}
                    onChange={(e) => setField('linkedinUrl', e.target.value)}
                  />
                </Field>
              </div>
              <Field label={`Bio (${form.bio.length}/${BIO_MAX})`} htmlFor="bio">
                <Textarea
                  id="bio"
                  rows={3}
                  maxLength={BIO_MAX}
                  placeholder="A short line about what you work on."
                  value={form.bio}
                  onChange={(e) => setField('bio', e.target.value)}
                />
              </Field>
              <InlineMessage message={profileMessage} />
              <div className="flex items-center gap-3">
                <Button type="submit" className="w-fit" loading={savingProfile} disabled={!hasUnsavedChanges}>
                  Save changes
                </Button>
                {!hasUnsavedChanges && !savingProfile && (
                  <span className="text-xs text-ink-muted">No changes to save yet</span>
                )}
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {tab === 'security' && (
        <Card className="card-sheen animate-[fade-in-up_0.2s_ease-out]">
          <CardBody>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-50 text-danger-600">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-ink">Change password</h3>
                <p className="text-xs text-ink-muted">Use something you don't use anywhere else.</p>
              </div>
            </div>
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <Field label="Current password" htmlFor="currentPassword">
                <PasswordInput
                  autoComplete="current-password"
                  required
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                />
              </Field>
              <Field label="New password" htmlFor="newPassword">
                <PasswordInput
                  autoComplete="new-password"
                  required
                  minLength={8}
                  showStrength
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                />
              </Field>
              <InlineMessage message={passwordMessage} />
              <Button type="submit" className="w-fit" loading={savingPassword}>
                Update password
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {tab === 'security' && <EmailResetCard />}
      {tab === 'security' && <TwoFactorCard user={user} onChange={refreshMe} />}
    </div>
  );
}
