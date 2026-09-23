// analytics: three recharts views over real aggregation endpoints —
// attendance trend, placement funnel, enrollment overview. Skeleton while
// loading, empty state with CTA when no data, never mocked numbers.
import { useEffect, useState } from 'react';
import { CartesianGrid, Cell, Line, LineChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../api/axios';
import { EmptyState, LoadingState } from '../ui/primitives';
import { cardTitle } from '../../system/tokens';

const wrap = 'cf-glass rounded-[24px] border border-[var(--cf-line)] p-5';

function useFetch(url) {
  const [rows, setRows] = useState(null); // null = loading
  useEffect(() => {
    let live = true;
    api.get(url).then(({ data }) => {
      if (live) setRows(data.data ?? []);
    }).catch(() => {
      if (live) setRows([]);
    });
    return () => { live = false; };
  }, [url]);
  return rows;
}

export function AttendanceTrend({ student, subject }) {
  const params = new URLSearchParams();
  if (student) params.set('student', student);
  if (subject) params.set('subject', subject);
  const rows = useFetch(`/analytics/attendance-trend?${params.toString()}`);
  if (rows === null) return <div className={wrap}><LoadingState /></div>;
  if (!rows.length) {
    return <div className={wrap}><EmptyState title="No attendance yet" hint="Marks appear here after the first session." /></div>;
  }
  return (
    <section className={wrap} aria-label="Attendance trend">
      <h3 className={cardTitle}>Attendance trend</h3>
      <div className="h-56 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 5" stroke="currentColor" opacity={0.12} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="rate" name="Present %" stroke="#D86D3E" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

const FUNNEL_COLORS = ['#D86D3E', '#B4806A', '#C87D4B', '#25D890'];

export function PlacementFunnel() {
  const rows = useFetch('/analytics/placement-funnel');
  if (rows === null) return <div className={wrap}><LoadingState /></div>;
  if (!rows.length || rows.every((r) => !r.count)) {
    return <div className={wrap}><EmptyState title="No pipeline data" hint="Publish a drive to start the funnel." /></div>;
  }
  return (
    <section className={wrap} aria-label="Placement funnel">
      <h3 className={cardTitle}>Drives → offers</h3>
      <div className="h-56 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 24 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="stage" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={90} />
            <Tooltip />
            <Bar dataKey="count" radius={[6, 6, 6, 6]}>
              {rows.map((_, i) => <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function EnrollmentOverview() {
  const payload = useFetch('/analytics/enrollment-overview');
  if (payload === null) return <div className={wrap}><LoadingState /></div>;
  const dept = payload?.byDepartment || [];
  const gpa = payload?.gpa || [];
  if (!dept.length && !gpa.every((g) => !g.count)) {
    return <div className={wrap}><EmptyState title="No enrollment data" hint="Enrollments appear here once admissions sync." /></div>;
  }
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <section className={wrap} aria-label="Enrollment by department">
        <h3 className={cardTitle}>Enrollment by department</h3>
        <div className="h-52 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dept} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 5" stroke="currentColor" opacity={0.12} />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={0} angle={-18} dy={8} height={48} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#D86D3E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className={wrap} aria-label="GPA distribution">
        <h3 className={cardTitle}>GPA distribution</h3>
        <div className="h-52 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gpa} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 5" stroke="currentColor" opacity={0.12} />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#B4806A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
