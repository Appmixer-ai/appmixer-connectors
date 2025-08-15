'use strict';

module.exports = async context => {

    require('./routes')(context);

    require('./routes-tasks.js')(context);
};
