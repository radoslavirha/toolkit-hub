import { ArrayUtils, CommonUtils, ObjectUtils, StringUtils } from '@radoslavirha/utils';
import type { ConfigDocsOptions } from './ConfigDocsOptions.js';
import type { JsonSchemaNode } from './JsonSchemaNode.js';
import { JsonSchemaNormaliser } from './JsonSchemaNormaliser.js';

interface Row {
    path: string;
    type: string;
    required: boolean;
    defaultValue: string;
    description: string;
}

interface DeferredUnion {
    path: string;
    variants: JsonSchemaNode[];
}

interface ChildGroup {
    path: string;
    schema: JsonSchemaNode;
    rows: Row[];
    deferred: DeferredUnion[];
    expands: boolean;
}

const DEFAULT_INTRO = [
    'The service reads one JSON document (the `config` library: `config/<NODE_ENV>.json`; in a cluster, the mounted ConfigMap). '
    + 'It is validated at boot, and an invalid document stops the service. Keys not listed here are ignored.',
    '',
    '**Required** means the key must be present whenever its parent is. A key with a default may be left out.'
].join('\n');

/**
 * Renders one normalised configuration JSON Schema as Markdown. Holds per-render state (which
 * unions were already printed), so a new instance is made for every render.
 */
export class ConfigDocsRenderer {
    private readonly lines: string[] = [];
    private readonly seenUnions = new Map<string, string>();
    private readonly context: string[] = [];

    public constructor(
        private readonly root: JsonSchemaNode,
        private readonly options: ConfigDocsOptions
    ) {}

    public render(): string {
        const required = new Set(this.root.required ?? []);
        const properties = Object.entries(this.root.properties ?? {});

        this.push(`# ${this.options.title} — configuration`);
        this.push('<!-- Generated from the configuration schema. Do not edit by hand. -->');
        this.push(this.options.intro ?? DEFAULT_INTRO);

        this.push('## Sections');
        this.push(this.tableOf(
            ['Section', 'Required', 'Description'],
            properties.map(([key, schema]) => [
                `[${this.code(key)}](#${key.toLowerCase()})`,
                this.isRequired(required, key, schema) ? 'yes' : '',
                this.cell(this.descriptionOf(schema))
            ])
        ));

        this.push('## Minimal example');
        this.push('Only the required keys, with placeholder values. Everything else falls back to its default.');
        this.push('```json\n' + JSON.stringify(this.example(this.root), null, 2) + '\n```');

        for (const [key, schema] of properties) {
            this.push(`## ${key}`);
            const description = this.descriptionOf(schema);
            if (StringUtils.isNotEmpty(description)) this.push(description);
            const node = JsonSchemaNormaliser.splitNullable(schema).schema;
            const plain = this.isPlainObject(node);
            const facts = [this.isRequired(required, key, schema) ? 'Required.' : 'Optional.'];
            if (CommonUtils.notUndefined(schema.default) && !(plain && this.sameJson(schema.default, this.childDefaults(node)))) {
                facts.push(`Default ${this.code(JSON.stringify(schema.default))}.`);
            }
            this.push(facts.join(' '));
            const collapse = this.options.collapseSections === true;
            if (collapse) this.openDetails(`Settings of ${this.htmlCode(key)}`);
            this.renderSection(key, schema, required.has(key), plain);
            if (collapse) this.push('</details>');
        }

        return this.lines.join('\n\n').replace(/\n{3,}/g, '\n\n') + '\n';
    }

    // ---------- blocks ----------

