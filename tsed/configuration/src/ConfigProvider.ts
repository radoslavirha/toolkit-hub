import { CommonUtils, DefaultsUtil } from '@radoslavirha/utils';
import { Type } from '@tsed/core';
import { Injectable, Opts } from '@tsed/di';
import { ConfigJsonProvider } from './ConfigJsonProvider.js';
import { ENVS, EnvironmentVariablesProvider } from './EnvironmentVariablesProvider.js';
import { PackageJsonProvider, PkgJson } from './PackageJsonProvider.js';
import { getServerDefaultConfig } from './helpers/ServerDefaultConfig.js';
import { BaseConfig } from './models/BaseConfig.js';
import { APIInformation } from './models/APIInformation.js';

export type ConfigProviderOptions<T extends BaseConfig> = {
    configModel: Type<T>;
    debug?: boolean;
};

@Injectable()
export class ConfigProvider<T extends BaseConfig> {
    readonly configModel: Type<T>;

    readonly _api: APIInformation;
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
    public get isTest() {
        return this.envs.NODE_ENV === 'test'; 
    }

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
