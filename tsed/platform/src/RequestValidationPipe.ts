import { AjvService } from '@tsed/ajv';
import { constant, inject, OverrideProvider } from '@tsed/di';
import { ParamTypes, ValidationPipe } from '@tsed/platform-params';
import { compile, JsonParameterStore } from '@tsed/schema';
import { Ajv } from 'ajv';
import { ArrayUtils, CommonUtils, StringUtils } from '@radoslavirha/utils';

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

const BOOLEANS = new Map<string, boolean>([['true', true], ['false', false], ['1', true], ['0', false]]);

/**
 * Replacement for Ts.ED's `ValidationPipe`, registered by {@link BaseServer}.
 *
 * With `requestValidation.strict` off (the default) it behaves exactly like Ts.ED. With it on:
 * - **body** is validated by a non-coercing Ajv, so `null` passes only where the model is nullable
 *   and any wrong JSON type is a 400;
 * - **query / path / header** keep coercion (values are strings) except that the text `null` becomes
 *   `null` only for nullable parameters, booleans accept only `true|false|1|0`, and an explicit
 *   `null` on a nullable parameter is accepted before the required check.
 */
@OverrideProvider(ValidationPipe)
export class RequestValidationPipe extends ValidationPipe {
    private readonly strictAjv = new StrictAjvService();
    private readonly coercingAjv = inject(AjvService);
    private readonly schemaTypes = new WeakMap<JsonParameterStore, string[]>();
    private readonly strict = constant<boolean>('requestValidation.strict', false);

    public override coerceTypes(value: unknown, metadata: JsonParameterStore): unknown {
        if (!this.strict) {
            return super.coerceTypes(value, metadata);
        }
        if (metadata.paramType === ParamTypes.BODY) {
            return value;
        }
        if (value === 'null') {
            return metadata.schema.isNullable ? null : value;
        }
        if (StringUtils.isString(value) && this.allows(metadata, 'boolean')) {
            return BOOLEANS.get(value) ?? value;
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

    private allows(metadata: JsonParameterStore, type: string): boolean {
        let types = this.schemaTypes.get(metadata);
        if (!types) {
            const declared = (compile(metadata, { customKeys: true }) as { type?: string | string[] }).type;
            types = ArrayUtils.toArray(declared as string | string[]);
            this.schemaTypes.set(metadata, types);
        }
        return types.includes(type);
    }
}
