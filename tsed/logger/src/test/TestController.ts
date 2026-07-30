import { Controller } from '@tsed/di';
import { Response, PlatformResponse } from '@tsed/platform-http';
import { BodyParams } from '@tsed/platform-params';
import { Get, Patch, Post, Returns } from '@tsed/schema';
import { CommonUtils } from '@radoslavirha/utils';

import { EchoPayload, EchoResponse } from './models/index.js';

/**
 * Minimal controller for Logger integration tests.
 *
 * Endpoints:
 * - GET /test/success        — returns 200 with a JSON body (happy path)
 * - GET /test/error          — throws an Error, resulting in a 500 response
 * - GET /test/handled-error  — sets status 400 without throwing, so $ctx.error stays null
 * - GET /test/code-error     — throws an error whose name is undefined but code is set (e.g. Node.js ENOENT-style)
 * - GET /test/binary         — returns 200 with Content-Type: application/octet-stream (binary path)
 * - POST /test/echo          — returns 200 with echo body
 * - PATCH /test/echo         — returns 200 with echo body
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

    @Get('/binary')
    @Returns(200)
    public getBinary(@Response() res: PlatformResponse): Buffer {
        res.contentType('application/octet-stream');
        return Buffer.from([0x01, 0x02, 0x03]);
    }

    @Post('/echo')
    @Returns(200, EchoResponse)
    public postEcho(@BodyParams(EchoPayload) body: EchoPayload): EchoResponse {
        return CommonUtils.buildModelStrict(EchoResponse, {
            ok: true,
            method: 'POST',
            body
        });
    }

    @Patch('/echo')
    @Returns(200, EchoResponse)
    public patchEcho(@BodyParams(EchoPayload) body: EchoPayload): EchoResponse {
        return CommonUtils.buildModelStrict(EchoResponse, {
            ok: true,
            method: 'PATCH',
            body
        });
    }
}
