'use strict';

module.exports = {
    async tick(context) {
        // Get state to track cohort changes
        let previousState = context.state.cohorts || {};
        let currentState = {};

        try {
            // Fetch current list of cohorts from Amplitude
            // https://developers.amplitude.com/docs/behavioral-cohorts-api#list-cohorts
            const { data } = await context.httpRequest({
                method: 'GET',
                url: 'https://analytics.eu.amplitude.com/api/3/cohorts',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Basic ${Buffer.from(context.auth.apiKey + ':' + context.auth.secretKey).toString('base64')}`
                }
            });

            const cohorts = data.cohorts || [];

            // Build current state
            for (const cohort of cohorts) {
                const cohortKey = cohort.id;
                currentState[cohortKey] = {
                    id: cohort.id,
                    name: cohort.name,
                    size: cohort.size,
                    modified_at: cohort.modified_at,
                    created_at: cohort.created_at
                };
            }

            // Detect changes
            for (const cohortId in currentState) {
                const current = currentState[cohortId];
                const previous = previousState[cohortId];

                if (!previous) {
                    // New cohort created
                    await context.sendJson({
                        eventType: 'created',
                        cohortId: current.id,
                        name: current.name,
                        size: current.size,
                        modified_at: current.modified_at,
                        created_at: current.created_at
                    }, 'out');
                } else if (
                    current.size !== previous.size ||
                    current.modified_at !== previous.modified_at ||
                    current.name !== previous.name
                ) {
                    // Cohort updated
                    await context.sendJson({
                        eventType: 'updated',
                        cohortId: current.id,
                        name: current.name,
                        size: current.size,
                        modified_at: current.modified_at,
                        created_at: current.created_at
                    }, 'out');
                }
            }

            // Detect deleted cohorts
            for (const cohortId in previousState) {
                if (!currentState[cohortId]) {
                    const deleted = previousState[cohortId];
                    await context.sendJson({
                        eventType: 'deleted',
                        cohortId: deleted.id,
                        name: deleted.name,
                        size: deleted.size,
                        modified_at: deleted.modified_at,
                        created_at: deleted.created_at
                    }, 'out');
                }
            }

            // Save current state
            context.state.cohorts = currentState;
        } catch (error) {
            await context.log({
                level: 'error',
                message: 'Error polling cohorts',
                error: error.message
            });
        }
    }
};
