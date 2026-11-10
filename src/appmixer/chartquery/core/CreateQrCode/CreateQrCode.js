'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { data, format, size } = context.messages.in.content;

        if (!data) {
            throw new context.CancelError('Data is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/v1/qrcode',
            params: {
                data: data,
                format: format || 'svg',
                size: size,
                share: 'true'
            }
        });

        return context.sendJson(response || {}, 'out');
    }
};
