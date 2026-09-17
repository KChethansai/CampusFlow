// CSV export — generic rowsToCsv/downloadCsv plus an admin-metrics builder.
// All rows come from real payloads passed in; no mock data lives here.

const escapeCell = (value) => {
  const s = value == null ? '' : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** rowsToCsv: array of arrays (or array of objects with `columns`) → CSV text. */
export function rowsToCsv(rows, columns) {
  const list = Array.isArray(rows) ? rows : [];
  const head = Array.isArray(columns) && columns.length ? [columns] : [];
  const body = list.map((row) =>
    Array.isArray(row) ? row : head.length ? columns.map((c) => row?.[c]) : Object.values(row ?? {})
  );
  return [...head, ...body].map((r) => r.map(escapeCell).join(',')).join('\r\n');
}

/** downloadCsv: trigger a client-side CSV download. */
export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const section = (comment, header, rows) =>
  [`# ${comment}`, header, ...rows.map((r) => r.map(escapeCell).join(','))].join('\r\n');

/**
 * buildAdminMetricsCsv: assemble the institutional activity report from live
 * payloads. Pass exactly what the backend returned — nothing is fabricated.
 *
 * {
 *   institutionName, institutionId, academicYear,
 *   overview: [{ metric, value, unit, benchmark, status }],
 *   trends: [{ date, day, logins, submissions, queries, placementViews, approvals }],
 *   departments: [{ code, name, students, faculty, engagementPct, adoption }],
 *   actions: [{ id, category, title, by, scope, status, date }],
 *   audit: [{ at, type, principal, ip, detail, severity }]
 * }
 */
export function buildAdminMetricsCsv(payload = {}) {
  const {
    institutionName = '',
    institutionId = '',
    academicYear = '',
    overview = [],
    trends = [],
    departments = [],
    actions = [],
    audit = []
  } = payload;

  const generatedAt = new Date().toISOString();
  const parts = [
    [
      '# =========================================================================',
      '# CAMPUSFLOW - INSTITUTIONAL ACTIVITY & ENGAGEMENT METRICS REPORT',
      `# Institution: "${institutionName}"`,
      `# Institution ID: "${institutionId}"`,
      `# Academic Year: "${academicYear}"`,
      `# Report Generated: "${generatedAt}"`,
      '# =========================================================================',
      ''
    ].join('\r\n'),
    section(
      'PLATFORM OVERVIEW',
      'SECTION,METRIC_NAME,VALUE,UNIT,BENCHMARK,STATUS',
      overview.map((o) => ['Platform Overview', o.metric, o.value, o.unit, o.benchmark, o.status])
    ),
    '',
    section(
      'DAILY ACTIVITY & ENGAGEMENT TRENDS',
      'DATE,DAY_OF_WEEK,LOGINS,ASSIGNMENTS_SUBMITTED,AI_COPILOT_QUERIES,PLACEMENT_VIEWS,GOVERNANCE_APPROVALS',
      trends.map((t) => [t.date, t.day, t.logins, t.submissions, t.queries, t.placementViews, t.approvals])
    ),
    '',
    section(
      'DEPARTMENT-LEVEL ENGAGEMENT BREAKDOWN',
      'DEPARTMENT_CODE,DEPARTMENT_NAME,STUDENT_COUNT,FACULTY_COUNT,ENGAGEMENT_SCORE_PCT,PORTAL_ADOPTION',
      departments.map((d) => [d.code, d.name, d.students, d.faculty, d.engagementPct, d.adoption])
    ),
    '',
    section(
      'SYSTEM PENDING ACTIONS & GOVERNANCE AUDIT',
      'ACTION_ID,CATEGORY,TITLE,SUBMITTED_BY,VALUE_OR_SCOPE,STATUS,SUBMITTED_DATE',
      actions.map((a) => [a.id, a.category, a.title, a.by, a.scope, a.status, a.date])
    ),
    '',
    section(
      'RECENT AUDIT TRAIL LOGS',
      'TIMESTAMP,EVENT_TYPE,PRINCIPAL,IP_ADDRESS,ACTION_DETAILS,SEVERITY',
      audit.map((e) => [e.at, e.type, e.principal, e.ip, e.detail, e.severity])
    )
  ];

  return parts.join('\r\n');
}

/** downloadAdminMetricsCsv: build from a real payload and download it. */
export function downloadAdminMetricsCsv(payload = {}) {
  const csv = buildAdminMetricsCsv(payload);
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(`CampusFlow_Admin_Activity_Metrics_${date}.csv`, csv);
  return csv;
}
