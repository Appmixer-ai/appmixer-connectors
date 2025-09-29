'use strict';

const assert = require('assert');

describe('front connector', () => {
    it('should exist', () => {
        const service = require('../../src/appmixer/front/service.json');
        const auth = require('../../src/appmixer/front/auth');
        const bundle = require('../../src/appmixer/front/bundle.json');
        const quota = require('../../src/appmixer/front/quota');

        assert.strictEqual(service.name, 'appmixer.front');
        assert.strictEqual(service.version, '1.0.0');
        assert.strictEqual(bundle.name, 'appmixer.front');
        assert.strictEqual(bundle.version, '1.0.0');
        assert.strictEqual(auth.type, 'apiKey');
        assert.ok(quota.rules.length > 0);
    });

    it('should have channels module', () => {
        const fs = require('fs');
        const path = require('path');

        const channelsPath = path.join(__dirname, '../../src/appmixer/front/channels');
        assert.ok(fs.existsSync(channelsPath), 'Channels directory should exist');

        const components = fs.readdirSync(channelsPath);
        assert.ok(components.includes('ListChannels'), 'ListChannels component should exist');
        assert.ok(components.includes('CreateChannel'), 'CreateChannel component should exist');
        assert.ok(components.includes('GetChannel'), 'GetChannel component should exist');
        assert.ok(components.includes('UpdateChannel'), 'UpdateChannel component should exist');
        assert.ok(components.includes('ValidateChannel'), 'ValidateChannel component should exist');
    });
});
