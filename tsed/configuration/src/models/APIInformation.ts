import { Description, Property, Required } from '@tsed/schema';

@Description('API information model.')
export class APIInformation {
    @Required()
    @Property(String)
    @Description('Service name.')
    public service: string;

    @Required()
    @Property(String)
    @Description('Service version.')
    public version: string;

    @Property(String)
    @Description('Service description.')
    public description?: string;

    @Property(String)
    @Description('Public URL of the service including protocol, domain and path if deployed behind a reverse proxy.')
    public publicURL?: string;
}