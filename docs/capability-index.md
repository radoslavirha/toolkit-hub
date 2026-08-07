# Capability Index

Generated from package entrypoint exports. Do not edit manually.

## @radoslavirha/config-eslint

- Location: `config/config-eslint`
- Entrypoint: `config/config-eslint/src/index.mjs`

| Export | Signature | Purpose |
| --- | --- | --- |
| `default` | `export default defineConfig(` | - |

## @radoslavirha/config-tsdown

- Location: `config/config-tsdown`
- Entrypoint: `config/config-tsdown/src/index.ts`

| Export | Signature | Purpose |
| --- | --- | --- |
| `cjsConfig` | `export const cjsConfig: UserConfig =` | - |
| `esmConfig` | `export const esmConfig: UserConfig =` | - |

## @radoslavirha/config-typescript

- Location: `config/config-typescript`
- Entrypoint: `(none)`

_No exported symbols discovered from an entrypoint._

## @radoslavirha/config-vitest

- Location: `config/config-vitest`
- Entrypoint: `config/config-vitest/src/index.ts`

| Export | Signature | Purpose |
| --- | --- | --- |
| `Coverage100` | `export const Coverage100 =` | - |
| `Coverage90` | `export const Coverage90 =` | - |
| `Coverage95` | `export const Coverage95 =` | - |
| `defaultConfig` | `export const defaultConfig =` | - |

## @radoslavirha/logger

- Location: `packages/logger`
- Entrypoint: `packages/logger/src/index.ts`

| Export | Signature | Purpose |
| --- | --- | --- |
| `Logger` | `export class Logger<T extends object = object>` | Structured logger backed by Winston. |
|  | members: `child, debug, error, fatal, info, log, trace, warn` |  |
| `LoggerOptions` | `export interface LoggerOptions<T extends object = object>` | Options for creating a Logger instance. |
| `LogLevel` | `export enum LogLevel` | OTEL-aligned log severity levels. |

## @radoslavirha/tsed-common

- Location: `tsed/common`
- Entrypoint: `tsed/common/src/index.ts`

| Export | Signature | Purpose |
| --- | --- | --- |
| `BaseModel` | `export class BaseModel` | - |
|  | members: `createdAt, id, updatedAt` |  |
| `DeserializeOptions` | `export type DeserializeOptions = Omit<JsonDeserializerOptions, 'type'>` | Options for {@link Serializer.deserialize} and {@link Serializer.deserializeArray}, |
| `JSONSchemaValidator` | `export class JSONSchemaValidator` | - |
|  | members: `validate` |  |
| `SerializeOptions` | `export type SerializeOptions = Omit<JsonSerializerOptions, 'type'>` | Options for {@link Serializer.serialize}, extending all native `JsonSerializerOptions` |
| `Serializer` | `export class Serializer` | Utility class wrapping `@tsed/json-mapper`'s `serialize` and `deserialize` |
|  | members: `deserialize, deserializeArray, serialize` |  |
| `ZodValidator` | `export class ZodValidator` | - |
|  | members: `validate` |  |

## @radoslavirha/tsed-configuration

- Location: `tsed/configuration`
- Entrypoint: `tsed/configuration/src/index.ts`

| Export | Signature | Purpose |
| --- | --- | --- |
| `APIInformation` | `export class APIInformation` | - |
|  | members: `description, publicURL, service, version` |  |
| `AppConfig` | `export type AppConfig = z.infer<typeof AppConfigSchema>` | - |
| `AppConfigSchema` | `export const AppConfigSchema = BaseConfigSchema.extend(` | - |
| `BaseConfig` | `export type BaseConfig = z.infer<typeof BaseConfig>;` | TypeScript type for the base configuration. |
| `BaseConfigProvider` | `export class BaseConfigProvider<T extends object>` | Base class for configuration providers with immutable configuration access. |
| `ConfigProvider` | `export class ConfigProvider<T extends BaseConfig>` | - |
| `ConfigProviderOptions` | `export type ConfigProviderOptions<T extends BaseConfig> =` | Configuration options for ConfigProvider. |
| `ConfigService` | `export class ConfigService extends ConfigProvider<AppConfig>` | - |
| `getHelmetDefaultDirectives` | `export const getHelmetDefaultDirectives = () => (` | Returns helmet directives to allow swagger-ui to work. |
| `getServerDefaultConfig` | `export const getServerDefaultConfig = (): Partial<TsED.Configuration> => (` | Returns default server configuration. |

