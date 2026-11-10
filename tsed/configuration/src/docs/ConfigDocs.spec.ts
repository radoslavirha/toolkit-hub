import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { BaseConfig } from '../models/BaseConfig.js';
import { ConfigDocs } from './ConfigDocs.js';

const render = (schema: z.ZodType): string => ConfigDocs.render(schema, { title: 'test-api' });

describe('ConfigDocs', () => {
    it('renders the BaseConfig fields with their descriptions', () => {
        const md = render(BaseConfig);

        expect(md).toContain('# test-api — configuration');
        expect(md).toContain('| [`server`](#server) | yes | Ts.ED server settings.');
        expect(md).toContain('| `server.httpPort` | number | yes |  | HTTP port the server listens on.');
        expect(md).toContain('| `serviceName` | string |  |  | Service name. Defaults to the name in package.json. |');
    });

    it('treats a key with a default as optional and shows the default', () => {
        const md = render(z.object({ level: z.enum(['info', 'debug']).default('info').describe('Logging level.') }));

        expect(md).toContain('| `level` | `"info"` \\| `"debug"` |  | `"info"` | Logging level. |');
    });

    it('collapses a union and every variant in it, whatever their size', () => {
        const md = render(z.object({
            key: z.discriminatedUnion('source', [
                z.object({ source: z.literal('value'), value: z.string().min(1) }),
                z.object({ source: z.literal('jwks'), uri: z.url() })
            ])
        }));

        expect(md).toContain('<details>\n<summary><code>key</code>: one of 2</summary>\n<blockquote>\n\nPick the variant with `source`.');
        expect(md).toContain('<details>\n<summary><code>key</code> — <code>source: "value"</code></summary>\n<blockquote>\n\n| Key |');
        expect(md).toContain('| `key.value` | string (non-empty) | yes |');
        expect(md).toContain('<summary><code>key</code> — <code>source: "jwks"</code></summary>');
        expect(md).toContain('| `key.uri` | string (uri) | yes |  |  |\n\n</blockquote>\n</details>\n\n</blockquote>\n</details>');
        expect(md.match(/<details>/g)).toHaveLength(3);
        expect(md).not.toMatch(/^#{3,} /m);
    });

    it('nests a collapsed union inside a collapsed variant', () => {
        const md = ConfigDocs.render(z.object({
            auth: z.discriminatedUnion('type', [
                z.object({
                    type: z.literal('bearer-jwt'),
                    key: z.discriminatedUnion('source', [
                        z.object({ source: z.literal('value'), value: z.string() }),
                        z.object({ source: z.literal('jwks'), uri: z.url() })
                    ])
                }),
                z.object({ type: z.literal('unauthenticated') })
            ])
        }), { title: 't' });

        const outer = md.indexOf('<summary><code>auth</code> — <code>type: "bearer-jwt"</code></summary>');
        const nested = md.indexOf('<summary><code>auth.key</code>: one of 2</summary>');
        const inner = md.indexOf('<summary><code>auth.key</code> — <code>source: "value"</code></summary>');
        const sibling = md.indexOf('<summary><code>auth</code> — <code>type: "unauthenticated"</code></summary>');
        expect(outer).toBeGreaterThan(-1);
        expect(nested).toBeGreaterThan(outer);
        expect(inner).toBeGreaterThan(nested);
        expect(sibling).toBeGreaterThan(inner);
        // Every body is indented in a blockquote that closes with its block.
        expect(md.match(/<blockquote>/g)).toHaveLength(md.match(/<details>/g)?.length ?? 0);
        expect(md.match(/<\/blockquote>\n<\/details>/g)).toHaveLength(md.match(/<\/details>/g)?.length ?? 0);
        // Both inner variants and their union close before the outer variant does.
        expect(md.slice(inner, sibling).match(/<\/details>/g)).toHaveLength(4);
        expect(md.match(/<details>/g)).toHaveLength(md.match(/<\/details>/g)?.length ?? 0);
    });

    it('escapes HTML in a variant summary', () => {
        const md = ConfigDocs.render(z.object({
            target: z.record(z.string(), z.discriminatedUnion('kind', [
                z.object({ kind: z.literal('a&b'), host: z.string() }),
                z.object({ kind: z.literal('c'), port: z.number() })
            ]))
        }), { title: 't' });

        expect(md).toContain('<summary><code>target.&lt;name&gt;</code> — <code>kind: "a&amp;b"</code></summary>');
    });

    it('keeps sections expanded by default and collapses them when asked', () => {
        const schema = z.object({ server: z.object({ httpPort: z.number() }) });

        expect(render(schema)).not.toContain('<details>');
        const md = ConfigDocs.render(schema, { title: 't', collapseSections: true });
        expect(md).toContain([
            '## server',
            '',
            'Required.',
            '',
            '<details>',
            '<summary>Settings of <code>server</code></summary>',
            '<blockquote>',
            '',
            '| Key |'
        ].join('\n'));
        expect(md).toContain('| `server.httpPort` | number | yes |  |  |\n\n</blockquote>\n</details>');
    });

    it('keeps a section of scalars in one plain table', () => {
        const md = render(z.object({ server: z.object({ httpPort: z.number(), host: z.string() }) }));

        expect(md).not.toContain('<details>');
        expect(md).toContain('| `server.httpPort` | number | yes |  |  |\n| `server.host` | string | yes |');
    });

    it('collapses every object child, however small, and keeps its own row in the parent', () => {
        const md = render(z.object({
            net: z.object({
                port: z.number(),
                proxy: z.object({ host: z.string() }).describe('Proxy `one`.')
            })
        }));

        expect(md).toContain('| `net.port` | number | yes |  |  |\n| `net.proxy` | object | yes |  | Proxy `one`. |\n\n<details>');
        expect(md).toContain('<summary><code>net.proxy</code> — Proxy <code>one</code>.</summary>\n<blockquote>\n\n| Key | Type | Required | Default | Description |\n| --- | --- | --- | --- | --- |\n| `net.proxy` | object |');
        expect(md).toContain('| `net.proxy.host` | string | yes |  |  |\n\n</blockquote>\n</details>');
        expect(md.match(/<details>/g)).toHaveLength(1);
    });

    it('collapses a child inside a child, recursively', () => {
        const five = { a: z.string(), b: z.string(), c: z.string(), d: z.string(), e: z.string() };
        const md = render(z.object({ root: z.object({ outer: z.object({ ...five, inner: z.object(five) }) }) }));

        const outer = md.indexOf('<summary><code>root.outer</code></summary>');
        const inner = md.indexOf('<summary><code>root.outer.inner</code></summary>');
        expect(outer).toBeGreaterThan(-1);
        expect(inner).toBeGreaterThan(outer);
        // The outer table keeps the inner row; the inner rows sit only in the inner block.
        expect(md.slice(outer, inner)).toContain('| `root.outer.inner` | object | yes |');
        expect(md.slice(outer, inner)).not.toContain('`root.outer.inner.a`');
        expect(md.slice(inner)).toContain('| `root.outer.inner.a` | string | yes |');
        expect(md.slice(inner).match(/<\/details>/g)).toHaveLength(2);
    });

    it('collapses the items of an array or map the same way', () => {
        const item = z.object({ a: z.string(), b: z.string(), c: z.string(), d: z.string(), e: z.string() });
        const md = render(z.object({ servers: z.array(item), apis: z.record(z.string(), item.describe('One API.')) }));

        expect(md).toContain('| `servers` | array of object | yes |  |  |\n\n<details>\n<summary><code>servers[]</code></summary>');
        expect(md).toContain('<summary><code>apis.&lt;name&gt;</code> — One API.</summary>');
        expect(md).toContain('| `apis.<name>.e` | string | yes |  |  |\n\n</blockquote>\n</details>');
    });

    it('puts a union inside the innermost collapsed block holding its key', () => {
        const api = z.object({
            baseURL: z.url(),
            a: z.string(),
            b: z.string(),
            c: z.string(),
            auth: z.discriminatedUnion('strategy', [
                z.object({ strategy: z.literal('none') }),
                z.object({ strategy: z.literal('token'), token: z.string() })
            ])
        });
        const md = render(z.object({ externalApis: z.object({ timeoutMs: z.number().default(1000), A: api, B: api }) }));

        const blockA = md.indexOf('<summary><code>externalApis.A</code></summary>');
        const unionA = md.indexOf('<summary><code>externalApis.A.auth</code>: one of 2</summary>');
        const blockB = md.indexOf('<summary><code>externalApis.B</code></summary>');
        const unionB = md.indexOf('<summary><code>externalApis.B.auth</code>: one of 2</summary>');
        expect(md.indexOf('| `externalApis.timeoutMs` | number |  | `1000` |  |')).toBeLessThan(blockA);
        expect(unionA).toBeGreaterThan(blockA);
        expect(blockB).toBeGreaterThan(unionA);
        expect(unionB).toBeGreaterThan(blockB);
        // Both variants, the union, then block A close before block B opens.
        expect(md.slice(unionA, blockB)).toContain('<summary><code>externalApis.A.auth</code> — <code>strategy: "token"</code></summary>');
        expect(md.slice(unionA, blockB).match(/<\/details>/g)).toHaveLength(4);
        expect(md.match(/<details>/g)).toHaveLength(md.match(/<\/details>/g)?.length ?? 0);
    });

    it('collapses an enabled true/false toggle with the same keys into one table', () => {
        const md = render(z.object({
            polling: z.discriminatedUnion('enabled', [
                z.object({ enabled: z.literal(true), intervalMs: z.number().default(1000) }),
                z.object({ enabled: z.literal(false), intervalMs: z.number().default(1000) })
            ]).optional()
        }));

        expect(md).not.toContain('one of');
        expect(md).toContain('| `polling.enabled` | boolean | yes |  | Set to `false` to disable.');
        expect(md).toContain('| `polling.intervalMs` | number |  | `1000` |  |');
    });

    it('drops a variant that an intersection makes impossible', () => {
        const toggle = z.discriminatedUnion('enabled', [
            z.object({ enabled: z.literal(true), url: z.string() }),
            z.object({ enabled: z.literal(false) })
        ]);
        const md = render(z.object({ mongodb: toggle.and(z.object({ enabled: z.literal(true) })) }));

        expect(md).not.toContain('one of');
        expect(md).toContain('| `mongodb.enabled` | `true` | yes |');
        expect(md).toContain('| `mongodb.url` | string | yes |');
    });

    it('labels variants without a discriminator by the keys only they require', () => {
        const md = render(z.object({
            headers: z.array(z.union([
                z.object({ name: z.string(), credential: z.string() }),
                z.object({ name: z.string(), value: z.string() })
            ]))
        }));

        expect(md).toContain('<summary><code>headers[]</code>: one of 2</summary>');
        expect(md).toContain('<summary><code>headers[]</code> — with <code>credential</code></summary>');
        expect(md).toContain('<summary><code>headers[]</code> — with <code>value</code></summary>');
    });

    it('prints a union in full wherever it occurs, without back-references', () => {
        const headers = z.array(z.union([
            z.object({ name: z.string(), credential: z.string() }),
            z.object({ name: z.string(), value: z.string() })
        ]));
        const md = render(z.object({
            auth: z.discriminatedUnion('strategy', [
                z.object({ strategy: z.literal('a'), headers }),
                z.object({ strategy: z.literal('b'), headers })
            ])
        }));

        expect(md.match(/<summary><code>auth\.headers\[\]<\/code>: one of 2<\/summary>/g)).toHaveLength(2);
        expect(md.match(/— with <code>credential<\/code>/g)).toHaveLength(2);
        expect(md).not.toContain('same shapes');
    });

    it('renders a map of named entries and a nullable value', () => {
        const md = render(z.object({
            apis: z.record(z.string(), z.object({ baseURL: z.url() })),
            note: z.string().nullable()
        }));

        expect(md).toContain('| `apis` | map of name → object | yes |');
        expect(md).toContain('| `apis.<name>.baseURL` | string (uri) | yes |');
        expect(md).toContain('| `note` | string \\| null | yes |');
    });

    it('omits an object default that only restates its children defaults', () => {
        const md = render(z.object({
            health: z.object({ cacheTtlMs: z.number().default(1000) }).default({ cacheTtlMs: 1000 })
        }));

        expect(md).toContain('| `health.cacheTtlMs` | number |  | `1000` |  |');
        expect(md).not.toContain('{"cacheTtlMs":1000}');
    });

    it('builds a minimal example from the required keys only', () => {
        const md = render(z.object({
            server: z.object({ httpPort: z.number() }),
            url: z.url(),
            level: z.string().default('info')
        }));

        expect(md).toContain([
            '```json',
            '{',
            '  "server": {',
            '    "httpPort": 0',
            '  },',
            '  "url": "https://example.com"',
            '}',
            '```'
        ].join('\n'));
    });

    it('unwraps a nullable object and still lists its keys', () => {
        const md = render(z.object({ net: z.object({ proxy: z.object({ host: z.string() }).nullable() }) }));

        expect(md).toContain('| `net.proxy` | object \\| null | yes |');
        expect(md).toContain('| `net.proxy.host` | string | yes |');
    });

    it('gives a non-object variant of a mixed union a type line', () => {
        const md = render(z.object({ target: z.union([z.object({ host: z.string() }), z.string()]) }));

        expect(md).toContain('<summary><code>target</code> — variant 2</summary>');
        expect(md).toContain('Type: string');
    });

    it('lists simple unions and constraints inline', () => {
        const md = render(z.object({
            id: z.union([z.string(), z.number()]),
            code: z.string().max(5).regex(/^[A-Z]+$/),
            ratio: z.number().min(1).max(10),
            share: z.number().gt(0).lt(1),
            tags: z.array(z.string()).max(3)
        }));

        expect(md).toContain('| `id` | string \\| number | yes |');
        expect(md).toContain('| `code` | string (max length 5, pattern `^[A-Z]+$`) | yes |');
        expect(md).toContain('| `ratio` | number (≥ 1, ≤ 10) | yes |');
        expect(md).toContain('| `share` | number (> 0, < 1) | yes |');
        expect(md).toContain('| `tags` | array of string (at most 3 items) | yes |');
    });

    it('fills the minimal example with a placeholder for every value kind', () => {
        const md = render(z.object({
            flag: z.boolean(),
            mode: z.enum(['a', 'b']),
            count: z.int().positive(),
            hosts: z.array(z.string()).min(1),
            extra: z.any()
        }));

        expect(md).toContain('"flag": false');
        expect(md).toContain('"mode": "a"');
        expect(md).toContain('"count": 1');
        expect(md).toContain('"hosts": [\n    "<string>"\n  ]');
    });

    it('omits nested object defaults that only restate deeper defaults', () => {
        const md = render(z.object({
            outer: z.object({
                inner: z.object({ ttl: z.number().default(1) })
            }).default({ inner: { ttl: 1 } })
        }));

        expect(md).toContain('| `outer.inner.ttl` | number |  | `1` |  |');
        expect(md).not.toContain('{"inner"');
    });

    it('throws when an intersection can never be satisfied', () => {
        const schema = z.object({ enabled: z.literal(true) }).and(z.object({ enabled: z.literal(false) }));

        expect(() => render(schema)).toThrow('can never be satisfied');
    });

    it('uses a custom introduction when given one', () => {
        const md = ConfigDocs.render(BaseConfig, { title: 't', intro: 'Custom intro.' });

        expect(md).toContain('Custom intro.');
        expect(md).not.toContain('It is validated at boot');
    });
});
