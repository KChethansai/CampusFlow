// Academic ingestion A1 (dry-run): extract course-structure tables + syllabus bodies
// from the consolidated AU-R24 PDF into seed/syllabus-extracted.json.
//
// Usage: node scripts/ingestSyllabus.js --dry-run [--pdf <path>] [--out <path>]
//        node scripts/ingestSyllabus.js --commit --institution-code <code> [--institution-name <name>] [--input <reviewed-json>]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFParse } from 'pdf-parse';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { InstitutionModel } from '../models/InstitutionModel.js';
import { DepartmentModel } from '../models/DepartmentModel.js';
import { CourseModel } from '../models/CourseModel.js';
import { SubjectModel } from '../models/SubjectModel.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_PDF = '/home/chethan/Downloads/Consolidated_3_4_Year_BTech_R24.pdf';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};
const pdfPath = opt('--pdf') || DEFAULT_PDF;
const outPath = opt('--out') || path.join(ROOT, 'seed', 'syllabus-extracted.json');
const inputPath = opt('--input') || outPath;
const IN_SCOPE = [
  'Artificial Intelligence',
  'Computer Science and Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Civil Engineering',
];
const DEPT_CODES = new Map([
  ['Artificial Intelligence', 'AI'],
  ['Computer Science and Engineering', 'CSE'],
  ['Information Technology', 'IT'],
  ['Electronics and Communication Engineering', 'ECE'],
  ['Civil Engineering', 'CIVIL'],
]);

