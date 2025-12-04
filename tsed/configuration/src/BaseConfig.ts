import { Description, Property, Required } from '@tsed/schema';
import { ServerConfig } from './ServerConfig.js';

@Description('Base server configuration.')
export class BaseConfig {
    @Required()
    @Property(ServerConfig)
    @Description('TsED server configuration.')
    public server: ServerConfig;

    @Property(String)
    @Description('Service name. If not set, the name from package.json will be used.')
    public serviceName?: string;

    @Property(String)
    @Description('Public URL of the service including protocol, domain and path if deployed behind a reverse proxy.')
    public publicURL?: string;
}