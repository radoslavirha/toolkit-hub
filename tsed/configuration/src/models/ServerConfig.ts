import { AdditionalProperties, Description, Required, Property } from '@tsed/schema';

/**
 * TsED server configuration.
 * 
 * Defines the server configuration properties for the application.
 * 
 * @remarks
 * Currently configured to support basic HTTP server setup with httpPort.
 */
@AdditionalProperties(true)
@Description('TsED server configuration.')
export class ServerConfig implements Partial<TsED.Configuration> {
    /**
     * The HTTP port to listen on.
     * @type {number}
     */
    @Required()
    @Property(Number)
    @Description('The HTTP port to listen on.')
    public httpPort: number;
}