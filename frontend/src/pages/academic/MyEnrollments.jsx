// MyEnrollments: student-facing course catalog + self-enroll/drop.
// Endpoints preserved: GET /enrollments, GET /courses,
// POST /enrollments/me, DELETE /enrollments/me/:id.
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { EmptyState, LoadingState, PageHeader, StatusPill } from '../../components/ui/primitives';
import { btnClass } from '../../system/tokens';

function MyEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [enrRes, courseRes] = await Promise.allSettled([
        api.get('/enrollments'),
        api.get('/courses')
      ]);
      if (enrRes.status === 'fulfilled') setEnrollments(enrRes.value.data.data || []);
      if (courseRes.status === 'fulfilled') setCourses(courseRes.value.data.data || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const activeEnrollmentIds = useMemo(
    () =>
      new Set(
        enrollments
          .filter((e) => e.status === 'active')
          .map((e) => String(e.course?._id || e.course))
      ),
    [enrollments]
  );

  const enroll = async (courseId) => {
    setBusy(`enroll-${courseId}`);
    try {
      await api.post('/enrollments/me', { course: courseId });
      toast.success('Enrolled successfully');
      const { data } = await api.get('/enrollments');
      setEnrollments(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll');
    } finally {
      setBusy(null);
    }
  };

  const drop = async (enrollmentId) => {
    setBusy(`drop-${enrollmentId}`);
    try {
      await api.delete(`/enrollments/me/${enrollmentId}`);
      toast.success('Course dropped');
      const { data } = await api.get('/enrollments');
      setEnrollments(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to drop course');
    } finally {
      setBusy(null);
    }
  };

  const myEnrollments = enrollments.filter((e) => e.status === 'active');

  return (
    <div>
      <PageHeader
        title="My Courses"
        subtitle={`${myEnrollments.length} active enrollments · browse the catalog to enroll in more`}
      />

      {loading ? (
        <LoadingState label="Loading courses…" />
      ) : (
        <>
          <h2 className="font-display text-lg font-semibold text-[var(--cf-ink)] mb-3">
            Enrolled <span className="brutal-tag bg-volt ml-1 px-2 py-0.5 text-[11px] font-bold tabular-nums">{myEnrollments.length}</span>
          </h2>
          {myEnrollments.length === 0 ? (
            <div className="card-brutal p-6 mb-8">
              <p className="text-sm text-[var(--cf-ink-mute)]">
                You are not enrolled in any courses yet. Pick one from the
                catalog below.
              </p>
            </div>
          ) : (
            <div className="card-brutal overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gold border-b-2 border-[var(--cf-ink)]">
                    <tr>
                      <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Course</th>
                      <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Department</th>
                      <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Year / Semester</th>
                      <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Status</th>
                      <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--cf-line)]">
                    {myEnrollments.map((e) => (
                      <tr key={e._id} className="hover:bg-black/[.02] dark:hover:bg-white/[.04] transition-colors">
                        <td className="px-4 py-3 font-medium">
                          {e.course?.name || '—'}
                          <span className="block text-xs text-[var(--cf-ink-mute)] font-normal">
                            {e.course?.code || ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--cf-ink-soft)]">
                          {e.course?.department?.name || '—'}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {e.academicYear} / Sem {e.semester}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={e.status}>{e.status}</StatusPill>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => drop(e._id)}
                            disabled={busy === `drop-${e._id}`}
                            className={btnClass('outline', 'small')}
                          >
                            {busy === `drop-${e._id}` ? 'Dropping...' : 'Leave'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <h2 className="font-display text-lg font-semibold text-[var(--cf-ink)] mb-3">
            Course Catalog
          </h2>
          <div className="card-brutal overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-[var(--cf-ink)] bg-[var(--cf-surface-2)]">
                  <tr>
                    <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Course</th>
                    <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Code</th>
                    <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Department</th>
                    <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Duration</th>
                    <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--cf-line)]">
                  {courses.map((course) => {
                    const enrolled = activeEnrollmentIds.has(String(course._id));
                    return (
                      <tr key={course._id} className="hover:bg-black/[.02] dark:hover:bg-white/[.04] transition-colors">
                        <td className="px-4 py-3 font-medium">{course.name}</td>
                        <td className="px-4 py-3">
                          <span className="brutal-tag bg-[var(--cf-surface-2)] px-2 py-0.5 text-[11px] font-bold">
                            {course.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--cf-ink-soft)]">
                          {course.department?.name || '—'}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {course.durationYears} yrs · {course.totalSemesters} sems
                        </td>
                        <td className="px-4 py-3 text-right">
                          {enrolled ? (
                            <StatusPill status="selected">Enrolled</StatusPill>
                          ) : (
                            <button
                              onClick={() => enroll(course._id)}
                              disabled={busy === `enroll-${course._id}`}
                              className={btnClass('primary', 'small')}
                            >
                              {busy === `enroll-${course._id}` ? 'Enrolling...' : 'Enroll'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {courses.length === 0 && (
              <div className="p-5"><EmptyState title="No courses available" hint="Check back once the catalog is published." /></div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MyEnrollments;
