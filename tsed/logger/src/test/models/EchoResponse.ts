import { AdditionalProperties, Property } from '@tsed/schema';

import { EchoPayload } from './EchoPayload.js';

@AdditionalProperties(false)
export class EchoResponse {
    /** Indicates successful handling of request. */
    @Property(Boolean)
    public ok: boolean;

    /** HTTP method used by endpoint. */
    @Property(String)
    public method: 'POST' | 'PATCH';

    /** Echoed request body. */
    @Property(EchoPayload)
    public body: EchoPayload;
}
