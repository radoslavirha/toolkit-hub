import { ServerConfiguration } from '@radoslavirha/tsed-platform';
import { Constant, Controller } from '@tsed/di';
import { PlatformResponse, Res } from '@tsed/platform-http';
import { HeaderParams } from '@tsed/platform-params';
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

    @Get('/')
    @(Returns(200, String).ContentType('text/html'))
    async get(
        @HeaderParams('x-forwarded-proto')
        protocol: string,
        @HeaderParams('host')
        host: string,
        @Res()
        response: PlatformResponse
    ) {
        const hostUrl = `${ protocol || 'http' }://${ host }`;;

        const _dirname = typeof __dirname !== 'undefined'
            ? __dirname
            : path.dirname(fileURLToPath(import.meta.url));

        return await response.render(path.join(_dirname, '../views', 'swagger.ejs'), {
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
