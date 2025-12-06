/* v8 ignore start */
/**
 * Returns helmet directives to allow swagger-ui to work.
 */
export const getHelmetDefaultDirectives = () => ({
    defaultSrc: [`'self'`],
    styleSrc: [`'self'`, `'unsafe-inline'`],
    imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
    scriptSrc: [`'self'`, `https: 'unsafe-inline'`]
});