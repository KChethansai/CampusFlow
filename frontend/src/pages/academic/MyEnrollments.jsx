// MyEnrollments: student-facing course catalog + self-enroll/drop.
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  badge,
  btnClass,
  cardClass,
  emptyState,
  loadingState,
  pageHeading,
  pageSubheading,
  statusColors,
  tableCell,
  tableCellHead,
  tableClass,
  tableHeadClass,
  tableRowHover
} from '../../styles/common';

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
      <div className="mb-6">
        <h1 className={pageHeading}>My Courses</h1>
        <p className={pageSubheading}>
          {myEnrollments.length} active enrollments · browse the catalog to
          enroll in more
        </p>
      </div>

      {loading ? (
        <p className={loadingState}>Loading...</p>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-[var(--cf-ink)] mb-3">Enrolled</h2>
          {myEnrollments.length === 0 ? (
            <div className={`${cardClass} p-6 mb-8`}>
              <p className="text-sm text-[var(--cf-ink-mute)]">
                You are not enrolled in any courses yet. Pick one from the
                catalog below.
              </p>
            </div>
          ) : (
            <div className={`${cardClass} overflow-hidden mb-8`}>
              <table className={tableClass}>
                <thead className={tableHeadClass}>
                  <tr>
                    <th className={tableCellHead}>Course</th>
                    <th className={tableCellHead}>Department</th>
                    <th className={tableCellHead}>Year / Semester</th>
                    <th className={tableCellHead}>Status</th>
                    <th className={tableCellHead} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--cf-line)]">
                  {myEnrollments.map((e) => (
                    <tr key={e._id} className={tableRowHover}>
                      <td className={`${tableCell} font-medium`}>
                        {e.course?.name || '—'}
                        <span className="block text-xs text-[var(--cf-ink-mute)] font-normal">
                          {e.course?.code || ''}
                        </span>
                      </td>
                      <td className={`${tableCell} text-[var(--cf-ink-soft)]`}>
                        {e.course?.department?.name || '—'}
                      </td>
                      <td className={tableCell}>
                        {e.academicYear} / Sem {e.semester}
                      </td>
                      <td className={tableCell}>
                        <span className={badge(statusColors.active)}>
                          {e.status}
                        </span>
                      </td>
                      <td className={`${tableCell} text-right`}>
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
          )}

          <h2 className="text-lg font-semibold text-[var(--cf-ink)] mb-3">
            Course Catalog
          </h2>
          <div className={`${cardClass} overflow-hidden`}>
            <table className={tableClass}>
              <thead className={tableHeadClass}>
                <tr>
                  <th className={tableCellHead}>Course</th>
                  <th className={tableCellHead}>Code</th>
                  <th className={tableCellHead}>Department</th>
                  <th className={tableCellHead}>Duration</th>
                  <th className={tableCellHead} />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cf-line)]">
                {courses.map((course) => {
                  const enrolled = activeEnrollmentIds.has(String(course._id));
                  return (
                    <tr key={course._id} className={tableRowHover}>
                      <td className={`${tableCell} font-medium`}>{course.name}</td>
                      <td className={tableCell}>
                        <span className="bg-black/[.05] dark:bg-white/10 px-2 py-0.5 rounded-full text-xs">
                          {course.code}
                        </span>
                      </td>
                      <td className={`${tableCell} text-[var(--cf-ink-soft)]`}>
                        {course.department?.name || '—'}
                      </td>
                      <td className={tableCell}>
                        {course.durationYears} yrs · {course.totalSemesters} sems
                      </td>
                      <td className={`${tableCell} text-right`}>
                        {enrolled ? (
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            Enrolled
                          </span>
                        ) : (
                          <button
                            onClick={() => enroll(course._id)}
                            disabled={busy === `enroll-${course._id}`}
                            className={btnClass('primary', 'small')}
                          >
                            {busy === `enroll-${course._id}`
                              ? 'Enrolling...'
                              : 'Enroll'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {courses.length === 0 && (
              <p className={emptyState}>No courses available.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MyEnrollments;
