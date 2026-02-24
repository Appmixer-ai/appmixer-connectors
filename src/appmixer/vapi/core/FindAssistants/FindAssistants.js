'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'orgId': { 'type': 'string', 'title': 'Org Id' },
    'createdAt': { 'type': 'string', 'title': 'Created At' },
    'updatedAt': { 'type': 'string', 'title': 'Updated At' },
    'name': { 'type': 'string', 'title': 'Name' },
    'firstMessage': { 'type': 'string', 'title': 'First Message' },
    'model': {
        'type': 'object',
        'properties': {
            'provider': { 'type': 'string', 'title': 'Model.Provider' },
            'model': { 'type': 'string', 'title': 'Model.Model' },
            'temperature': { 'type': 'number', 'title': 'Model.Temperature' },
            'maxTokens': { 'type': 'number', 'title': 'Model.Max Tokens' }
        },
        'title': 'Model'
    },
    'voice': {
        'type': 'object',
        'properties': {
            'provider': { 'type': 'string', 'title': 'Voice.Provider' },
            'voiceId': { 'type': 'string', 'title': 'Voice.Voice Id' }
        },
        'title': 'Voice'
    },
    'transcriber': {
        'type': 'object',
        'properties': {
            'provider': { 'type': 'string', 'title': 'Transcriber.Provider' },
            'model': { 'type': 'string', 'title': 'Transcriber.Model' }
        },
        'title': 'Transcriber'
    },
    'analyzeConversation': { 'type': 'boolean', 'title': 'Analyze Conversation' },
    'functions': {
        'type': 'array',
        'items': {
            'type': 'object',
            'properties': {
                'id': { 'type': 'string', 'title': 'Functions.Id' },
                'name': { 'type': 'string', 'title': 'Functions.Name' },
                'description': { 'type': 'string', 'title': 'Functions.Description' },
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'type': { 'type': 'string', 'title': 'Functions.Parameters.Type' },
                        'properties': {
                            'type': 'object',
                            'properties': {
                                'title': {
                                    'type': 'object',
                                    'properties': {
                                        'type': { 'type': 'string', 'title': 'Functions.Parameters.Properties.Title.Type' },
                                        'description': { 'type': 'string', 'title': 'Functions.Parameters.Properties.Title.Description' }
                                    },
                                    'title': 'Functions.Parameters.Properties.Title'
                                },
                                'description': {
                                    'type': 'object',
                                    'properties': {
                                        'type': { 'type': 'string', 'title': 'Functions.Parameters.Properties.Description.Type' },
                                        'description': { 'type': 'string', 'title': 'Functions.Parameters.Properties.Description.Description' }
                                    },
                                    'title': 'Functions.Parameters.Properties.Description'
                                }
                            },
                            'title': 'Functions.Parameters.Properties'
                        },
                        'required': {
                            'type': 'array',
                            'items': { 'type': 'string' },
                            'title': 'Functions.Parameters.Required'
                        }
                    },
                    'title': 'Functions.Parameters'
                }
            }
        },
        'title': 'Functions'
    },
    'serverMessages': {
        'type': 'array',
        'items': { 'type': 'string' },
        'title': 'Server Messages'
    },
    'clientMessages': {
        'type': 'array',
        'items': { 'type': 'string' },
        'title': 'Client Messages'
    },
    'silenceTimeoutSeconds': { 'type': 'number', 'title': 'Silence Timeout Seconds' },
    'maxDurationSeconds': { 'type': 'number', 'title': 'Max Duration Seconds' },
    'backgroundSound': { 'type': 'string', 'title': 'Background Sound' },
    'backchannelingEnabled': { 'type': 'boolean', 'title': 'Backchanneling Enabled' },
    'transcriptionEnabled': { 'type': 'boolean', 'title': 'Transcription Enabled' },
    'forwardingPhoneNumber': { 'type': 'string', 'title': 'Forwarding Phone Number' }
};

module.exports = {
    async receive(context) {

        const {
            outputType,
            orgId,
            createdAtGt,
            createdAtLt,
            updatedAtGt,
            updatedAtLt
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Assistants', value: 'assistants' });
        }

        const params = {};

        if (orgId) {
            params.orgId = orgId;
        }

        if (createdAtGt) {
            params.createdAtGt = new Date(createdAtGt).toISOString();
        }

        if (createdAtLt) {
            params.createdAtLt = new Date(createdAtLt).toISOString();
        }

        if (updatedAtGt) {
            params.updatedAtGt = new Date(updatedAtGt).toISOString();
        }

        if (updatedAtLt) {
            params.updatedAtLt = new Date(updatedAtLt).toISOString();
        }

        // https://docs.vapi.ai/api-reference/assistants/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.vapi.ai/assistant',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params
        });

        const records = Array.isArray(data) ? data : [];

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
