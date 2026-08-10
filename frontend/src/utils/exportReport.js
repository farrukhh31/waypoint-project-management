// Builds a plain-CSV snapshot of the admin Reports page and triggers a
// browser download — no backend endpoint needed since everything here is
// already loaded on the page. Kept deliberately simple (no library) since
// the shape is just a handful of flat sections.

function csvEscape(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function section(title, rows) {
  return [title, ...rows.map((r) => r.map(csvEscape).join(',')), ''];
}

export function buildReportCsv({ stats, projectsByStatus, tasksByStatus, priorityCounts, contributors, atRiskProjects, upcomingDeadlines }) {
  const lines = [];

  lines.push(...section('Metric,Value', Object.entries(stats)));

  if (projectsByStatus?.length) {
    lines.push(...section('Projects by status,Count', projectsByStatus.map((r) => [r.status, r.count])));
  }

  if (tasksByStatus?.length) {
    lines.push(...section('Tasks by status,Count', tasksByStatus.map((r) => [r.status, r.count])));
  }

  if (priorityCounts) {
    lines.push(
      ...section(
        'Priority mix,Projects,Tasks',
        Object.keys(priorityCounts.projects).map((key) => [key, priorityCounts.projects[key], priorityCounts.tasks[key]])
      )
    );
  }

  if (contributors?.length) {
    lines.push(
      ...section(
        'Top contributor,Completed,Assigned',
        contributors.map((c) => [c.user.name, c.completed, c.total])
      )
    );
  }

  if (atRiskProjects?.length) {
    lines.push(
      ...section(
        'Project at risk,Overdue tasks,Total tasks',
        atRiskProjects.map((p) => [p.name, p.progress?.overdue ?? 0, p.progress?.total ?? 0])
      )
    );
  }

  if (upcomingDeadlines?.length) {
    lines.push(
      ...section(
        'Upcoming deadline,Project,Due date',
        upcomingDeadlines.map((t) => [t.title, t.project?.name ?? '', t.dueDate?.slice(0, 10) ?? ''])
      )
    );
  }

  return lines.join('\n');
}

export function downloadReportCsv(payload) {
  const csv = buildReportCsv(payload);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `org-report-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
