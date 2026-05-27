'use strict';
const { makeRequest } = require('../common');

function kvToObj(arr) {
    if (!arr || !Array.isArray(arr)) return {};
    const out = {};
    for (const row of arr) {
        if (!row || typeof row !== "object") continue;
        const key = row.key;
        if (typeof key !== "string" || key.length === 0) continue;
        out[key] = row.value;
    }
    return out;
}

module.exports = {

    async receive(context) {

        const { url, method, headers: headersKV, parameters: parametersKV, body } = context.messages.in.content;

        const extraHeaders = kvToObj(headersKV);
        const queryParams = kvToObj(parametersKV);

        const apiResponse = await makeRequest({ url, method, extraHeaders, queryParams, bodyData }, context);
        return context.sendJson({ response: apiResponse }, 'out');
    }
};
