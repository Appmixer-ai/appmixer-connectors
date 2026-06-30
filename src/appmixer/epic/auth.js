'use strict';

const { FHIR_BASE_URL, OAUTH_BASE_URL } = require('./commons');

// Read-only SMART on FHIR scopes covering every resource type this connector
// reads. Adding scopes later is a breaking change (users must re-authenticate).
const SCOPES = [
    'openid',
    'fhirUser',
    'user/Patient.read',
    'user/Condition.read',
    'user/Observation.read',
    'user/Medication.read',
    'user/MedicationRequest.read',
    'user/Procedure.read',
    'user/CarePlan.read',
    'user/Goal.read',
    'user/Immunization.read',
    'user/DiagnosticReport.read',
    'user/DocumentReference.read',
    'user/Device.read'
];

async function exchangeToken(context, data) {

    const response = await context.httpRequest({
        method: 'POST',
        url: `${OAUTH_BASE_URL}/token`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        data: new URLSearchParams(data).toString()
    });

    const token = response.data;
    const expiresIn = Number(token.expires_in) || 3600;

    return {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        accessTokenExpDate: new Date(Date.now() + expiresIn * 1000)
    };
}

module.exports = {

    type: 'oauth2',

    definition: {

        scope: SCOPES,

        scopeDelimiter: ' ',

        authUrl: context => {

            const params = new URLSearchParams({
                response_type: 'code',
                client_id: context.clientId,
                redirect_uri: context.callbackUrl,
                scope: context.scope.join(' '),
                state: context.ticket,
                // Epic requires the FHIR base URL as the audience.
                aud: FHIR_BASE_URL
            });

            return `${OAUTH_BASE_URL}/authorize?${params.toString()}`;
        },

        requestAccessToken: context => {

            const data = {
                grant_type: 'authorization_code',
                code: context.authorizationCode,
                redirect_uri: context.callbackUrl,
                client_id: context.clientId
            };

            if (context.clientSecret) {
                data.client_secret = context.clientSecret;
            }

            return exchangeToken(context, data);
        },

        refreshAccessToken: context => {

            const data = {
                grant_type: 'refresh_token',
                refresh_token: context.refreshToken,
                client_id: context.clientId
            };

            if (context.clientSecret) {
                data.client_secret = context.clientSecret;
            }

            return exchangeToken(context, data);
        },

        requestProfileInfo: async context => {

            try {
                const { data } = await context.httpRequest({
                    method: 'GET',
                    url: `${OAUTH_BASE_URL}/userinfo`,
                    headers: {
                        'Authorization': `Bearer ${context.accessToken}`,
                        'Accept': 'application/json'
                    }
                });
                return data || {};
            } catch (error) {
                // The userinfo endpoint is optional for some Epic deployments.
                return {};
            }
        },

        accountNameFromProfileInfo: context => {

            const profile = context.profileInfo || {};
            return profile.fhirUser
                || profile.name
                || profile.preferred_username
                || profile.sub
                || 'Epic FHIR Account';
        },

        validateAccessToken: context => {

            return !!context.accessToken;
        }
    }
};
