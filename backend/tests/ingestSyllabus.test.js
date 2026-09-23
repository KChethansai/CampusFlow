import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extractPath = path.join(backendRoot, 'seed', 'syllabus-extracted.json');

describe('AR24 syllabus ingestion review artifact', () => {
  it('contains only the 20 in-scope department/year/semester tables with numeric workload', () => {
    const artifact = JSON.parse(readFileSync(extractPath, 'utf8'));
    const expectedDepartments = [
      'Artificial Intelligence',
      'Computer Science and Engineering',
      'Information Technology',
      'Electronics and Communication Engineering',
      'Civil Engineering',
    ];
    expect(artifact.tables).toHaveLength(20);
    expect(new Set(artifact.tables.map((table) => table.dept))).toEqual(new Set(expectedDepartments));
    expect(artifact.tables.every((table) => table.rows.every((row) =>
      ['l', 't', 'p', 'credits'].every((key) => Number.isFinite(row[key]))))).toBe(true);
    expect(artifact.tables.some((table) => table.rows.some((row) => row.electiveGroup && row.options?.length))).toBe(true);
    // Approved only via human gate (approvedAt set); unapproved during drafting.
    expect(
      artifact.meta.review.approved === false ||
      (artifact.meta.review.approved === true && !!artifact.meta.review.approvedAt),
    ).toBe(true);
  });

  it('extracts outcomes and all five units for the page 7 EMA3181 syllabus', () => {
    const artifact = JSON.parse(readFileSync(extractPath, 'utf8'));
    const syllabus = artifact.courses.find((course) =>
      course.code === 'EMA3181' && course.dept === 'Artificial Intelligence' && course.pages.includes(7));
    expect(syllabus).toBeDefined();
    expect(syllabus.outcomes).toEqual(expect.arrayContaining([
      'Design static web pages using HTML.',
      'Create single-page web applications using Angular.',
    ]));
    expect(syllabus.units.map((unit) => unit.title)).toEqual(['UNIT-I', 'UNIT-II', 'UNIT-III', 'UNIT-IV', 'UNIT-V']);
    expect(syllabus.references.length).toBeGreaterThan(0);
  });

  it('merges the page 31 MERN lab syllabus and weekly experiments into EMA3281', () => {
    const artifact = JSON.parse(readFileSync(extractPath, 'utf8'));
    const syllabus = artifact.courses.find((course) =>
      course.code === 'EMA3281' && course.dept === 'Artificial Intelligence' && course.pages.includes(30));
    expect(syllabus).toBeDefined();
    expect(syllabus.outcomes).toEqual(expect.arrayContaining([
      'Describe web architectures and MERN stack concepts.',
      'Construct Node.js and Express server applications.',
    ]));
    expect(syllabus.units.map((unit) => unit.title)).toEqual(['UNIT-I', 'UNIT-II', 'UNIT-III', 'UNIT-IV', 'UNIT-V']);
    expect(syllabus.references.length).toBeGreaterThan(0);
    expect(syllabus.pages).toContain(31);
    expect(syllabus.labExperiments).toHaveLength(14);
    expect(syllabus.labExperiments[0]).toMatch(/Week 1: Identification of the problem/i);
  });

  it('keeps syllabus extraction coverage above the regression floor without requiring every course to have theory sections', () => {
    const { stats } = JSON.parse(readFileSync(extractPath, 'utf8')).meta;
    expect(stats.coursesWithOutcomes).toBeGreaterThanOrEqual(100);
    expect(stats.coursesWithUnits).toBeGreaterThanOrEqual(70);
    expect(stats.coursesWithWeeks).toBeGreaterThan(0);
  });

  it('refuses database commit until a human has approved the review JSON', () => {
    // Use an unapproved copy so the gate is tested even after the real artifact is approved.
    const artifact = JSON.parse(readFileSync(extractPath, 'utf8'));
    artifact.meta.review = { approved: false };
    const tmpPath = path.join(backendRoot, 'seed', '.unapproved-review.tmp.json');
    writeFileSync(tmpPath, JSON.stringify(artifact));
    const result = spawnSync(process.execPath, ['scripts/ingestSyllabus.js', '--commit', '--input', tmpPath], {
      cwd: backendRoot,
      encoding: 'utf8',
    });
    rmSync(tmpPath, { force: true });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/review approval required/);
  });
});
