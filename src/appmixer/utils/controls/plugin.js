'use strict';

module.exports = async context => {
    await require('./routes')(context);
    // await require('./jobs')(context);
    context.log('info', '[Utils Controls] Utils controls plugin successfully initialized.');
};
