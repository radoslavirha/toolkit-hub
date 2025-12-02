import { ServerConfiguration } from '@radoslavirha/tsed-platform';
import { Constant, Controller, Inject } from '@tsed/di';
import { HeaderParams } from '@tsed/platform-params';
import PlatformViews from '@tsed/platform-views';
import { Get, Hidden, Returns } from '@tsed/schema';
import { SwaggerSettings } from '@tsed/swagger';
import path from 'path';
import { fileURLToPath } from 'url';

@Hidden()
@Controller('/')
export class SwaggerController {
    @Constant('swagger')
    private swagger!: SwaggerSettings[];

    @Constant('api')
    private api!: ServerConfiguration;

    @Inject(PlatformViews)
    private platformViews: PlatformViews;

    @Get('/')
    @(Returns(200, String).ContentType('text/html'))
    async get(
        @HeaderParams('x-forwarded-proto')
        protocol: string,
        @HeaderParams('host')
        host: string
    ) {
        const hostUrl = this.api.publicURL ?? `${ protocol || 'http' }://${ host }`;

        const _dirname = typeof __dirname !== 'undefined'
            ? __dirname
            : path.dirname(fileURLToPath(import.meta.url));

        // files are compiled by tsup into single index.ts file
        // we need to keep assets in the same directory as index.ts
        // views are copied by cpx library into dist directory
        return await this.platformViews.render(path.join(_dirname, 'views', 'swagger.ejs'), {
            BASE_URL: hostUrl,
            SERVICE: this.api.service,
            VERSION: this.api.version,
            docs: this.swagger.map((conf) => {
                return {
                    url: hostUrl + conf.path,
                    ...conf
                };
            })
        });
    }
}
