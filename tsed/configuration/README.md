# @radoslavirha/tsed-configuration

Ts.ED base platform utils.

## Installation

`pnpm add @radoslavirha/tsed-configuration`

## Usage

Create config model using Ts.ED decorators. It'll be used for JSON file validation, so you can require fields to be present or have correct values.

```ts
// ConfigModel.ts
import { Property, Required } from '@tsed/schema';

export class ConfigModel {
    @Required()
    @Property(String)
    field: string;
}
```

Library is using [config library](https://www.npmjs.com/package/config), create the corresponding JSON configuration.

Server bootstrap example usage:

```ts
// index.ts
import { ConfigProvider, ConfigProviderOptions } from '@radoslavirha/tsed-configuration';
import { injector } from '@tsed/di';
import { ConfigModel } from './ConfigModel.js';

try {
    const options = <ConfigProviderOptions<ConfigModel>>{
        service: 'Service name',
        fallbackPort: 4000,
        configModel: ConfigModel,
        debug: false
    });

    // Without DI
    const config = new ConfigProvider(options);
    // With DI
    // This may be usable in some cases 
    const config = injector().get(ConfigProvider, { useOpts: options });
    
    const configuration: ServerConfiguration = {
        ...config.server,
        api: config.api
      };

    const platform = await Platform.bootstrap(Server, configuration);
    await platform.listen();

    ...
} catch (error) {
}
```

## Production tip

Set `NODE_ENV=production` in Dockerfile and inject `production.json` file.
