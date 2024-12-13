import { NormalizeOptions, readPackageSync } from 'read-pkg';
import { BaseConfigProvider } from './BaseConfigProvider.js';

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
            description: readPackageSync(opts).description ?? '',
            version: readPackageSync(opts).version
        });
    }
}
