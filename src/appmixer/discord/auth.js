'use strict';

const { splitScopesAndPermissions } = require('../discord/permission-calculator');

module.exports = {

    type: 'oauth2',

    definition: () => {

        let guildId;
        let guildName;

        return {

            scope: [
                'identify', 'bot', 'CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'MANAGE_MESSAGES',
                'MANAGE_ROLES', 'VIEW_CHANNEL', 'MANAGE_EVENTS', 'ADD_REACTIONS',
                'MANAGE_THREADS', 'SEND_MESSAGES', 'MANAGE_WEBHOOKS', 'CREATE_EVENTS',
                'CREATE_PUBLIC_THREADS', 'SEND_MESSAGES_IN_THREADS'
            ],

            authUrl: (context) => {
                const scopesAndPermissions = splitScopesAndPermissions(context.scope);

                return 'https://discord.com/oauth2/authorize?' +
                    `client_id=${encodeURIComponent(context.clientId)}&` +
                    `scope=${scopesAndPermissions.scopes.join('+')}&` +
                    `permissions=${scopesAndPermissions.permissions}&` +
                    `redirect_uri=${encodeURIComponent(context.callbackUrl)}&` +
                    'response_type=code&' +
                    `state=${encodeURIComponent(context.ticket)}`;
            },

            requestAccessToken: async (context) => {
                const body = {
                    'grant_type': 'authorization_code',
                    'code': context.authorizationCode,
                    'redirect_uri': context.callbackUrl,
                    'client_id': context.clientId,
                    'client_secret': context.clientSecret
                };

                const { data } = await context.httpRequest({
                    method: 'POST',
                    url: 'https://discord.com/api/oauth2/token',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: body
                });

                guildId = data.guild.id;
                guildName = data.guild.name;

                const expDate = new Date();
                expDate.setTime(expDate.getTime() + (data.expires_in * 1000));

                return {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    accessTokenExpDate: expDate
                };
            },

            requestProfileInfo: async (context) => {
                const { data } = await context.httpRequest({
                    method: 'GET',
                    url: 'https://discord.com/api/oauth2/@me',
                    headers: {
                        Authorization: `Bearer ${context.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                return {
                    ...data,
                    guildId,
                    guildName
                };
            },

            accountNameFromProfileInfo: (context) => {

                return `${context.profileInfo.application.name} (${context.profileInfo.user.username} [${context.profileInfo.guildName}])`;
            },

            validateAccessToken: 'https://discord.com/api/oauth2/@me',

            refreshAccessToken: async (context) => {
                const body = {
                    'grant_type': 'refresh_token',
                    'refresh_token': context.refreshToken,
                    'client_id': context.clientId,
                    'client_secret': context.clientSecret
                };

                const { data } = await context.httpRequest({
                    method: 'POST',
                    url: 'https://discord.com/api/oauth2/token',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: body
                });

                const expDate = new Date();
                expDate.setTime(expDate.getTime() + (data.expires_in * 1000));

                return {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    accessTokenExpDate: expDate
                };
            }
        };
    }
};
