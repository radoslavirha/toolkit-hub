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
    @Property()
    field: string;
}
```

Library is using [config library](https://www.npmjs.com/package/config), create the corresponding JSON configuration.

Server bootstrap example usage:

```ts
// index.ts
import { ConfigProvider, ConfigProviderOptions } from '@radoslavirha/tsed-configuration';
import { ConfigModel } from './ConfigModel.js';

try {
    const config = new ConfigProvider(<ConfigProviderOptions>{
        service: 'Service name',
        fallbackPort: 4000,
        configModel: ConfigModel
    });
    
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
