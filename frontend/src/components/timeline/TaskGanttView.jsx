import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Diamond, Zap, X, Undo2, Locate } from 'lucide-react';
import clsx from 'clsx';
import EmptyState from '../ui/EmptyState.jsx';
import Avatar from '../ui/Avatar.jsx';
import { PRIORITY_META } from '../../config/statuses';
import {
  DAY,
  ZOOM_LEVELS,
  addDays,
  buildTicks,
  computeWindow,
  diffDays,
  effectiveRange,
  formatShort,
  startOfDay,
} from '../../utils/timelineScale';

const ROW_HEIGHT = 40;
const LABEL_WIDTH = 240;

// Task-level Gantt: bars grouped by project, dependency connectors drawn
// as elbowed SVG paths, milestones rendered as diamonds, bars draggable
// (horizontal move = reschedule keeping duration, edge drag = resize).
export default function TaskGanttView({ tasks = [], zoom, basePath = '/admin/tasks', onReschedule, readOnly = false }) {
  const scrollRef = useRef(null);
  const [dragState, setDragState] = useState(null); // { taskId, mode, startX, originalStart, originalDue }
  const [localOverrides, setLocalOverrides] = useState({});
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [cascadeToast, setCascadeToast] = useState(null); // { count, changes: [{taskId, override, prev}] }
  const cascadeTimeoutRef = useRef(null);

  const { pxPerDay, tickUnit } = ZOOM_LEVELS[zoom];

  const effective = tasks.map((t) => ({ ...t, ...localOverrides[t.id] }));

  const { rangeStart, rangeEnd } = useMemo(() => computeWindow(effective), [effective]);
  const totalDays = Math.max(diffDays(rangeEnd, rangeStart), 1);
  const totalWidth = totalDays * pxPerDay;
  const ticks = useMemo(() => buildTicks(rangeStart, rangeEnd, tickUnit), [rangeStart, rangeEnd, tickUnit]);

  const dateToX = (date) => diffDays(date, rangeStart) * pxPerDay;

  // Group tasks by project so the chart reads as swimlanes, and assign
  // each visible row (group header + task) a sequential index for the
  // pixel Y math the dependency connectors rely on.
  const groups = useMemo(() => {
    const byProject = new Map();
    effective.forEach((t) => {
      const key = t.project?.id || 'unassigned';
      if (!byProject.has(key)) byProject.set(key, { project: t.project, tasks: [] });
      byProject.get(key).tasks.push(t);
    });
    return [...byProject.values()];
  }, [effective]);

  const rows = []; // { type: 'header'|'task', task?, project? }
  groups.forEach((g) => {
    rows.push({ type: 'header', project: g.project });
    g.tasks.forEach((task) => rows.push({ type: 'task', task }));
  });
  const rowIndexByTaskId = new Map(rows.map((r, i) => [r.task?.id, i]).filter(([id]) => id));

  const now = new Date();
  const todayX = now >= rangeStart && now <= rangeEnd ? dateToX(now) : null;

  // Open on "today" instead of the range start — a plan you have to
  // scroll to find isn't one you actually check day to day.
  useEffect(() => {
    if (todayX == null || !scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollLeft = Math.max(todayX - el.clientWidth / 2, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  function scrollToToday() {
    if (todayX == null || !scrollRef.current) return;
    scrollRef.current.scrollTo({ left: Math.max(todayX - scrollRef.current.clientWidth / 2, 0), behavior: 'smooth' });
  }

  // Reverse of task.dependsOn — who depends on ME. Needed to walk both
  // directions from a selected task, and to do the longest-path pass
  // for the critical path.
  const dependsOnMap = useMemo(() => {
    const m = new Map();
    effective.forEach((t) => m.set(t.id, (t.dependsOn || []).map((d) => d.id)));
    return m;
  }, [effective]);

  const dependentsMap = useMemo(() => {
    const m = new Map();
    effective.forEach((t) => {
      (t.dependsOn || []).forEach((dep) => {
        if (!m.has(dep.id)) m.set(dep.id, []);
        m.get(dep.id).push(t.id);
      });
    });
    return m;
  }, [effective]);

  // Click any task → highlight everything upstream (its prerequisites)
  // and downstream (what's waiting on it), so "why can't this move" is
  // answerable at a glance instead of guessing from the arrows.
  const selectedChain = useMemo(() => {
    if (!selectedTaskId) return null;
    const visited = new Set([selectedTaskId]);
    const queue = [selectedTaskId];
    while (queue.length) {
      const id = queue.shift();
      (dependsOnMap.get(id) || []).forEach((p) => {
        if (!visited.has(p)) {
          visited.add(p);
          queue.push(p);
        }
      });
      (dependentsMap.get(id) || []).forEach((c) => {
        if (!visited.has(c)) {
          visited.add(c);
          queue.push(c);
        }
      });
    }
    return visited;
  }, [selectedTaskId, dependsOnMap, dependentsMap]);

  // Longest-duration chain through the whole dependency graph — the
  // sequence of tasks that actually determines how soon everything
  // downstream can finish. Classic CPM longest-path pass over the DAG.
  const criticalPath = useMemo(() => {
    const dur = new Map();
    effective.forEach((t) => {
      const { start, end } = effectiveRange(t);
      dur.set(t.id, Math.max(diffDays(end, start), 1));
    });

    const indeg = new Map(effective.map((t) => [t.id, (t.dependsOn || []).length]));
    const longestEnd = new Map(effective.map((t) => [t.id, dur.get(t.id)]));
    const prev = new Map();
    const queue = effective.filter((t) => (indeg.get(t.id) || 0) === 0).map((t) => t.id);
    const localIndeg = new Map(indeg);
    let processed = 0;

    while (queue.length) {
      const id = queue.shift();
      processed += 1;
      (dependentsMap.get(id) || []).forEach((childId) => {
        const candidate = longestEnd.get(id) + (dur.get(childId) || 1);
        if (candidate > (longestEnd.get(childId) || 0)) {
          longestEnd.set(childId, candidate);
          prev.set(childId, id);
        }
        localIndeg.set(childId, (localIndeg.get(childId) || 0) - 1);
        if (localIndeg.get(childId) === 0) queue.push(childId);
      });
    }
    if (processed < effective.length) return null; // a cycle — bail rather than show something wrong

    let bestId = null;
    let bestVal = 0;
    longestEnd.forEach((v, id) => {
      if (v > bestVal) {
        bestVal = v;
        bestId = id;
      }
    });
    if (!bestId || !prev.has(bestId)) return null; // no multi-task chain to speak of

    const path = [bestId];
    let cur = bestId;
    while (prev.has(cur)) {
      cur = prev.get(cur);
      path.unshift(cur);
    }
    return { ids: new Set(path), order: path, totalDays: bestVal };
  }, [effective, dependentsMap]);

  const highlightSet = selectedTaskId ? selectedChain : showCriticalPath ? criticalPath?.ids : null;

  function handlePointerDown(e, task, mode) {
    // Team members can see the Gantt but the backend doesn't let them
    // reschedule (that's Admin/PM only) — bail before starting a drag
    // session rather than letting them drag a bar that snaps back on
    // the next refresh with no explanation.
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    const { start } = effectiveRange(task);
    // Plain mutable object for this drag session — deliberately NOT React
    // state. It's only read by the pointermove/pointerup listeners below,
    // and keeping it out of setState avoids two footguns: stale closures
    // over state from the render that started the drag, and (worse) side
    // effects nested inside a functional setState updater, which Strict
    // Mode double-invokes in dev and would fire the click-to-select toggle
    // twice — select then immediately deselect.
    const session = {
      taskId: task.id,
      mode, // 'move' | 'resize-end'
      startClientX: e.clientX,
      originalStart: start,
      originalDue: new Date(task.dueDate),
      moved: false,
      latestOverride: null,
    };
    setDragState({ taskId: task.id, mode });

    function handleMove(ev) {
      const deltaPx = ev.clientX - session.startClientX;
      if (Math.abs(deltaPx) > 3) session.moved = true;
      const deltaDays = Math.round(deltaPx / pxPerDay);
      let newStart = session.originalStart;
      let newDue = session.originalDue;
      if (session.mode === 'move') {
        newStart = addDays(session.originalStart, deltaDays);
        newDue = addDays(session.originalDue, deltaDays);
      } else {
        newDue = addDays(session.originalDue, deltaDays);
        if (newDue < session.originalStart) newDue = session.originalStart;
      }
      session.latestOverride = { startDate: newStart.toISOString(), dueDate: newDue.toISOString() };
      setLocalOverrides((o) => ({ ...o, [session.taskId]: session.latestOverride }));
    }

    function handleUp() {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      setDragState(null);

      if (!session.moved) {
        // No real drag happened — treat it as a click: select/deselect
        // this task's dependency chain instead of committing a reschedule.
        setSelectedTaskId((id) => (id === session.taskId ? null : session.taskId));
        return;
      }
      if (!session.latestOverride) return;

      const deltaDays = diffDays(new Date(session.latestOverride.startDate), session.originalStart);

      // Moving (not resizing) a task that has downstream dependents:
      // shift every transitive dependent by the same number of days so
      // the schedule stays internally consistent instead of silently
      // drifting out of sync with what it's blocking.
      if (session.mode === 'move' && deltaDays !== 0) {
        const dependentIds = new Set();
        const queue = [...(dependentsMap.get(session.taskId) || [])];
        while (queue.length) {
          const id = queue.shift();
          if (dependentIds.has(id)) continue;
          dependentIds.add(id);
          (dependentsMap.get(id) || []).forEach((c) => {
            if (!dependentIds.has(c)) queue.push(c);
          });
        }

        if (dependentIds.size > 0) {
          const changes = [
            {
              taskId: session.taskId,
              override: session.latestOverride,
              prev: { startDate: session.originalStart.toISOString(), dueDate: session.originalDue.toISOString() },
            },
          ];
          dependentIds.forEach((id) => {
            const t = effective.find((x) => x.id === id);
            if (!t) return;
            const { start: depStart, end: depEnd } = effectiveRange(t);
            changes.push({
              taskId: id,
              override: {
                startDate: addDays(depStart, deltaDays).toISOString(),
                dueDate: addDays(depEnd, deltaDays).toISOString(),
              },
              prev: { startDate: depStart.toISOString(), dueDate: depEnd.toISOString() },
            });
          });

          setLocalOverrides((o) => {
            const next = { ...o };
            changes.forEach((c) => {
              next[c.taskId] = c.override;
            });
            return next;
          });
          changes.forEach((c) => {
            onReschedule?.(c.taskId, c.override).catch(() => {});
          });

          clearTimeout(cascadeTimeoutRef.current);
          setCascadeToast({ count: changes.length - 1, changes });
          cascadeTimeoutRef.current = setTimeout(() => setCascadeToast(null), 7000);
          return;
        }
      }

      if (onReschedule) {
        onReschedule(session.taskId, session.latestOverride).catch(() => {
          setLocalOverrides((o) => {
            const next = { ...o };
            delete next[session.taskId];
            return next;
          });
        });
      }
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }

  function undoCascade() {
    if (!cascadeToast) return;
    clearTimeout(cascadeTimeoutRef.current);
    setLocalOverrides((o) => {
      const next = { ...o };
      cascadeToast.changes.forEach((c) => {
        next[c.taskId] = c.prev;
      });
      return next;
    });
    cascadeToast.changes.forEach((c) => {
      onReschedule?.(c.taskId, c.prev).catch(() => {});
    });
    setCascadeToast(null);
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No scheduled tasks yet"
        description="Tasks with a due date will appear here as Gantt bars. Add a start date for a full-width bar."
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-surface">
      {/* Chain inspector / critical path toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-paper/50 px-3 py-2">
        <div className="flex min-h-[20px] items-center gap-2 text-xs">
          {selectedTaskId ? (
            <>
              <span className="font-medium text-ink">
                {selectedChain.size} task{selectedChain.size > 1 ? 's' : ''} in this chain
              </span>
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="flex items-center gap-0.5 rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-ink-muted hover:text-ink"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            </>
          ) : showCriticalPath && criticalPath ? (
            <span className="font-medium text-ink">
              Critical path: {criticalPath.order.length} tasks ·{' '}
              <span className="font-mono">{criticalPath.totalDays}d</span> end-to-end
            </span>
          ) : (
            <span className="text-ink-muted">Click any task to trace what it's waiting on</span>
          )}
        </div>
        {criticalPath && (
          <button
            type="button"
            onClick={() => {
              setShowCriticalPath((v) => !v);
              setSelectedTaskId(null);
            }}
            className={clsx(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              showCriticalPath
                ? 'border-route-500 bg-route-500 text-white shadow-sm'
                : 'border-line bg-surface text-ink-muted hover:text-ink'
            )}
          >
            <Zap className="h-3 w-3" />
            Critical path
          </button>
        )}
        {todayX != null && (
          <button
            type="button"
            onClick={scrollToToday}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <Locate className="h-3 w-3" />
            Today
          </button>
        )}
      </div>

      {/* Cascading-reschedule confirmation */}
      {cascadeToast && (
        <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-ink/10 bg-ink px-4 py-2 text-xs text-white shadow-pop">
          <span>
            Rescheduled — {cascadeToast.count} downstream task{cascadeToast.count > 1 ? 's' : ''} shifted too.
          </span>
          <button
            type="button"
            onClick={undoCascade}
            className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 font-medium transition-colors hover:bg-white/25"
          >
            <Undo2 className="h-3 w-3" />
            Undo
          </button>
        </div>
      )}

      <div className="flex">
        {/* Fixed label column */}
        <div className="shrink-0 border-r border-line" style={{ width: LABEL_WIDTH }}>
          <div className="flex items-center border-b border-line px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted" style={{ height: 36 }}>
            Task
          </div>
          {rows.map((row, i) =>
            row.type === 'header' ? (
              <div
                key={`h-${i}`}
                className="flex items-center bg-paper/70 px-3 text-xs font-semibold text-ink-soft"
                style={{ height: ROW_HEIGHT }}
              >
                {row.project?.name || 'Unassigned'}
              </div>
            ) : (
              <Link
                key={row.task.id}
                to={`${basePath}/${row.task.id}`}
                className={clsx(
                  'flex items-center gap-2 truncate px-3 text-sm transition-opacity hover:text-route-600',
                  highlightSet && !highlightSet.has(row.task.id) ? 'text-ink-muted opacity-40' : 'text-ink'
                )}
                style={{ height: ROW_HEIGHT }}
                title={row.task.title}
              >
                {row.task.isMilestone && <Diamond className="h-3 w-3 shrink-0 text-accent-500" />}
                <span className="truncate">{row.task.title}</span>
              </Link>
            )
          )}
        </div>

        {/* Scrollable timeline area */}
        <div ref={scrollRef} className="relative flex-1 overflow-x-auto">
          <div style={{ width: totalWidth, minWidth: '100%' }}>
            {/* Ruler — current tick reads as a dark "pressed in" pill, echoing the reference's active "8 AM" marker */}
            <div className="relative border-b border-line" style={{ height: 36 }}>
              {/* Weekend shading, day zoom only */}
              {tickUnit === 'day' &&
                ticks.map((tick, i) => {
                  const day = tick.getDay();
                  if (day !== 0 && day !== 6) return null;
                  return (
                    <div
                      key={`we-${i}`}
                      className="absolute top-0 h-full bg-ink/[0.025]"
                      style={{ left: dateToX(tick), width: pxPerDay }}
                    />
                  );
                })}
              {ticks.map((tick, i) => {
                const isCurrent = tickUnit === 'day' && diffDays(tick, now) === 0;
                return (
                  <div
                    key={i}
                    className="absolute top-0 flex h-full items-center border-l border-dashed border-line/70 pl-1.5"
                    style={{ left: dateToX(tick) }}
                  >
                    <span
                      className={clsx(
                        'whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-tight',
                        isCurrent ? 'bg-ink text-white shadow-sm' : 'text-ink-muted'
                      )}
                    >
                      {tickUnit === 'month'
                        ? tick.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
                        : formatShort(tick)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Rows + bars */}
            <div className="relative" style={{ height: rows.length * ROW_HEIGHT }}>
              {/* Weekend shading through the full chart height */}
              {tickUnit === 'day' &&
                ticks.map((tick, i) => {
                  const day = tick.getDay();
                  if (day !== 0 && day !== 6) return null;
                  return (
                    <div
                      key={`wer-${i}`}
                      className="pointer-events-none absolute top-0 z-0 bg-ink/[0.02]"
                      style={{ left: dateToX(tick), width: pxPerDay, height: rows.length * ROW_HEIGHT }}
                    />
                  );
                })}

              {/* Dashed vertical gridlines running the full height of the chart */}
              <div className="pointer-events-none absolute left-0 top-0 z-0" style={{ height: rows.length * ROW_HEIGHT, width: totalWidth }}>
                {ticks.map((tick, i) => (
                  <div
                    key={i}
                    className="absolute top-0 border-l border-dashed border-line/70"
                    style={{ left: dateToX(tick), height: rows.length * ROW_HEIGHT }}
                  />
                ))}
              </div>

              {/* Today marker — the one place the amber "current position" accent is used */}
              {todayX != null && (
                <div className="absolute top-0 z-10" style={{ left: todayX, height: rows.length * ROW_HEIGHT }}>
                  <div className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent-400/25 to-transparent blur-[2px]" />
                  <div className="absolute inset-y-0 left-0 w-px bg-accent-500/80" />
                  <span className="absolute -top-0 left-1.5 flex items-center gap-1 whitespace-nowrap rounded-full bg-ink px-1.5 py-0.5 font-mono text-[9px] font-semibold text-white shadow-sm">
                    <span className="h-1 w-1 rounded-full bg-accent-400" />
                    Today
                  </span>
                </div>
              )}

              {/* Row backgrounds */}
              {rows.map((row, i) => (
                <div
                  key={i}
                  className={clsx(
                    'absolute left-0 right-0 border-b border-line/60 transition-colors',
                    row.type === 'header' ? 'bg-paper/70' : 'hover:bg-paper/50'
                  )}
                  style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                />
              ))}

              {/* Dependency connectors */}
              <svg
                className="pointer-events-none absolute left-0 top-0"
                width={totalWidth}
                height={rows.length * ROW_HEIGHT}
              >
                <defs>
                  <marker id="gantt-arrow" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
                    <path d="M0,0 L5,2.5 L0,5 Z" fill="rgb(var(--color-ink-muted) / 1)" />
                  </marker>
                  <marker id="gantt-arrow-active" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
                    <path d="M0,0 L5,2.5 L0,5 Z" fill="#5B4FE0" />
                  </marker>
                </defs>
                {rows.map((row) => {
                  if (row.type !== 'task' || !row.task.dependsOn?.length) return null;
                  const toIndex = rowIndexByTaskId.get(row.task.id);
                  const { start: toStart } = effectiveRange(row.task);
                  const toX = dateToX(toStart);
                  const toY = toIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

                  return row.task.dependsOn.map((dep) => {
                    const fromIndex = rowIndexByTaskId.get(dep.id);
                    if (fromIndex == null) return null;
                    const fromTask = effective.find((t) => t.id === dep.id);
                    if (!fromTask) return null;
                    const { end: fromEnd } = effectiveRange(fromTask);
                    const fromX = dateToX(fromEnd);
                    const fromY = fromIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
                    const midX = fromX + Math.max((toX - fromX) / 2, 12);
                    const r = 6;
                    const vDir = toY > fromY ? 1 : -1;
                    const d = `M ${fromX} ${fromY}
                      H ${midX - r}
                      Q ${midX} ${fromY} ${midX} ${fromY + r * vDir}
                      V ${toY - r * vDir}
                      Q ${midX} ${toY} ${midX + r} ${toY}
                      H ${toX}`;

                    const isActive = highlightSet && highlightSet.has(fromTask.id) && highlightSet.has(row.task.id);
                    const isDimmed = highlightSet && !isActive;

                    return (
                      <path
                        key={`${dep.id}-${row.task.id}`}
                        d={d}
                        fill="none"
                        stroke={isActive ? '#5B4FE0' : 'rgb(var(--color-ink-muted) / 1)'}
                        strokeWidth={isActive ? 2.5 : 1.5}
                        strokeLinecap="round"
                        opacity={isDimmed ? 0.15 : 1}
                        markerEnd={isActive ? 'url(#gantt-arrow-active)' : 'url(#gantt-arrow)'}
                        style={{ transition: 'opacity 150ms, stroke-width 150ms' }}
                      />
                    );
                  });
                })}
              </svg>

              {/* Bars */}
              {rows.map((row, i) => {
                if (row.type !== 'task') return null;
                const task = row.task;
                const { start, end } = effectiveRange(task);
                const left = dateToX(start);
                const width = Math.max(diffDays(end, start) * pxPerDay, 10);
                const priorityMeta = PRIORITY_META[task.priority];
                const isDragging = dragState?.taskId === task.id;
                const inChain = highlightSet?.has(task.id);
                const isDimmed = highlightSet && !inChain;
                const isOnCriticalPath = showCriticalPath && criticalPath?.ids.has(task.id) && !selectedTaskId;

                if (task.isMilestone) {
                  return (
                    <div
                      key={task.id}
                      className="absolute flex items-center justify-center transition-opacity duration-150"
                      style={{
                        left: left - 7,
                        top: i * ROW_HEIGHT + ROW_HEIGHT / 2 - 7,
                        width: 14,
                        height: 14,
                        opacity: isDimmed ? 0.25 : 1,
                      }}
                      title={`${task.title} — ${formatShort(end)}`}
                    >
                      <Diamond
                        className={clsx(
                          'h-3.5 w-3.5 fill-accent-400 text-accent-600 transition-transform',
                          inChain && 'scale-125 drop-shadow-[0_0_6px_rgba(226,163,59,0.6)]'
                        )}
                      />
                    </div>
                  );
                }

                const capColor =
                  task.priority === 'URGENT'
                    ? 'bg-danger-400'
                    : task.priority === 'HIGH'
                    ? 'bg-accent-400'
                    : task.priority === 'LOW'
                    ? 'bg-ink-muted/50'
                    : 'bg-route-400';
                const glowShadow =
                  task.priority === 'URGENT'
                    ? '0 6px 20px -4px rgba(193,72,61,0.45)'
                    : task.priority === 'HIGH'
                    ? '0 6px 20px -4px rgba(226,163,59,0.4)'
                    : '0 6px 20px -4px rgba(76,135,181,0.4)';
                const wide = width > 130;
                const canShowLabel = width >= 48;

                return (
                  <div
                    key={task.id}
                    className={clsx(
                      'group absolute z-10 flex items-center gap-1.5 overflow-hidden rounded-md border border-white/[0.06] bg-gradient-to-b from-ink-soft to-ink pl-0 pr-2 shadow-sm ring-1 ring-black/5 transition-all duration-150',
                      readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
                      isDimmed
                        ? ''
                        : isDragging
                        ? 'z-20 ring-2 ring-route-400'
                        : isOnCriticalPath
                        ? 'z-20 ring-2 ring-route-500'
                        : inChain
                        ? 'z-20 ring-2 ring-ink/70'
                        : 'hover:-translate-y-px'
                    )}
                    style={{
                      left,
                      width,
                      top: i * ROW_HEIGHT + 6,
                      height: ROW_HEIGHT - 12,
                      opacity: isDimmed ? 0.3 : task.status === 'COMPLETED' ? 0.6 : 1,
                      boxShadow: isDragging || inChain ? glowShadow : undefined,
                    }}
                    onMouseEnter={(e) => {
                      if (!isDragging) e.currentTarget.style.boxShadow = glowShadow;
                    }}
                    onMouseLeave={(e) => {
                      if (!isDragging) e.currentTarget.style.boxShadow = inChain ? glowShadow : '';
                    }}
                    onPointerDown={(e) => handlePointerDown(e, task, 'move')}
                    title={`${task.title} · ${formatShort(start)} – ${formatShort(end)}`}
                  >
                    {/* Glass sheen along the top edge */}
                    <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20" />
                    <span className={clsx('h-full shrink-0', capColor)} style={{ width: canShowLabel ? 4 : '100%' }} />
                    {isOnCriticalPath && canShowLabel && (
                      <Zap className="h-3 w-3 shrink-0 fill-route-300 text-route-300" />
                    )}
                    {canShowLabel && task.assignee && (
                      <Avatar name={task.assignee.name} size="sm" className="h-4 w-4 shrink-0 text-[8px] ring-2 ring-ink/80" />
                    )}
                    {canShowLabel && (
                      <span className="relative z-10 truncate text-[11px] font-medium text-white">{task.title}</span>
                    )}
                    {wide && (
                      <span className="relative z-10 ml-auto flex shrink-0 items-center gap-1 whitespace-nowrap font-mono text-[10px] tracking-tight text-ink-muted/90">
                        {formatShort(start)} – {formatShort(end)}
                      </span>
                    )}
                    {/* Progress underline */}
                    <div
                      className="absolute bottom-0 left-0 h-[3px] rounded-full bg-white/70"
                      style={{ width: `${Math.min(Math.max(task.progress || 0, 0), 100)}%` }}
                    />
                    {priorityMeta && (
                      <span
                        className="absolute right-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
                        style={{ background: task.priority === 'URGENT' ? '#C1483D' : task.priority === 'HIGH' ? '#E2A33B' : '#2F5D8A' }}
                      />
                    )}
                    {/* Resize handle */}
                    {!readOnly && (
                      <div
                        className="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
                        onPointerDown={(e) => handlePointerDown(e, task, 'resize-end')}
                      >
                        <div className="mx-auto mt-1 h-[calc(100%-8px)] w-0.5 rounded-full bg-white/60" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}