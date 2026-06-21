import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type ExportKind = 'class' | 'function' | 'interface' | 'type' | 'enum' | 'const' | 'let' | 'var' | 'unknown';

type ExportEntry = {
    name: string;
    kind: ExportKind;
    signature: string;
    purpose: string;
    source: string;
    members: string[];
};

type PackageEntry = {
    name: string;
    location: string;
    entrypoint: string | null;
    exports: ExportEntry[];
};

type CapabilityIndex = {
    packages: PackageEntry[];
};

type ParseResult = {
    exports: Map<string, ExportEntry>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repositoryRoot = path.resolve(__dirname, '..');
const outputJson = path.join(repositoryRoot, 'docs', 'capability-index.json');
const outputMarkdown = path.join(repositoryRoot, 'docs', 'capability-index.md');

const args = new Set(process.argv.slice(2));
const shouldValidateOnly = args.has('--validate-references-only');

function normalizeSignature(signature: string): string {
    return signature.replace(/\s+/g, ' ').trim();
}

function extractJsDocSummary(rawComment: string): string {
    const cleanedLines = rawComment
        .trim()
        .replace(/^\/\*\*/, '')
        .replace(/\*\/$/, '')
        .split('\n')
        .map((line) => line.replace(/^\s*\*\s?/, '').trim());

    const summaryTag = cleanedLines
        .find((line) => line.toLowerCase().startsWith('@summary '));

    if (summaryTag) {
        return summaryTag.slice('@summary '.length).trim();
    }

    const firstLine = cleanedLines.find((line) => line !== '' && !line.startsWith('@'));
    return firstLine ?? '';
}

function findJsDocBefore(content: string, index: number): string {
    let searchIndex = index;

    while (searchIndex > 0) {
        const start = content.lastIndexOf('/**', searchIndex - 1);
        if (start === -1) {
            return '';
        }

        const end = content.indexOf('*/', start + 3);
        if (end === -1 || end >= index) {
            searchIndex = start;
            continue;
        }

        const between = content.slice(end + 2, index);
        if (/^\s*$/.test(between)) {
            return content.slice(start, end + 2);
        }

        searchIndex = start;
    }

    return '';
}

function findMatchingBrace(content: string, openingBraceIndex: number): number {
    let depth = 0;

    for (let i = openingBraceIndex; i < content.length; i += 1) {
        const char = content[i];
        if (char === '{') {
            depth += 1;
            continue;
        }
        if (char === '}') {
            depth -= 1;
            if (depth === 0) {
                return i;
            }
        }
    }

    return -1;
}

function extractClassMembers(classBody: string): string[] {
    const members = new Set<string>();
    // Intentionally limited to explicit public members declared on the class body.
    // This is used only for drift-checking agent docs against public API references.
    const lines = classBody.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('public ')) {
            continue;
        }

        if (trimmed.includes('constructor(')) {
            continue;
        }

        const methodMatch = /^public\s+(?:static\s+)?(?:readonly\s+)?(?:override\s+)?(?:async\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*(?:<.*?>)?\s*\(/.exec(trimmed);
        if (methodMatch) {
            members.add(methodMatch[1]);
            continue;
        }

        const propertyMatch = /^public\s+(?:static\s+)?(?:readonly\s+)?(?:override\s+)?([A-Za-z_][A-Za-z0-9_]*)\??\s*[:=]/.exec(trimmed);
        if (propertyMatch) {
            members.add(propertyMatch[1]);
        }
    }

    return Array.from(members).sort((a, b) => a.localeCompare(b));
}

function resolveModuleFile(moduleSpecifier: string, fromFile: string): string | null {
    const fromDir = path.dirname(fromFile);
    const basePath = moduleSpecifier.startsWith('.')
        ? path.resolve(fromDir, moduleSpecifier)
        : null;

    if (basePath === null) {
        return null;
    }

    const normalized = basePath.replace(/\.(?:[mc]?js)$/, '');
    const candidates = [
        `${normalized}.ts`,
        `${normalized}.mts`,
        `${normalized}.tsx`,
        `${normalized}.mjs`,
        normalized,
        path.join(normalized, 'index.ts'),
        path.join(normalized, 'index.mjs')
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
        }
    }

    return null;
}

