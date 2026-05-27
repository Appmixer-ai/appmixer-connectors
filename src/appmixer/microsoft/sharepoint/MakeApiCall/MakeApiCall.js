'use strict';
const { makeRequest } = require('../common');

function kvToObj(arr) {
    if (!arr || !Array.isArray(arr)) return {};
    return Object.fromEntries(arr.map(({ key, value }) => [key, value]));
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
