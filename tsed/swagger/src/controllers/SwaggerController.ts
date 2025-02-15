import { ServerConfiguration } from '@radoslavirha/tsed-platform';
import { Constant, Controller } from '@tsed/di';
import { HeaderParams } from '@tsed/platform-params';
import { View } from '@tsed/platform-views';
import { Get, Hidden, Returns } from '@tsed/schema';
import { SwaggerSettings } from '@tsed/swagger';

@Hidden()
@Controller('/')
export class SwaggerController {
    @Constant('swagger')
    private swagger!: SwaggerSettings[];

    @Constant('api')
    private api!: ServerConfiguration;

    @Get('/')
    @View('swagger.ejs')
    @(Returns(200, String).ContentType('text/html'))
    get(@HeaderParams('x-forwarded-proto') protocol: string, @HeaderParams('host') host: string) {
        const hostUrl = `${ protocol || 'http' }://${ host }`;

        return {
            BASE_URL: hostUrl,
            SERVICE: this.api.service,
            VERSION: this.api.version,
            docs: this.swagger.map((conf) => {
                return {
                    url: hostUrl + conf.path,
                    ...conf
                };
            })
        };
    }
}
