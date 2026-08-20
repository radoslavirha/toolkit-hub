#!/usr/bin/env node
// Verify relative links and heading anchors across the repo's markdown.
//
// Checks README.md, AGENTS.md, package READMEs and every SKILL.md. External links
// (http/https/mailto) are not fetched — only local targets and their anchors.
//
// Usage: node scripts/check-doc-links.mjs
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const docs = [];
const addIfExists = (p) => existsSync(p) && docs.push(p);

addIfExists('README.md');
addIfExists('AGENTS.md');
for (const root of ['packages', 'config', 'tsed']) {
    if (!existsSync(root)) continue;
    for (const name of readdirSync(root)) addIfExists(join(root, name, 'README.md'));
}
const collectSkills = (dir) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) addIfExists(join(dir, name, 'SKILL.md'));
};
collectSkills('.apm/skills');
for (const root of ['packages', 'config', 'tsed', 'agents']) {
    if (!existsSync(root)) continue;
    for (const name of readdirSync(root)) collectSkills(join(root, name, '.apm', 'skills'));
}

// GitHub's heading slug: lowercase, drop anything but word chars/spaces/hyphens, spaces to
// hyphens. Not trimmed: a heading opening with an emoji ("## 🤖 Quick Reference") keeps the
// space the emoji leaves behind, so its anchor legitimately starts with a hyphen.
const slug = (heading) =>
    heading
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s+/g, '-');

const anchorsOf = (file) => {
    const set = new Set();
    for (const line of readFileSync(file, 'utf8').split('\n')) {
        const m = line.match(/^#{1,6}\s+(.*?)\s*$/);
        if (m) set.add(slug(m[1]));
    }
    return set;
};

let problems = 0;
for (const doc of docs) {
    const lines = readFileSync(doc, 'utf8').split('\n');
    lines.forEach((line, i) => {
        // Skip fenced-code fences crudely: links inside code blocks are rare and harmless.
        const re = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
        let m;
        while ((m = re.exec(line)) !== null) {
            const target = m[1];
            if (/^(https?:|mailto:|tel:)/.test(target)) continue;

            const [rawPath, anchor] = target.split('#');
            const where = `${doc}:${i + 1}`;

            if (rawPath === '') {
                if (anchor && !anchorsOf(doc).has(anchor.toLowerCase())) {
                    console.log(`${where}  missing anchor #${anchor} in this file`);
                    problems++;
                }
                continue;
            }

            const resolved = resolve(dirname(doc), rawPath);
            if (!existsSync(resolved)) {
                console.log(`${where}  broken link -> ${target}`);
                problems++;
                continue;
            }
            if (anchor) {
                const file = statSync(resolved).isDirectory()
                    ? join(resolved, 'README.md')
                    : resolved;
                if (!existsSync(file)) {
                    console.log(`${where}  anchor target has no README -> ${target}`);
                    problems++;
                } else if (!anchorsOf(file).has(anchor.toLowerCase())) {
                    console.log(`${where}  missing anchor -> ${target}`);
                    problems++;
                }
            }
        }
    });
}

console.log(`\n${docs.length} document(s) checked, ${problems} problem(s)`);
process.exit(problems > 0 ? 1 : 0);
