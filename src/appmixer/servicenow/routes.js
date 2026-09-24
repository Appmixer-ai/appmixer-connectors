const { timingSafeEqual } = require('node:crypto');

// ServiceNow does not sign outbound REST messages. The business rule calling this route must send
// the shared secret configured in the connector settings (`webhookSecret`) in this header.
const SECRET_HEADER = 'x-appmixer-webhook-secret';

module.exports = async context => {

    context.http.router.register({
        method: 'POST',
        path: '/events',
        options: {
            auth: false,
            handler: async (req, h) => {

                if (!verifySecret(context, req)) {
                    return h.response({ error: 'Unauthorized.' }).code(401);
                }

                const { data = {}, type } = req.payload || {};

                if (!type) {
                    context.log('error', 'Missing \'type\' property.', { payload: req.payload });
                    throw new Error('Missing \'type\' property.');
                }

                await context.triggerListeners({
                    eventName: type,
                    payload: data
                });

                return {};
            }
        }
    });
};

function verifySecret(context, req) {

    const webhookSecret = context.config?.webhookSecret;
    if (!webhookSecret) {
        context.log('error', 'servicenow-plugin-route-webhook-missing-secret-config');
        return false;
    }

    const received = Buffer.from(String(req.headers?.[SECRET_HEADER] || ''));
    const expected = Buffer.from(String(webhookSecret));
    const valid = received.length === expected.length && timingSafeEqual(received, expected);
    if (!valid) {
        context.log('error', 'servicenow-plugin-route-webhook-invalid-secret');
    }
    return valid;
}