    /**
     * Renders one top-level section. Each direct child that expands into rows of its own (a plain
     * object, a map or an array of objects) gets a collapsed block holding its table and its
     * unions; the remaining children share one table at the top. A section that is itself a map or
     * an array of objects keeps its own row visible and collapses its items the same way.
     */
    private renderSection(key: string, schema: JsonSchemaNode, required: boolean, plain: boolean): void {
        const section = { type: 'object', properties: { [key]: schema }, required: required ? [key] : [] };
        if (!plain) {
            const deferred: DeferredUnion[] = [];
            const rows = this.rows(section, '', deferred);
            const items = this.itemsOf(key, JsonSchemaNormaliser.splitNullable(schema).schema);
            if (CommonUtils.isNull(items) || !this.expands(schema, rows, deferred)) {
                this.renderBlock(section, '', 3);
                return;
            }
            this.push(this.table(rows.slice(0, 1)));
            this.renderGroup(items.path, items.schema, rows.slice(1), deferred);
            return;
        }
        const groups = this.childGroups(key, JsonSchemaNormaliser.splitNullable(schema).schema);
        const expanding = groups.filter((group) => group.expands);
        if (expanding.length === 0) {
            // A plain object's own row only repeats the heading.
            this.renderBlock(section, '', 3, key);
            return;
        }
        const flat = groups.filter((group) => !group.expands);
        if (flat.length > 0) {
            this.push(this.table(flat.flatMap((group) => group.rows)));
            for (const union of flat.flatMap((group) => group.deferred)) this.renderUnion(union, 3);
        }
        for (const group of expanding) this.renderGroup(group.path, group.schema, group.rows, group.deferred);
    }

    /** One collapsed block: summary from the path and description, then the rows and their unions. */
    private renderGroup(path: string, schema: JsonSchemaNode, rows: Row[], deferred: DeferredUnion[]): void {
        const description = this.descriptionOf(schema);
        this.openDetails(StringUtils.isNotEmpty(description)
            ? `${this.htmlCode(path)} — ${this.inlineHtml(description)}`
            : this.htmlCode(path));
        if (rows.length > 0) this.push(this.table(rows));
        for (const union of deferred) this.renderUnion(union, 3);
        this.push('</details>');
    }

    /** Rows and deferred unions of each direct child of a section, and whether the child expands. */
    private childGroups(key: string, node: JsonSchemaNode): ChildGroup[] {
        const required = new Set(node.required ?? []);
        return Object.entries(node.properties ?? {}).map(([child, schema]) => {
            const deferred: DeferredUnion[] = [];
            const rows = this.rows({ type: 'object', properties: { [child]: schema }, required: required.has(child) ? [child] : [] }, key, deferred);
            return { path: `${key}.${child}`, schema, rows, deferred, expands: this.expands(schema, rows, deferred) };
        });
    }

    /**
     * Whether a value has rows or unions below its own row. A union keeps its row in the shared
     * table: its variants already collapse.
     */
    private expands(schema: JsonSchemaNode, rows: Row[], deferred: DeferredUnion[]): boolean {
        const union = CommonUtils.notNull(JsonSchemaNormaliser.variants(JsonSchemaNormaliser.splitNullable(schema).schema));
        return !union && (rows.length > 1 || deferred.length > 0);
    }

    /** The item path and schema of an array or a map, as its rows name them; `null` for anything else. */
    private itemsOf(key: string, node: JsonSchemaNode): { path: string; schema: JsonSchemaNode } | null {
        if (node.type === 'array' && JsonSchemaNormaliser.isNode(node.items)) return { path: `${key}[]`, schema: node.items };
        if (this.isMap(node)) return { path: `${key}.<name>`, schema: node.additionalProperties as JsonSchemaNode };
        return null;
    }

    private renderBlock(schema: JsonSchemaNode, path: string, level: number, dropRow?: string): void {
        const deferred: DeferredUnion[] = [];
        let rows = this.rows(schema, path, deferred);
        // A section's own row only repeats its heading, unless the section is a single value.
        if (CommonUtils.notUndefined(dropRow) && rows.length > 1) rows = rows.filter((row) => row.path !== dropRow);
        this.push(this.table(rows));
        for (const union of deferred) this.renderUnion(union, level);
    }

