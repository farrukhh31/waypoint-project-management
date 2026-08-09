import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

// Powers the multi-view Timeline page (and its dashboard preview):
// fetches every project the caller can see, plus the flat task schedule
// (dates, progress, dependency edges) from GET /api/tasks/timeline.
// Both are fetched together since the Project / Gantt / Milestones tabs
// all read from one or the other of these two lists.
export function useTimeline({ projectId } = {}) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const taskParams = projectId ? { projectId, limit: 100 } : { limit: 100 };

    Promise.all([
      api.get('/projects', { params: { limit: 100 } }),
      api.get('/tasks/timeline', { params: projectId ? { projectId } : undefined }),
    ])
      .then(([projectsRes, tasksRes]) => {
        if (cancelled) return;
        setProjects(projectsRes.data.data.projects);
        setTasks(tasksRes.data.data.tasks);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, reloadToken]);

  // Optimistic local patch so a dragged Gantt bar doesn't wait on a
  // round trip before it looks correct; reload() re-syncs from the server.
  const patchTaskLocal = useCallback((taskId, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  }, []);

  async function rescheduleTask(taskId, { startDate, dueDate }) {
    const previous = tasks.find((t) => t.id === taskId);
    patchTaskLocal(taskId, { startDate, dueDate });
    try {
      await api.patch(`/tasks/${taskId}/reschedule`, { startDate, dueDate });
    } catch (err) {
      if (previous) patchTaskLocal(taskId, { startDate: previous.startDate, dueDate: previous.dueDate });
      throw err;
    }
  }

  return { projects, tasks, loading, error, reload, rescheduleTask };
}
