import { useEffect, useState } from 'react';
import { FolderKanban, Users, ClipboardCheck, Compass, ShieldCheck, Clock3, ListChecks } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Avatar from '../ui/Avatar.jsx';
import { useAuth } from '../../hooks/useAuth';
import { usePointerParallax } from '../../hooks/usePointerParallax';
import { ROLE_LABELS, ROLES } from '../../config/roles';

// Per-role secondary action — Admin gets the org-wide Users list, PM gets
// their Member reports, and a Team Member (who doesn't manage anyone)
// gets a shortcut straight to their own task list instead. Primary
// "View projects" stays the same shape for all three, just pointed at
// the right portal.
const SECONDARY_ACTION = {
  [ROLES.ADMIN]: { label: 'Users', to: '/admin/users', icon: Users },
  [ROLES.PROJECT_MANAGER]: { label: 'Member reports', to: '/pm/reports/team', icon: ClipboardCheck },
  [ROLES.TEAM_MEMBER]: { label: 'My tasks', to: '/team/tasks', icon: ListChecks },
};
const PROJECTS_PATH = {
  [ROLES.ADMIN]: '/admin/projects',
  [ROLES.PROJECT_MANAGER]: '/pm/projects',
  [ROLES.TEAM_MEMBER]: '/team/projects',
};

// Admin/PM oversee other people's work, so the subtitle talks about
// "every"/project-wide state; a Team Member only ever sees their own
// slice, so it reads "your" instead.
const SUBTITLE = {
  [ROLES.ADMIN]: "Here's where every project stands today.",
  [ROLES.PROJECT_MANAGER]: "Here's where every project stands today.",
  [ROLES.TEAM_MEMBER]: "Here's where your work stands today.",
};

function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || name;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// A real, ticking clock (not a static "as of page load" timestamp) — one
// small honest touch of "this is live" for the very first thing a person
// sees each session.
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// Splits the greeting into words so each can cascade in on mount with its
// own stagger delay, instead of the whole line popping in as one block.
function CascadeWords({ text, startDelay = 0, step = 55, className }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className={className}
          style={{ display: 'inline-block', animationDelay: `${startDelay + i * step}ms` }}
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </>
  );
}

// The dashboard's signature moment, and now genuinely its most premium
// surface: the whole panel tilts in real 3D off the cursor (same
// usePointerParallax hook driving the auth scene's floating cards, so the
// "alive" feel is consistent across the app, not a one-off effect built
// just for here), the greeting renders as shimmering, per-word-cascading
// gradient text with a soft extruded shadow for depth, a real ticking
// clock replaces the old static date, and — since this is the very first
// thing anyone sees each session — a strip of real, role-scoped headline
// numbers (passed in as `highlights`, never fabricated) turns it from a
// pure greeting into an actual at-a-glance briefing.
export default function WelcomeBanner({ name, highlights = [] }) {
  const { user } = useAuth();
  const { ref, offset } = usePointerParallax();
  const now = useClock();
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : null;
  const secondaryAction = SECONDARY_ACTION[user?.role];
  const projectsPath = PROJECTS_PATH[user?.role] || '/admin/projects';

  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const timeLabel = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });

  return (
    <Card className="card-sheen relative flex flex-col gap-5 overflow-hidden bg-gradient-to-br from-route-500/[0.07] via-surface to-surface p-6">
      {/* Ambient corner glow + drifting accent wash — quiet, slow, never loops jarringly */}
      <span
        className="animate-glow-pulse pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-route-400/15 blur-3xl"
        aria-hidden="true"
      />
      <span
        className="animate-aurora-a pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-accent-400/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Everything below tilts together in real 3D off the cursor — a
          subtle, capped rotation (max ~4deg) so it reads as "premium
          responsiveness," not a gimmick. No-ops under reduced-motion or
          on touch, per usePointerParallax. `ref` here is also what
          usePointerParallax measures the cursor position against. */}
      <div
        ref={ref}
        className="relative flex flex-col gap-4 transition-transform duration-200 ease-out sm:flex-row sm:items-center sm:justify-between"
        style={{
          perspective: '1200px',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${offset.y * -4}deg) rotateY(${offset.x * 4}deg)`,
        }}
      >
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0" style={{ transform: 'translateZ(28px)' }}>
            {/* Slow-spinning conic ring behind the avatar — a premium touch
                that stays subtle since it's fully hidden behind the avatar
                except for a thin bleed at the edge. */}
            <span
              className="absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,theme(colors.route.400),theme(colors.accent.400),theme(colors.route.400))] opacity-70 blur-[2px]"
              style={{ animation: 'wp-spin 6s linear infinite' }}
              aria-hidden="true"
            />
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface p-[3px]">
              {user?.name ? (
                <Avatar name={user.name} src={user.avatarUrl} size="md" className="h-full w-full" />
              ) : (
                <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-route-500 to-route-600 text-white shadow-lg shadow-route-500/30">
                  <Compass className="h-5 w-5" strokeWidth={2.25} />
                </span>
              )}
            </span>
            {/* Online pulse */}
            <span className="absolute bottom-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-surface">
              <span className="absolute h-2 w-2 animate-ping rounded-full bg-success-400 opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-success-400" />
            </span>
          </div>

          <div style={{ transform: 'translateZ(18px)' }}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{dateLabel}</p>
              {roleLabel && (
                <span className="inline-flex items-center gap-1 rounded-full border border-route-400/30 bg-route-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-route-600">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  {roleLabel}
                </span>
              )}
            </div>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              <CascadeWords text={`${greeting()}, ${firstName(name)}`} className="text-shimmer-brand animate-word-in" />
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
              <span>{SUBTITLE[user?.role] || SUBTITLE[ROLES.ADMIN]}</span>
              <span className="inline-flex items-center gap-1 tabular-nums text-ink-soft">
                <Clock3 className="h-3.5 w-3.5" />
                {timeLabel}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2" style={{ transform: 'translateZ(22px)' }}>
          {secondaryAction && (
            <Link to={secondaryAction.to}>
              <Button variant="secondary" size="md">
                <secondaryAction.icon className="h-4 w-4" /> {secondaryAction.label}
              </Button>
            </Link>
          )}
          <Link to={projectsPath}>
            <Button variant="primary" size="md" className="animate-cta-glow">
              <FolderKanban className="h-4 w-4" /> View projects
            </Button>
          </Link>
        </div>
      </div>

      {/* Real, role-scoped headline numbers — the "briefing" strip. Only
          renders what the calling dashboard actually passes in, so it
          never shows a stat that isn't backed by real data. */}
      {highlights.length > 0 && (
        <div className="relative flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {highlights.map((h, i) => (
            <Link
              key={h.label}
              to={h.to}
              className="animate-word-in flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-2 pr-3 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-route-200 hover:shadow-card"
              style={{ animationDelay: `${300 + i * 70}ms` }}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${h.tone || 'bg-route-100 text-route-600'}`}>
                <h.icon className="h-3.5 w-3.5" />
              </span>
              <span className="font-semibold text-ink">{h.value}</span>
              <span className="text-ink-muted">{h.label}</span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
