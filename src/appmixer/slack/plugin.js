'use strict';

module.exports = async context => {

    require('./routes')(context);

    require('./routes-tasks.js')(context);

    await require('./jobs')(context);
    context.log('info', '[SLACK] Scheduling Slack jobs.');
};
