'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const result = await api.Index11.execute(context, {});
        return context.sendJson(result, 'out');
    },

    toSelectArray(msg) {
        return (msg.data || []).map(pub => ({ label: pub.name, value: pub.id }));
    }
};
