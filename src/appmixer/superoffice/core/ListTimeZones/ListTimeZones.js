'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const result = lib.listTimeZones();
        return context.sendJson({ result, count: result.length }, 'out');
    },

    toSelectArray({ result }) {

        return (result || []).map(item => ({ label: item.label, value: item.name }));
    }
};
