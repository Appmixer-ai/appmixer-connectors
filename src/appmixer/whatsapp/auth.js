'use strict';

const GRAPH_VERSION = 'v25.0';

module.exports = {

    type: 'oauth2',

    definition: {

        // The scope is defined inside the Meta Login Configuration (admin sets it
        // up in Meta App Dashboard → Facebook Login for Business → Configurations).
        // Keeping `scope` here only as a hint for the engine / docs — the OAuth
        // request itself uses `config_id` and the Login Config's declared scopes
        // take precedence, regardless of what we send.
        scope: [
            'whatsapp_business_messaging',
            'whatsapp_business_management'
        ],

        authUrl: async context => {

            // configId comes from Backoffice → `appmixer:whatsapp.configId` (the
            // Login Configuration ID from Meta App Dashboard). When present, we
            // use the Facebook Login for Business flow which shows the WABA /
            // Business asset picker. Without it we fall back to plain OAuth.
            const configId = context.config.configId;

            await context.log({ 'step': 'login', d: { configId, client: context.clientId } });

            const params = {
                'redirect_uri': context.callbackUrl,
                'response_type': 'code',
                'state': context.ticket
            };

            if (configId) {
                // Facebook Login for Business with Login Configuration — Meta
                // expects `app_id` in this flow (alias of client_id, but the
                // asset-picker UI specifically looks for app_id). Scopes and
                // assets are declared in the Login Config itself, do NOT send
                // the `scope` query parameter — it would silently broaden the
                // request and confuse Meta's UI.
                params['app_id'] = context.clientId;
                params['config_id'] = configId;
                params['override_default_response_type'] = 'true';
            } else {
                // Plain OAuth fallback — client_id + explicit scope.
                params['client_id'] = context.clientId;
                params['scope'] = context.scope.join(',');
            }

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
            //
            //    Behaviour:
            //    - /debug_token succeeded AND granular_scopes present AND has WABA target_ids
            //         → auto-discovery succeeded, store on profile
            //    - /debug_token succeeded AND granular_scopes present AND NO WABA target_ids
            //         → user authenticated without picking any WABA in the asset picker
            //           (or their Meta account has no WABA). FAIL auth with a clear
            //           message so we don't end up with a "connected" but useless account.
            //    - /debug_token failed OR granular_scopes absent (e.g. plain OAuth fallback
            //      with no config_id) → can't verify; return profile silently.

            let debugSucceeded = false;
            let granularScopesPresent = false;
            const wabaIds = [];

            try {
                const appAccessToken = `${context.clientId}|${context.clientSecret}`;
                const debugUrl = `https://graph.facebook.com/${GRAPH_VERSION}/debug_token`
                    + `?input_token=${encodeURIComponent(context.accessToken)}`
                    + `&access_token=${encodeURIComponent(appAccessToken)}`;
                const debug = await context.httpRequest.get(debugUrl);
                debugSucceeded = true;

                const granular = debug && debug.data && debug.data.data && debug.data.data.granular_scopes;
                if (Array.isArray(granular) && granular.length > 0) {
                    granularScopesPresent = true;
                    for (const entry of granular) {
                        if (entry && entry.scope === 'whatsapp_business_management' && Array.isArray(entry.target_ids)) {
                            for (const id of entry.target_ids) {
                                if (id && !wabaIds.includes(id)) wabaIds.push(id);
                            }
                        }
                    }
                }
            } catch (err) {
                // /debug_token failed (network, app token rejected, …). Continue best-effort.
            }

            if (debugSucceeded && granularScopesPresent && wabaIds.length === 0) {
                throw new Error(
                    'No WhatsApp Business Account selected during authentication. '
                    + 'Please disconnect and reconnect — when the Meta asset picker appears, '
                    + 'explicitly select at least one WhatsApp Business Account. '
                    + 'If your Meta account does not have any WhatsApp Business Account, '
                    + 'create one in Meta Business Manager (business.facebook.com → Settings → '
                    + 'Business Settings → Accounts → WhatsApp Accounts → Add) before reconnecting.'
                );
            }

            if (wabaIds.length > 0) {
                profile.businessAccountId = wabaIds[0];   // default WABA
                profile.wabaIds = wabaIds;                // full list for diagnostics
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
