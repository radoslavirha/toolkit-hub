import _ from 'lodash';

/**
 * Utility class for common operations.
 */
export class CommonUtils {
    /**
     * Checks if the value is empty.
     * Returns true for empty objects, arrays, strings, maps, sets, or null/undefined.
     * @template T The type of value to check.
     * @param value The value to check for emptiness.
     * @returns True if value is empty, false otherwise.
     */
    public static isEmpty<T>(value: T): boolean {
        return _.isEmpty(value);
    }

    /**
     * Checks if the value is null or undefined.
     * @template T The type of value to check.
     * @param value The value to check.
     * @returns True if value is null or undefined, narrowing the type accordingly.
     */
    public static isNil<T>(value: T): value is Extract<T, null | undefined> {
        return _.isNil(value);
    }

    /**
     * Checks if the value is not null or undefined.
     * Type guard that narrows the type to exclude null and undefined.
     * @template T The type of value to check.
     * @param value The value to check.
     * @returns True if value is neither null nor undefined, narrowing to NonNullable<T>.
     */
    public static notNil<T>(value: T): value is NonNullable<T> {
        return !_.isNil(value);
    }

    /**
     * Checks if the value is null.
     * @template T The type of value to check.
     * @param value The value to check if is null.
     * @returns True if value is null, narrowing the type accordingly.
     */
    public static isNull<T>(value: T): value is Extract<T, null> {
        return _.isNull(value);
    }

    /**
     * Checks if the value is not null.
     * Type guard that narrows the type to exclude null.
     * @template T The type of value to check.
     * @param value The value to check if is not null.
     * @returns True if value is not null, narrowing to Exclude<T, null>.
     */
    public static notNull<T>(value: T): value is Exclude<T, null> {
        return !_.isNull(value);
    }

    /**
     * Checks if the value is undefined.
     * @template T The type of value to check.
     * @param value The value to check if is undefined.
     * @returns True if value is undefined, narrowing the type accordingly.
     */
    public static isUndefined<T>(value: T): value is Extract<T, undefined> {
        return _.isUndefined(value);
    }

    /**
     * Checks if the value is not undefined.
     * Type guard that narrows the type to exclude undefined.
     * @template T The type of value to check.
     * @param value The value to check if is not undefined.
     * @returns True if value is not undefined, narrowing to Exclude<T, undefined>.
     */
    public static notUndefined<T>(value: T): value is Exclude<T, undefined> {
        return !_.isUndefined(value);
    }

    /**
     * Builds a model instance from a type and data.
     * Creates a new instance of the specified class and assigns the provided data to it.
     * @template T The type of the model to create.
     * @param type The constructor of the model class.
     * @param data The data to assign to the model instance.
     * @returns A new instance of the model with the data assigned.
     * @deprecated Use {@link buildModelStrict} when all required properties are provided,
     * or {@link buildModelPartial} when providing only a subset of properties.
     */
    public static buildModel<T extends object>(type: { new (): T }, data: Partial<T>): T {
        const instance = new type();
        return Object.assign(instance, data) as T;
    }

    /**
     * Builds a fully-typed model instance, requiring all TypeScript-required properties.
     * Optional properties (marked with `?`) remain optional.
     * @template T The type of the model to create.
     * @param type The constructor of the model class.
     * @param data All required (and any optional) properties of the model.
     * @returns A new instance of the model with the data assigned.
     */
    public static buildModelStrict<T extends object>(type: { new (): T }, data: T): T {
        const instance = new type();
        return Object.assign(instance, data);
    }

    /**
     * Builds a model instance from a partial set of properties.
     * Designed for classes that have constructor-level defaults for some properties —
     * the constructor runs first (setting defaults), then `Object.assign` overlays only the provided keys.
     *
     * TypeScript tracks exactly which properties were provided:
     * provided keys retain their full type, unprovided keys become `T[K] | undefined`.
     *
     * **Important:** Only omit properties that have a class-body default (e.g. `x: T = defaultValue`).
     * Omitting a truly uninitialized required field (`x!: T`) will result in `undefined` at runtime.
     * Use {@link buildModelStrict} when all required properties must be explicitly supplied.
     * @template T The type of the model to create.
     * @template D The shape of the partial data provided.
     * @param type The constructor of the model class.
     * @param data A subset of the model's properties.
     * @returns A new instance of the model with the provided data assigned.
     */
    public static buildModelPartial<T extends object, D extends Partial<T>>(
        type: { new (): T },
        data: D
    ): Pick<T, Extract<keyof D, keyof T>> & Partial<Omit<T, keyof D>> {
        const instance = new type();
        return Object.assign(instance, data) as Pick<T, Extract<keyof D, keyof T>> & Partial<Omit<T, keyof D>>;
    }

    /**
     * Builds a model instance that excludes auto-generated database fields.
     * Intended for constructing the "core" payload of a model before it is persisted —
     * i.e. when `id`, `_id`, `createdAt`, and `updatedAt` are not yet known or not relevant.
     *
     * The type parameter `D` must cover all properties of `T` **except** the four excluded
     * fields (`id`, `_id`, `createdAt`, `updatedAt`), so TypeScript enforces that every
     * domain-owned field is supplied.
     *
     * Under the hood this delegates to {@link buildModelPartial}, so the constructor runs
     * first (preserving class-body defaults) and `Object.assign` overlays only the provided keys.
     *
     * @template T The full model type (e.g. a class with `id`, `createdAt`, domain fields …).
     * @template D The data shape: `T` minus the four auto-generated fields.
     * @param type The constructor of the model class.
     * @param data All domain-owned properties of the model (excluding `id`, `_id`, `createdAt`, `updatedAt`).
     * @returns A new instance of the model with only the provided properties assigned;
     *          the four auto-generated fields are absent / carry their constructor defaults.
     *
     * @example
     * class Model {
     *   id!: string;
     *   createdAt!: Date;
     *   updatedAt!: Date;
     *   name!: string;
     *   email!: string;
     * }
     *
     * // TypeScript requires name + email but forbids passing id/createdAt/updatedAt
     * const core = CommonUtils.buildModelCore(Model, { name: 'Alice', email: 'alice@example.com' });
     * // core.name  === 'Alice'
     * // core.email === 'alice@example.com'
     * // core has no id / createdAt / updatedAt
     */
    public static buildModelCore<T extends object, D extends Omit<T, 'id' | '_id' | 'createdAt' | 'updatedAt'>>(
        type: { new (): T },
        data: D
    ): Omit<T, 'id' | '_id' | 'createdAt' | 'updatedAt'> {
        return CommonUtils.buildModelPartial(type, data as unknown as Partial<T>);
    }
}
