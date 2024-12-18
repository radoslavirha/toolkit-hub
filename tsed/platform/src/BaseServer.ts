import { configuration, Configuration } from '@tsed/di';
import { application } from '@tsed/platform-http';
import '@tsed/platform-express';
import '@tsed/ajv';
import { $log } from '@tsed/logger';
import { getServerDefaultConfig } from '@radoslavirha/tsed-configuration';
import bodyParser from 'body-parser';
import compress from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import methodOverride from 'method-override';
import { ServerConfigurationAPI } from './ServerConfiguration.js';

@Configuration({
    ...getServerDefaultConfig(),
    api: {
        service: 'test',
        version: '0.0.1'
    }
})
export class BaseServer {
    protected app = application();
    private settings = configuration();

    $onReady(): void {
        const api = this.settings.get<ServerConfigurationAPI>('api');
        
        $log.info(`${ api?.service } ${ api?.version } is ready!`);
    }

    protected registerMiddlewares(): void {
        $log.info('Registering common middlewares...');

        this.app
            .use(
                cors({
                    origin: true,
                    credentials: true
                })
            )
            .use(cookieParser())
            .use(compress({}))
            .use(methodOverride())
            .use(bodyParser.json())
            .use(
                bodyParser.urlencoded({
                    extended: true
                })
            );
    }
}