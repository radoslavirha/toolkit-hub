import { NormalizeOptions, readPackageSync } from 'read-pkg';
import { BaseConfigProvider } from './BaseConfigProvider.js';
import { DefaultsUtil } from '@radoslavirha/utils';

export interface PkgJson {
    name: string;
    version: string;
    description: string;
}

const opts: NormalizeOptions = { normalize: true };

export class PackageJsonProvider extends BaseConfigProvider<PkgJson> {
    constructor() {
        super({
            name: readPackageSync(opts).name,
            description: DefaultsUtil.string(readPackageSync(opts).description, ''),
            version: readPackageSync(opts).version
        });
    }
}
