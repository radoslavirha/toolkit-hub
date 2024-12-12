/* v8 ignore start */
export interface ServerConfigurationAPI {
    service: string;
    version: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ServerConfiguration<T extends Record<string, unknown> = {}> = {
    api: ServerConfigurationAPI;
} & Partial<TsED.Configuration> & T;
/* v8 ignore stop */