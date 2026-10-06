#!/usr/bin/env node
// Enforce the structural rules from the authoring-skills skill, so they are checked rather
// than remembered.
//
// SKILL.md (root .apm/skills and every package / apm-plugins skill):
//   - `name`: lowercase letters, digits and hyphens, at most 64 characters, equal to its
//     directory name, gerund-first (`using-utils`, `writing-tests`), no reserved words
//   - `description`: non-empty, at most 1024 characters, no XML-like tags such as `<pkg>`
//   - body: at most 500 lines
//
// README.md (root and every package) longer than 100 lines:
//   - a `## Contents` section within the first 30 lines, listing every other `##` heading.
//     An agent that previews a file with `head -100` then still sees what the whole file covers.
//
// Usage:
//   node scripts/check-agent-docs.mjs          # report problems, exit 1 if any
//   node scripts/check-agent-docs.mjs --fix    # also (re)write README Contents sections
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';

const FIX = process.argv.includes('--fix');

// Limits from Anthropic's skill authoring guidance; see the authoring-skills skill.
const NAME_MAX = 64;
const DESCRIPTION_MAX = 1024;
const SKILL_BODY_MAX_LINES = 500;
// Agents preview long files with partial reads such as `head -100`.
const CONTENTS_REQUIRED_ABOVE_LINES = 100;
const CONTENTS_WITHIN_FIRST_LINES = 30;

const ROOTS = ['packages', 'config', 'tsed'];

const skills = [];
const collectSkills = (dir) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
        const file = join(dir, name, 'SKILL.md');
        if (existsSync(file)) skills.push(file);
    }
};
collectSkills('.apm/skills');
for (const root of [...ROOTS, 'apm-plugins']) {
    if (!existsSync(root)) continue;
    for (const name of readdirSync(root)) collectSkills(join(root, name, '.apm', 'skills'));
}

const readmes = existsSync('README.md') ? ['README.md'] : [];
for (const root of ROOTS) {
    if (!existsSync(root)) continue;
    for (const name of readdirSync(root)) {
        const file = join(root, name, 'README.md');
        if (existsSync(file)) readmes.push(file);
    }
}

let problems = 0;
const report = (where, message) => {
    console.log(`${where}  ${message}`);
    problems++;
};

// --- SKILL.md -------------------------------------------------------------------------------

for (const file of skills) {
    const text = readFileSync(file, 'utf8');
    const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
    if (!fm) {
        report(file, 'no YAML frontmatter (expected --- name/description --- at the top)');
        continue;
    }
    const field = (key) => fm[1].match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))?.[1].trim() ?? '';
    const name = field('name');
    const description = field('description');
    const dir = basename(dirname(file));

    if (!/^[a-z0-9-]+$/.test(name) || name.length > NAME_MAX) {
        report(file, `name "${name}" must be lowercase letters, digits and hyphens, at most ${NAME_MAX} characters`);
    }
    if (name !== dir) {
        report(file, `name "${name}" must equal its directory name "${dir}"`);
    }
    if (!/^[a-z]+ing-/.test(name)) {
        report(file, `name "${name}" must start with a gerund, e.g. "using-<package>" or "writing-<thing>"`);
    }
    if (/anthropic|claude/.test(name)) {
        report(file, `name "${name}" contains a reserved word ("anthropic" or "claude")`);
    }
    if (description === '') {
        report(file, 'description is empty');
    } else if (description.length > DESCRIPTION_MAX) {
        report(file, `description is ${description.length} characters, the limit is ${DESCRIPTION_MAX}`);
    }
    const tags = description.match(/<\/?[A-Za-z][^>]*>/g);
    if (tags) {
        report(file, `description contains XML-like tags ${tags.join(', ')} - write PACKAGE instead of <pkg>`);
    }
    const bodyLines = text.slice(fm[0].length).split('\n').length;
    if (bodyLines > SKILL_BODY_MAX_LINES) {
        report(file, `body is ${bodyLines} lines, the limit is ${SKILL_BODY_MAX_LINES} - move detail into a reference file one level below SKILL.md`);
    }
}

// --- README Contents ------------------------------------------------------------------------

// Same slug as check-doc-links.mjs, so every generated link passes that check too.
const slug = (heading) =>
    heading
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s+/g, '-');

// `##` headings outside fenced code blocks, with their line index.
const h2Headings = (lines) => {
    const found = [];
    let fenced = false;
    lines.forEach((line, i) => {
        if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
        const m = !fenced && line.match(/^##\s+(.*?)\s*$/);
        if (m) found.push({ index: i, text: m[1] });
    });
    return found;
};

const contentsBlock = (headings) => [
    '## Contents',
    '',
    ...headings.map((h) => `- [${h.text}](#${slug(h.text)})`),
    ''
];

for (const file of readmes) {
    let lines = readFileSync(file, 'utf8').split('\n');
    if (lines.length <= CONTENTS_REQUIRED_ABOVE_LINES) continue;

    const all = h2Headings(lines);
    const contents = all.find((h) => h.text === 'Contents');
    const sections = all.filter((h) => h.text !== 'Contents');

    if (FIX) {
        const block = contentsBlock(sections);
        if (contents) {
            const end = all.find((h) => h.index > contents.index)?.index ?? lines.length;
            lines.splice(contents.index, end - contents.index, ...block);
        } else {
            const at = sections[0]?.index ?? lines.length;
            lines.splice(at, 0, ...block);
        }
        writeFileSync(file, lines.join('\n'));
        lines = readFileSync(file, 'utf8').split('\n');
    }

    const now = h2Headings(lines);
    const current = now.find((h) => h.text === 'Contents');
    if (!current) {
        report(file, `${lines.length} lines but no "## Contents" section - run with --fix to add one`);
        continue;
    }
    if (current.index >= CONTENTS_WITHIN_FIRST_LINES) {
        report(`${file}:${current.index + 1}`, `"## Contents" must start within the first ${CONTENTS_WITHIN_FIRST_LINES} lines`);
    }
    const end = now.find((h) => h.index > current.index)?.index ?? lines.length;
    const listed = new Set(
        lines.slice(current.index, end).flatMap((l) => [...l.matchAll(/\]\(#([^)]+)\)/g)].map((m) => m[1]))
    );
    for (const h of now.filter((h) => h.text !== 'Contents')) {
        if (!listed.has(slug(h.text))) {
            report(`${file}:${h.index + 1}`, `"## ${h.text}" is not listed in Contents - run with --fix to regenerate it`);
        }
    }
}

console.log(`\n${skills.length} skill(s) and ${readmes.length} README(s) checked, ${problems} problem(s)`);
process.exit(problems > 0 ? 1 : 0);
