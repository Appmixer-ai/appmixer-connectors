'use strict';

module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            'botToken': {
                'name': 'Bot Token',
                'type': 'text',
                'tooltip': '<p>Create a bot using @BotFather on Telegram and get your bot token. The token format should be like: 123456789:AbCdefGhIJKlmNoPQRsTUVwxyZ</p>'
            }
        },

        replaceVariables(context, str) {
            Object.keys(this.auth).forEach(variableName => {
                str = str.replaceAll('{' + variableName + '}', context[variableName]);
            });
            return str;
        },

        requestProfileInfo(context) {
            const botToken = this.replaceVariables(context, '{botToken}');
            return {
                name: 'Bot ' + botToken.split(':')[0] + '...'
            };
        },

        accountNameFromProfileInfo: 'name',

        async validate(context) {
            const method = 'GET';
            const url = '/getMe';
            const baseUrl = 'https://api.telegram.org/bot{botToken}';
            const normalizedUrl = this.replaceVariables(context, baseUrl + url);
            const options = { method: method, url: normalizedUrl };
            
            const response = await context.httpRequest(options);
            
            if (!response.data || !response.data.ok) {
                throw new Error(response.data?.description || 'Invalid bot token');
            }
            
            return true;
        }
    }
};