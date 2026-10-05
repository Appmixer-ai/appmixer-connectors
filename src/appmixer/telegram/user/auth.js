'use strict';

const { Api } = require('telegram');
const lib = require('./lib');

const getMe = async (context) => {

    const client = await lib.getClient(context);
    const users = await lib.invoke(context, client, new Api.users.GetUsers({ id: [new Api.InputUserSelf()] }), 'your account');
    const user = (users || [])[0] || {};

    if (user.bot) {
        throw new context.CancelError(
            'This session belongs to a bot. Bots cannot read channels they are not members of - '
            + 'use the Telegram (bot) connector for bots, or log in with a user account here.'
        );
    }

    return user;
};

module.exports = {

    type: 'apiKey',

    name: 'appmixer:telegram:user',

    definition: () => {

        return {

            auth: {
                apiId: {
                    type: 'text',
                    name: 'API ID',
                    tooltip: 'Log in at <i>https://my.telegram.org</i>, open <i>API development tools</i>, create an '
                        + 'application and copy its numeric <i>App api_id</i>.'
                },
                apiHash: {
                    type: 'password',
                    name: 'API Hash',
                    tooltip: 'The <i>App api_hash</i> shown next to the API ID on my.telegram.org.'
                },
                session: {
                    type: 'password',
                    name: 'Session String',
                    tooltip: 'A pre-generated user session for the API ID above. Create it once on your own machine '
                        + 'with gramjs (<i>npm install telegram</i>, then <i>client.start()</i> and '
                        + '<i>client.session.save()</i> - see <i>https://gram.js.org/getting-started/authorization</i>), '
                        + 'which asks for your phone number, the login code and your 2FA password. '
                        + 'The string grants full access to the Telegram account, so treat it as a password. '
                        + 'Use a dedicated account if possible.'
                }
            },

            validate: async (context) => {

                await getMe(context);
                return true;
            },

            accountNameFromProfileInfo: 'accountName',

            // The phone number is deliberately not stored in the profile.
            requestProfileInfo: async (context) => {

                const user = await getMe(context);
                const name = [user.firstName, user.lastName].filter(Boolean).join(' ');

                return {
                    accountName: user.username ? `@${user.username}` : (name || 'Telegram User'),
                    id: user.id ? String(user.id) : undefined,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName
                };
            }
        };
    }
};