    private renderUnion({ path, variants }: DeferredUnion, level: number): void {
        const heading = this.heading(level);
        const key = path + JSON.stringify(variants);
        const firstSeen = this.seenUnions.get(key);
        if (CommonUtils.notUndefined(firstSeen)) {
            this.push(`${heading} ${this.code(path)}`);
            this.push(`Same shapes as described above, first listed under ${this.code(firstSeen)}.`);
            return;
        }
        this.seenUnions.set(key, this.context.at(-1) ?? path);

        const discriminator = JsonSchemaNormaliser.discriminator(variants);
        this.push(`${heading} ${this.code(path)}: one of ${variants.length}`);
        this.push(CommonUtils.notNull(discriminator)
            ? `Pick the variant with ${this.code(discriminator)}.`
            : 'Give exactly one of the shapes below.');

        // Each variant is collapsed: only one applies, so the reader opens the one they picked.
        variants.forEach((variant, index) => {
            const label = CommonUtils.notNull(discriminator)
                ? this.discriminated(discriminator, variant)
                : this.distinguishing(variants, variant, index);
            this.openDetails(`${this.htmlCode(path)} — ${label.html}`);
            this.context.push(`${path} — ${label.text}`);
            if (StringUtils.isNotEmpty(variant.description)) this.push(variant.description);
            if (this.isPlainObject(variant)) this.renderBlock(variant, path, level + 1);
            else this.push(`Type: ${this.typeText(variant)}`);
            this.context.pop();
            this.push('</details>');
        });
    }

    private discriminated(discriminator: string, variant: JsonSchemaNode): { html: string; text: string } {
        const text = `${discriminator}: ${JSON.stringify(variant.properties?.[discriminator]?.const)}`;
        return { html: this.htmlCode(text), text };
    }

    /** Labels a variant without a discriminator by the keys only it requires, as summary HTML and as plain text. */
    private distinguishing(variants: JsonSchemaNode[], variant: JsonSchemaNode, index: number): { html: string; text: string } {
        const own = (variant.required ?? []).filter((key) => !variants.every((other) => (other.required ?? []).includes(key)));
        if (own.length === 0) return { html: `variant ${index + 1}`, text: `variant ${index + 1}` };
        return {
            html: `with ${own.map((key) => this.htmlCode(key)).join(', ')}`,
            text: `with ${own.join(', ')}`
        };
    }

    // ---------- rows ----------

    /**
     * Flattens a plain object into rows with dotted paths. A union of objects, or an array or map
     * of them, gets a row here and its own subsection afterwards.
     */
    private rows(schema: JsonSchemaNode, prefix: string, deferred: DeferredUnion[], out: Row[] = []): Row[] {
        const required = new Set(schema.required ?? []);
        for (const [key, raw] of Object.entries(schema.properties ?? {})) {
            const path = prefix === '' ? key : `${prefix}.${key}`;
            const { schema: node } = JsonSchemaNormaliser.splitNullable(raw);
            const restatesChildren = this.isPlainObject(node)
                && CommonUtils.notUndefined(raw.default)
                && this.sameJson(raw.default, this.childDefaults(node));
            out.push({
                path,
                type: this.typeText(raw),
                required: this.isRequired(required, key, raw),
                defaultValue: CommonUtils.notUndefined(raw.default) && !restatesChildren ? this.code(JSON.stringify(raw.default)) : '',
                description: this.descriptionOf(raw)
            });
            this.descend(node, path, deferred, out);
        }
        return out;
    }

    private descend(node: JsonSchemaNode, path: string, deferred: DeferredUnion[], out: Row[]): void {
        const variants = JsonSchemaNormaliser.variants(node);
        if (CommonUtils.notNull(variants) && variants.some((variant) => variant.type === 'object')) {
            deferred.push({ path, variants });
            return;
        }
        if (this.isPlainObject(node)) {
            this.rows(node, path, deferred, out);
            return;
        }
        let child: JsonSchemaNode | undefined;
        let childPath = path;
        if (node.type === 'array' && JsonSchemaNormaliser.isNode(node.items)) {
            child = node.items;
            childPath = `${path}[]`;
        } else if (this.isMap(node)) {
            child = node.additionalProperties as JsonSchemaNode;
            childPath = `${path}.<name>`;
        }
        if (CommonUtils.isUndefined(child)) return;
        const inner = JsonSchemaNormaliser.splitNullable(child).schema;
        const innerVariants = JsonSchemaNormaliser.variants(inner);
        if (CommonUtils.notNull(innerVariants) && innerVariants.some((variant) => variant.type === 'object')) {
            deferred.push({ path: childPath, variants: innerVariants });
        } else if (this.isPlainObject(inner)) {
            this.rows(inner, childPath, deferred, out);
        }
    }

