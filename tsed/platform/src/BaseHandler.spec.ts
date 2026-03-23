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
        // @ts-expect-error protected
        const spy = vi.spyOn(handler, 'performOperation');

        await handler.execute({ key: 'value' });

        expect(spy).toHaveBeenCalledWith({ key: 'value' }, undefined);
    });

    it('Should call performOperation with 2 arguments', async () => {
        // @ts-expect-error protected
        const spy = vi.spyOn(handler, 'performOperation');

        await handler.execute({ key: 'value' }, '2');

        expect(spy).toHaveBeenCalledWith({ key: 'value' }, '2');
    });

    it('Should return value', async () => {
        // @ts-expect-error protected
        vi.spyOn(handler, 'performOperation').mockResolvedValue({ key: 'value' });

        expect.assertions(1);

        const response = await handler.execute({ key: 'value' });

        expect(response).toEqual({ key: 'value' });
    });

    it('Should return error', async () => {
        // @ts-expect-error protected
        vi.spyOn(handler, 'performOperation').mockRejectedValue(new Error('test'));

        expect.assertions(1);
        try {
            await handler.execute({ key: 'value' });
        } catch (error) {
            expect(error).toEqual(new Error('test'));
        }
    });
});
