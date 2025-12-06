import { AdditionalProperties, Description, Required, Property } from '@tsed/schema';

@AdditionalProperties(true)
@Description('TsED server configuration.')
export class ServerConfig implements Partial<TsED.Configuration> {
    @Required()
    @Property(Number)
    @Description('The HTTP port to listen on.')
    public httpPort: number;
}