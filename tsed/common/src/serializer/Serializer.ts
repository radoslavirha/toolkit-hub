import { Type } from '@tsed/core';
import { deserialize, JsonDeserializerOptions, JsonSerializerOptions, serialize } from '@tsed/json-mapper';

/**
 * Options for {@link Serializer.serialize}, extending all native `JsonSerializerOptions`
 * except `type` which is provided as a required separate parameter.
 */
export type SerializeOptions = Omit<JsonSerializerOptions, 'type'>;

/**
 * Options for {@link Serializer.deserialize} and {@link Serializer.deserializeArray},
 * extending all native `JsonDeserializerOptions` except `type` which is provided
 * as a required separate parameter.
 */
export type DeserializeOptions = Omit<JsonDeserializerOptions, 'type'>;

/**
 * Utility class wrapping `@tsed/json-mapper`'s `serialize` and `deserialize`
 * functions with strongly-typed, explicit `type` parameters.
 *
 * The native functions accept `type` inside a loose options bag, which makes it
 * easy to forget and results in silent data loss. This wrapper makes the target
 * type a required first-class parameter so TypeScript enforces it at the call site.
 *
 * @example
 * ```typescript
 * // Serialize a Ts.ED model to a plain object
 * const plain = Serializer.serialize(user, UserModel);
 *
 * // Deserialize a POJO into a typed model instance
 * const model = Serializer.deserialize(plain, UserModel);
 *
 * // Deserialize an array of POJOs
 * const models = Serializer.deserializeArray(items, UserModel);
 * ```
 */
export class Serializer {
    /**
     * Serializes a Ts.ED model instance (or plain object) to a plain JSON-compatible object.
     * The target schema is determined by `type`, ensuring properties decorated with
     * `@tsed/schema` decorators are correctly mapped, aliased and filtered.
     *
     * @template T The model type.
     * @param input The model instance or plain object to serialize.
     * @param type The Ts.ED model class used to drive serialization.
     * @param options Additional serializer options (e.g. `useAlias`, `groups`).
     * @returns A plain JSON-compatible object.
     * @example
     * const plain = Serializer.serialize(userModel, UserModel, { useAlias: true });
     */
    public static serialize<T extends object>(input: T, type: Type<T>, options?: SerializeOptions): object {
        return serialize(input, { ...options, type });
    }

    /**
     * Deserializes a plain object (POJO) into an instance of the given Ts.ED model class.
     * Properties are mapped according to the schema metadata on `type`.
     *
     * @template T The target model type.
     * @param input The raw plain object to deserialize (e.g. from JSON.parse or an API response).
     * @param type The Ts.ED model class to deserialize into.
     * @param options Additional deserializer options (e.g. `useAlias`, `groups`).
     * @returns A fully hydrated instance of `T`.
     * @example
     * const user = Serializer.deserialize(rawPayload, UserModel);
     */
    public static deserialize<T extends object>(input: object, type: Type<T>, options?: DeserializeOptions): T {
        return deserialize<T>(input, { ...options, type });
    }

    /**
     * Deserializes an array of plain objects into an array of typed model instances.
     * Equivalent to calling {@link Serializer.deserialize} with `collectionType: Array`.
     *
     * @template T The target model type.
     * @param input An array of raw plain objects to deserialize.
     * @param type The Ts.ED model class to deserialize each item into.
     * @param options Additional deserializer options (e.g. `useAlias`, `groups`).
     * @returns An array of fully hydrated `T` instances.
     * @example
     * const users = Serializer.deserializeArray(rawArray, UserModel);
     */
    public static deserializeArray<T extends object>(input: object[], type: Type<T>, options?: DeserializeOptions): T[] {
        return deserialize<T[]>(input, { ...options, type, collectionType: Array });
    }
}