    // ---------- type text ----------

    private typeText(raw: JsonSchemaNode): string {
        const { schema: node, nullable } = JsonSchemaNormaliser.splitNullable(raw);
        const variants = JsonSchemaNormaliser.variants(node);
        let text: string;
        if ('const' in node) text = this.code(JSON.stringify(node.const));
        else if (ArrayUtils.isArray(node.enum)) text = node.enum.map((value) => this.code(JSON.stringify(value))).join(' | ');
        else if (CommonUtils.notNull(variants)) {
            const simple = variants.every((variant) => variant.type !== 'object' && variant.type !== 'array');
            text = simple ? variants.map((variant) => this.typeText(variant)).join(' | ') : 'one of (see below)';
        } else if (node.type === 'array') {
            text = `array of ${JsonSchemaNormaliser.isNode(node.items) ? this.typeText(node.items) : 'any'}`;
        } else if (this.isMap(node)) {
            const value = node.additionalProperties as JsonSchemaNode;
            text = `map of name → ${this.isPlainObject(value) ? 'object' : this.typeText(value)}`;
        } else if (ArrayUtils.isArray(node.type)) text = node.type.join(' | ');
        else text = node.type ?? 'any';

        const constraints = this.constraints(node);
        if (constraints.length > 0 && CommonUtils.isNull(variants)) text += ` (${constraints.join(', ')})`;
        return nullable ? `${text} | null` : text;
    }

    private constraints(node: JsonSchemaNode): string[] {
        const out: string[] = [];
        const safe = (value: number): boolean => Math.abs(value) !== Number.MAX_SAFE_INTEGER;
        if (CommonUtils.notUndefined(node.format)) out.push(node.format);
        if (CommonUtils.notUndefined(node.minLength)) out.push(node.minLength === 1 ? 'non-empty' : `min length ${node.minLength}`);
        if (CommonUtils.notUndefined(node.maxLength)) out.push(`max length ${node.maxLength}`);
        if (CommonUtils.notUndefined(node.minimum) && safe(node.minimum)) out.push(`≥ ${node.minimum}`);
        if (CommonUtils.notUndefined(node.exclusiveMinimum)) out.push(`> ${node.exclusiveMinimum}`);
        if (CommonUtils.notUndefined(node.maximum) && safe(node.maximum)) out.push(`≤ ${node.maximum}`);
        if (CommonUtils.notUndefined(node.exclusiveMaximum)) out.push(`< ${node.exclusiveMaximum}`);
        if (CommonUtils.notUndefined(node.minItems)) out.push(`at least ${node.minItems} item${node.minItems === 1 ? '' : 's'}`);
        if (CommonUtils.notUndefined(node.maxItems)) out.push(`at most ${node.maxItems} items`);
        if (CommonUtils.notUndefined(node.pattern)) out.push(`pattern ${this.code(node.pattern)}`);
        return out;
    }

    // ---------- example ----------

    private example(raw: JsonSchemaNode): unknown {
        const { schema: node } = JsonSchemaNormaliser.splitNullable(raw);
        if ('const' in node) return node.const;
        if (ArrayUtils.isArray(node.enum)) return node.enum[0];
        const variants = JsonSchemaNormaliser.variants(node);
        if (CommonUtils.notNull(variants)) return this.example(variants[0]);
        switch (node.type) {
            case 'object': {
                const out: Record<string, unknown> = {};
                for (const key of node.required ?? []) {
                    const child = node.properties?.[key];
                    if (CommonUtils.notUndefined(child) && CommonUtils.isUndefined(child.default)) out[key] = this.example(child);
                }
                return out;
            }
            case 'array':
                return CommonUtils.notUndefined(node.minItems) && node.minItems > 0 ? [this.example(node.items ?? {})] : [];
            case 'string':
                return node.format === 'uri' ? 'https://example.com' : '<string>';
            case 'number':
            case 'integer':
                return CommonUtils.notUndefined(node.exclusiveMinimum) ? node.exclusiveMinimum + 1 : (node.minimum ?? 0);
            case 'boolean':
                return false;
            default:
                return null;
        }
    }

