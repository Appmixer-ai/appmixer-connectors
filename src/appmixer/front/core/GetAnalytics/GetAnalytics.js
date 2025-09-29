module.exports = {

    async receive(context) {

        const { start, end, timezone = 'UTC', filters } = context.messages.in.content;

        if (!start) {
            throw new context.CancelError('Start time is required!');
        }

        if (!end) {
            throw new context.CancelError('End time is required!');
        }

        try {
            const url = 'https://api2.frontapp.com/analytics';

            const params = {
                start: start,
                end: end,
                timezone: timezone
            };

            // Parse filters if provided as JSON string
            if (filters) {
                let parsedFilters;
                if (typeof filters === 'string') {
                    try {
                        parsedFilters = JSON.parse(filters);
                    } catch (e) {
                        throw new context.CancelError('Filters must be valid JSON!');
                    }
                } else {
                    parsedFilters = filters;
                }

                // Add filters to params
                Object.assign(params, parsedFilters);
            }

            const response = await context.httpRequest({
                method: 'GET',
                url,
                params,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Accept': 'application/json'
                }
            });

            return context.sendJson(response.data, 'out');

        } catch (error) {
            if (error.response?.status === 400) {
                throw new context.CancelError('Invalid parameters provided!');
            }
            throw error;
        }
    }
};
