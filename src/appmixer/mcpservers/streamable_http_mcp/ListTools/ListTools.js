'use strict';

const lib = require('../lib');

module.exports = {

    receive: async function(context) {

        let { url, headers } = context.properties;

        const result = await lib.mcpCall(context, url, headers, 'listTools', []);

        return context.sendJson(result, 'out');
    },

    toolsToSelectArray: function(out) {

        return (out.tools || []).map(tool => ({ label: tool.name, value: tool.name }));
    }
};
