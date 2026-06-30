'use strict';

const API_VERSION = 'v25.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

/**
 * Facebook Graph API client using context.httpRequest.
 */
class FacebookClient {

    constructor(context) {
        this.context = context;
        this.accessToken = context.auth.accessToken;
    }

    async get(path, params = {}) {
        params.access_token = this.accessToken;
        const url = `${BASE_URL}${path}?` + new URLSearchParams(params).toString();
        const response = await this.context.httpRequest.get(url);
        return response.data;
    }

    async post(path, data = {}) {
        data.access_token = this.accessToken;
        const url = `${BASE_URL}${path}`;
        const response = await this.context.httpRequest.post(url, data);
        return response.data;
    }

    /**
     * Set a different access token (e.g. page token).
     */
    setAccessToken(token) {
        this.accessToken = token;
        return this;
    }

    /**
     * Fetch all pages using cursor-based pagination.
     */
    async fetchAll(path, params = {}) {
        const results = [];
        let url = `${BASE_URL}${path}`;
        params.access_token = this.accessToken;

        let response = await this.context.httpRequest.get(url + '?' + new URLSearchParams(params).toString());
        let data = response.data;

        if (data.data) {
            results.push(...data.data);
        }

        while (data.paging?.next) {
            response = await this.context.httpRequest.get(data.paging.next);
            data = response.data;
            if (data.data) {
                results.push(...data.data);
            }
        }

        return results;
    }
}

module.exports = { FacebookClient, API_VERSION, BASE_URL };
