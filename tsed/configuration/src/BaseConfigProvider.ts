import { CommonUtils } from '@radoslavirha/utils';

export class BaseConfigProvider<T> {
    #config: T;

    public get config(): T {
        return CommonUtils.cloneDeep(this.#config);
    }

    constructor(config: T) {
        this.#config = config;
    }
}
