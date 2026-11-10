import { ArrayUtils, BooleanUtils, CommonUtils, ObjectUtils } from '@radoslavirha/utils';
import type { JsonSchemaNode } from './JsonSchemaNode.js';

/**
 * Rewrites a Zod-emitted JSON Schema into the shapes a reader expects:
 *
 * - `allOf` members are merged into one schema (Zod emits them for `.and()`); a merge whose
 *   members contradict (`const: true` and `const: false`) makes the schema impossible, and an
 *   impossible union variant is dropped.
 * - A union left with one variant becomes that variant.
 * - An `enabled: true | false` toggle whose two variants carry the same keys becomes one object
 *   with a boolean `enabled`.
 * - `X | null` stays a union; {@link JsonSchemaNormaliser.splitNullable} unwraps it on read.
 */
export class JsonSchemaNormaliser {
    /** Normalises every sub-schema, children first. Returns `null` when the schema itself is impossible. */
    public static normalise(schema: JsonSchemaNode): JsonSchemaNode | null {
        let node: JsonSchemaNode = { ...schema };
        if (CommonUtils.notNil(node.properties)) {
            const properties: Record<string, JsonSchemaNode> = {};
            for (const [key, child] of Object.entries(node.properties)) {
                const normalised = JsonSchemaNormaliser.normalise(child);
                if (CommonUtils.isNull(normalised)) return null;
                properties[key] = normalised;
            }
            node.properties = properties;
        }
        if (JsonSchemaNormaliser.isNode(node.items)) {
            node.items = JsonSchemaNormaliser.normalise(node.items) ?? {};
        }
        if (JsonSchemaNormaliser.isNode(node.additionalProperties)) {
            node.additionalProperties = JsonSchemaNormaliser.normalise(node.additionalProperties) ?? {};
        }
        if (ArrayUtils.isArray(node.anyOf)) node.anyOf = JsonSchemaNormaliser.normaliseList(node.anyOf);
        if (ArrayUtils.isArray(node.oneOf)) node.oneOf = JsonSchemaNormaliser.normaliseList(node.oneOf);

        const merged = JsonSchemaNormaliser.mergeAllOf(node);
        if (CommonUtils.isNull(merged)) return null;
        node = JsonSchemaNormaliser.collapse(merged);
        return node;
    }

    /** The variants of a union with more than one member, or `null` when the schema is not one. */
    public static variants(schema: JsonSchemaNode): JsonSchemaNode[] | null {
        const list = schema.anyOf ?? schema.oneOf;
        return ArrayUtils.isArray(list) && list.length > 1 ? list : null;
    }

    /** Unwraps `X | null`, reporting whether `null` was one of the members. */
    public static splitNullable(schema: JsonSchemaNode): { schema: JsonSchemaNode; nullable: boolean } {
        const variants = JsonSchemaNormaliser.variants(schema);
        if (CommonUtils.isNull(variants)) return { schema, nullable: false };
        const nonNull = variants.filter((variant) => variant.type !== 'null');
        if (nonNull.length === variants.length) return { schema, nullable: false };
        const rest = JsonSchemaNormaliser.without(schema, 'anyOf', 'oneOf');
        if (nonNull.length === 1) {
            const only = nonNull[0];
            return {
                schema: { ...rest, ...only, description: rest.description ?? only.description, default: rest.default ?? only.default },
                nullable: true
            };
        }
        return { schema: { ...rest, anyOf: nonNull }, nullable: true };
    }

    /** The property whose `const` value tells the variants apart (`strategy`, `type`, `source`, ...). */
    public static discriminator(variants: JsonSchemaNode[]): string | null {
        if (variants.length < 2 || !variants.every((variant) => CommonUtils.notNil(variant.properties))) return null;
        const first = variants[0].properties ?? {};
        const candidates = Object.keys(first).filter((key) =>
            variants.every((variant) => CommonUtils.notNil(variant.properties?.[key]) && 'const' in (variant.properties?.[key] ?? {}))
        );
        const key = candidates.find((candidate) =>
            new Set(variants.map((variant) => JSON.stringify(variant.properties?.[candidate]?.const))).size === variants.length
        );
        return key ?? null;
    }

    public static isNode(value: unknown): value is JsonSchemaNode {
        return ObjectUtils.isPlainObject(value);
    }

    private static without(schema: JsonSchemaNode, ...keys: (keyof JsonSchemaNode)[]): JsonSchemaNode {
        const copy: JsonSchemaNode = { ...schema };
        for (const key of keys) delete copy[key];
        return copy;
    }

    private static normaliseList(list: JsonSchemaNode[]): JsonSchemaNode[] {
        return list
            .map((variant) => JsonSchemaNormaliser.normalise(variant))
            .filter((variant): variant is JsonSchemaNode => CommonUtils.notNil(variant));
    }

    private static mergeAllOf(schema: JsonSchemaNode): JsonSchemaNode | null {
        if (!ArrayUtils.isArray(schema.allOf)) return schema;
        const { allOf, ...rest } = schema;
        let out: JsonSchemaNode = rest;
        for (const raw of allOf) {
            const part = JsonSchemaNormaliser.normalise(raw);
            if (CommonUtils.isNull(part)) return null;
            if ('const' in part && 'const' in out && JSON.stringify(part.const) !== JSON.stringify(out.const)) return null;
            const properties: Record<string, JsonSchemaNode> = { ...out.properties };
            for (const [key, value] of Object.entries(part.properties ?? {})) {
                const existing = properties[key];
                const next = CommonUtils.notNil(existing) ? JsonSchemaNormaliser.normalise({ allOf: [existing, value] }) : value;
                if (CommonUtils.isNull(next)) return null;
                properties[key] = next;
            }
            out = {
                ...out,
                ...part,
                properties: Object.keys(properties).length > 0 ? properties : undefined,
                required: [...new Set([...(out.required ?? []), ...(part.required ?? [])])]
            };
        }
        return out;
    }

    private static collapse(schema: JsonSchemaNode): JsonSchemaNode {
        const list = schema.anyOf ?? schema.oneOf;
        if (!ArrayUtils.isArray(list)) return schema;
        const rest = JsonSchemaNormaliser.without(schema, 'anyOf', 'oneOf');
        if (list.length === 1) {
            return { ...list[0], ...rest, description: rest.description ?? list[0].description };
        }
        if (list.length === 2) {
            const key = JsonSchemaNormaliser.discriminator(list);
            const keySets = list.map((variant) => Object.keys(variant.properties ?? {}).sort().join());
            const isToggle = CommonUtils.notNil(key)
                && keySets[0] === keySets[1]
                && list.every((variant) => BooleanUtils.isBoolean(variant.properties?.[key]?.const));
            if (isToggle) {
                const on = list.find((variant) => variant.properties?.[key]?.const === true) ?? list[0];
                const toggle = JsonSchemaNormaliser.without(on.properties?.[key] ?? {}, 'const');
                return {
                    ...on,
                    ...rest,
                    description: rest.description ?? on.description,
                    properties: {
                        ...on.properties,
                        [key]: {
                            ...toggle,
                            type: 'boolean',
                            description: toggle.description
                                ?? 'Set to `false` to disable. Keys marked required are required only when this is `true`.'
                        }
                    }
                };
            }
        }
        return schema;
    }
}
