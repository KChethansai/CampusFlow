// Schedule: weekly timetable grid + today list. Endpoint preserved: GET /timetable.
import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from '../../components/ui/primitives';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const JS_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ROLE_HINT = {
  student: 'your enrolled classes',
  faculty: 'classes you teach',
  hod: 'your department schedule',
  college_admin: 'all scheduled classes',
  super_admin: 'all scheduled classes',
};

function Schedule() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/timetable');
      setEntries(data.data || []);
    } catch {
      setError('Could not load the schedule — check your connection and retry.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const byDay = useMemo(() => {
    const groups = Object.fromEntries(DAYS.map((d) => [d, []]));
    [...entries]
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
      .forEach((e) => {
        if (groups[e.dayOfWeek]) groups[e.dayOfWeek].push(e);
      });
    return groups;
  }, [entries]);

  const today = JS_DAY[new Date().getDay()];
  const todayList = byDay[today] || [];

  return (
    <div>
      <PageHeader
        title="Schedule"
        subtitle={`${entries.length} classes · ${ROLE_HINT[user?.role] || 'your schedule'}`}
      />

      {loading ? (
        <LoadingState label="Loading schedule…" />
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={fetchSchedule} />
        </Card>
      ) : entries.length === 0 ? (
        <Card><EmptyState title="No classes scheduled" hint="Classes appear here once the timetable is published." /></Card>
      ) : (
        <div className="space-y-4">
          <section aria-label="Today's classes" className="rounded-3xl border border-[var(--cf-line)] bg-[var(--cf-surface)]/70 backdrop-blur-xl p-5">
            <h2 className="font-display text-base font-semibold mb-3">
              Today{today === 'Sun' ? ' (Sun — no classes)' : ''}
              <span className="ml-2 text-xs font-bold tabular-nums text-[var(--cf-ink-mute)]">{todayList.length}</span>
            </h2>
            {todayList.length === 0 ? (
              <p className="text-sm text-[var(--cf-ink-mute)]">Nothing scheduled for today.</p>
            ) : (
              <ul className="space-y-2">
                {todayList.map((e) => (
                  <li key={e._id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/50 px-4 py-3 text-sm">
                    <span className="font-mono text-xs font-bold tabular-nums text-[var(--cf-ink-soft)]">
                      {e.startTime}–{e.endTime}
                    </span>
                    <span className="font-medium">{e.subject?.name || 'Class'}</span>
                    <span className="text-[var(--cf-ink-mute)]">{e.room ? `${e.room.name} (${e.room.code})` : '—'}</span>
                    <span className="text-[var(--cf-ink-mute)]">{e.faculty?.name || ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Weekly schedule" className="rounded-3xl border border-[var(--cf-line)] bg-[var(--cf-surface)]/70 backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60">
                  <tr>
                    <th className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Day</th>
                    <th className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Time</th>
                    <th className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Subject</th>
                    <th className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Room</th>
                    <th className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Faculty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--cf-line)]">
                  {DAYS.flatMap((day) =>
                    byDay[day].length === 0 ? (
                      <tr key={day}>
                        <td className="px-4 py-3 font-semibold">{day}</td>
                        <td colSpan={4} className="px-4 py-3 text-[var(--cf-ink-mute)]">—</td>
                      </tr>
                    ) : (
                      byDay[day].map((e, i) => (
                        <tr key={e._id} className="hover:bg-black/[.02] dark:hover:bg-white/[.04] transition-colors">
                          {i === 0 && (
                            <td rowSpan={byDay[day].length} className="px-4 py-3 font-semibold align-top">{day}</td>
                          )}
                          <td className="px-4 py-3 font-mono text-xs tabular-nums">{e.startTime}–{e.endTime}</td>
                          <td className="px-4 py-3 font-medium">{e.subject?.name || '—'}</td>
                          <td className="px-4 py-3 text-[var(--cf-ink-soft)]">
                            {e.room ? `${e.room.name} (${e.room.code})` : '—'}
                          </td>
                          <td className="px-4 py-3 text-[var(--cf-ink-soft)]">{e.faculty?.name || '—'}</td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Schedule;
