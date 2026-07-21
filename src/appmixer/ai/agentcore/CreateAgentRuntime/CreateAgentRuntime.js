'use strict';

const { CreateAgentRuntimeCommand } = require('@aws-sdk/client-bedrock-agentcore-control');
const lib = require('../lib');

module.exports = {

    async receive(context) {

        const {
            agentRuntimeName,
            containerUri,
            roleArn,
            networkMode,
            serverProtocol,
            description,
            environmentVariables
        } = context.messages.in.content;

        if (!agentRuntimeName) {
            throw new context.CancelError('Name is required!');
        }
        if (!containerUri) {
            throw new context.CancelError('Container Image URI is required!');
        }
        if (!roleArn) {
            throw new context.CancelError('Role ARN is required!');
        }

        const { controlClient } = lib.init(context);

        const params = {
            agentRuntimeName,
            agentRuntimeArtifact: {
                containerConfiguration: { containerUri }
            },
            roleArn,
            networkConfiguration: { networkMode: networkMode || 'PUBLIC' }
        };
        if (serverProtocol) {
            params.protocolConfiguration = { serverProtocol };
        }
        if (description) {
            params.description = description;
        }
        if (environmentVariables) {
            params.environmentVariables = typeof environmentVariables === 'string'
                ? JSON.parse(environmentVariables)
                : environmentVariables;
        }

        const response = await controlClient.send(new CreateAgentRuntimeCommand(params));

        return context.sendJson({
            agentRuntimeId: response.agentRuntimeId,
            agentRuntimeArn: response.agentRuntimeArn,
            agentRuntimeVersion: response.agentRuntimeVersion,
            status: response.status,
            createdAt: response.createdAt
        }, 'out');
    }
};
