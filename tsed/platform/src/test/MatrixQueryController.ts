import { NullableDateTime, NullableEnum } from '@radoslavirha/tsed-common';
import { Controller } from '@tsed/di';
import { QueryParams } from '@tsed/platform-params';
import { DateTime, Enum, Get, Integer, Nullable, Required } from '@tsed/schema';
import { Color, describeValue } from './MatrixBodyController.js';

/**
 * Query side of the request-validation matrix. Declared statically (not built at runtime) so the
 * parameters carry the `design:paramtypes` SWC emits in real controllers — `X | null` becomes
 * `Object`, which changes how Ts.ED treats a nullable parameter.
 */
@Controller('/matrix-query')
export class MatrixQueryController {
    @Get('/string/R')
    public stringR(@Required() @QueryParams('v') v: string): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/string/RN')
    public stringRN(@Required() @QueryParams('v') @Nullable(String) v: string | null): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/string/O')
    public stringO(@QueryParams('v') v?: string): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/string/ON')
    public stringON(@QueryParams('v') @Nullable(String) v?: string | null): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/number/R')
    public numberR(@Required() @QueryParams('v') v: number): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/number/RN')
    public numberRN(@Required() @QueryParams('v') @Nullable(Number) v: number | null): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/number/O')
    public numberO(@QueryParams('v') v?: number): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/number/ON')
    public numberON(@QueryParams('v') @Nullable(Number) v?: number | null): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/integer/R')
    public integerR(@Required() @QueryParams('v') @Integer() v: number): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/integer/RN')
    public integerRN(@Required() @QueryParams('v') @Nullable(Number) @Integer() v: number | null): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/integer/O')
    public integerO(@QueryParams('v') @Integer() v?: number): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/integer/ON')
    public integerON(@QueryParams('v') @Nullable(Number) @Integer() v?: number | null): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/boolean/R')
    public booleanR(@Required() @QueryParams('v') v: boolean): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/boolean/RN')
    public booleanRN(@Required() @QueryParams('v') @Nullable(Boolean) v: boolean | null): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/boolean/O')
    public booleanO(@QueryParams('v') v?: boolean): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/boolean/ON')
    public booleanON(@QueryParams('v') @Nullable(Boolean) v?: boolean | null): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/stringEnum/R')
    public stringEnumR(@Required() @QueryParams('v') @Enum(Color) v: Color): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/stringEnum/RN')
    public stringEnumRN(@Required() @QueryParams('v') @NullableEnum(Color) v: Color | null): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/stringEnum/O')
    public stringEnumO(@QueryParams('v') @Enum(Color) v?: Color): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/stringEnum/ON')
    public stringEnumON(@QueryParams('v') @NullableEnum(Color) v?: Color | null): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/dateTime/R')
    public dateTimeR(@Required() @QueryParams('v') @DateTime() v: Date): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/dateTime/RN')
    public dateTimeRN(@Required() @QueryParams('v') @NullableDateTime() v: Date | null): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/dateTime/O')
    public dateTimeO(@QueryParams('v') @DateTime() v?: Date): { v: string } {
        return { v: describeValue(v) };
    }

    @Get('/dateTime/ON')
    public dateTimeON(@QueryParams('v') @NullableDateTime() v?: Date | null): { v: string } {
        return { v: describeValue(v) };
    }
}
