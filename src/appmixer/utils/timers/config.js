'use strict';

module.exports = context => {

    return {
        throttlerJob: {

            schedule: context.config.dueTasksSchedule || '0 */1 * * * *'
        }
    };
};
