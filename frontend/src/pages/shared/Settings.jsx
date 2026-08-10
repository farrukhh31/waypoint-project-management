import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Palette,
  BellRing,
  Mail,
  ShieldCheck,
  UserCog,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  PanelLeftClose,
  MonitorSmartphone,
  LogOut,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useSidebarPrefs } from '../../hooks/useSidebarPrefs';
import { ROLE_HOME, ROLE_LABELS } from '../../config/roles';
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_META } from '../../config/notificationTypes';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Switch from '../../components/ui/Switch.jsx';
import InlineMessage from '../../components/ui/InlineMessage.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';

// A section wrapper shared by every settings block below — icon chip +
// title/description on the left, whatever controls the section needs
// on the right. Keeps Appearance/Notifications/Account visually consistent
// without each one re-declaring the same header markup.
function SettingsSection({ icon: Icon, iconClassName, title, description, children }) {
  return (
    <Card className="animate-[fade-in-up_0.2s_ease-out]">
      <CardBody>
        <div className="mb-4 flex items-center gap-2.5">
          <div className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ' + iconClassName}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
            {description && <p className="text-xs text-ink-muted">{description}</p>}
          </div>
        </div>
        {children}
      </CardBody>
    </Card>
  );
}

const THEME_OPTIONS = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
];

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { collapsed, setCollapsed } = useSidebarPrefs();
  const homePath = ROLE_HOME[user.role];

  // Sessions — revoke every refresh token except this browser's.
  const [confirmLogoutAllOpen, setConfirmLogoutAllOpen] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [sessionsMessage, setSessionsMessage] = useState(null);

  async function handleLogoutAllOtherSessions() {
    setLoggingOutAll(true);
    setSessionsMessage(null);
    try {
      await api.post('/auth/logout-all');
      setSessionsMessage({ type: 'success', text: 'Every other device has been signed out.' });
    } catch (err) {
      setSessionsMessage({ type: 'error', text: err.response?.data?.message || 'Could not sign out other devices.' });
    } finally {
      setLoggingOutAll(false);
      setConfirmLogoutAllOpen(false);
    }
  }

  // Notification preferences — same data the Profile-adjacent bell modal
  // uses, but presented full-page here since this is now the settings home.
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [mutedTypes, setMutedTypes] = useState([]);
  const savedPrefsRef = useRef(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/users/me/notification-preferences')
      .then(({ data }) => {
        if (cancelled) return;
        const email = data.data.emailNotifications;
        const muted = data.data.mutedNotificationTypes || [];
        setEmailNotifications(email);
        setMutedTypes(muted);
        savedPrefsRef.current = { emailNotifications: email, mutedTypes: muted };
      })
      .finally(() => !cancelled && setLoadingPrefs(false));
    return () => {
      cancelled = true;
    };
  }, [savedPrefsRef]);

  const prefsDirty = useMemo(() => {
    if (!savedPrefsRef.current) return false;
    const saved = savedPrefsRef.current;
    return (
      saved.emailNotifications !== emailNotifications ||
      JSON.stringify([...saved.mutedTypes].sort()) !== JSON.stringify([...mutedTypes].sort())
    );
  }, [emailNotifications, mutedTypes, savedPrefsRef]);

  function toggleType(type) {
    setMutedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  async function savePrefs() {
    setSavingPrefs(true);
    setPrefsMessage(null);
    try {
      await api.patch('/users/me/notification-preferences', {
        emailNotifications,
        mutedNotificationTypes: mutedTypes,
      });
      savedPrefsRef.current = { emailNotifications, mutedTypes };
      setPrefsMessage({ type: 'success', text: 'Preferences saved.' });
    } catch (err) {
      setPrefsMessage({ type: 'error', text: err.response?.data?.message || 'Could not save preferences.' });
    } finally {
      setSavingPrefs(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Page header — deliberately not the identity hero Profile uses:
          this page is about app behavior, not who the account belongs to. */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-route-500 to-route-600 text-white shadow-md shadow-route-500/25">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Settings</h1>
          <p className="text-sm text-ink-muted">How Waypoint looks and talks to you — your profile lives separately.</p>
        </div>
      </div>

      {/* Appearance */}
      <SettingsSection
        icon={Palette}
        iconClassName="bg-accent-50 text-accent-600"
        title="Appearance"
        description="Choose how the interface looks on this device."
      >
        <div className="flex gap-2">
          {THEME_OPTIONS.map(({ id, label, icon: Icon }) => {
            const active = theme === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                className={
                  'flex flex-1 flex-col items-center gap-2 rounded-xl border px-4 py-4 text-sm font-medium transition-all duration-150 ' +
                  (active
                    ? 'border-route-500 bg-route-50 text-route-700 shadow-sm'
                    : 'border-line text-ink-soft hover:border-route-200 hover:bg-paper')
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
          <Monitor className="h-3.5 w-3.5" /> Applies instantly and only on this browser.
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-line bg-paper/60 px-3.5 py-3">
          <div className="flex items-start gap-2.5">
            <PanelLeftClose className="mt-0.5 h-4 w-4 shrink-0 text-route-600" />
            <div>
              <p className="text-sm font-medium text-ink">Compact sidebar</p>
              <p className="text-xs text-ink-muted">Collapse the side nav to icons only, on desktop.</p>
            </div>
          </div>
          <Switch checked={collapsed} onChange={setCollapsed} label="Compact sidebar" />
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection
        icon={BellRing}
        iconClassName="bg-sky-50 text-sky-600"
        title="Notifications"
        description="Control what reaches your inbox and the notification bell."
      >
        {loadingPrefs ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-lg bg-paper" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper/60 px-3.5 py-3">
              <div className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-route-600" />
                <div>
                  <p className="text-sm font-medium text-ink">Email me a copy</p>
                  <p className="text-xs text-ink-muted">Sent to your account email whenever you get a notification.</p>
                </div>
              </div>
              <Switch checked={emailNotifications} onChange={setEmailNotifications} label="Email notifications" />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Notify me about</p>
              <div className="flex flex-col divide-y divide-line rounded-lg border border-line">
                {NOTIFICATION_TYPES.map((type) => {
                  const meta = NOTIFICATION_TYPE_META[type];
                  const Icon = meta.icon;
                  const enabled = !mutedTypes.includes(type);
                  return (
                    <div key={type} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className={'flex h-7 w-7 items-center justify-center rounded-lg ' + meta.chip}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm text-ink">{meta.label}</span>
                      </div>
                      <Switch checked={enabled} onChange={() => toggleType(type)} label={meta.label} />
                    </div>
                  );
                })}
              </div>
            </div>

            <InlineMessage message={prefsMessage} />
            <div className="flex items-center gap-3">
              <Button onClick={savePrefs} loading={savingPrefs} disabled={!prefsDirty} className="w-fit">
                Save preferences
              </Button>
              {!prefsDirty && !savingPrefs && (
                <span className="text-xs text-ink-muted">No changes to save yet</span>
              )}
            </div>
          </div>
        )}
      </SettingsSection>

      {/* Sessions — a real revoke-all-refresh-tokens action against the
          backend, gated behind confirmation since it signs out every other
          browser/device on the account. */}
      <SettingsSection
        icon={MonitorSmartphone}
        iconClassName="bg-teal-50 text-teal-600"
        title="Sessions"
        description="Manage where you're signed in."
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper/60 px-3.5 py-3">
            <div className="flex items-start gap-2.5">
              <MonitorSmartphone className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
              <div>
                <p className="text-sm font-medium text-ink">This device</p>
                <p className="text-xs text-ink-muted">Your current session — stays signed in.</p>
              </div>
            </div>
            <span className="rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-600">
              Active
            </span>
          </div>

          <InlineMessage message={sessionsMessage} />

          <Button
            type="button"
            variant="secondary"
            onClick={() => setConfirmLogoutAllOpen(true)}
            className="w-fit"
          >
            <LogOut className="h-4 w-4" /> Log out of all other devices
          </Button>
        </div>
      </SettingsSection>

      {/* Account & security — a signpost over to Profile rather than a
          duplicate of it, so identity/password/2FA stay owned by one page. */}
      <SettingsSection
        icon={ShieldCheck}
        iconClassName="bg-danger-50 text-danger-600"
        title="Account & security"
        description="Name, photo, password, and two-factor authentication live on your profile."
      >
        <Link
          to={`${homePath}/profile`}
          className="group flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-route-200 hover:shadow-card"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-route-50 text-route-600">
              <UserCog className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Go to your profile</p>
              <p className="text-xs text-ink-muted">
                Signed in as {user.name} · {ROLE_LABELS[user.role]}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-route-600" />
        </Link>
      </SettingsSection>

      <ConfirmModal
        open={confirmLogoutAllOpen}
        onClose={() => setConfirmLogoutAllOpen(false)}
        onConfirm={handleLogoutAllOtherSessions}
        loading={loggingOutAll}
        title="Log out of all other devices?"
        message="Every other browser and device signed into your account will be signed out. This one stays active."
        confirmLabel="Log out others"
        cancelLabel="Cancel"
      />
    </div>
  );
}
