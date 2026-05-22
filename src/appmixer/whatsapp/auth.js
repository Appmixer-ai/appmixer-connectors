'use strict';

const GRAPH_VERSION = 'v25.0';

module.exports = {

    type: 'oauth2',

    definition: {

        scope: [
            'whatsapp_business_messaging',
            'whatsapp_business_management'
        ],

        authUrl: context => {

            const params = {
                'client_id': context.clientId,
                'redirect_uri': context.callbackUrl,
                'scope': context.scope.join(','),
                'state': context.ticket
            };
            return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?` + new URLSearchParams(params).toString();
        },

        requestAccessToken: async context => {

            const params = {
                'client_id': context.clientId,
                'redirect_uri': context.callbackUrl,
                'client_secret': context.clientSecret,
                'code': context.authorizationCode
            };

            const url = `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`;
            const response = await context.httpRequest.get(url + '?' + new URLSearchParams(params).toString());

            const expiresIn = response.data['expires_in'];
            const accessTokenExpDate = expiresIn
                ? new Date(Date.now() + expiresIn * 1000)
                : undefined;

            return {
                accessToken: response.data['access_token'],
                accessTokenExpDate
            };
        },

        accountNameFromProfileInfo: context => {

            return context.profileInfo['name'] || context.profileInfo['id'].toString();
        },

        requestProfileInfo: async context => {

            // 1) Basic user profile.
            const meUrl = `https://graph.facebook.com/${GRAPH_VERSION}/me?access_token=${context.accessToken}`;
            const me = await context.httpRequest.get(meUrl);

            const profile = { ...me.data };

            // 2) Discover the user's WABA(s) via /debug_token granular_scopes.
            //    Facebook Login for Business returns the WABA IDs the user
            //    granted access to under `granular_scopes[].target_ids` —
            //    accessible without business_management scope, unlike /me/businesses.
            try {
                const appAccessToken = `${context.clientId}|${context.clientSecret}`;
                const debugUrl = `https://graph.facebook.com/${GRAPH_VERSION}/debug_token`
                    + `?input_token=${encodeURIComponent(context.accessToken)}`
                    + `&access_token=${encodeURIComponent(appAccessToken)}`;
                const debug = await context.httpRequest.get(debugUrl);

                const granular = (debug.data && debug.data.data && debug.data.data.granular_scopes) || [];

                const wabaIds = [];
                for (const entry of granular) {
                    if (entry && entry.scope === 'whatsapp_business_management' && Array.isArray(entry.target_ids)) {
                        for (const id of entry.target_ids) {
                            if (id && !wabaIds.includes(id)) wabaIds.push(id);
                        }
                    }
                }

                if (wabaIds.length > 0) {
                    profile.businessAccountId = wabaIds[0];   // default WABA
                    profile.wabaIds = wabaIds;                // full list for diagnostics
                }

            } catch (err) {
                // Best-effort — auth still succeeds even when /debug_token is unavailable.
                // The user can paste the WABA ID into the inspector field as a fallback.
            }

            return profile;
        },

        refreshAccessToken: async context => {

            const params = {
                'client_id': context.clientId,
                'client_secret': context.clientSecret,
                'grant_type': 'fb_exchange_token',
                'fb_exchange_token': context.accessToken
            };

            const url = `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`;
            const response = await context.httpRequest.get(url + '?' + new URLSearchParams(params).toString());

            const expiresIn = response.data['expires_in'];
            const accessTokenExpDate = expiresIn
                ? new Date(Date.now() + expiresIn * 1000)
                : undefined;

            return {
                accessToken: response.data['access_token'],
                accessTokenExpDate
            };
        },

        validateAccessToken: async context => {

            try {
                const url = `https://graph.facebook.com/${GRAPH_VERSION}/me?access_token=${context.accessToken}`;
                await context.httpRequest.get(url);
                return true;
            } catch (err) {
                return false;
            }
        }
    }
};
