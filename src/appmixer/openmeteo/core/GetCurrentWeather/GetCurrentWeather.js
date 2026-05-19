'use strict';

module.exports = {

    async receive(context) {

        const { latitude, longitude } = context.messages.in.content;
        const url = `https://api.open-meteo.com/v1/forecastttt?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

        const response = await context.httpRequest({
            method: 'GET',
            url,
            json: true
        });

        return context.sendJson(response.data, 'out');
    }
};