function assertReviewedArtifact(data) {
  if (data?.meta?.review?.approved !== true || !data.meta.review.approvedAt) {
    throw new Error('review approval required: set meta.review.approved=true and approvedAt on the reviewed JSON');
  }
  if (!Array.isArray(data.tables) || !Array.isArray(data.courses)) throw new Error('invalid reviewed extract');
  const invalid = data.tables.some((t) => !IN_SCOPE.includes(t.dept) || !['III', 'IV'].includes(t.year) || !['I', 'II'].includes(t.sem));
  if (invalid) throw new Error('reviewed extract contains out-of-scope tables');
  const missing = IN_SCOPE.flatMap((dept) => ['III|I', 'III|II', 'IV|I', 'IV|II']
    .filter((key) => !data.tables.some((t) => t.dept === dept && `${t.year}|${t.sem}` === key))
    .map((key) => `${dept} ${key.replace('|', ' year, ')} semester`));
  if (missing.length) throw new Error(`reviewed extract is missing required tables: ${missing.join('; ')}`);
  for (const t of data.tables) {
    if (t.rows.some((r) => !Number.isFinite(r.credits) || !Number.isFinite(r.l) || !Number.isFinite(r.t) || !Number.isFinite(r.p))) {
      throw new Error(`table ${t.dept} ${t.year}/${t.sem} contains invalid L/T/P/credit values`);
    }
    for (const r of t.rows) {
      if (r.courseName && (/^--\s*/.test(r.courseName) || /MOOCS#/.test(r.courseName))) {
        throw new Error(`table ${t.dept} ${t.year}/${t.sem} contains scrap row: ${r.courseName.slice(0, 60)}`);
      }
      for (const o of r.options || []) {
        if (!o.courseName || /^(theoretical|exploratory|practical)$/i.test(o.courseName)) {
          throw new Error(`table ${t.dept} ${t.year}/${t.sem} contains nameless option ${o.code || '?'}`);
        }
      }
    }
  }
  if (JSON.stringify(data).includes('"None"')) throw new Error('reviewed extract contains "None" string values');
}

async function commitReviewedArtifact(filePath) {
  const data = JSON.parse(await readFile(filePath, 'utf8'));
  assertReviewedArtifact(data);
  const institutionCode = opt('--institution-code')?.trim().toUpperCase();
  const institutionName = opt('--institution-name')?.trim() || 'Anurag University';
  if (!institutionCode) throw new Error('--institution-code is required; commit target must be explicit');
  await mongoose.connect(env.dbUrl);
  try {
    const institutions = await InstitutionModel.find({ code: institutionCode, name: institutionName }).limit(2);
    if (institutions.length !== 1) throw new Error(`expected exactly one institution matching code ${institutionCode} and name ${institutionName}; found ${institutions.length}`);
    const institution = institutions[0];
    const deptDocs = new Map();
    const courseDocs = new Map();
    for (const deptName of IN_SCOPE) {
      const deptCode = DEPT_CODES.get(deptName);
      const department = await DepartmentModel.findOneAndUpdate(
        { institution: institution._id, code: deptCode },
        { $set: { name: deptName, isActive: true }, $setOnInsert: { institution: institution._id, code: deptCode } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
      deptDocs.set(deptName, department);
      const courseCode = `BT${deptCode}`;
      const course = await CourseModel.findOneAndUpdate(
        { institution: institution._id, code: courseCode },
        { $set: { name: `B.Tech in ${deptName}`, department: department._id, isActive: true }, $setOnInsert: { institution: institution._id, code: courseCode, durationYears: 4, totalSemesters: 8 } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
      courseDocs.set(deptName, course);
    }
    const syllabusByKey = new Map(data.courses.map((c) => [`${c.dept}|${c.code || ''}|${norm(c.title)}`, c]));
    let upserted = 0;
    for (const table of data.tables) {
      const semester = (table.year === 'III' ? 4 : 6) + (table.sem === 'I' ? 1 : 2);
      for (const [index, row] of table.rows.entries()) {
        const elective = Array.isArray(row.options);
        const name = elective ? row.electiveGroup || row.category || `Elective ${index + 1}` : row.courseName;
        if (!name) throw new Error(`missing subject name at ${table.dept} ${table.year}/${table.sem} row ${index + 1}`);
        const code = row.code || `EL-${DEPT_CODES.get(table.dept)}-${table.year}-${table.sem}-${index + 1}`;
        const body = elective ? null : syllabusByKey.get(`${table.dept}|${row.code || ''}|${norm(row.courseName)}`);
        const syllabus = body ? {
          outcomes: body.outcomes || [], units: body.units || [],
          labExperiments: body.labExperiments || [], references: body.references || [],
        } : undefined;
        await SubjectModel.findOneAndUpdate(
          { course: courseDocs.get(table.dept)._id, semester, code: code.toUpperCase() },
          { $set: {
            institution: institution._id, name, credits: row.credits, category: row.category,
            l: row.l, t: row.t, p: row.p, ...(elective ? { electiveGroup: { name: row.electiveGroup || name, options: row.options.map((o) => ({ code: o.code || undefined, courseName: o.courseName || undefined })) } } : { electiveGroup: undefined }),
            ...(syllabus ? { syllabus } : {}), isActive: true,
          }, $setOnInsert: { course: courseDocs.get(table.dept)._id, code: code.toUpperCase() } },
          { upsert: true, runValidators: true, setDefaultsOnInsert: true },
        );
        upserted++;
      }
    }
    process.stdout.write(`commit complete: institution ${institution.code}, ${IN_SCOPE.length} departments, ${upserted} subjects upserted\n`);
  } finally {
    await mongoose.disconnect();
  }
}

const norm = (s) =>
  (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

const isFooterLine = (line) => {
  const t = line.trim();
  return (
    /^Program Structure and Syllabus of 3rd and 4th year B\.?\s*Tech\.?,?\s*\(AU-R24\)$/i.test(t) ||
    /^Page \d+ of \d+$/i.test(t) ||
    /meeting of the Academic Council|Detailed Agenda/i.test(t)
  );
};

const cleanPage = (text) =>
  text
    .split('\n')
    // Normalize dash variants so placeholder '--' and "OE – II" parse reliably.
    .map((l) => l.replace(/[\u2013\u2014\u2212]/g, '-').replace(/\t/g, ' ').replace(/[ \u00a0]+/g, ' ').trimEnd())
    .filter((l) => l.trim() !== '' && !isFooterLine(l))
    .join('\n');

const SECTION_RE = /B\.?\s*TECH\.?\s+(III|IV)\s+YEAR\s+(I|II)\s+SEMESTER/i;
const TABLE_HEAD_RE = /S\.?\s*No\s+Course\s*(Code|Hours)/i;
const CODE_RE = /\b([A-Z]{2,4}[0-9X]{4}|--)\b/;
const CODE_ONLY_RE = /^([A-Z]{2,4}[0-9X]{4})$/;
const SUBROW_RE = /^([A-Z]{2,4}[0-9X]{4})\s+(\d+\.\s*.*|.*)$/;
const ROW_START_RE = /^\d+\s+/;
const QUAD_RE = /^(\d{1,2}\s+\d{1,2}\s+\d{1,2}\s+\d{1,2})(?=\s|$)/;
// Category head: one base token (or a bare "(TAG)" when the table omits the
// base word) + any "(...)" tags + one optional "/ SUFFIX". Single base only:
// "Project Project Work" is category Project + name Project Work.
const CAT_WORD = '(?:Theoretical(?:\\s*(?:&|and)\\s*Practical)?|Practical|Exploratory|BS|Major|HSMC|Skill\\s+Enhancement|Ability\\s+Enhancement|Mini\\s+[Pp]roject|Seminar|Project|Viva(?:\\s*-?\\s*Voce)?|PR|SEM|OE(?:\\s*[-–]\\s*[IVX0-9]+)?|Summer\\s+Internship|(?:Open|Professional)\\s+Elective(?:\\s*[-–]?\\s*[IVX0-9]+)?)';
const CATEGORY_RE = new RegExp(
  `^((?:${CAT_WORD}|\\([^)]*\\))(?:\\s*\\([^)]*\\))*(?:\\s*\\/\\s*[A-Za-z]+(?:\\s+[A-Za-z]+){0,2})?)\\s+([\\s\\S]+)$`,
  'i',
);
const ELECTIVE_RE = /elective|open elective|professional elective|\(OE\)|\(PE\)/i;
const OPT_SPLIT_RE = /(?=\b\d+\.(?:\s|[A-Za-z]))/;
const OPT_NUM_RE = /^(\d+)\.\s*([\s\S]+)$/;

// Numeric cell or real null. Never the string "None".
const numOrNull = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (t === '' || /^(none|null|nan|--|n\/a)$/i.test(t)) return null;
    const n = Number(t);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

function parseMainRow(rowNo, lines, warnings, tctx) {
  const text = lines.join('\n');
  let rest = text.replace(/^\d+\s+/, '').trim();
  let code = null;
  const cm = rest.match(CODE_RE);
  if (cm) {
    code = cm[1] === '--' ? null : cm[1];
    rest = (rest.slice(0, cm.index) + ' ' + rest.slice(cm.index + cm[0].length)).trim();
    if (cm[1] === '--') warnings.push(`table ${tctx}: row ${rowNo} has placeholder code '--'`);
  }
  const quads = [...rest.matchAll(/\s(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})(?=\s|$)/g)];
  const nm = quads.find((m) => {
    const v = m.slice(1, 5).map(Number);
    return v[0] <= 9 && v[1] <= 9 && v[2] <= 30 && v[3] <= 20;
  });
  if (!nm) {
    warnings.push(`table ${tctx}: row ${rowNo} unparsed (no trailing L/T/P/credits): ${rest.replace(/\s+/g, ' ').slice(0, 120)}`);
    return { rowNo, code, category: '', courseName: rest.replace(/\s+/g, ' ').slice(0, 200), l: null, t: null, p: null, credits: null, unparsed: true };
  }
  const [, l, t, p, credits] = nm.map(Number);
  // Codes trailing after the quad (e.g. "2 0 4 4 EMA3271") belong to option rows.
  const trailingCodes = [...rest.slice(nm.index + nm[0].length).matchAll(/\b([A-Z]{2,4}[0-9X]{4})\b/g)].map((m) => m[1]);
  rest = rest.slice(0, nm.index).trim();
  let category = '';
  let namePart = rest;
  let multiLineName = false;
  const catm = rest.match(CATEGORY_RE);
  if (catm) {
    category = catm[1].replace(/\s+/g, ' ').trim();
    multiLineName = /\n/.test(catm[2]);
    namePart = catm[2].replace(/\s+/g, ' ').trim();
  } else {
    multiLineName = /\n/.test(rest);
    namePart = rest.replace(/\s+/g, ' ').trim();
    warnings.push(`table ${tctx}: row ${rowNo} unparsed-category: ${namePart.slice(0, 120)}`);
  }
  return { rowNo, code, category, l, t, p, credits, namePart, multiLineName, trailingCodes };
}

function splitOptions(namePart) {
  // Returns { name, options: [{n, name}] } splitting on "N. " markers.
  const cleanName = (s) =>
    s.replace(/\s+/g, ' ').replace(/^\d+\.\s*/, '').replace(/[*#]+\/?$/, '').trim();
  const parts = namePart.split(OPT_SPLIT_RE);
  if (parts.length < 2 && !OPT_NUM_RE.test(namePart.trim())) return { name: namePart, options: [] };
  const head = cleanName(parts[0]);
  const options = parts
    .slice(OPT_NUM_RE.test(namePart.trim()) ? 0 : 1)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(OPT_NUM_RE);
      return m ? { n: Number(m[1]), name: cleanName(m[2]) } : null;
    })
    .filter(Boolean);
  return { name: head, options };
}

const SYLLABUS_MARKER_RE = /Course Outcomes|UNIT\s*-?\s*[IVX]+|Text Books|Reference Books|List of Experiments|Week\s+\d|Dept\.\s*of|Code\s+Category/i;
const tablePageHasHours = (text) => TABLE_HEAD_RE.test(text) && /Hours\s*(per|\/)\s*week/i.test(text);

const deptFromBanner = (text) => {
  const m = text.match(
    /Program Structure\s*(?:&|and)\s*\n?Syllabus\s+of\s*\n?B\.?\s*Tech\s+([\s\S]{1,160}?)\(Academic Regulations\s*-\s*AR24\)/,
  );
  if (!m) return null;
  const dept = m[1]
    .replace(/^(((III|IV)\s*(Years?|Year)?\s*(&|and)?\s*)+(IV\s*(Years?|Year)?)?)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return dept || null;
};

function parseTableBlocks(pages, warnings, notes, moocCatalog) {
  // pages: [{ num, text }] cleaned. Returns tables: [{dept, year, sem, page, rows}].
  const tables = [];
  let currentDept = 'Unknown';
  let lastSection = null;
  let lastTablePage = -10;

  for (const page of pages) {
    const dept = deptFromBanner(page.text);
    if (dept && !TABLE_HEAD_RE.test(page.text)) {
      currentDept = dept;
      continue;
    }
    if (dept) currentDept = dept;

    // Split page into sections at each semester header.
    const headerIdx = [...page.text.matchAll(new RegExp(SECTION_RE, 'gi'))].map((m) => ({
      year: m[1],
      sem: m[2],
      index: m.index,
    }));
    // Split into table blocks at each S.No header line; keep TOTAL terminator.
    const lines = page.text.split('\n');
    const hasTable = tablePageHasHours(page.text);
    const hasRows = lines.some((l) => ROW_START_RE.test(l));
    if (!hasTable && !hasRows) continue; // syllabus/banner page

    const headPos = [...page.text.matchAll(/S\.?\s*No\s+Course\s*(?:Code|Hours)/gi)].map((m) => m.index);
    const chunks = [];
    if (!hasTable) {
      // Continuation = rows spilling across pages: row-start lines must carry
      // their L/T/P/credit quad (elective pool lists like p248 have none).
      const hasQuadRow = /^\d+\s+.*\d{1,2}\s+\d{1,2}\s+\d{1,2}\s+\d{1,2}\s*$/m.test(page.text);
      if (hasRows && hasQuadRow && !SYLLABUS_MARKER_RE.test(page.text) && lastSection && page.num === lastTablePage + 1) {
        chunks.push({ text: page.text, continuation: true });
      } else {
        continue;
      }
    } else {
      for (let i = 0; i < headPos.length; i++) {
        chunks.push({ text: page.text.slice(headPos[i], headPos[i + 1] ?? undefined), continuation: false });
      }
    }

    for (const chunk of chunks) {
      // Headers belonging to this chunk: those inside its span, else the
      // nearest preceding header on the page (headers sit above the S.No head).
      const spanStart = chunk.continuation ? 0 : page.text.indexOf(chunk.text);
      const spanEnd = spanStart + chunk.text.length;
      let inSpan = headerIdx.filter((h) => h.index >= spanStart && h.index < spanEnd);
      if (inSpan.length === 0) {
        const prev = headerIdx.filter((h) => h.index < spanStart).pop();
        if (prev) inSpan = [prev];
      }
      // Cut chunk at TOTAL / guidelines / footnotes.
      const cutAt = chunk.text.search(/^(TOTAL|Total|Key guidelines for NPTEL)/m);
      const body = (cutAt === -1 ? chunk.text : chunk.text.slice(0, cutAt)).split('\n').filter((l) => !TABLE_HEAD_RE.test(l));

      const rows = [];
      let current = null;
      const flush = () => {
        if (current) rows.push(current);
        current = null;
      };
      for (const raw of body) {
        const line = raw.trim();
        if (!line || /^(L\s+T\s+P|Hours per|Course Name|Credits)\b/i.test(line)) continue;
        if (/^[*#]/.test(line) || /^The summer internship/i.test(line)) continue; // footnotes
        const openQuad = current ? /\s\d{1,2}\s+\d{1,2}\s+\d{1,2}\s+\d{1,2}(?=\s|$)/.test(current.lines.join(' ')) : false;
        // Bare serial number on its own line starts a new row once the open
        // row already has its L/T/P/credits (else it belongs to the open row).
        if (/^\d{1,3}$/.test(line)) {
          if (current && openQuad) {
            flush();
          }
          if (current) {
            current.lines.push(line);
          } else {
            current = { no: Number(line), lines: [], subRows: [] };
          }
          continue;
        }
        // L/T/P/credits spilling onto their own line belong to the open row.
        if (/^\d{1,2}\s+\d{1,2}\s+\d{1,2}\s+\d{1,2}\s*$/.test(line) && current) {
          current.lines.push(line);
          continue;
        }
        // Quad + next elective option sharing one line ("3 0 0 3  EMA3284 2. ...").
        const splitLine = line.match(/^(\d{1,2}\s+\d{1,2}\s+\d{1,2}\s+\d{1,2})\s+([A-Z]{2,4}[0-9X]{4}\s+\d+\.[\s\S]*)$/);
        if (splitLine && current) {
          current.lines.push(splitLine[1]);
          const optm = splitLine[2].match(/^([A-Z]{2,4}[0-9X]{4})\s+(\d+)\.\s*([\s\S]+)$/);
          current.subRows.push({ code: optm[1], n: Number(optm[2]), name: optm[3].replace(/\s+/g, ' ').trim() });
          continue;
        }
        // Quad followed only by trailing option codes ("2 0 4 4 EMA3271").
        const quadCodes = line.match(QUAD_RE);
        if (quadCodes && current && CODE_RE.test(line.slice(quadCodes[0].length))) {
          current.lines.push(quadCodes[1]);
          for (const cm of line.slice(quadCodes[0].length).matchAll(/\b([A-Z]{2,4}[0-9X]{4})\b/g)) {
            current.subRows.push({ code: cm[1], n: null, name: '' });
          }
          continue;
        }
        // Bare option code on its own line belongs to the open row's options.
        if (CODE_ONLY_RE.test(line) && current) {
          current.subRows.push({ code: line, n: null, name: '' });
          continue;
        }
        const sub = line.match(SUBROW_RE);
        if (sub && current && !ROW_START_RE.test(line)) {
          const optm = sub[2].match(OPT_NUM_RE);
          current.subRows.push({
            code: sub[1],
            n: optm ? Number(optm[1]) : null,
            name: (optm ? optm[2] : sub[2]).replace(/\s+/g, ' ').trim(),
          });
          continue;
        }
        if (ROW_START_RE.test(line)) {
          flush();
          current = { no: Number(line.match(/^(\d+)/)[1]), lines: [line], subRows: [] };
        } else if (current) {
          // Wrapped parenthetical ("(PE-" / "III) 1. ..."): join into the
          // open line instead of starting a stray row.
          const joined = current.lines.join(' ');
          const unbalanced = (joined.match(/\(/g) || []).length > (joined.match(/\)/g) || []).length;
          if (unbalanced && !QUAD_RE.test(line) && !CODE_ONLY_RE.test(line)) {
            current.lines[current.lines.length - 1] =
              `${current.lines[current.lines.length - 1]} ${line}`.replace(/\s+/g, ' ').trim();
            continue;
          }
          // Wrapped elective-option name: the open row already has its
          // L/T/P/credits, so this continues the last option's name.
          if (openQuad && current.subRows.length > 0) {
            const last = current.subRows[current.subRows.length - 1];
            last.name = `${last.name} ${line}`.replace(/\s+/g, ' ').trim();
            continue;
          }
          // Possible "CODE Name" sub-row without numbering (e.g. ESI3X01 Summer Internship)
          const bare = line.match(/^([A-Z]{2,4}[0-9X]{4})\s+([^0-9][\s\S]*)$/);
          if (bare && !/\s(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})(?=\s|$)/.test(line)) {
            current.subRows.push({ code: bare[1], n: null, name: bare[2].replace(/\s+/g, ' ').trim() });
          } else {
            current.lines.push(line);
          }
        } else if (!chunk.continuation) {
          // Stray line before first row (e.g. wrapped header) — ignore silently.
        }
      }
      flush();
      if (rows.length === 0) continue;

      // Resolve year/sem: chunk headers in order; course-code vote as tiebreak.
      const vote = {};
      for (const r of rows) {
        const joined = r.lines.join(' ');
        const m = joined.match(/\b[A-Z]{2,4}([0-9X])([0-9X])[0-9X]{2}\b/);
        if (m && m[1] !== 'X' && m[2] !== 'X') {
          const k = `${m[1] === '3' ? 'III' : m[1] === '4' ? 'IV' : '?'}|${m[2] === '1' ? 'I' : m[2] === '2' ? 'II' : '?'}`;
          vote[k] = (vote[k] || 0) + 1;
        }
      }
      const ranked = Object.entries(vote).sort((a, b) => b[1] - a[1]);
      const topVote = ranked[0]?.[0];
      let year = inSpan[0]?.year ?? lastSection?.year ?? null;
      let sem = inSpan[0]?.sem ?? lastSection?.sem ?? null;
      if (chunk.continuation && lastSection) {
        year = lastSection.year;
        sem = lastSection.sem;
      }
      // Course codes disambiguate shared headers (both sem headers sit above
      // one S.No head on pages like p247): the vote wins, headers tiebreak.
      if (topVote) {
        const [vy, vs] = topVote.split('|');
        if (vy !== '?' && vs !== '?' && (vy !== year || vs !== sem)) {
          notes.push(`page ${page.num}: header says ${year}Y-${sem}S but codes vote ${vy}/${vs} — using vote`);
          year = vy;
          sem = vs;
        }
      }
      const tctx = `${currentDept} ${year}Y-${sem}S p${page.num}`;
      const optOf = (s) => ({ code: s.code || null, courseName: (s.name || '').trim() || null });
      const outRows = [];
      for (const r of rows) {
        const parsed = parseMainRow(r.no, r.lines, warnings, tctx);
        for (const c of parsed.trailingCodes || []) r.subRows.unshift({ code: c, n: null, name: '' });
        if (parsed.namePart !== undefined) {
          const { name, options } = splitOptions(parsed.namePart);
          const inlineOpts = options.map((o, i) => ({
            code: i === 0 ? parsed.code : r.subRows[i - 1]?.code ?? null,
            courseName: o.name,
          }));
          if (inlineOpts.length > 0 || r.subRows.length > 0) {
            // Elective slot. Rows whose category isn't elective-labelled but
            // which carry sub-rows (e.g. "Full Stack Java / Competitive
            // Programming") are alternative-pick slots too — keep main first.
            const allOpts =
              inlineOpts.length > 0
                ? [...inlineOpts, ...r.subRows.slice(inlineOpts.length - 1).map(optOf)]
                : parsed.code || name
                  ? [{ code: parsed.code, courseName: name }, ...r.subRows.map(optOf)]
                  : r.subRows.map(optOf);
            outRows.push({
              code: parsed.code,
              category: parsed.category,
              electiveGroup: parsed.category || name || 'Elective',
              options: allOpts.filter((o) => o.code || o.courseName),
              l: numOrNull(parsed.l),
              t: numOrNull(parsed.t),
              p: numOrNull(parsed.p),
              credits: numOrNull(parsed.credits),
            });
          } else {
            if (parsed.category && ELECTIVE_RE.test(parsed.category)) {
              notes.push(`table ${tctx}: row ${r.no} elective category but no options listed: ${name.slice(0, 100)}`);
            }
            outRows.push({
              code: parsed.code,
              category: parsed.category,
              courseName: name,
              l: numOrNull(parsed.l),
              t: numOrNull(parsed.t),
              p: numOrNull(parsed.p),
              credits: numOrNull(parsed.credits),
            });
          }
        } else {
          outRows.push({
            code: parsed.code,
            category: parsed.category,
            courseName: parsed.courseName,
            l: numOrNull(parsed.l),
            t: numOrNull(parsed.t),
            p: numOrNull(parsed.p),
            credits: numOrNull(parsed.credits),
            unparsed: true,
          });
        }
      }
      // MOOC-catalog guard: a pseudo-table (option lists without L/T/P) is
      // not a semester table. Attach by option codes or stash in moocCatalog.
      const nullCount = outRows.filter((r) => r.credits === null).length;
      if (outRows.length > 0 && nullCount / outRows.length > 0.5) {
        const pseudo = [];
        for (const r of outRows) {
          if (r.options) pseudo.push(...r.options);
          else if (r.code || r.courseName) pseudo.push({ code: r.code, courseName: r.courseName });
        }
        attachOrStash(tables, moocCatalog, { dept: currentDept, page: page.num }, pseudo, notes);
        lastSection = { year, sem };
        lastTablePage = page.num;
        continue;
      }
      // Never emit null-credit rows into semester tables.
      const dropped = outRows.filter((r) => r.credits === null);
      const kept = outRows.filter((r) => r.credits !== null);
      if (dropped.length > 0) {
        warnings.push(
          `table ${tctx}: dropped ${dropped.length} row(s) without credits: ` +
            dropped.map((r) => `${r.code ?? '?'} ${(r.courseName ?? '').slice(0, 60)}`).join(' | '),
        );
      }
      if (kept.length === 0) continue;
      if (chunk.continuation && tables.length > 0) {
        const prev = tables[tables.length - 1];
        if (prev.dept === currentDept && prev.year === year && prev.sem === sem) {
          prev.rows.push(...kept);
          prev.pages = [...new Set([...(prev.pages || [prev.page]), page.num])];
          lastSection = { year, sem };
          lastTablePage = page.num;
          continue;
        }
      }
      tables.push({ dept: currentDept, year, sem, page: page.num, rows: kept });
      lastSection = { year, sem };
      lastTablePage = page.num;
    }
  }
  return tables;
}

function attachOrStash(tables, moocCatalog, where, pseudo, notes) {
  // pseudo: [{code, courseName}]. Fill blank option names by code match;
  // stash the rest under moocCatalog. Never duplicates existing entries.
  const have = new Set();
  for (const t of tables) {
    for (const r of t.rows) {
      if (r.code) have.add(r.code);
      for (const o of r.options || []) {
        if (o.code) have.add(o.code);
        if (o.code && !o.courseName) {
          const fill = pseudo.find((p) => p.code === o.code && p.courseName);
          if (fill) o.courseName = fill.courseName;
        }
      }
    }
  }
  const orphans = pseudo.filter((p) => p.code && !have.has(p.code) && p.courseName);
  if (orphans.length === 0) {
    notes.push(`p${where.page} (${where.dept}): pseudo-table absorbed, no new options`);
    return;
  }
  const seen = new Set(moocCatalog.flatMap((m) => m.options.map((o) => o.code)));
  const fresh = orphans.filter((o) => !seen.has(o.code));
  if (fresh.length > 0) moocCatalog.push({ dept: where.dept, page: where.page, options: fresh });
  notes.push(`p${where.page} (${where.dept}): stashed ${fresh.length} MOOC-catalog options`);
}

// ---- Syllabus bodies (anchored on the meta line closing each course) ----

// Meta line sits at the END of a course body: title banner first, then
// outcomes/units, then "B. Tech (AI) III Year I Semester Dept. of X".
// The (PROGRAM) tag is absent on some pages (e.g. IT), so it is optional.
// Dept names sometimes wrap onto a second line (p656).
const META_RE = /B\.?\s*Tech\s*(?:\(([^)]+)\))?\s*(III|IV)\s*Year\s*(I|II)\s*Semester\s*Dept\.\s*of\s*([^\n]+?)(?:\n([A-Z][^\n]{1,50}))?(?=\n|$)/i;
const META_CONT_RE = /^(Code|B\.?\s*Tech|L\s*T\s*P|Program)\b/;
const TITLE_FOLLOW_RE = /Course Outcomes|Course Objectives|List of Experiments|Course layout|Pre-?requisites?|Course Content|Code\s+Category|B\.?\s*Tech\b[\s\S]{0,40}Dept\.\s*of/i;
const TITLE_JUNK_RE = /^(L\s*T\s*P\b.*|Code\s+Category\b.*|Course Name|Credits|Course Outcomes|Course Objectives|Course layout|List of Experiments|Text Books?|Reference Books?|UNIT\s*-?\s*[IVX]+|Week\s+\d|Indicative Problems|After completion\b.*|At the end of\b.*|The evaluation\b.*|Students?\b.*|Table\b.*|Figure\b.*|Theoretical(?:\s*&\s*Practical)?(?:\s*\([^)]*\))?|Practical(?:\s*\([^)]*\))?|Exploratory(?:\s*\([^)]*\))?|Major(?:\s*\([^)]*\))?|HSMC|BS|Skill Enhancement|Ability Enhancement|Mini Project|Seminar|Project|Viva(?:-Voce)?|PR|SEM|OE(?:\s*-.*)?|Summer Internship)$/i;

function titleShapeOk(line) {
  const t = line.trim();
  if (t.length < 3 || t.length > 90 || !/^[A-Z]/.test(t)) return false;
  if (/[.:;]$/.test(t) || /^\d+\.\s/.test(t)) return false;
  if (META_RE.test(t) || TITLE_JUNK_RE.test(t)) return false;
  if (CODE_RE.test(t) && /L\s*T\s*P|CIE|SEE|Total|Marks|Hours/.test(t)) return false; // codeblock line
  return true;
}

function canonDept(raw, tableDepts) {
  const clean = (raw || '').replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  const n = norm(clean.replace(/&/g, ' and ').replace(/\bcomputers\b/gi, 'computer'));
  for (const d of tableDepts) {
    if (norm(d.replace(/&/g, ' and ').replace(/\bcomputers\b/gi, 'computer')) === n) return d;
  }
  // Wrapped meta lines truncate the dept ("Electronics & Communication" for
  // "... Engineering"): complete by unique prefix; also match inner phrases
  // ("Data Science" inside "CSE - Data Science").
  const cands = tableDepts.filter((d) => {
    const dn = norm(d.replace(/&/g, ' and ').replace(/\bcomputers\b/gi, 'computer'));
    return (dn.startsWith(n) || dn.includes(n)) && n.length >= 10;
  });
  if (cands.length === 1) return cands[0];
  return clean;
}

function parseSyllabus(pages, tableCourses, warnings, notes) {
  void warnings;
  const { names, codes, depts } = tableCourses;
  const bodies = [];
  let cur = null; // { title, lines, startPage, pages }
  let droppedNoLink = 0;
  let adopted = 0;

  const isTitleAt = (lines, i) => {
    const t = lines[i].trim();
    if (META_RE.test(t)) return false;
    if (TITLE_JUNK_RE.test(t)) return false;
    // Lines carrying a course code are codeblock/meta rows, never banners
    // ("EMA3283 Theoretical", "ESI4X01 Summer Internship L T P C ...").
    if (CODE_RE.test(t) && !names.has(norm(t))) return false;
    // Table-known banners always split, even if shaped like category words
    // ("Summer Internship", "Project Work").
    if (names.has(norm(t))) return true;
    if (!titleShapeOk(lines[i])) return false;
    const ahead = lines.slice(i + 1, i + 11).join('\n');
    return TITLE_FOLLOW_RE.test(ahead);
  };

  const flush = () => {
    if (cur && cur.lines.some((l) => l.trim() !== '')) bodies.push(cur);
    cur = null;
  };

  for (const page of pages) {
    if (page.isTable || page.isPool) {
      flush();
      continue;
    }
    if (/Academic Regulations\s*-\s*AR24/.test(page.text) && page.text.length < 700 && /B\.?\s*Tech/i.test(page.text)) {
      flush();
      continue; // dept banner page
    }
    const lines = page.text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '') {
        cur?.lines.push('');
        continue;
      }
      // A title splits the stream only when the open body already has
      // substance (else this line IS the body's title, e.g. page top).
      const hasSubstance = cur && cur.lines.some((l) => TITLE_FOLLOW_RE.test(l) || META_RE.test(l));
      if ((!cur || hasSubstance) && isTitleAt(lines, i)) {
        flush();
        cur = { title: lines[i].trim(), lines: [lines[i]], startPage: page.num, pages: [page.num] };
      } else if (cur) {
        if (!cur.pages.includes(page.num)) cur.pages.push(page.num);
        cur.lines.push(lines[i]);
      } else {
        // Stray lines before the first banner (wrapped refs etc.) — skip.
        notes.push(`p${page.num}: leading line outside any syllabus body skipped: ${lines[i].trim().slice(0, 80)}`);
        cur = { title: null, lines: [], startPage: page.num, pages: [page.num], stray: true };
      }
    }
  }
  flush();

  // Index forward banner lines for the 3-page name search.
  const bannerIdx = [];
  for (const page of pages) {
    if (page.isTable || page.isPool) continue;
    const lines = page.text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      if (titleShapeOk(t) && names.has(norm(t))) bannerIdx.push({ page: page.num, title: t });
    }
  }

  const seen = new Map();
  let mergedFrags = 0;
  const courses = [];
  const metaDept = (meta) => {
    if (!meta) return null;
    const extra = meta[5] && !META_CONT_RE.test(meta[5].trim()) ? ` ${meta[5].trim()}` : '';
    return `${meta[4].trim()}${extra}`;
  };
  for (const b of bodies) {
    if (b.stray) continue;
    const text = b.lines.join('\n');
    const meta = text.match(META_RE);
    const codeBlock = text.match(/Code\s+Category[\s\S]{0,300}?([A-Z]{2,4}[0-9X]{4})/);
    const titleCode = (b.title || '').match(CODE_RE)?.[1];
    const titleKey = norm(b.title || '');
    let title = b.title;
    let linked = names.get(titleKey) || [];
    const labAlias = linked.length === 0 && /\s+lab$/.test(titleKey);
    if (labAlias) linked = names.get(titleKey.replace(/\s+lab$/, '')) || [];
    const key = labAlias && linked[0]?.name ? norm(linked[0].name) : titleKey;
    if (labAlias && linked[0]?.name) title = linked[0].name;
    let code = codeBlock?.[1] ?? (titleCode && titleCode !== '--' ? titleCode : null) ?? linked[0]?.code ?? null;
    if (code === '--') code = null;
    const named = key.length >= 3 && names.has(key);

    if (!code && !named) {
      droppedNoLink++; // junk: wrapped ref line, publisher imprint, header scrap
      continue;
    }
    if (code && !named) {
      // Code but no banner name: search forward ≤3 pages for the yellow
      // title banner whose table entry carries this code.
      const found = bannerIdx.find(
        (bi) => bi.page >= b.startPage && bi.page <= b.startPage + 3 &&
          (names.get(norm(bi.title)) || []).some((l) => l.code === code),
      );
      const byCode = codes.get(code);
      if (found) {
        title = found.title;
        adopted++;
      } else if (byCode) {
        title = byCode.name;
        adopted++;
      } else {
        droppedNoLink++;
        continue;
      }
    }
    const lkey = norm(title);
    const links = names.get(lkey) || [];
    const byCode = code ? codes.get(code) : null;
    const dept = canonDept(metaDept(meta), depts) ?? links[0]?.dept ?? byCode?.dept ?? null;
    const dupeKey = `${code ?? ''}|${lkey}|${dept ?? ''}`;
    const coSec = text.split(/Course Outcomes/i)[1]?.split(/UNIT\s*-?\s*[IVX]+|List of Experiments|Week 1|Text Books|Reference Books/i)[0] || '';
    const objSec = text.split(/Course Objectives/i)[1]?.split(/Course Outcomes|UNIT\s*-?\s*[IVX]+|List of Experiments|Week 1|Text Books|Reference Books/i)[0] || '';
    const numList = (sec) => [...sec.matchAll(/^\s*(\d+)\.\s*(.+?)(?=^\s*\d+\.\s*|\s*$)/gms)]
      .map((m) => m[2].replace(/\s+/g, ' ').trim())
      .filter((s) => s.length > 10 && !/After completion of course/i.test(s));
    let outcomes = numList(coSec);
    if (outcomes.length === 0) outcomes = numList(objSec); // objectives-only bodies (IT)
    const units = [...text.matchAll(/UNIT\s*-?\s*([IVX]+)\s*\n([\s\S]*?)(?=UNIT\s*-?\s*[IVX]+|Text Books|Reference Books|List of Experiments|$)/gi)]
      .map((m) => ({ title: `UNIT-${m[1]}`, content: m[2].replace(/\s+/g, ' ').trim().slice(0, 4000) }));
    const weekSec = text.includes('List of Experiments')
      ? text.split(/List of Experiments/i)[1].split(/Text Books|Reference Books/i)[0]
      : /Course layout/i.test(text)
        ? text.split(/Course layout/i)[1].split(/Text Books|Reference Books/i)[0]
        : '';
    const labExperiments = weekSec
      ? (() => {
          const weeks = [...weekSec.matchAll(/Week\s+(\d+(?:\s*-\s*\d+)?)\s*\n([\s\S]*?)(?=Week\s+\d|$)/gi)].map((m) =>
            `Week ${m[1]}: ${m[2].replace(/\s+/g, ' ').trim().slice(0, 1500)}`,
          );
          if (weeks.length) return weeks;
          return [...weekSec.matchAll(/^\s*(\d+)[.)]\s*([\s\S]*?)(?=^\s*\d+[.)]\s*|$)/gms)]
            .map((m) => `${m[1]}. ${m[2].replace(/\s+/g, ' ').trim().slice(0, 1500)}`)
            .filter((s) => s.length > 3);
        })()
      : [];
    const refSec = text.split(/Text Books/i)[1] || '';
    const references = [...refSec.matchAll(/^\s*\d+\.\s*(.+?)(?=^\s*\d+\.\s*|\s*$)/gms)]
      .map((m) => m[1].replace(/\s+/g, ' ').trim())
      .filter((s) => s.length > 5)
      .slice(0, 30);
    const course = {
      title,
      code,
      dept,
      program: meta?.[1]?.trim() || null,
      year: meta?.[2] ?? links[0]?.year ?? byCode?.year ?? null,
      sem: meta?.[3] ?? links[0]?.sem ?? byCode?.sem ?? null,
      pages: b.pages,
      outcomes,
      units,
      labExperiments,
      references,
    };
    if (seen.has(dupeKey)) {
      // Same course split across segments (title restated mid-body): merge
      // lists into the kept body instead of dropping knowledge.
      const kept = seen.get(dupeKey);
      mergedFrags++;
      for (const k of ['outcomes', 'units', 'labExperiments', 'references']) {
        const itemKey = (item) => {
          if (typeof item !== 'string') return item.title;
          return k === 'labExperiments' ? norm(item.replace(/^Week\s+[^:]+:\s*/i, '')) : item;
        };
        const ids = new Set(kept[k].map(itemKey));
        for (const u of course[k]) {
          const id = itemKey(u);
          if (!ids.has(id)) {
            ids.add(id);
            kept[k].push(u);
          }
        }
      }
      kept.pages = [...new Set([...kept.pages, ...course.pages])];
      for (const k of ['code', 'dept', 'program', 'year', 'sem']) {
        if (!kept[k] && course[k]) kept[k] = course[k];
      }
      continue;
    }
    seen.set(dupeKey, course);
    courses.push(course);
  }
  notes.push(`syllabus: dropped ${droppedNoLink} bodies with neither code nor table-matched banner name`);
  notes.push(`syllabus: adopted ${adopted} banner names via table-code / 3-page forward search`);
  if (mergedFrags > 0) notes.push(`syllabus: merged ${mergedFrags} re-split fragments into kept bodies`);
  return courses;
}

