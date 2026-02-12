import { CommonUtils, DefaultsUtil, ObjectUtils } from '@radoslavirha/utils';
import { Type } from '@tsed/core';
import { Injectable, Opts } from '@tsed/di';
import { ConfigJsonProvider } from './ConfigJsonProvider.js';
import { ENVS, EnvironmentVariablesProvider } from './EnvironmentVariablesProvider.js';
import { PackageJsonProvider, PkgJson } from './PackageJsonProvider.js';
import { getServerDefaultConfig } from './helpers/ServerDefaultConfig.js';
import { BaseConfig } from './models/BaseConfig.js';
import { APIInformation } from './models/APIInformation.js';

/**
 * Configuration options for ConfigProvider.
 * @template T The configuration model type extending BaseConfig
 */
export type ConfigProviderOptions<T extends BaseConfig> = {
    /** The configuration model class decorated with @tsed/schema decorators */
    configModel: Type<T>;
    /** Enable debug logging for configuration loading and validation */
    debug?: boolean;
};

/**
 * Central configuration provider for Ts.ED microservices.
 * 
 * Aggregates configuration data from multiple sources:
 * - JSON configuration files (via ConfigJsonProvider)
 * - Environment variables (via EnvironmentVariablesProvider)
 * - package.json metadata (via PackageJsonProvider)
 * 
 * Provides immutable access to configuration, API information, and server settings.
 * All getter methods return deep clones to prevent accidental mutations.
 * 
 * @template T The configuration model type extending BaseConfig
 * 
 * @example
 * ```typescript
 * import { ConfigProvider, ConfigProviderOptions } from '@radoslavirha/tsed-configuration';
 * import { Injectable } from '@tsed/di';
 * import { ConfigModel } from '../models/ConfigModel.js';
 * 
 * @Injectable()
 * export class ConfigService extends ConfigProvider<ConfigModel> {
 *     public static readonly options: ConfigProviderOptions<ConfigModel> = {
 *         configModel: ConfigModel
 *     };
 * 
 *     constructor() {
 *         super(ConfigService.options);
 *     }
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Usage in Ts.ED bootstrap
 * const config = injector().get<ConfigService>(ConfigService);
 * const configuration: ServerConfiguration = {
 *     ...config.server,
 *     api: config.api
 * };
 * 
 * const platform = await Platform.bootstrap(Server, configuration);
 * ```
 * 
 * @remarks
 * This is a core service used across all microservices to provide consistent
 * configuration management, validation, and access patterns.
 */
@Injectable()
export class ConfigProvider<T extends BaseConfig> {
    /** The configuration model class */
    readonly configModel: Type<T>;

    /** Internal API information model */
    readonly _api: APIInformation;
    /** Internal configuration model instance */
    readonly _config: T;
    /** Internal environment variables */
    readonly _envs: ENVS;
    /** Internal package.json metadata */
    readonly _packageJson: PkgJson;
    /** Internal server configuration */
    readonly _server: Partial<TsED.Configuration>;

    /**
     * Gets immutable API information.
     * @returns Deep clone of the API information model
     */
    public get api() {
        return ObjectUtils.cloneDeep(this._api); 
    }
    
    /**
     * Gets immutable configuration.
     * @returns Deep clone of the configuration model
     */
    public get config(): T {
        return ObjectUtils.cloneDeep(this._config); 
    }
    
    /**
     * Gets immutable environment variables.
     * @returns Deep clone of the environment variables
     */
    public get envs() {
        return ObjectUtils.cloneDeep(this._envs); 
    }
    
    /**
     * Gets immutable package.json metadata.
     * @returns Deep clone of the package.json data
     */
    public get packageJson() {
        return ObjectUtils.cloneDeep(this._packageJson); 
    }
    
    /**
     * Gets immutable server configuration.
     * @returns Deep clone of the Ts.ED server configuration
     */
    public get server() {
        return ObjectUtils.cloneDeep(this._server); 
    }
    
    /**
     * Checks if the current environment is test.
     * @returns true if NODE_ENV is 'test'
     */
    public get isTest() {
        return this.envs.NODE_ENV === 'test'; 
    }

    /**
     * Creates a new configuration provider.
     * 
     * Loads and aggregates configuration from multiple sources:
     * 1. Environment variables
     * 2. package.json
     * 3. JSON configuration files (validated against the model)
     * 4. Constructs API information from the gathered data
     * 5. Builds final server configuration with defaults
     * 
     * @param options Configuration options including the model class
     * @throws {Error} If configuration validation fails
     */
    constructor(@Opts options: ConfigProviderOptions<T>) {
        this.configModel = options.configModel;

        this._envs = new EnvironmentVariablesProvider().config;
        this._packageJson = new PackageJsonProvider().config;
        this._config = new ConfigJsonProvider(this.configModel, options.debug).config;

        this._api = CommonUtils.buildModel(APIInformation, {
            service: DefaultsUtil.string(this.config.serviceName, this.packageJson.name),
            version: this.packageJson.version,
            description: this.packageJson.description,
            publicURL: this.config.publicURL
        });

        this._server = <Partial<TsED.Configuration>>{
            ...getServerDefaultConfig(),
            ...this._config.server,
            envs: this.envs
        };
    }
}
