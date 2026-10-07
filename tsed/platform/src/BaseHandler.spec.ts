import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { Logger } from '@radoslavirha/tsed-logger';
import { BaseHandler } from './BaseHandler.js';

interface IRequest {
    key: 'value';
}
interface IResponse {
    key: 'value';
}

class Handler extends BaseHandler<IRequest, IResponse> {
    protected async performOperation(request: IRequest): Promise<IResponse> {
        return request;
    }
}

describe('BaseHandler', () => {
    let handler: Handler;

    beforeEach(() => {
        vi.spyOn(Logger.prototype, 'child').mockReturnValue({
            debug: vi.fn(),
            error: vi.fn()
        } as never);
    });

    beforeEach(() => {
        handler = new Handler();
    });

    afterEach(() => vi.restoreAllMocks());

    it('Should call performOperation', async () => {
        const spy = vi.spyOn(handler, 'performOperation');

        await handler.execute({ key: 'value' });

        expect(spy).toHaveBeenCalledWith({ key: 'value' }, undefined);
    });

    it('Should call performOperation with 2 arguments', async () => {
        const spy = vi.spyOn(handler, 'performOperation');

        await handler.execute({ key: 'value' }, '2');

        expect(spy).toHaveBeenCalledWith({ key: 'value' }, '2');
    });

    it('Should return value', async () => {
        vi.spyOn(handler, 'performOperation').mockResolvedValue({ key: 'value' });

        expect.assertions(1);

        const response = await handler.execute({ key: 'value' });

        expect(response).toStrictEqual({ key: 'value' });
    });

    it('Should return error', async () => {
        vi.spyOn(handler, 'performOperation').mockRejectedValue(new Error('test'));

        expect.assertions(1);
        try {
            await handler.execute({ key: 'value' });
        } catch (error) {
            expect(error).toStrictEqual(new Error('test'));
        }
    });

    it('Should log the stack of the error thrown by performOperation', async () => {
        const error = vi.fn();
        vi.spyOn(Logger.prototype, 'child').mockReturnValue({ debug: vi.fn(), error } as never);
        const thrown = new Error('db down');
        vi.spyOn(handler, 'performOperation').mockRejectedValue(thrown);

        await expect(handler.execute({ key: 'value' })).rejects.toBe(thrown);

        expect(error).toHaveBeenCalledOnce();
        expect(JSON.stringify(error.mock.calls[0], (_key, value: unknown) => value instanceof Error ? value.stack : value))
            .toContain('BaseHandler.spec.ts');
    });

    it('Should log the details of a non-Error value thrown by performOperation', async () => {
        const error = vi.fn();
        vi.spyOn(Logger.prototype, 'child').mockReturnValue({ debug: vi.fn(), error } as never);
        vi.spyOn(handler, 'performOperation').mockRejectedValue({ code: 'E_QUOTA', detail: 'limit reached' });

        await expect(handler.execute({ key: 'value' })).rejects.toBeDefined();

        expect(JSON.stringify(error.mock.calls[0])).toContain('E_QUOTA');
    });
});
