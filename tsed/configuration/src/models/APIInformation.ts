import { Description, Property, Required } from '@tsed/schema';

/**
 * API information model.
 * 
 * Composite model that aggregates service metadata collected from multiple configuration providers.
 * Provides quick access to essential service information for use in microservices (e.g., logging,
 * monitoring, service discovery).
 * 
 * @remarks
 * The data in this model is typically assembled from various sources such as package.json,
 * environment variables, and configuration files.
 */
@Description('API information model.')
export class APIInformation {
    /**
     * Service name.
     * @type {string}
     */
    @Required()
    @Property(String)
    @Description('Service name.')
    public service: string;

    /**
     * Service version.
     * @type {string}
     */
    @Required()
    @Property(String)
    @Description('Service version.')
    public version: string;

    /**
     * Service description.
     * @type {string}
     */
    @Property(String)
    @Description('Service description.')
    public description?: string;

    /**
     * Public URL of the service including protocol, domain and path if deployed behind a reverse proxy.
     * @type {string}
     * @example 'https://api.example.com/v1'
     */
    @Property(String)
    @Description('Public URL of the service including protocol, domain and path if deployed behind a reverse proxy.')
    public publicURL?: string;
}