function parseModuleExports(modulePath: string, cache: Map<string, ParseResult>, stack: Set<string>): ParseResult {
    if (cache.has(modulePath)) {
        return cache.get(modulePath)!;
    }

    if (stack.has(modulePath)) {
        return { exports: new Map<string, ExportEntry>() };
    }

    stack.add(modulePath);

    const content = fs.readFileSync(modulePath, 'utf8');
    const localExports = new Map<string, ExportEntry>();

    const declarationRegex = /export\s+(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(class|function|interface|type|enum|const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)/g;

    for (const match of content.matchAll(declarationRegex)) {
        const [matchedText, rawKind, name] = match;
        const declarationIndex = match.index ?? 0;
        const kind = rawKind as ExportKind;

        const declarationEnd = (() => {
            const afterDeclaration = content.slice(declarationIndex);
            const semicolonIndex = afterDeclaration.indexOf(';');
            const braceIndex = afterDeclaration.indexOf('{');
            if (braceIndex === -1 && semicolonIndex === -1) {
                return declarationIndex + matchedText.length;
            }
            if (braceIndex === -1) {
                return declarationIndex + semicolonIndex + 1;
            }
            if (semicolonIndex === -1) {
                return declarationIndex + braceIndex;
            }
            return declarationIndex + Math.min(braceIndex, semicolonIndex);
        })();

        const signature = normalizeSignature(content.slice(declarationIndex, declarationEnd).trim());
        const purpose = extractJsDocSummary(findJsDocBefore(content, declarationIndex));

        let members: string[] = [];
        if (kind === 'class') {
            const openBraceIndex = content.indexOf('{', declarationIndex);
            if (openBraceIndex !== -1) {
                const closeBraceIndex = findMatchingBrace(content, openBraceIndex);
                if (closeBraceIndex !== -1) {
                    const classBody = content.slice(openBraceIndex + 1, closeBraceIndex);
                    members = extractClassMembers(classBody);
                }
            }
        }

        localExports.set(name, {
            name,
            kind,
            signature,
            purpose,
            source: modulePath,
            members
        });
    }

    const defaultExportRegex = /export\s+default\s+([^\n;{(]+)?/g;
    for (const match of content.matchAll(defaultExportRegex)) {
        const declarationIndex = match.index ?? 0;
        const declarationLine = content.slice(declarationIndex).split('\n')[0] ?? '(default export)';
        const purpose = extractJsDocSummary(findJsDocBefore(content, declarationIndex));

        localExports.set('default', {
            name: 'default',
            kind: 'unknown',
            signature: normalizeSignature(declarationLine.trim()),
            purpose,
            source: modulePath,
            members: []
        });
    }

    const finalExports = new Map(localExports);

    const exportAllRegex = /export\s+\*\s+from\s+['"]([^'"]+)['"];?/g;
    for (const match of content.matchAll(exportAllRegex)) {
        const target = resolveModuleFile(match[1], modulePath);
        if (target === null) {
            continue;
        }

        const targetExports = parseModuleExports(target, cache, stack).exports;
        for (const [exportName, entry] of targetExports.entries()) {
            finalExports.set(exportName, entry);
        }
    }

    const exportNamedRegex = /export\s+(?:type\s+)?\{([^}]+)\}(?:\s+from\s+['"]([^'"]+)['"])?;?/g;
    for (const match of content.matchAll(exportNamedRegex)) {
        const specifierList = match[1];
        const moduleSpecifier = match[2];
        const specifiers = specifierList
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => {
                const parts = item.split(/\s+as\s+/i).map((part) => part.trim());
                if (parts.length === 2) {
                    return { localName: parts[0], exportName: parts[1] };
                }
                return { localName: parts[0], exportName: parts[0] };
            });

        if (moduleSpecifier) {
            const target = resolveModuleFile(moduleSpecifier, modulePath);
            if (target === null) {
                continue;
            }

            const targetExports = parseModuleExports(target, cache, stack).exports;
            for (const specifier of specifiers) {
                const source = targetExports.get(specifier.localName);
                if (!source) {
                    continue;
                }
                finalExports.set(specifier.exportName, {
                    ...source,
                    name: specifier.exportName
                });
            }
            continue;
        }

        for (const specifier of specifiers) {
            const source = localExports.get(specifier.localName);
            if (!source) {
                continue;
            }
            finalExports.set(specifier.exportName, {
                ...source,
                name: specifier.exportName
            });
        }
    }

    const result: ParseResult = { exports: finalExports };
    cache.set(modulePath, result);
    stack.delete(modulePath);

    return result;
}

function collectWorkspacePackageDirectories(): string[] {
    const roots = ['config', 'packages', 'tsed'];
    const packageDirs: string[] = [];

    for (const workspaceRoot of roots) {
        const absoluteRoot = path.join(repositoryRoot, workspaceRoot);
        if (!fs.existsSync(absoluteRoot) || !fs.statSync(absoluteRoot).isDirectory()) {
            continue;
        }

        for (const child of fs.readdirSync(absoluteRoot)) {
            const candidate = path.join(absoluteRoot, child);
            const packageJsonPath = path.join(candidate, 'package.json');
            if (fs.existsSync(packageJsonPath) && fs.statSync(candidate).isDirectory()) {
                packageDirs.push(candidate);
            }
        }
    }

    return packageDirs.sort((a, b) => a.localeCompare(b));
}

function resolvePackageEntrypoint(packageDir: string, packageJson: Record<string, unknown>): string | null {
    const candidates = [
        path.join(packageDir, 'src', 'index.ts'),
        path.join(packageDir, 'src', 'index.mjs')
    ];

    if (typeof packageJson.types === 'string') {
        candidates.push(path.join(packageDir, packageJson.types));
    }

    if (typeof packageJson.main === 'string') {
        candidates.push(path.join(packageDir, packageJson.main));
    }

    for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
        }
    }

    return null;
}

