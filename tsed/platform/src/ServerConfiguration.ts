/* v8 ignore start */
import { APIInformation } from '@radoslavirha/tsed-configuration';

/**
 * Server configuration type for Ts.ED applications with API metadata.
 * 
 * Combines Ts.ED's standard configuration interface with required {@link APIInformation}
 * metadata and optional custom configuration properties. This type ensures that all
 * Ts.ED microservices include essential API metadata (service name, version, description)
 * alongside standard server configuration (ports, middleware, routes, etc.).
 * 
 * @template T - Optional custom configuration properties to merge into the configuration
 * 
 * @remarks
 * This type is designed to be used with {@link Platform.bootstrap} and extends Ts.ED's
 * global `TsED.Configuration` interface. The `api` property is required and typically
 * populated from {@link ConfigService} which aggregates metadata from package.json,
 * environment variables, and configuration files.
 * 
 * @example Basic usage
 * ```typescript
 * import { ServerConfiguration } from '@radoslavirha/tsed-platform';
 * import { ConfigService } from './config/ConfigService';
 * 
 * const config = injector().get<ConfigService>(ConfigService);
 * 
 * const configuration: ServerConfiguration = {
 *     ...config.server,  // httpPort, httpsPort, etc.
 *     api: config.api   // service, version, description, publicURL
 * };
 * ```
 * 
 * @property api - Required API metadata (service name, version, description, publicURL)
 * 
 * @see {@link Platform.bootstrap} for usage in application bootstrap
 * @see {@link APIInformation} from @radoslavirha/tsed-configuration for api property structure
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ServerConfiguration<T extends object = {}> = {
    /**
     * API metadata including service name, version, description, and optional public URL.
     * 
     * This metadata is typically sourced from package.json via {@link ConfigService} and
     * used throughout the application for logging, monitoring, documentation, and service discovery.
     * 
     * @type {APIInformation}
     * @required
     */
    api: APIInformation;
} & Partial<TsED.Configuration> & T;
/* v8 ignore stop */