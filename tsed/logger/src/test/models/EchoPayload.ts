import { AdditionalProperties, Property } from '@tsed/schema';

@AdditionalProperties(false)
export class EchoPayload {
    /** Optional user envelope echoed by test endpoint. */
    @Property(Object)
    public user?: { id?: string };

    /** Optional boolean flag echoed by test endpoint. */
    @Property(Boolean)
    public enabled?: boolean;

    /** Optional status value echoed by test endpoint. */
    @Property(String)
    public status?: string;
}
