/**
 * The subset of a JSON Schema (draft 2020-12, as emitted by Zod's `toJSONSchema`) that the
 * configuration docs renderer reads.
 */
export interface JsonSchemaNode {
    type?: string | string[];
    description?: string;
    default?: unknown;
    const?: unknown;
    examples?: unknown[];
    enum?: unknown[];
    format?: string;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
    minItems?: number;
    maxItems?: number;
    properties?: Record<string, JsonSchemaNode>;
    required?: string[];
    additionalProperties?: boolean | JsonSchemaNode;
    items?: JsonSchemaNode;
    anyOf?: JsonSchemaNode[];
    oneOf?: JsonSchemaNode[];
    allOf?: JsonSchemaNode[];
}
