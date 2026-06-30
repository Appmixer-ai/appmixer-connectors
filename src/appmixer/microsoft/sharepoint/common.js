'use strict';
const oneDriveAPI = require('onedrive-api');
const commons = require('../microsoft-commons');
const { URL } = require('url');

async function makeRequest(options, context) {
    const { url, method, extraHeaders = {}, queryParams = {}, bodyData = {} } = options;
    const { accessToken, profileInfo } = context.auth;

    // Parse the URL and default it to Microsoft Graph API if invalid
    let apiUrl;
    try {
        apiUrl = new URL(url);
    } catch (error) {
        apiUrl = new URL(url, 'https://graph.microsoft.com/v1.0/');
    }

    // Append query params if any
    if (Object.keys(queryParams).length > 0) {
        Object.entries(queryParams).forEach(([k, v]) => apiUrl.searchParams.set(k, v));
    }

    const endpointUrl = apiUrl.href.replace(apiUrl.origin + '/v1.0/', '');
    const apiOptions = {
        accessToken,
        url: endpointUrl,
        method,
        body: Object.keys(bodyData).length > 0 ? bodyData : undefined,
        ...(Object.keys(extraHeaders).length > 0 ? { headers: extraHeaders } : {})
    };

    // Call the SharePoint API endpoint and handle errors
    const apiResponse = await commons.formatError(async () => {
        return oneDriveAPI.items.customEndpoint(apiOptions);
    }, `Failed to perform the API request in your SharePoint account (${profileInfo.userPrincipalName}).`);
    return apiResponse;
}

module.exports = { makeRequest };
