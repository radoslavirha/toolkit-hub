import { ObjectUtils } from '@radoslavirha/utils';

/**
 * Base class for configuration providers with immutable configuration access.
 * 
 * This abstract provider stores configuration privately and provides read-only
 * access through a getter that returns a deep clone. This prevents external
 * code from accidentally mutating the configuration state.
 * 
 * All configuration providers in this package extend this base class to ensure
 * consistent immutability guarantees across different configuration sources
 * (package.json, environment variables, JSON files, etc.).
 * 
 * @template T The configuration object type
 * 
 * @example
 * ```typescript
 * // Extending BaseConfigProvider for custom configuration source
 * class CustomConfigProvider extends BaseConfigProvider<AppConfig> {
 *     constructor() {
 *         const config = loadConfigFromCustomSource();
 *         super(config);
 *     }
 * }
 * 
 * const provider = new CustomConfigProvider();
 * const config = provider.config; // Returns deep clone
 * ```
 * 
 * @example
 * ```typescript
 * // Immutability guarantee
 * const provider = new BaseConfigProvider({ port: 3000, host: 'localhost' });
 * const config1 = provider.config;
 * config1.port = 8080; // Does not affect internal state
 * 
 * const config2 = provider.config;
 * console.log(config2.port); // Still 3000
 * ```
 * 
 * @remarks
 * - Configuration is stored privately and cannot be modified after construction
 * - The `config` getter returns a deep clone using `ObjectUtils.cloneDeep`
 * - Deep cloning prevents mutations to nested objects/arrays
 * - Each access to `config` creates a new clone (consider caching if called frequently)
 * - Subclasses should perform validation/loading in constructor before calling `super()`
 */
export class BaseConfigProvider<T> {
    private readonly configuration: T;

    /**
     * Gets an immutable copy of the configuration.
     * 
     * Returns a deep clone to prevent external mutations from affecting
     * the internal configuration state.
     * 
     * @returns A deep clone of the configuration object
     */
    public get config(): T {
        return ObjectUtils.cloneDeep(this.configuration);
    }

    /**
     * Creates a new configuration provider.
     * 
     * @param config The initial configuration object to store
     */
    constructor(config: T) {
        this.configuration = config;
    }
}
