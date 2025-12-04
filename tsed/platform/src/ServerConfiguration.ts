/* v8 ignore start */
import { APIInformation } from '@radoslavirha/tsed-configuration';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ServerConfiguration<T extends object = {}> = {
    api: APIInformation;
} & Partial<TsED.Configuration> & T;
/* v8 ignore stop */