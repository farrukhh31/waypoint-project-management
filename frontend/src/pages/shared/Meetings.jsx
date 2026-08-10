import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ListTodo,
  Building2,
  Clock,
  Video,
  MapPin,
  Search,
} from 'lucide-react';
import clsx from 'clsx';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../config/roles';
import { useMeetingsMonth, dayKey } from '../../hooks/useMeetingsMonth';
import { useUpcomingMeetings } from '../../hooks/useUpcomingMeetings';
import { meetingColor } from '../../config/meetingColors';
import PageHeader from '../../components/shared/PageHeader.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import AvatarStack from '../../components/ui/AvatarStack.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import Input from '../../components/ui/Input.jsx';
import UpcomingMeetingBanner from '../../components/meetings/UpcomingMeetingBanner.jsx';
import MeetingFormModal from '../../components/meetings/MeetingFormModal.jsx';
import MeetingDetailsModal from '../../components/meetings/MeetingDetailsModal.jsx';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function buildGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return date;
  });
}

function MeetingRow({ meeting, onSelect }) {
  const tone = meetingColor(meeting.color);
  return (
    <button
      type="button"
      onClick={() => onSelect(meeting)}
      className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface px-3.5 py-3 text-left shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-pop"
    >
      <span className={clsx('h-9 w-1 shrink-0 rounded-full', tone.dot)} />
      <div className="w-20 shrink-0">
        <p className="text-sm font-semibold text-ink">
          {new Date(meeting.startTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{meeting.title}</p>
        <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-ink-muted">
          {meeting.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {meeting.location}
            </span>
          )}
          {meeting.meetingLink && (
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3" /> Video
            </span>
          )}
        </p>
      </div>
      <AvatarStack people={meeting.attendees} max={4} size="sm" />
    </button>
  );
}

// Personal calendar + agenda for meetings this user is invited to. Admins
// get an extra "All meetings" tab for organization-wide oversight — same
// page, so there's one meetings surface instead of a separate admin app.
export default function Meetings() {
  const { user } = useAuth();
  const isAdmin = user.role === ROLES.ADMIN;
  // Team members join meetings they're invited to but don't organize their
  // own — scheduling stays a PM/Admin responsibility. Backend enforces this
  // too (POST /api/meetings requires ADMIN/PROJECT_MANAGER); hiding the
  // entry points here just keeps a member from hitting a 403.
  const canCreate = user.role !== ROLES.TEAM_MEMBER;
  const [searchParams, setSearchParams] = useSearchParams();

  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState('calendar'); // 'calendar' | 'agenda' | 'all' (admin)
  const [visibleMonth, setVisibleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const { byDay, meetings, loading, toggleReminder, createMeeting, updateMeeting, deleteMeeting } =
    useMeetingsMonth(visibleMonth);
  const { startingSoon } = useUpcomingMeetings(60);

  const [formOpen, setFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [detailsMeeting, setDetailsMeeting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [presetDate, setPresetDate] = useState(null);

  // Deep-link from a notification: /meetings?highlight=<id>
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (!highlightId) return;
    const local = meetings.find((m) => m.id === highlightId);
    if (local) {
      setDetailsMeeting(local);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('highlight');
        return next;
      });
    } else {
      api
        .get(`/meetings/${highlightId}`)
        .then(({ data }) => setDetailsMeeting(data.data.meeting))
        .catch(() => {})
        .finally(() =>
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete('highlight');
            return next;
          })
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, meetings]);

  const grid = buildGrid(visibleMonth);
  const selectedMeetings = (byDay[dayKey(selectedDate)] || [])
    .slice()
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const upcomingAgenda = meetings
    .filter((m) => new Date(m.startTime) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const isSameMonth = (d) => d.getMonth() === visibleMonth.getMonth();
  const isToday = (d) => d.toDateString() === today.toDateString();
  const isSelected = (d) => d.toDateString() === selectedDate.toDateString();

  function shiftMonth(delta) {
    setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + delta, 1));
  }

  function openCreate(presetDay) {
    setEditingMeeting(null);
    setPresetDate(presetDay || null);
    setFormOpen(true);
  }
  function openEdit(meeting) {
    setDetailsMeeting(null);
    setEditingMeeting(meeting);
    setFormOpen(true);
  }
  function handleSaved(meeting) {
    setDetailsMeeting(meeting);
  }
  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteMeeting(deleteTarget.id);
    setDeleteTarget(null);
    setDetailsMeeting(null);
  }
  async function handleToggleReminder(meeting) {
    await toggleReminder(meeting);
    setDetailsMeeting((prev) => (prev && prev.id === meeting.id ? { ...prev, reminderEnabled: !prev.reminderEnabled } : prev));
  }

  return (
    <div>
      <PageHeader
        title="Meetings"
        description={
          canCreate
            ? 'Your schedule, invites, and reminders — all in one place.'
            : "Your schedule and reminders — meetings you're invited to, all in one place."
        }
        action={
          canCreate ? (
            <Button onClick={() => openCreate()} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> New meeting
            </Button>
          ) : null
        }
      />

      <div className="mb-5">
        <UpcomingMeetingBanner meetings={startingSoon} onSelect={setDetailsMeeting} />
      </div>

      <div className="mb-5 flex items-center gap-1 rounded-lg border border-line bg-surface p-1 shadow-card w-fit">
        <ViewTab icon={CalendarDays} label="Calendar" active={view === 'calendar'} onClick={() => setView('calendar')} />
        <ViewTab icon={ListTodo} label="Agenda" active={view === 'agenda'} onClick={() => setView('agenda')} />
        {isAdmin && (
          <ViewTab icon={Building2} label="All meetings" active={view === 'all'} onClick={() => setView('all')} />
        )}
      </div>

      {view === 'calendar' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
          <Card className="h-fit overflow-hidden">
            <CardBody>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => shiftMonth(-1)} className="rounded-md p-1.5 text-ink-muted hover:bg-paper hover:text-ink">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-display text-sm font-semibold text-ink">
                  {visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </span>
                <button type="button" onClick={() => shiftMonth(1)} className="rounded-md p-1.5 text-ink-muted hover:bg-paper hover:text-ink">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-y-1.5 text-center">
                {WEEKDAYS.map((d, i) => (
                  <span key={i} className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                    {d}
                  </span>
                ))}
                {grid.map((date) => {
                  const dayMeetings = byDay[dayKey(date)] || [];
                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={clsx(
                        'relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-all duration-150',
                        !isSameMonth(date) && 'text-ink-muted/40',
                        isSameMonth(date) && !isSelected(date) && 'text-ink-soft hover:bg-paper hover:shadow-card',
                        isSelected(date) && 'bg-route-500 text-white shadow-pop -translate-y-px',
                        !isSelected(date) && isToday(date) && 'font-semibold text-route-600 ring-1 ring-route-300'
                      )}
                    >
                      {date.getDate()}
                      {dayMeetings.length > 0 && (
                        <span className={clsx('absolute -bottom-1 h-1 w-1 rounded-full', isSelected(date) ? 'bg-white' : 'bg-accent-400')} />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display text-sm font-semibold text-ink">
                  {isToday(selectedDate)
                    ? 'Today'
                    : selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                {canCreate && (
                  <Button size="sm" variant="secondary" onClick={() => openCreate(selectedDate)} className="flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                )}
              </div>
              {loading ? (
                <div className="flex flex-col gap-2.5">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-line/40" />
                  ))}
                </div>
              ) : selectedMeetings.length === 0 ? (
                <EmptyState title="Nothing scheduled" description="No meetings on this day yet." />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {selectedMeetings.map((m) => (
                    <MeetingRow key={m.id} meeting={m} onSelect={setDetailsMeeting} />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {view === 'agenda' && (
        <Card>
          <CardBody>
            {loading ? (
              <div className="flex flex-col gap-2.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-line/40" />
                ))}
              </div>
            ) : upcomingAgenda.length === 0 ? (
              <EmptyState
                title="No meetings this month"
                description={
                  canCreate
                    ? "Once you're invited to (or schedule) a meeting, it'll show up here."
                    : "Once you're invited to a meeting, it'll show up here."
                }
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                {upcomingAgenda.map((m) => (
                  <MeetingRow key={m.id} meeting={m} onSelect={setDetailsMeeting} />
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {view === 'all' && isAdmin && <AdminAllMeetings onSelect={setDetailsMeeting} onCreate={() => openCreate()} />}

      <MeetingFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        meeting={editingMeeting}
        presetDate={presetDate}
        currentUserId={user.id}
      />
      <MeetingDetailsModal
        open={Boolean(detailsMeeting)}
        onClose={() => setDetailsMeeting(null)}
        meeting={detailsMeeting}
        isAdmin={isAdmin}
        currentUserId={user.id}
        onEdit={() => openEdit(detailsMeeting)}
        onDelete={() => setDeleteTarget(detailsMeeting)}
        onToggleReminder={() => handleToggleReminder(detailsMeeting)}
      />
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Cancel this meeting?"
        message={`"${deleteTarget?.title ?? ''}" will be removed and attendees will be notified.`}
        confirmLabel="Cancel meeting"
      />
    </div>
  );
}

function ViewTab({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-route-500 text-white shadow-sm' : 'text-ink-soft hover:bg-paper'
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

// Admin-only tab: organization-wide meeting list (GET /meetings/admin/all)
// with search + pagination, for oversight across every organizer.
function AdminAllMeetings({ onSelect, onCreate }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ meetings: [], pagination: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/meetings/admin/all', { params: { search: search || undefined, page, limit: 10 } })
      .then(({ data: res }) => {
        if (!cancelled) setData(res.data);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search, page]);

  return (
    <Card>
      <CardBody>
        <div className="mb-4 flex items-center justify-between gap-3">
          <Input
            icon={Search}
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search meetings…"
            className="max-w-xs"
          />
          <Button size="sm" onClick={onCreate} className="flex items-center gap-1.5 shrink-0">
            <Plus className="h-3.5 w-3.5" /> New meeting
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-line/40" />
            ))}
          </div>
        ) : data.meetings.length === 0 ? (
          <EmptyState title="No meetings found" description="Try a different search." />
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {data.meetings.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect(m)}
                className="flex items-center gap-3 py-3 text-left first:pt-0 last:pb-0 hover:bg-paper"
              >
                <span className={clsx('h-2 w-2 shrink-0 rounded-full', meetingColor(m.color).dot)} />
                <div className="w-36 shrink-0 text-xs text-ink-muted">
                  <Clock className="mr-1 inline h-3 w-3" />
                  {new Date(m.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{m.title}</p>
                  <p className="truncate text-xs text-ink-muted">Organized by {m.organizer?.name}</p>
                </div>
                <AvatarStack people={m.attendees} max={3} size="sm" />
              </button>
            ))}
          </div>
        )}

        <Pagination pagination={data.pagination} onPageChange={setPage} />
      </CardBody>
    </Card>
  );
}
