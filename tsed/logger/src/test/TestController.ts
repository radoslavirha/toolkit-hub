import { Controller } from '@tsed/di';
import { Response, PlatformResponse } from '@tsed/platform-http';
import { Get, Returns } from '@tsed/schema';

/**
 * Minimal controller for Logger integration tests.
 *
 * Endpoints:
 * - GET /test/success        — returns 200 with a JSON body (happy path)
 * - GET /test/error          — throws an Error, resulting in a 500 response
 * - GET /test/handled-error  — sets status 400 without throwing, so $ctx.error stays null
 * - GET /test/code-error     — throws an error whose name is undefined but code is set (e.g. Node.js ENOENT-style)
 */
@Controller('/test')
export class TestController {
    @Get('/success')
    @Returns(200)
    public getSuccess(): { ok: boolean } {
        return { ok: true };
    }

    @Get('/error')
    @Returns(500)
    public getError(): never {
        throw new Error('Something went wrong');
    }

    @Get('/code-error')
    @Returns(500)
    public getCodeError(): never {
        const err = new Error('disk fail') as Error & { code?: string };
        (err as unknown as Record<string, unknown>)['name'] = undefined;
        err.code = 'ENOENT';
        throw err;
    }

    @Get('/handled-error')
    @Returns(400)
    public getHandledError(@Response() res: PlatformResponse): { message: string } {
        res.status(400);
        return { message: 'handled' };
    }
}
