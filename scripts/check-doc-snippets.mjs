#!/usr/bin/env node
// Compile the TypeScript snippets embedded in package docs against the real package.
//
// Selected ```ts blocks from a package's README.md and .apm/skills/**/*.md are written to a
// scratch directory (<pkg>/.doccheck/, gitignored, removed afterwards) and type-checked with
// a tsconfig extending the package's own. Imports of the package's own name are rewritten to
// its source entrypoint. Nothing is ever written into src/, so a crashed run cannot leave
// stray .ts files where lint, build or vitest would pick them up.
//
// Which blocks are checked:
//   .apm/skills/**  every block, unless tagged  ```ts ignore
//   README.md       only blocks tagged          ```ts check
//
// READMEs deliberately contain fragments (placeholder inventories, snippets whose import
// sits in an earlier block), so blanket checking there reports style, not defects.
//
// Usage: node scripts/check-doc-snippets.mjs [--verbose]
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';

const verbose = process.argv.includes('--verbose');
const roots = ['packages', 'config', 'tsed'];
const TMP = '.doccheck';

const docsOf = (pkgDir) => {
    const docs = [];
    const readme = join(pkgDir, 'README.md');
    if (existsSync(readme)) docs.push(readme);
    const skills = join(pkgDir, '.apm', 'skills');
    if (existsSync(skills)) {
        for (const skill of readdirSync(skills)) {
            const md = join(skills, skill, 'SKILL.md');
            if (existsSync(md)) docs.push(md);
        }
    }
    return docs;
};

// Skills are small, self-contained and travel to consumers, so every block in one is
// compiled unless tagged `ignore`. READMEs deliberately use fragments — placeholder
// inventories, continuation snippets that import in an earlier block — so there a block
// is only compiled when tagged `check`.
const blocksOf = (file) => {
    const strict = file.includes(`${sep}.apm${sep}skills${sep}`);
    const src = readFileSync(file, 'utf8');
    const out = [];
    const re = /```(ts|typescript)([^\n]*)\n([\s\S]*?)```/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        const tags = m[2];
        const wanted = strict ? !/\bignore\b/.test(tags) : /\bcheck\b/.test(tags);
        if (!wanted) continue;
        out.push({ code: m[3], line: src.slice(0, m.index).split('\n').length });
    }
    return out;
};

let failures = 0;
let checked = 0;

for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const name of readdirSync(root)) {
        const pkgDir = join(root, name);
        if (!existsSync(join(pkgDir, 'package.json'))) continue;
        if (!existsSync(join(pkgDir, 'tsconfig.json'))) continue;

        const pkgName = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')).name;
        const tmpDir = join(pkgDir, TMP);
        rmSync(tmpDir, { recursive: true, force: true });

        const written = [];
        for (const doc of docsOf(pkgDir)) {
            blocksOf(doc).forEach((b, i) => {
                mkdirSync(tmpDir, { recursive: true });
                const rel = doc.replace(/[^a-zA-Z0-9]/g, '_');
                const target = join(tmpDir, `${rel}_${i}.ts`);
                const code = b.code
                    .replaceAll(`from '${pkgName}'`, "from '../src/index.js'")
                    .replaceAll(`from "${pkgName}"`, 'from "../src/index.js"');
                writeFileSync(target, code);
                written.push({ target, doc, line: b.line, file: `${rel}_${i}.ts` });
            });
        }

        if (written.length === 0) continue;
        checked += written.length;

        // The package tsconfig sets rootDir to src/, which would exclude this scratch
        // directory; widening it to the package root covers both the snippets and the
        // sources they import. noEmit means nothing is written regardless.
        writeFileSync(
            join(tmpDir, 'tsconfig.json'),
            JSON.stringify(
                {
                    extends: '../tsconfig.json',
                    compilerOptions: { rootDir: '..', composite: false, noEmit: true },
                    include: ['*.ts']
                },
                null,
                4
            )
        );

        try {
            execFileSync('pnpm', ['exec', 'tsc', '--noEmit', '--project', `${TMP}/tsconfig.json`], {
                cwd: pkgDir,
                stdio: 'pipe'
            });
            if (verbose) console.log(`ok    ${pkgName} (${written.length} snippet(s))`);
        } catch (err) {
            const out = `${err.stdout || ''}${err.stderr || ''}`;
            const lines = out.split('\n').filter((l) => l.includes(TMP));
            failures += lines.length || 1;
            console.log(`FAIL  ${pkgName}`);
            for (const l of lines.length ? lines : [out.trim()]) {
                const origin = written.find((w) => l.includes(w.file));
                const where = origin ? `${origin.doc}:~${origin.line}` : '(unknown block)';
                const msg = l.split('):').slice(1).join('):').trim() || l.trim();
                console.log(`      ${where}  ${msg}`);
            }
        } finally {
            rmSync(tmpDir, { recursive: true, force: true });
        }
    }
}

console.log(`\n${checked} snippet(s) checked, ${failures} problem(s)`);
process.exit(failures > 0 ? 1 : 0);
