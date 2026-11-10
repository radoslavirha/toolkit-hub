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

    it('renders a discriminated union as one subsection per variant', () => {
        const md = render(z.object({
            key: z.discriminatedUnion('source', [
                z.object({ source: z.literal('value'), value: z.string().min(1) }),
                z.object({ source: z.literal('jwks'), uri: z.url() })
            ])
        }));

        expect(md).toContain('### `key`: one of 2');
        expect(md).toContain('Pick the variant with `source`.');
        expect(md).toContain('#### `key` — `source: "value"`');
        expect(md).toContain('| `key.value` | string (non-empty) | yes |');
        expect(md).toContain('#### `key` — `source: "jwks"`');
        expect(md).toContain('| `key.uri` | string (uri) | yes |');
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

        expect(md).toContain('### `headers[]`: one of 2');
        expect(md).toContain('#### `headers[]` — with `credential`');
        expect(md).toContain('#### `headers[]` — with `value`');
    });

    it('prints a union repeated at the same path once', () => {
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

        expect(md.match(/— with `credential`/g)).toHaveLength(1);
        expect(md).toContain('Same shapes as described above, first listed under `auth — strategy: "a"`.');
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

        expect(md).toContain('#### `target` — variant 2');
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