function buildCapabilityIndex(): CapabilityIndex {
    const packageDirs = collectWorkspacePackageDirectories();
    const cache = new Map<string, ParseResult>();

    const packages: PackageEntry[] = packageDirs.map((packageDir) => {
        const packageJsonPath = path.join(packageDir, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>;
        const name = String(packageJson.name ?? path.basename(packageDir));
        const entrypoint = resolvePackageEntrypoint(packageDir, packageJson);

        if (!entrypoint) {
            return {
                name,
                location: path.relative(repositoryRoot, packageDir).replaceAll(path.sep, '/'),
                entrypoint: null,
                exports: []
            };
        }

        const parsed = parseModuleExports(entrypoint, cache, new Set<string>());

        const exports = Array.from(parsed.exports.values())
            .map((entry) => ({
                ...entry,
                source: path.relative(repositoryRoot, entry.source).replaceAll(path.sep, '/')
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return {
            name,
            location: path.relative(repositoryRoot, packageDir).replaceAll(path.sep, '/'),
            entrypoint: path.relative(repositoryRoot, entrypoint).replaceAll(path.sep, '/'),
            exports
        };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return { packages };
}

function renderMarkdown(index: CapabilityIndex): string {
    const lines: string[] = [];

    lines.push('# Capability Index');
    lines.push('');
    lines.push('Generated from package entrypoint exports. Do not edit manually.');
    lines.push('');

    for (const pkg of index.packages) {
        lines.push(`## ${pkg.name}`);
        lines.push('');
        lines.push(`- Location: \`${pkg.location}\``);
        lines.push(`- Entrypoint: ${pkg.entrypoint ? `\`${pkg.entrypoint}\`` : '`(none)`'}`);
        lines.push('');

        if (pkg.exports.length === 0) {
            lines.push('_No exported symbols discovered from an entrypoint._');
            lines.push('');
            continue;
        }

        lines.push('| Export | Signature | Purpose |');
        lines.push('| --- | --- | --- |');

        for (const entry of pkg.exports) {
            const signature = entry.signature.replaceAll('|', '\\|');
            const purpose = (entry.purpose || '-').replaceAll('|', '\\|');
            lines.push(`| \`${entry.name}\` | \`${signature}\` | ${purpose} |`);

            if (entry.members.length > 0) {
                lines.push(`|  | members: \`${entry.members.join(', ')}\` |  |`);
            }
        }

        lines.push('');
    }

    return `${lines.join('\n')}\n`;
}

function writeIndexFiles(index: CapabilityIndex): void {
    fs.mkdirSync(path.dirname(outputJson), { recursive: true });

    const jsonContent = `${JSON.stringify(index, null, 2)}\n`;
    const markdownContent = renderMarkdown(index);

    fs.writeFileSync(outputJson, jsonContent, 'utf8');
    fs.writeFileSync(outputMarkdown, markdownContent, 'utf8');
}

function collectMarkdownFilesForReferenceValidation(): string[] {
    const files: string[] = [path.join(repositoryRoot, 'AGENTS.md')];
    const skillsRoot = path.join(repositoryRoot, '.github', 'skills');

    if (!fs.existsSync(skillsRoot)) {
        return files;
    }

    const visit = (directory: string): void => {
        for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
            const fullPath = path.join(directory, item.name);
            if (item.isDirectory()) {
                visit(fullPath);
                continue;
            }

            if (item.isFile() && item.name.endsWith('.md')) {
                files.push(fullPath);
            }
        }
    };

    visit(skillsRoot);
    return files.sort((a, b) => a.localeCompare(b));
}

function validateAgentReferences(index: CapabilityIndex): string[] {
    const exportedByName = new Map<string, ExportEntry[]>();

    for (const pkg of index.packages) {
        for (const entry of pkg.exports) {
            const existing = exportedByName.get(entry.name) ?? [];
            existing.push(entry);
            exportedByName.set(entry.name, existing);
        }
    }

    const issues: string[] = [];
    const markdownFiles = collectMarkdownFilesForReferenceValidation();

    for (const file of markdownFiles) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/```[\s\S]*?```/g, '');

        const inlineCodeMatches = content.match(/`[^`]+`/g) ?? [];

        for (const rawSnippet of inlineCodeMatches) {
            const snippet = rawSnippet.slice(1, -1).trim();
            // Keep this strict on two-part `Owner.member` references to avoid noisy false positives
            // from general prose and non-API markdown snippets.
            const memberMatch = /^([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)$/.exec(snippet);
            if (!memberMatch) {
                continue;
            }

            const owner = memberMatch[1];
            const member = memberMatch[2];
            const ownerEntries = exportedByName.get(owner);

            if (!ownerEntries) {
                continue;
            }

            const classEntries = ownerEntries.filter((entry) => entry.kind === 'class');
            if (classEntries.length === 0) {
                continue;
            }

            const hasMember = classEntries.some((entry) => entry.members.includes(member));
            if (!hasMember) {
                const relativeFile = path.relative(repositoryRoot, file).replaceAll(path.sep, '/');
                issues.push(`${relativeFile}: reference \`${snippet}\` points to missing member \`${member}\` on exported symbol \`${owner}\`.`);
            }
        }
    }

    return issues;
}

function main(): void {
    const capabilityIndex = buildCapabilityIndex();
    const referenceIssues = validateAgentReferences(capabilityIndex);

    if (!shouldValidateOnly) {
        writeIndexFiles(capabilityIndex);
    }

    if (referenceIssues.length > 0) {
        console.error('Capability reference validation failed:');
        for (const issue of referenceIssues) {
            console.error(`- ${issue}`);
        }
        process.exit(1);
    }

    console.log(`Capability index processed for ${capabilityIndex.packages.length} packages.`);
}

main();
