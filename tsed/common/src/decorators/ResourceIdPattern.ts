/**
 * Ready-made id patterns for `@ResourceId`. Values are flag-free regular expression sources.
 */
export enum ResourceIdPattern {
    /** 24 hexadecimal characters (e.g. MongoDB ObjectId). */
    HEX_24 = '^[a-fA-F0-9]{24}$',
    /** Canonical UUID, any version. */
    UUID = '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
}