function parsePoolOptions(text) {
  // NPTEL/MOOC catalog lists: "N CODE Name", URLs and "Offered by" on followers.
  const opts = [];
  let cur = null;
  const flush = () => {
    if (cur) opts.push(cur);
    cur = null;
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || /^R24\s*-|^Key Rules|^S\.?\s*No/i.test(line) || /^[*⮚]/.test(line)) continue;
    if (/^https?:|Link:|\/preview|swayam|nptel|e-learning|\.in\//i.test(line)) continue;
    if (/^Offered by/i.test(line)) continue;
    if (/^(EEE|CIVIL|School of|English|PWC|Salesforce|ServiceNow|Wipro)/i.test(line) && cur && !/^\d+\s+[A-Z]{2,4}[0-9X]{4}/.test(line)) {
      continue; // offered-by column wrap
    }
    const m = line.match(/^(\d+)\s+([A-Z]{2,4}[0-9X]{4})\s+(.+)$/);
    if (m) {
      flush();
      cur = { n: Number(m[1]), code: m[2], courseName: stripOfferedBy(m[3]) };
    } else if (cur && /^[A-Za-z(]/.test(line) && !ROW_START_RE.test(line)) {
      cur.courseName = `${cur.courseName} ${stripOfferedBy(line)}`.replace(/\s+/g, ' ').trim();
    }
  }
  flush();
  return opts.filter((o) => o.code && o.courseName).map((o) => ({ code: o.code, courseName: o.courseName }));
}

function stripOfferedBy(s) {
  return s
    .replace(/\s+(EEE|CIVIL) Department$/i, '')
    .replace(/\s+School of Management$/i, '')
    .replace(/\s+English Department$/i, '')
    .replace(/\s+(PWC|Salesforce|ServiceNow|Wipro)$/i, '')
    .replace(/\s*\[MOOCs\]$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sweepNone(v) {
  // Defensive: real nulls only, never the string "None".
  if (Array.isArray(v)) return v.map(sweepNone);
  if (v && typeof v === 'object') {
    for (const k of Object.keys(v)) {
      if (v[k] === 'None') v[k] = null;
      else v[k] = sweepNone(v[k]);
    }
  }
  return v;
}

function cleanOptName(s) {
  // Strip enumeration, OR-prefix, footnote scrap, MOOC catalog noise.
  let t = (s || '').replace(/\s+/g, ' ').trim();
  t = t.replace(/^(?:OR|\(or\))\s+/i, '').replace(/^\d+\.\s*/, '');
  t = t.replace(/\s*\/\s*MOOCS#?\s*/gi, ' ').replace(/\*+\/?$/, '').trim();
  t = t.replace(/\s*-\s*\(Course No:\s*[^)]+\)\s*$/i, '').replace(/\s+/g, ' ').trim();
  t = t.replace(/\s+\(MOOCS\)$/i, '');
  return t;
}

const JUNK_OPT_NAME_RE = /^(theoretical|exploratory|practical)$/i;

function cleanTables(tables, warnings) {
  // Post-pass: merge split code/name option pairs, drop scrap, normalize.
  for (const t of tables) {
    const tctx = `${t.dept} ${t.year}Y-${t.sem}S p${t.page}`;
    const seenCodes = new Set();
    const keptRows = [];
    for (const r of t.rows) {
      if (!r.options) {
        if (/^--\s*/.test(r.courseName || '')) {
          warnings.push(`table ${tctx}: dropped scrap row: ${(r.courseName || '').slice(0, 80)}`);
          continue;
        }
        r.courseName = cleanOptName(r.courseName || '');
        // Repair clipped category prefixes ("MC) NSO/NSS", "PC) Linear ...").
        if (/^MC\)\s*/.test(r.courseName)) r.courseName = `(HS&MC) ${r.courseName.replace(/^MC\)\s*/, '')}`;
        else if (/^PC\)\s*/.test(r.courseName)) {
          r.courseName = r.courseName.replace(/^PC\)\s*/, '');
          if (!/\(PC\)/.test(r.category || '')) r.category = `${r.category || 'Theoretical'} (PC)`.trim();
        }
        r.courseName = r.courseName.replace(/\*$/, '');
        if (r.code && seenCodes.has(r.code)) {
          warnings.push(`table ${tctx}: dropped duplicate row code ${r.code}`);
          continue;
        }
        if (r.code) seenCodes.add(r.code);
        keptRows.push(r);
        continue;
      }
      r.code = null; // elective slots never carry a parent code
      const cleaned = [];
      const opts = r.options.map((o) => ({ code: o.code || null, courseName: o.courseName ? cleanOptName(o.courseName) : null }));
      for (let i = 0; i < opts.length; i++) {
        const cur = opts[i];
        const nxt = opts[i + 1];
        // Merge split pair: null-code real name + coded null/junk name.
        if (!cur.code && cur.courseName && nxt && nxt.code &&
          (!nxt.courseName || JUNK_OPT_NAME_RE.test(nxt.courseName))) {
          cleaned.push({ code: nxt.code, courseName: cur.courseName });
          i++;
          continue;
        }
        cleaned.push(cur);
      }
      const byName = new Set();
      r.options = [];
      for (const o of cleaned) {
        if (!o.courseName || JUNK_OPT_NAME_RE.test(o.courseName)) {
          warnings.push(`table ${tctx}: dropped nameless option ${o.code || '?'}`);
          continue;
        }
        if (/MOOCS#/.test(o.courseName)) {
          warnings.push(`table ${tctx}: dropped MOOC-header pseudo-option ${o.code || '?'}`);
          continue;
        }
        const nk = norm(o.courseName);
        if (!o.code && byName.has(nk)) continue; // null-code header dup of coded entry
        byName.add(nk);
        if (o.code) {
          if (seenCodes.has(o.code)) {
            warnings.push(`table ${tctx}: dropped duplicate option code ${o.code}`);
            continue;
          }
          seenCodes.add(o.code);
        }
        r.options.push(o);
      }
      if (r.options.length === 0) {
        warnings.push(`table ${tctx}: elective group emptied after cleanup: ${r.electiveGroup || r.category}`);
        continue;
      }
      keptRows.push(r);
    }
    t.rows = keptRows;
  }
  return tables;
}

