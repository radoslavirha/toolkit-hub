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

/**
 * What one table renders: its rows, the unions whose keys sit in it, and the object-like children
 * big enough to get a collapsed block of their own.
 */
interface Block {
    rows: Row[];
    unions: DeferredUnion[];
    children: CollapsedChild[];
}

interface CollapsedChild {
    /** Path shown in the summary: the object's own path, or `x[]` / `x.<name>` for items. */
    path: string;
    description: string;
    block: Block;
}

/** A union variant's label: summary HTML, heading Markdown, and plain text for back-references. */
interface VariantLabel {
    html: string;
    markdown: string;
    text: string;
}

const DEFAULT_COLLAPSE_THRESHOLD = 5;

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
     * Renders one top-level section as an open table. Below it, at every depth, an object-like
     * child (a plain object, or the items of an array or map) whose table would hold more than
     * `collapseThreshold` rows gets a collapsed block of its own; smaller ones stay inline.
     */
    private renderSection(key: string, schema: JsonSchemaNode, required: boolean, plain: boolean): void {
        const section = { type: 'object', properties: { [key]: schema }, required: required ? [key] : [] };
        // The section itself is never collapsed: its table is what the heading introduces.
        const block = this.block(section, '', false);
        // A plain object's own row only repeats the heading, unless the section is a single value.
        if (plain && block.rows.length > 1) block.rows = block.rows.filter((row) => row.path !== key);
        this.renderBlockContent(block, 3);
    }

    /** A block's table, then the unions whose keys it holds, then its collapsed children. */
    private renderBlockContent(block: Block, level: number): void {
        if (block.rows.length > 0) this.push(this.table(block.rows));
        for (const union of block.unions) this.renderUnion(union, level);
        for (const child of block.children) {
            this.openDetails(StringUtils.isNotEmpty(child.description)
                ? `${this.htmlCode(child.path)} — ${this.inlineHtml(child.description)}`
                : this.htmlCode(child.path));
            this.renderBlockContent(child.block, level);
            this.push('</details>');
        }
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

        // A variant follows the same size rule as an object: above the threshold it is a closed
        // block, otherwise an open heading (which keeps its anchor) and its table.
        variants.forEach((variant, index) => {
            const label = CommonUtils.notNull(discriminator)
                ? this.discriminated(discriminator, variant)
                : this.distinguishing(variants, variant, index);
            this.context.push(`${path} — ${label.text}`);
            const block = this.isPlainObject(variant) ? this.block(variant, path) : null;
            const collapsed = CommonUtils.notNull(block) && this.overThreshold(block.rows.length);
            if (collapsed) this.openDetails(`${this.htmlCode(path)} — ${label.html}`);
            else this.push(`${this.heading(level + 1)} ${this.code(path)} — ${label.markdown}`);
            if (StringUtils.isNotEmpty(variant.description)) this.push(variant.description);
            if (CommonUtils.notNull(block)) this.renderBlockContent(block, collapsed ? level + 1 : level + 2);
            else this.push(`Type: ${this.typeText(variant)}`);
            if (collapsed) this.push('</details>');
            this.context.pop();
        });
    }

    private discriminated(discriminator: string, variant: JsonSchemaNode): VariantLabel {
        const text = `${discriminator}: ${JSON.stringify(variant.properties?.[discriminator]?.const)}`;
        return { html: this.htmlCode(text), markdown: this.code(text), text };
    }

    /** Labels a variant without a discriminator by the keys only it requires. */
    private distinguishing(variants: JsonSchemaNode[], variant: JsonSchemaNode, index: number): VariantLabel {
        const own = (variant.required ?? []).filter((key) => !variants.every((other) => (other.required ?? []).includes(key)));
        if (own.length === 0) return { html: `variant ${index + 1}`, markdown: `variant ${index + 1}`, text: `variant ${index + 1}` };
        return {
            html: `with ${own.map((key) => this.htmlCode(key)).join(', ')}`,
            markdown: `with ${own.map((key) => this.code(key)).join(', ')}`,
            text: `with ${own.join(', ')}`
        };
    }

    /** The one size rule for objects, array or map items, and union variants. */
    private overThreshold(rows: number): boolean {
        return rows > (this.options.collapseThreshold ?? DEFAULT_COLLAPSE_THRESHOLD);
    }

    // ---------- rows ----------

    /**
     * Flattens a plain object into rows with dotted paths. A union of objects, or an array or map
     * of them, gets a row here and its own subsection afterwards. `collapseOwn` is false only for
     * a top-level section, whose own object is never collapsed.
     */
    private block(schema: JsonSchemaNode, prefix: string, collapseOwn = true, out: Block = { rows: [], unions: [], children: [] }): Block {
        const required = new Set(schema.required ?? []);
        for (const [key, raw] of Object.entries(schema.properties ?? {})) {
            const path = prefix === '' ? key : `${prefix}.${key}`;
            const { schema: node } = JsonSchemaNormaliser.splitNullable(raw);
            const restatesChildren = this.isPlainObject(node)
                && CommonUtils.notUndefined(raw.default)
                && this.sameJson(raw.default, this.childDefaults(node));
            const row: Row = {
                path,
                type: this.typeText(raw),
                required: this.isRequired(required, key, raw),
                defaultValue: CommonUtils.notUndefined(raw.default) && !restatesChildren ? this.code(JSON.stringify(raw.default)) : '',
                description: this.descriptionOf(raw)
            };
            out.rows.push(row);
            this.descend(node, row, out, collapseOwn);
        }
        return out;
    }

    private descend(node: JsonSchemaNode, row: Row, out: Block, collapseOwn: boolean): void {
        const variants = JsonSchemaNormaliser.variants(node);
        if (CommonUtils.notNull(variants) && variants.some((variant) => variant.type === 'object')) {
            out.unions.push({ path: row.path, variants });
            return;
        }
        if (this.isPlainObject(node)) {
            this.nest(node, row.path, row, node, out, collapseOwn);
            return;
        }
        let child: JsonSchemaNode | undefined;
        let childPath = row.path;
        if (node.type === 'array' && JsonSchemaNormaliser.isNode(node.items)) {
            child = node.items;
            childPath = `${row.path}[]`;
        } else if (this.isMap(node)) {
            child = node.additionalProperties as JsonSchemaNode;
            childPath = `${row.path}.<name>`;
        }
        if (CommonUtils.isUndefined(child)) return;
        const inner = JsonSchemaNormaliser.splitNullable(child).schema;
        const innerVariants = JsonSchemaNormaliser.variants(inner);
        if (CommonUtils.notNull(innerVariants) && innerVariants.some((variant) => variant.type === 'object')) {
            out.unions.push({ path: childPath, variants: innerVariants });
        } else if (this.isPlainObject(inner)) {
            this.nest(inner, childPath, row, child, out, true);
        }
    }

    /**
     * Flattens an object-like child into its own block. Its table holds the owner's row plus every
     * row not collapsed further down; above the threshold it becomes a collapsed child, otherwise
     * it is merged inline into the parent.
     */
    private nest(node: JsonSchemaNode, path: string, row: Row, schema: JsonSchemaNode, out: Block, collapsible: boolean): void {
        const inner = this.block(node, path);
        if (collapsible && this.overThreshold(inner.rows.length + 1)) {
            out.children.push({
                path,
                description: StringUtils.isNotEmpty(this.descriptionOf(schema)) ? this.descriptionOf(schema) : row.description,
                block: { ...inner, rows: [row, ...inner.rows] }
            });
            return;
        }
        out.rows.push(...inner.rows);
        out.unions.push(...inner.unions);
        out.children.push(...inner.children);
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
