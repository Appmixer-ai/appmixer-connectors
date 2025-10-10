'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');

describe('Front Tags Integration', function() {

    describe('Basic Integration', function() {
        it('should have tags module integrated', function() {
            const createComponent = require('../../../src/appmixer/front/tag/CreateTag/CreateTag.js');
            const getComponent = require('../../../src/appmixer/front/tag/GetTag/GetTag.js');
            const listComponent = require('../../../src/appmixer/front/tag/ListTags/ListTags.js');
            const deleteComponent = require('../../../src/appmixer/front/tag/DeleteTag/DeleteTag.js');

            assert(typeof createComponent.receive === 'function', 'CreateTag should be integrated');
            assert(typeof getComponent.receive === 'function', 'GetTag should be integrated');
            assert(typeof listComponent.receive === 'function', 'ListTags should be integrated');
            assert(typeof deleteComponent.receive === 'function', 'DeleteTag should be integrated');
        });
    });
});
