import { $log } from '@tsed/logger';

/**
 * Abstract base handler with performance tracking and error handling.
 * 
 * Provides a standardized pattern for implementing operation handlers (use cases, commands, queries)
 * with automatic execution time logging and consistent error handling. Extend this class and implement
 * the {@link performOperation} method with your business logic.
 * 
 * @template IRequest - Type of the request/input data (optional)
 * @template IResponse - Type of the response/output data
 * 
 * @remarks
 * This handler pattern follows the Command/Query pattern, providing:
 * - **Performance Tracking**: Logs execution time in milliseconds
 * - **Error Handling**: Catches and logs errors with handler name context
 * - **Type Safety**: Strong typing for request and response objects
 * 
 * The handler tracks execution time using `performance.now()` and logs at debug level,
 * making it easy to identify slow operations during development and testing.
 * 
 * @example Simple handler with typed request/response
 * ```typescript
 * import { BaseHandler } from '@radoslavirha/tsed-platform';
 * 
 * @Injectable()
 * export class Handler extends BaseHandler<Request, Response> {
 *     protected async performOperation(request: Request): Promise<Response> {
 *         // Business logic here
 *     }
 * }
 * 
 * // Usage in controller
 * @Controller('/')
 * export class Controller {
 *     constructor(private handler: Handler) {}
 *     
 *     @Post('/')
 *     async post(@Required() @BodyParams(Request) request: Request): Promise<Response> {
 *         return this.handler.execute(request);
 *     }
 * }
 * ```
 * 
 * @example Handler without request (query pattern)
 * ```typescript
 * @Injectable()
 * export class Handler extends BaseHandler<void, Response> {
 *     protected async performOperation(): Promise<Response> {
 *          // Business logic here
 *     }
 * }
 * 
 * // Usage in controller
 * @Controller('/')
 * export class Controller {
 *     constructor(private handler: Handler) {}
 *     
 *     @Get('/')
 *     async get(): Promise<Response> {
 *         return this.handler.execute();
 *     }
 * }
 * ```
 * 
 * @example Handler with ID parameter (resource operations)
 * ```typescript
 * @Injectable()
 * export class Handler extends BaseHandler<Request, Response> {
 *     protected async performOperation(request: Request, id: string): Promise<Response> {
 *         // Business logic here
 *     }
 * }
 * 
 * // Usage in controller
 * @Controller('/')
 * export class Controller {
 *     constructor(private handler: Handler) {}
 *     
 *     @Put('/:id')
 *     async update(@Required() @PathParams('id') id: string, @Required() @BodyParams(Request) request: Request): Promise<Response> {
 *         return this.handler.execute(request, id);
 *     }
 * }
 * ```
 * 
 * @see Performance tracking logs at debug level: `HandlerName.execute() took +123.45 ms to execute!`
 * @see Error logs include handler name for easy debugging: `HandlerName.execute() threw the following error: ...`
 */
export abstract class BaseHandler<IRequest, IResponse> {
    /**
     * Execute the handler operation with performance tracking and error handling.
     * 
     * Wraps the {@link performOperation} method with:
     * - Performance measurement using `performance.now()`
     * - Debug logging of execution time
     * - Error catching and logging with handler context
     * 
     * @param request - Optional request/input data for the operation
     * @param id - Optional identifier for resource-specific operations
     * @returns Promise resolving to the operation response
     * 
     * @throws Re-throws any errors from {@link performOperation} after logging
     * 
     * @remarks
     * This is the public interface of the handler. Consumers call `execute()` while
     * implementations override {@link performOperation}. The execution time is logged
     * at debug level, so ensure your logger is configured to show debug logs during
     * development.
     * 
     * @example Controller usage with dependency injection
     * ```typescript
     * @Controller('/')
     * export class Controller {
     *     constructor(private handler: Handler) {}
     *     
     *     @Post('/:id')
     *     async handleRequest(
     *         @Required() @PathParams('id') id: string,
     *         @Required() @BodyParams(Request) request: Request
     *     ): Promise<Response> {
     *         return this.handler.execute(request, id);
     *     }
     * }
     * ```
     */
    public async execute(request?: IRequest, id?: string): Promise<IResponse> {
        try {
            const startTime = performance.now();

            const response = await this.performOperation(request, id);

            const endTime = performance.now();

            const useCaseExecutionTime = endTime - startTime;

            $log.debug(`${ this.constructor.name }.execute() took +${ useCaseExecutionTime } ms to execute!`);

            return response;
        } catch (error) {
            $log.error(`${ this.constructor.name }.execute() threw the following error: ${ error }`);
            throw error;
        }
    }

    /**
     * Perform the actual operation logic.
     * 
     * Abstract method to be implemented by concrete handler classes. Contains the business
     * logic for the operation without boilerplate performance tracking or error handling.
     * 
     * @param request - Optional request/input data for the operation
     * @param id - Optional identifier for resource-specific operations
     * @returns Promise resolving to the operation result
     * 
     * @throws Can throw any error which will be caught, logged, and re-thrown by {@link execute}
     * 
     * @protected
     * @abstract
     * 
     * @remarks
     * This method is called by {@link execute} and should focus solely on business logic.
     * Performance tracking and error handling are automatically provided by the base class.
     * 
     * @example Implementation with request validation
     * ```typescript
     * protected async performOperation(request: Request): Promise<Response> {
     *     // Business logic
     * }
     * ```
     */
    protected abstract performOperation(request?: IRequest, id?: string): Promise<IResponse>;
}
