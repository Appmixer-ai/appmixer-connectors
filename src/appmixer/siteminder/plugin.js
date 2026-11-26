'use strict';

module.exports = async (context) => {

    require('./routes')(context);
    context.log('info', '[SITEMINDER] Plugin initialized.');
};