async function main() {
  if (!existsSync(pdfPath)) {
    process.stderr.write(`PDF not found: ${pdfPath}\n`);
    process.exit(1);
  }
  const buf = await readFile(pdfPath);
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  await parser.destroy();

  const pages = result.pages.map((p) => ({ num: p.num, text: cleanPage(p.text || '') }));
  for (const p of pages) {
    if (tablePageHasHours(p.text)) {
      p.isTable = true;
    } else if (/^R24\s*-|Professional Electives\s*$|Open Electives\s*$/m.test(p.text) && /S\.?\s*No\s+Course\s+Code/i.test(p.text)) {
      p.isPool = true; // elective pool list (no L/T/P) — catalogued, not a table
    }
  }

  const warnings = [];
  const notes = [];
  const moocCatalog = [];
  const tables = cleanTables(
    parseTableBlocks(pages, warnings, notes, moocCatalog).filter((t) => IN_SCOPE.includes(t.dept)),
    warnings,
  );

  // Known course names/codes from tables for banner matching.
  const names = new Map();
  const codes = new Map();
  const pushName = (n, link) => {
    const k = norm(n);
    if (k.length < 3) return;
    if (!names.has(k)) names.set(k, []);
    names.get(k).push(link);
  };
  for (const t of tables) {
    for (const r of t.rows) {
      if (r.options) {
        for (const o of r.options) {
          if (!o.courseName) continue;
          pushName(o.courseName, { dept: t.dept, code: o.code, name: o.courseName, year: t.year, sem: t.sem });
          if (o.code && !codes.has(o.code)) codes.set(o.code, { dept: t.dept, name: o.courseName, year: t.year, sem: t.sem });
        }
      } else if (r.courseName) {
        pushName(r.courseName, { dept: t.dept, code: r.code, name: r.courseName, year: t.year, sem: t.sem });
        if (r.code && !codes.has(r.code)) codes.set(r.code, { dept: t.dept, name: r.courseName, year: t.year, sem: t.sem });
      }
    }
  }
  const tableDepts = [...new Set(tables.map((t) => t.dept))];

  // MOOC pools: fill blank option names by code, stash orphans as catalog.
  let deptCtx = 'Unknown';
  for (const p of pages) {
    const d = deptFromBanner(p.text);
    if (d) deptCtx = d;
    if (!p.isPool) continue;
    const pseudo = parsePoolOptions(p.text);
    attachOrStash(tables, moocCatalog, { dept: deptCtx, page: p.num }, pseudo, notes);
  }

  const courses = parseSyllabus(pages, { names, codes, depts: tableDepts }, warnings, notes)
    .filter((c) => IN_SCOPE.includes(c.dept));

  // Defect-5 gate: in-scope depts × 4 semester tables, all rows numeric.
  for (const dept of IN_SCOPE) {
    for (const [year, sem] of [['III', 'I'], ['III', 'II'], ['IV', 'I'], ['IV', 'II']]) {
      const found = tables.filter((t) => t.dept === dept && t.year === year && t.sem === sem);
      if (found.length === 0) {
        warnings.push(`missing semester table: ${dept} ${year}Y-${sem}S`);
      } else if (found.length > 1) {
        notes.push(`${dept} ${year}Y-${sem}S: ${found.length} table sections (split across pages)`);
      }
      for (const t of found) {
        const bad = t.rows.filter((r) => typeof r.credits !== 'number');
        if (bad.length > 0) warnings.push(`table ${dept} ${year}Y-${sem}S p${t.page}: ${bad.length} non-numeric-credit rows`);
      }
    }
  }

  const stats = {
    tableSections: tables.length,
    tableRows: tables.reduce((n, t) => n + t.rows.length, 0),
    electiveGroups: tables.reduce((n, t) => n + t.rows.filter((r) => r.options).length, 0),
    electiveOptions: tables.reduce((n, t) => n + t.rows.reduce((m, r) => m + (r.options ? r.options.length : 0), 0), 0),
    moocCatalogOptions: moocCatalog.reduce((n, m) => n + m.options.length, 0),
    coursesWithSyllabus: courses.length,
    coursesWithOutcomes: courses.filter((c) => c.outcomes.length > 0).length,
    coursesWithUnits: courses.filter((c) => c.units.length > 0).length,
    coursesWithWeeks: courses.filter((c) => c.labExperiments.length > 0).length,
    warnings: warnings.length,
    notes: notes.length,
  };
  const out = sweepNone({
    meta: { source: pdfPath, pages: result.total, extractedAt: new Date().toISOString(), review: { approved: false }, stats, moocCatalog },
    tables,
    courses,
    warnings,
    notes,
  });
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(out, null, 2));
  process.stdout.write(
    `dry-run ok: ${result.total} pages, ${stats.tableSections} table sections, ${stats.tableRows} rows, ` +
      `${stats.coursesWithSyllabus} syllabus bodies, ${warnings.length} warnings -> ${outPath}\n`,
  );
}

if (args.includes('--commit')) {
  await commitReviewedArtifact(inputPath).catch((err) => {
    process.stderr.write(`commit refused/failed: ${err.message}\n`);
    process.exitCode = 1;
  });
} else {
  await main();
}
