'use strict';

module.exports = async context => {

    require('./routes')(context);

    require('./tasks/routes.js')(context);
};
