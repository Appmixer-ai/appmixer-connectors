'use strict';

const assert = require('assert');

describe('Front Channels Components', () => {

    describe('ListChannels', () => {
        it('should have correct component definition', () => {
            const component = require('../../../src/appmixer/front/channels/ListChannels/component.json');

            assert.strictEqual(component.name, 'appmixer.front.channels.ListChannels');
            assert.strictEqual(component.description, 'List all channels in an inbox. Channels are the sources of incoming conversations (email, chat, SMS, etc.).');
            assert.strictEqual(component.version, '1.0.0');
            assert.ok(component.auth);
            assert.strictEqual(component.auth.service, 'appmixer:front');
            assert.ok(component.inPorts);
            assert.ok(component.outPorts);

            // Check required input
            const inPort = component.inPorts[0];
            assert.strictEqual(inPort.name, 'in');
            assert.ok(inPort.schema.properties.inboxId);
            assert.ok(inPort.schema.required.includes('inboxId'));
        });

        it('should have required behavior file', () => {
            const behavior = require('../../../src/appmixer/front/channels/ListChannels/ListChannels.js');
            assert.ok(typeof behavior.receive === 'function');
        });
    });

    describe('CreateChannel', () => {
        it('should have correct component definition', () => {
            const component = require('../../../src/appmixer/front/channels/CreateChannel/component.json');

            assert.strictEqual(component.name, 'appmixer.front.channels.CreateChannel');
            assert.strictEqual(component.description, 'Create a custom channel linked to an inbox.');
            assert.strictEqual(component.version, '1.0.0');
            assert.ok(component.auth);
            assert.strictEqual(component.auth.service, 'appmixer:front');
            assert.ok(component.inPorts);
            assert.ok(component.outPorts);

            // Check required inputs
            const inPort = component.inPorts[0];
            assert.strictEqual(inPort.name, 'in');
            assert.ok(inPort.schema.properties.inboxId);
            assert.ok(inPort.schema.properties.type);
            assert.ok(inPort.schema.required.includes('inboxId'));
            assert.ok(inPort.schema.required.includes('type'));
        });

        it('should have required behavior file', () => {
            const behavior = require('../../../src/appmixer/front/channels/CreateChannel/CreateChannel.js');
            assert.ok(typeof behavior.receive === 'function');
        });
    });

    describe('GetChannel', () => {
        it('should have correct component definition', () => {
            const component = require('../../../src/appmixer/front/channels/GetChannel/component.json');

            assert.strictEqual(component.name, 'appmixer.front.channels.GetChannel');
            assert.strictEqual(component.description, 'Fetch a specific channel by its ID.');
            assert.strictEqual(component.version, '1.0.0');
            assert.ok(component.auth);
            assert.strictEqual(component.auth.service, 'appmixer:front');
            assert.ok(component.inPorts);
            assert.ok(component.outPorts);

            // Check required input
            const inPort = component.inPorts[0];
            assert.strictEqual(inPort.name, 'in');
            assert.ok(inPort.schema.properties.channelId);
            assert.ok(inPort.schema.required.includes('channelId'));
        });

        it('should have required behavior file', () => {
            const behavior = require('../../../src/appmixer/front/channels/GetChannel/GetChannel.js');
            assert.ok(typeof behavior.receive === 'function');
        });
    });

    describe('UpdateChannel', () => {
        it('should have correct component definition', () => {
            const component = require('../../../src/appmixer/front/channels/UpdateChannel/component.json');

            assert.strictEqual(component.name, 'appmixer.front.channels.UpdateChannel');
            assert.strictEqual(component.description, 'Update a channel\'s settings.');
            assert.strictEqual(component.version, '1.0.0');
            assert.ok(component.auth);
            assert.strictEqual(component.auth.service, 'appmixer:front');
            assert.ok(component.inPorts);
            assert.ok(component.outPorts);

            // Check required input
            const inPort = component.inPorts[0];
            assert.strictEqual(inPort.name, 'in');
            assert.ok(inPort.schema.properties.channelId);
            assert.ok(inPort.schema.required.includes('channelId'));
        });

        it('should have required behavior file', () => {
            const behavior = require('../../../src/appmixer/front/channels/UpdateChannel/UpdateChannel.js');
            assert.ok(typeof behavior.receive === 'function');
        });
    });

    describe('ValidateChannel', () => {
        it('should have correct component definition', () => {
            const component = require('../../../src/appmixer/front/channels/ValidateChannel/component.json');

            assert.strictEqual(component.name, 'appmixer.front.channels.ValidateChannel');
            assert.strictEqual(component.description, 'Asynchronously validate an SMTP channel. This endpoint is only relevant for SMTP channel types.');
            assert.strictEqual(component.version, '1.0.0');
            assert.ok(component.auth);
            assert.strictEqual(component.auth.service, 'appmixer:front');
            assert.ok(component.inPorts);
            assert.ok(component.outPorts);

            // Check required input
            const inPort = component.inPorts[0];
            assert.strictEqual(inPort.name, 'in');
            assert.ok(inPort.schema.properties.channelId);
            assert.ok(inPort.schema.required.includes('channelId'));
        });

        it('should have required behavior file', () => {
            const behavior = require('../../../src/appmixer/front/channels/ValidateChannel/ValidateChannel.js');
            assert.ok(typeof behavior.receive === 'function');
        });
    });
});
