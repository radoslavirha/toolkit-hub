import { NormalizeOptions, readPackageSync } from 'read-pkg';
import { BaseConfigProvider } from './BaseConfigProvider.js';
import { DefaultsUtil } from '@radoslavirha/utils';

/**
 * Interface representing essential package.json fields.
 */
export interface PkgJson {
    /** Package name from package.json */
    name: string;
    /** Package version (semver) from package.json */
    version: string;
    /** Package description from package.json */
    description: string;
}

/**
 * Configuration provider that reads and exposes package.json metadata.
 * 
 * Automatically loads package.json from the project root and provides
 * type-safe access to essential package information (name, version, description).
 * 
 * @extends BaseConfigProvider<PkgJson>
 * 
 * @example
 * ```typescript
 * const pkgProvider = new PackageJsonProvider();
 * const pkg = pkgProvider.config;
 * 
 * console.log(`${pkg.name} v${pkg.version}`);
 * console.log(pkg.description);
 * ```
 * 
 * @remarks
 * - Reads package.json synchronously during construction
 * - Uses DefaultsUtil to provide empty string if description is missing
 * - Normalizes package.json data using read-pkg
 * - Throws error if package.json is not found or invalid
 */
export class PackageJsonProvider extends BaseConfigProvider<PkgJson> {
    private static readonly NORMALIZE_OPTIONS: NormalizeOptions = { normalize: true };

    constructor() {
        // Read package.json once and extract needed fields
        const pkg = readPackageSync(PackageJsonProvider.NORMALIZE_OPTIONS);
        
        super({
            name: pkg.name,
            version: pkg.version,
            description: DefaultsUtil.string(pkg.description, '')
        });
    }
}
