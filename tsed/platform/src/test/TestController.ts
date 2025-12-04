import { Controller, ProviderScope, Scope } from '@tsed/di';
import { Get } from '@tsed/schema';

@Controller('/')
@Scope(ProviderScope.REQUEST)
export class TestController {
    @Get('/')
    public getRequest(): Promise<unknown> {
        return Promise.resolve({
            test: 'This is a test',
            value: 12345
        });
    }
}