    // ---------- helpers ----------

    /** What an object becomes when every child falls back to its own default. */
    private childDefaults(node: JsonSchemaNode): Record<string, unknown> {
        const out: Record<string, unknown> = {};
        for (const [key, raw] of Object.entries(node.properties ?? {})) {
            const child = JsonSchemaNormaliser.splitNullable(raw).schema;
            if (CommonUtils.notUndefined(raw.default)) out[key] = raw.default;
            else if (this.isPlainObject(child)) {
                const nested = this.childDefaults(child);
                if (Object.keys(nested).length > 0) out[key] = nested;
            }
        }
        return out;
    }

    private sameJson(left: unknown, right: unknown): boolean {
        return JSON.stringify(this.sortKeys(left)) === JSON.stringify(this.sortKeys(right));
    }

    private sortKeys(value: unknown): unknown {
        if (ArrayUtils.isArray(value)) return value.map((item) => this.sortKeys(item));
        if (ObjectUtils.isPlainObject(value)) {
            const record = value as Record<string, unknown>;
            return Object.fromEntries(Object.keys(record).sort().map((key) => [key, this.sortKeys(record[key])]));
        }
        return value;
    }

    private isRequired(required: Set<string>, key: string, schema: JsonSchemaNode): boolean {
        return required.has(key) && CommonUtils.isUndefined(schema.default);
    }

    private descriptionOf(schema: JsonSchemaNode): string {
        return schema.description ?? JsonSchemaNormaliser.splitNullable(schema).schema.description ?? '';
    }

    private isPlainObject(node: JsonSchemaNode): boolean {
        return node.type === 'object'
            && JsonSchemaNormaliser.isNode(node.properties)
            && CommonUtils.isNull(JsonSchemaNormaliser.variants(node));
    }

    private isMap(node: JsonSchemaNode): boolean {
        return node.type === 'object'
            && CommonUtils.isUndefined(node.properties)
            && JsonSchemaNormaliser.isNode(node.additionalProperties)
            && Object.keys(node.additionalProperties).length > 0;
    }

    private table(rows: Row[]): string {
        if (rows.length === 0) return '_No settings._';
        return this.tableOf(
            ['Key', 'Type', 'Required', 'Default', 'Description'],
            rows.map((row) => [
                this.code(row.path),
                this.cell(row.type),
                row.required ? 'yes' : '',
                this.cell(row.defaultValue),
                this.cell(row.description)
            ])
        );
    }

    private tableOf(header: string[], rows: string[][]): string {
        const line = (cells: string[]): string => `| ${cells.join(' | ')} |`;
        return [line(header), line(header.map(() => '---')), ...rows.map(line)].join('\n');
    }

    private heading(level: number): string {
        return '#'.repeat(Math.min(level, 6));
    }

    /**
     * Opens a collapsed `<details>` block. GitHub does not render Markdown inside `<summary>`, so
     * the summary is HTML; the blank line `push` leaves after it lets Markdown render in the body.
     */
    private openDetails(summaryHtml: string): void {
        this.push(`<details>\n<summary>${summaryHtml}</summary>`);
    }

    private htmlCode(value: string): string {
        return `<code>${this.escapeHtml(value)}</code>`;
    }

    /** Description text for a `<summary>`: escaped, newlines folded, inline code kept as `<code>`. */
    private inlineHtml(value: string): string {
        return this.escapeHtml(value).replace(/\r?\n+/g, ' ').replace(/`([^`]+)`/g, '<code>$1</code>').trim();
    }

    private escapeHtml(value: string): string {
        return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    private code(value: string): string {
        return '`' + value.replace(/`/g, '\\`') + '`';
    }

    /** Escapes a value for a table cell: `|` would end the cell, a newline the row. */
    private cell(value: string): string {
        return value.replace(/\|/g, '\\|').replace(/\r?\n+/g, ' ').trim();
    }

    private push(block: string): void {
        this.lines.push(block);
    }
}
