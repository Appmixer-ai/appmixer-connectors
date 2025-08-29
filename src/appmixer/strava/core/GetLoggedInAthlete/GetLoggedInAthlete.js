'use strict';

module.exports = {

    async receive(context) {

        // Get authenticated athlete using Strava API
        // https://developers.strava.com/docs/reference/#api-Athletes-getLoggedInAthlete
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://www.strava.com/api/v3/athlete',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
