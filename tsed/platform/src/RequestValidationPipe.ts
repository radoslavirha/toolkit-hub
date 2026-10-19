import { AjvService } from '@tsed/ajv';
import { constant, inject, OverrideProvider } from '@tsed/di';
import { ParamTypes, ValidationPipe } from '@tsed/platform-params';
import { compile, getJsonSchema, JsonParameterStore } from '@tsed/schema';
import { Ajv } from 'ajv';
import { ArrayUtils, CommonUtils, ObjectUtils, StringUtils } from '@radoslavirha/utils';

/**
 * Ajv service that validates without coercing types. It is built from the DI Ajv, so options,
 * keywords (`ajv-errors`, `@Formats`) and formats are the same; only `coerceTypes` is off.
 * It is not registered as a `validator:service`, the pipe owns the single instance.
 */
class StrictAjvService extends AjvService {
    public constructor() {
        super();
        const base = this.ajv;
        const strict = new Ajv({ ...base.opts, coerceTypes: false });
        for (const [keyword, rule] of Object.entries(base.RULES.all)) {
            if (!strict.RULES.all[keyword] && typeof rule === 'object') {
                strict.addKeyword(rule.definition);
            }
        }
        for (const [name, format] of Object.entries(base.formats)) {
            strict.addFormat(name, format as never);
        }
        this.ajv = strict;
    }
}

type SchemaTypes = { type?: string | string[]; items?: { type?: string | string[] } };

const BOOLEANS = new Map<string, boolean>([['true', true], ['false', false], ['1', true], ['0', false]]);

/**
 * Replacement for Ts.ED's `ValidationPipe`, registered by {@link BaseServer}.
 *
 * With `requestValidation.strict` set to `false` it behaves exactly like Ts.ED. Strict is the default; with it on:
 * - **body** is validated by a non-coercing Ajv, so `null` passes only where the model is nullable
 *   and any wrong JSON type is a 400;
 * - **query / path** keep coercion (values are strings) except that the text `null` becomes
 *   `null` only for nullable parameters, booleans accept only `true|false|1|0`, and an explicit
 *   `null` on a nullable parameter is accepted before the required check;
 * - **header** parameters only reach this pipe when declared with
 *   `@HeaderParams({ expression, useValidation: true })` (Ts.ED defaults to no validation), and are then
 *   treated like query parameters.
 */
@OverrideProvider(ValidationPipe)
export class RequestValidationPipe extends ValidationPipe {
    private readonly strictAjv = new StrictAjvService();
    private readonly coercingAjv = inject(AjvService);
    private readonly schemaTypes = new WeakMap<JsonParameterStore, string[]>();
    private readonly strict = constant<boolean>('requestValidation.strict', true);

    public override coerceTypes(value: unknown, metadata: JsonParameterStore): unknown {
        if (!this.strict) {
            return super.coerceTypes(value, metadata);
        }
        if (metadata.paramType === ParamTypes.BODY || CommonUtils.isUndefined(value)) {
            return value;
        }
        if (metadata.isClass && !metadata.isCollection && ObjectUtils.isObject(value)) {
            return super.coerceTypes(this.coerceModelFields(value as Record<string, unknown>, metadata), metadata);
        }
        if (value === 'null') {
            return metadata.schema.isNullable ? null : value;
        }
        if (StringUtils.isString(value) && this.allows(metadata, 'boolean')) {
            return BOOLEANS.get(value) ?? value;
        }
        if (metadata.isArray && this.allows(metadata, 'boolean', true)) {
            return ArrayUtils.toArray(value).map((item) => (StringUtils.isString(item) ? (BOOLEANS.get(item) ?? item) : item));
        }
        return super.coerceTypes(value, metadata);
    }

    public override async transform(value: unknown, metadata: JsonParameterStore): Promise<unknown> {
        if (!this.strict) {
            return super.transform(value, metadata);
        }
        if (this.skip(value, metadata)) {
            return value;
        }
        const coerced = this.coerceTypes(value, metadata);
        if (CommonUtils.isNull(coerced) && metadata.schema.isNullable) {
            return null;
        }
        this.checkIsRequired(coerced, metadata);
        if (CommonUtils.isUndefined(coerced)) {
            return coerced;
        }
        const validator = metadata.paramType === ParamTypes.BODY ? this.strictAjv : this.coercingAjv;
        return validator.validate(coerced, {
            schema: compile(metadata, { customKeys: true }),
            type: metadata.isClass ? metadata.type : undefined,
            collectionType: metadata.collectionType
        });
    }

    private coerceModelFields(value: Record<string, unknown>, metadata: JsonParameterStore): Record<string, unknown> {
        const { properties = {} } = getJsonSchema(metadata.type, { customKeys: true }) as { properties?: Record<string, SchemaTypes> };
        const result = { ...value };
        for (const [key, field] of Object.entries(result)) {
            const types = ArrayUtils.toArray(properties[key]?.type);
            if (field === 'null') {
                result[key] = types.includes('null') ? null : field;
            } else if (StringUtils.isString(field) && types.includes('boolean')) {
                result[key] = BOOLEANS.get(field) ?? field;
            } else if (ArrayUtils.isArray(field) && types.includes('array') && ArrayUtils.toArray(properties[key]?.items?.type).includes('boolean')) {
                result[key] = field.map((item) => (StringUtils.isString(item) ? (BOOLEANS.get(item) ?? item) : item));
            }
        }
        return result;
    }

    private allows(metadata: JsonParameterStore, type: string, items = false): boolean {
        let types = this.schemaTypes.get(metadata);
        if (!types) {
            const schema = compile(metadata, { customKeys: true }) as { type?: string | string[]; items?: { type?: string | string[] } };
            const itemTypes = ArrayUtils.toArray(schema.items?.type as string | string[]).map((t) => `items:${t}`);
            types = [...ArrayUtils.toArray(schema.type as string | string[]), ...itemTypes];
            this.schemaTypes.set(metadata, types);
        }
        return types.includes(items ? `items:${type}` : type);
    }
}
