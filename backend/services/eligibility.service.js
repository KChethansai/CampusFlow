export function checkEligibility(student, drive) {
  const failures = [];
  const rules = drive.eligibility || {};

  if (rules.minCGPA != null && (student.profile?.cgpa || 0) < rules.minCGPA) {
    failures.push(`CGPA ${student.profile?.cgpa} is below minimum requirement of ${rules.minCGPA}`);
  }
  if (rules.maxBacklogs != null && (student.profile?.backlogs || 0) > rules.maxBacklogs) {
    failures.push(`Active backlogs (${student.profile?.backlogs}) exceed maximum limit of ${rules.maxBacklogs}`);
  }
  if (rules.graduationYear != null && student.profile?.batchYear !== rules.graduationYear) {
    failures.push(`Graduation year (${student.profile?.batchYear}) does not match drive requirement (${rules.graduationYear})`);
  }
  if (Array.isArray(rules.allowedDepartments) && rules.allowedDepartments.length > 0) {
    const studentDept = String(student.department?._id || student.department || '');
    const allowed = rules.allowedDepartments.map((d) => String(d?._id || d));
    if (!allowed.includes(studentDept)) {
      failures.push('Student department is not eligible for this drive');
    }
  }

  return { eligible: failures.length === 0, failures, reasons: failures };
}