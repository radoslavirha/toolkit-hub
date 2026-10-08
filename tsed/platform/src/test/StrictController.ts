import { Controller } from '@tsed/di';
import { BodyParams, QueryParams } from '@tsed/platform-params';
import { CollectionOf, Nullable, Post, Get, Property, Required } from '@tsed/schema';

export class StrictBody {
    @Required() public rString!: string;
    @Required() @Nullable(String) public rnString!: string | null;
    @Property() public oString?: string;
    @Nullable(String) public onString?: string | null;

    @Required() public rNumber!: number;
    @Required() @Nullable(Number) public rnNumber!: number | null;
    @Property() public oNumber?: number;
    @Nullable(Number) public onNumber?: number | null;

    @Required() public rBoolean!: boolean;
    @Required() @Nullable(Boolean) public rnBoolean!: boolean | null;
    @Property() public oBoolean?: boolean;
    @Nullable(Boolean) public onBoolean?: boolean | null;

    @CollectionOf(String) public oList?: string[];
}

@Controller('/strict')
export class StrictController {
    @Post('/body')
    public body(@BodyParams() body: StrictBody): { body: StrictBody } {
        return { body };
    }

    @Get('/number/r')
    public rNumber(@QueryParams('v') @Required() v: number): { v: unknown } {
        return { v };
    }

    @Get('/number/rn')
    public rnNumber(@QueryParams('v') @Required() @Nullable(Number) v: number | null): { v: unknown } {
        return { v };
    }

    @Get('/number/o')
    public oNumber(@QueryParams('v') v?: number): { v: unknown } {
        return { v };
    }

    @Get('/number/on')
    public onNumber(@QueryParams('v') @Nullable(Number) v?: number | null): { v: unknown } {
        return { v };
    }

    @Get('/boolean/r')
    public rBoolean(@QueryParams('v') @Required() v: boolean): { v: unknown } {
        return { v };
    }

    @Get('/boolean/on')
    public onBoolean(@QueryParams('v') @Nullable(Boolean) v?: boolean | null): { v: unknown } {
        return { v };
    }

    @Get('/boolean/o')
    public oBoolean(@QueryParams('v') v?: boolean): { v: unknown } {
        return { v };
    }

    @Get('/string/o')
    public oString(@QueryParams('v') v?: string): { v: unknown } {
        return { v };
    }

    @Get('/string/on')
    public onString(@QueryParams('v') @Nullable(String) v?: string | null): { v: unknown } {
        return { v };
    }
}
