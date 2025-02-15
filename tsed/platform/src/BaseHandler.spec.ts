import { $log } from '@tsed/logger';
import { describe, beforeEach, expect, it, vi } from 'vitest';
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
        handler = new Handler();
    });

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
        const spy = vi.spyOn($log, 'debug');

        expect.assertions(3);

        const response = await handler.execute({ key: 'value' });

        expect(response).toEqual({ key: 'value' });
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('Handler.execute() took '));
        expect(spy).toHaveBeenCalledWith(expect.stringContaining(' ms to execute!'));
    });

    it('Should return error', async () => {
        // @ts-expect-error protected
        vi.spyOn(handler, 'performOperation').mockRejectedValue(new Error('test'));
        const spy = vi.spyOn($log, 'error');

        expect.assertions(2);
        try {
            await handler.execute({ key: 'value' });
        } catch (error) {
            expect(error).toEqual(new Error('test'));
            expect(spy).toHaveBeenCalledWith(`Handler.execute() threw the following error: ${ new Error('test') }`);
        }
    });
});
