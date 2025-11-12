'use strict';

module.exports = {
    async receive(context) {

        const { user_id, device_id, amplitude_id } = context.messages.in.content;

        // At least one identifier must be provided
        if (!user_id && !device_id && !amplitude_id) {
            throw new context.CancelError('Either User Id, Device Id, or Amplitude Id is required!');
        }

        // Build query parameters
        const params = {};
        if (user_id) {
            params.user_id = user_id;
        }
        if (device_id) {
            params.device_id = device_id;
        }
        if (amplitude_id) {
            params.amplitude_id = amplitude_id;
        }

        // https://developers.amplitude.com/docs/user-profile-api
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://profile-api.amplitude.com/v1/userprofile',
            headers: {
                'Authorization': `Basic ${Buffer.from(context.auth.apiKey + ':' + context.auth.secretKey).toString('base64')}`
            },
            params: params
        });

        return context.sendJson(data, 'out');
    }
};
