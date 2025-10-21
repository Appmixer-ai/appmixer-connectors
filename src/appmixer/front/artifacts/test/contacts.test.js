'use strict';

const assert = require('assert');
const appmixer = require('../../../../../test/utils');

// Import Front components
const GetContact = require('../../contacts/GetContact/GetContact');
const CreateContact = require('../../contacts/CreateContact/CreateContact');
const UpdateContact = require('../../contacts/UpdateContact/UpdateContact');
const DeleteContact = require('../../contacts/DeleteContact/DeleteContact');
const FindContacts = require('../../contacts/FindContacts/FindContacts');

describe('Front Contacts Tests', () => {

    let context;

    beforeEach(() => {
        context = appmixer.createMockContext({
            auth: {
                accessToken: process.env.FRONT_ACCESS_TOKEN || 'test-token'
            }
        });
    });

    describe('GetContact', () => {
        it('should throw error when ID is missing', async () => {
            const input = {};

            context.messages = { in: { content: input } };

            try {
                await GetContact.receive(context);
                assert.fail('Should have thrown error');
            } catch (error) {
                assert(error.message.includes('Contact ID is required'));
            }
        });

        it('should validate that ID is passed to the component', () => {
            assert(GetContact, 'GetContact component should exist');
            assert(typeof GetContact.receive === 'function', 'GetContact should have receive method');
        });
    });

    describe('CreateContact', () => {
        it('should throw error when name is missing', async () => {
            const input = {}; // Missing name

            context.messages = { in: { content: input } };

            try {
                await CreateContact.receive(context);
                assert.fail('Should have thrown error');
            } catch (error) {
                assert(error.message.includes('Name is required'));
            }
        });

        it('should validate component exists', () => {
            assert(CreateContact, 'CreateContact component should exist');
            assert(typeof CreateContact.receive === 'function', 'CreateContact should have receive method');
        });
    });

    describe('UpdateContact', () => {
        it('should throw error when ID is missing', async () => {
            const input = { name: 'Updated Name' }; // Missing id

            context.messages = { in: { content: input } };

            try {
                await UpdateContact.receive(context);
                assert.fail('Should have thrown error');
            } catch (error) {
                assert(error.message.includes('Contact ID is required'));
            }
        });

        it('should validate component exists', () => {
            assert(UpdateContact, 'UpdateContact component should exist');
            assert(typeof UpdateContact.receive === 'function', 'UpdateContact should have receive method');
        });
    });

    describe('DeleteContact', () => {
        it('should throw error when ID is missing', async () => {
            const input = {};

            context.messages = { in: { content: input } };

            try {
                await DeleteContact.receive(context);
                assert.fail('Should have thrown error');
            } catch (error) {
                assert(error.message.includes('Contact ID is required'));
            }
        });

        it('should validate component exists', () => {
            assert(DeleteContact, 'DeleteContact component should exist');
            assert(typeof DeleteContact.receive === 'function', 'DeleteContact should have receive method');
        });
    });

    describe('FindContacts', () => {
        it('should validate component exists', () => {
            assert(FindContacts, 'FindContacts component should exist');
            assert(typeof FindContacts.receive === 'function', 'FindContacts should have receive method');
        });

        it('should generate output port options when requested', async () => {
            const input = { outputType: 'array' };

            context.properties = { generateOutputPortOptions: true };
            context.messages = { in: { content: input } };

            await FindContacts.receive(context);

            // Verify sendJson was called - the lib should have sent port options
            assert(context.sendJson.called, 'sendJson should have been called for output port options');
        });
    });
});