## @radoslavirha/tsed-logger

- Location: `tsed/logger`
- Entrypoint: `tsed/logger/src/index.ts`

| Export | Signature | Purpose |
| --- | --- | --- |
| `Logger` | `export class Logger<T extends object = object> extends BaseLogger<T>` | - |
| `LoggerOptions` | `export type LoggerOptions = z.input<typeof LoggerOptionsSchema>;` | Input type for {@link LoggerOptionsSchema} — all fields optional (defaults applied on parse). |
| `LoggerOptionsSchema` | `export const LoggerOptionsSchema = z.object(` | Zod schema for {@link LoggerOptions} — the full Logger constructor options. |
| `LoggerService` | `export class LoggerService extends Logger` | - |
| `SomeService` | `export class SomeService` | - |

## @radoslavirha/tsed-mongoose

- Location: `tsed/mongoose`
- Entrypoint: `tsed/mongoose/src/index.ts`

| Export | Signature | Purpose |
| --- | --- | --- |
| `BaseMongo` | `export class BaseMongo` | Base model class for Mongoose models in Ts.ED applications. |
|  | members: `_id, createdAt, updatedAt` |  |
| `ItemMapper` | `export class ItemMapper extends MongoMapper<Item, ItemModel>` | - |
| `ItemRepository` | `export class ItemRepository extends MongoRepository<Item>` | - |
| `MongoConfig` | `export type MongoConfig = z.infer<typeof MongoConfigSchema>;` | - |
| `MongoConfigSchema` | `export const MongoConfigSchema = z.union([MongoEnabledSchema, MongoDisabledSchema]);` | - |
| `MongoCreate` | `export type MongoCreate<T> = Omit<Partial<T>, 'id' \| '_id' \| 'createdAt' \| 'updatedAt'> &` | Strictly-typed payload for creating a new Mongoose document. |
| `MongoDeleteResult` | `export interface MongoDeleteResult` | Typed result returned from MongoDB delete operations. |
| `MongoFilter` | `export type MongoFilter<T extends BaseMongo> = Omit<QueryFilter<T>, '_id'> &` | Filter type for MongoRepository queries. |
| `MongoMapper` | `export abstract class MongoMapper<MONGO extends BaseMongo, MODEL extends BaseModel> extends MappingUtils` | Abstract base mapper for converting between Mongoose documents and application models. |
|  | members: `getModelValue, mongoToModelBase` |  |
| `MongoRepository` | `export abstract class MongoRepository<MONGO extends BaseMongo>` | Abstract base repository for MongoDB operations in Ts.ED applications. |
| `MongoUpdate` | `export type MongoUpdate<T> = Omit<Partial<T>, 'id' \| '_id' \| 'createdAt' \| 'updatedAt'> &` | Strictly-typed payload for updating an existing Mongoose document. |
| `MongoUpdateResult` | `export interface MongoUpdateResult` | Typed result returned from MongoDB count-based update operations. |
| `User` | `export class User extends BaseMongo` | - |

## @radoslavirha/tsed-platform

- Location: `tsed/platform`
- Entrypoint: `tsed/platform/src/index.ts`

| Export | Signature | Purpose |
| --- | --- | --- |
| `BaseHandler` | `export abstract class BaseHandler<IRequest, IResponse>` | Abstract base handler with performance tracking and error handling. |
|  | members: `execute` |  |
| `BaseServer` | `export class BaseServer` | - |
| `Controller` | `export class Controller` | - |
| `Handler` | `export class Handler extends BaseHandler<Request, Response>` | - |
| `Platform` | `export class Platform extends PlatformExpress` | Express-based Ts.ED platform adapter. |
| `Server` | `export class Server extends BaseServer` | - |
| `ServerConfiguration` | `export type ServerConfiguration<T extends object =` | - |
| `TsEDLoggerBridge` | `export class TsEDLoggerBridge` | - |
|  | members: `getTsEDLoggerConfig` |  |

## @radoslavirha/tsed-swagger

