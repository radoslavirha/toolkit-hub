import { CommonUtils } from '@radoslavirha/utils';
import { Type } from '@tsed/core';
import { ConfigJsonProvider } from './ConfigJsonProvider.js';
import { ENVS, EnvironmentVariablesProvider } from './EnvironmentVariablesProvider.js';
import { PackageJsonProvider, PkgJson } from './PackageJsonProvider.js';
import { getServerDefaultConfig } from './ServerDefaultConfig.js';

export type ConfigProviderOptions<T = object> = {
    service: string;
    /**
     * Used when PORT env is not set
     */
    fallbackPort: number;
    configModel: Type<T>;
};

export class ConfigProvider<T> {
    readonly service: string;
    readonly fallbackPort: number;
    readonly configModel: Type<T>;

    readonly _api: { service: string; version: string; description?: string };
    readonly _config: T;
    readonly _envs: ENVS;
    readonly _packageJson: PkgJson;
    readonly _server: Partial<TsED.Configuration>;

    public get api() {
        return CommonUtils.cloneDeep(this._api); 
    }
    public get config(): T {
        return CommonUtils.cloneDeep(this._config); 
    }
    public get envs() {
        return CommonUtils.cloneDeep(this._envs); 
    }
    public get packageJson() {
        return CommonUtils.cloneDeep(this._packageJson); 
    }
    public get server() {
        return CommonUtils.cloneDeep(this._server); 
    }
    public get isProduction() {
        return this.envs.NODE_ENV === 'production'; 
    }
    public get isTest() {
        return this.envs.NODE_ENV === 'test'; 
    }

    constructor(options: ConfigProviderOptions<T>) {
        this.service = options.service;
        this.fallbackPort = options.fallbackPort;
        this.configModel = options.configModel;

        this._envs = new EnvironmentVariablesProvider().config;
        this._packageJson = new PackageJsonProvider().config;
        this._config = new ConfigJsonProvider(this.configModel).config;

        this._api = {
            service: options.service,
            version: this.packageJson.version,
            description: this.packageJson.description
        };

        this._server = {
            ...getServerDefaultConfig(),
            httpPort: parseInt(this.envs.PORT || String(this.fallbackPort)),
            envs: this.envs
        };
    }
}
