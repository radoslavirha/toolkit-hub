import _ from 'lodash';

export class CommonUtils {
    public static cloneDeep<T>(obj: T): T {
        return _.cloneDeep(obj);
    }
}
