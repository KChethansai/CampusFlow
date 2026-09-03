import { checkEligibility } from '../src/services/eligibility.service.js';

describe('Eligibility Service', () => {
  const baseDrive = {
    eligibility: { minCGPA: 7.0, maxBacklogs: 1, graduationYear: 2026 }
  };

  it('should pass eligible student', () => {
    const student = { profile: { cgpa: 8.5, backlogs: 0, batchYear: 2026 } };
    const result = checkEligibility(student, baseDrive);
    expect(result.eligible).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('should fail student low CGPA', () => {
    const student = { profile: { cgpa: 5.5, backlogs: 0, batchYear: 2026 } };
    const result = checkEligibility(student, baseDrive);
    expect(result.eligible).toBe(false);
    expect(result.failures[0]).toMatch(/CGPA/i);
  });

  it('should fail student many backlogs', () => {
    const student = { profile: { cgpa: 8.0, backlogs: 3, batchYear: 2026 } };
    const result = checkEligibility(student, baseDrive);
    expect(result.eligible).toBe(false);
    expect(result.failures[0]).toMatch(/backlog/i);
  });

  it('should fail student wrong graduation year', () => {
    const student = { profile: { cgpa: 8.0, backlogs: 0, batchYear: 2025 } };
    const result = checkEligibility(student, baseDrive);
    expect(result.eligible).toBe(false);
    expect(result.failures[0]).toMatch(/Graduation year/i);
  });

  it('should accumulate multiple failures', () => {
    const student = { profile: { cgpa: 5.0, backlogs: 5, batchYear: 2024 } };
    const result = checkEligibility(student, baseDrive);
    expect(result.eligible).toBe(false);
    expect(result.failures).toHaveLength(3);
  });

  it('should pass when drive eligibility criteria', () => {
    const student = { profile: { cgpa: 5.0, backlogs: 5, batchYear: 2020 } };
    const result = checkEligibility(student, { eligibility: {} });
    expect(result.eligible).toBe(true);
  });

  it('should handle student missing profile gracefully', () => {
    const student = {};
    const result = checkEligibility(student, baseDrive);
    expect(result.eligible).toBe(false);
    expect(result.failures.length).toBeGreaterThan(0);
  });
});