- Location: `tsed/swagger`
- Entrypoint: `tsed/swagger/src/index.ts`

| Export | Signature | Purpose |
| --- | --- | --- |
| `Server` | `export class Server extends BaseServer` | - |
| `SwaggerConfig` | `export class SwaggerConfig` | - |
|  | members: `description, documents, serverUrl, swaggerUIOptions, title, version` |  |
| `SwaggerController` | `export class SwaggerController` | - |
| `SwaggerDocumentConfig` | `export class SwaggerDocumentConfig` | - |
|  | members: `docs, outFile, security` |  |
| `SwaggerProvider` | `export class SwaggerProvider extends BaseConfigProvider<SwaggerSettings[]>` | Provider that converts {@link SwaggerConfig} into Ts.ED's `SwaggerSettings[]` format. |
| `SwaggerSecurityScheme` | `export enum SwaggerSecurityScheme` | Enumeration of supported Swagger security schemes for API authentication. |
| `SwaggerUIConfig` | `export class SwaggerUIConfig implements SwaggerUIOptions` | - |
| `UserControllerV1` | `export class UserControllerV1` | - |
| `UserControllerV2` | `export class UserControllerV2` | - |

## @radoslavirha/types

- Location: `packages/types`
- Entrypoint: `packages/types/src/index.ts`

| Export | Signature | Purpose |
| --- | --- | --- |
| `Dictionary` | `export type Dictionary<T> =` | A generic dictionary type mapping string keys to values of type `T`. |
| `EnumDictionary` | `export type EnumDictionary<TKey extends string \| symbol \| number, TType> =` | - |
| `FullPartial` | `export type FullPartial<T> =` | A utility type that makes all properties of T optional, including nested objects. |
| `NullableProperty` | `export type NullableProperty<T> = T \| null;` | A utility type that represents a property that can be either a value of type `T` or `null`. |

## @radoslavirha/utils

- Location: `packages/utils`
- Entrypoint: `packages/utils/src/index.ts`

| Export | Signature | Purpose |
| --- | --- | --- |
| `ArrayElement` | `export type ArrayElement<T> = T extends readonly (infer E)[] ? E : never` | Extracts the element type from an array type. |
| `ArrayUtils` | `export class ArrayUtils` | Utility class for array operations. |
|  | members: `isArray, toArray` |  |
| `BooleanUtils` | `export class BooleanUtils` | Utility class for boolean operations. |
|  | members: `isBoolean` |  |
| `CommonUtils` | `export class CommonUtils` | Utility class for common operations. |
|  | members: `buildModel, buildModelCore, buildModelPartial, buildModelStrict, isEmpty, isNil, isNull, isUndefined, notNil, notNull, notUndefined` |  |
| `DefaultsUtil` | `export class DefaultsUtil` | Utility class for setting default values. |
|  | members: `number, string` |  |
| `Enabled` | `export type Enabled<T extends` | Represents T with the `enabled` property narrowed to the literal `true`. |
| `GeoUtils` | `export class GeoUtils` | Utility class for geographic calculations. |
|  | members: `calculateKmBetweenCoordinates, degToRad` |  |
| `MapKey` | `export type MapKey<T> = T extends Map<infer K, unknown> ? K : never` | Extracts the key type from a Map type. |
| `MappingUtils` | `export class MappingUtils` | - |
| `MapValue` | `export type MapValue<T> = T extends Map<unknown, infer V> ? V : never` | Extracts the value type from a Map type. |
| `NumberUtils` | `export class NumberUtils` | Utility class for number operations. |
|  | members: `ceil, floor, getPercentFromValue, getValueFromPercent, max, mean, min, round` |  |
| `ObjectUtils` | `export class ObjectUtils` | Utility class for object operations. |
|  | members: `cloneDeep, isEnabled, isObject, isPlainObject, keys, mergeDeep, values` |  |
| `Result` | `export type Result<TValue, TTarget> = (null extends TValue ? null : never) \| (undefined extends TValue ? undefined : never) \| (TValue extends null \| undefined ? never : TTarget)` | Maps values while preserving nullability from the input type. |
| `StringUtils` | `export class StringUtils` | Utility class for string operations. |
|  | members: `isString` |  |

