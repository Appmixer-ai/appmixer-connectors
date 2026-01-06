'use strict';
const { InvokeCommand } = require('@aws-sdk/client-lambda');
const commons = require('../../aws-commons');

/**
 * Invoke Lambda function.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        if (context.properties.generateOutputPortOptions) {
            return this.getOutputPortOptions(context, context.messages.in.content.invocationType);
        }

        const { region, name, invocationType, clientContext, logType, payload, qualifier } =
            context.messages.in.content;
        if (!region) {
            throw new context.CancelError('Region is required');
        }

        if (!name) {
            throw new context.CancelError('FunctionName is required');
        }

        const { lambda } = commons.init(context);

        const params = {
            FunctionName: name,
            InvocationType: invocationType,
            // See https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html for clientContext usage.
            ClientContext: clientContext,
            LogType: logType,
            Payload: payload ? Buffer.from(JSON.stringify(payload)) : undefined,
            Qualifier: qualifier
        };
        const response = await lambda.send(new InvokeCommand(params));

        // In SDK v3, Payload is a Uint8Array, convert to string
        const PayloadString = response.Payload ? new TextDecoder().decode(response.Payload) : null;

        return context.sendJson({
            ExecutedVersion: response.ExecutedVersion,
            FunctionError: response.FunctionError,
            LogResult: response.LogResult,
            Payload: PayloadString,
            StatusCode: response.StatusCode
        }, 'out');
    },

    getOutputPortOptions(context, invocationType) {

        if (invocationType === 'Event' || invocationType === 'DryRun') {
            return context.sendJson([{ 'label': 'StatusCode', 'value': 'StatusCode' }], 'out');
        } else {
            // RequestResponse
            return context.sendJson([
                { 'label': 'StatusCode', 'value': 'StatusCode' },
                { 'label': 'FunctionError', 'value': 'FunctionError' },
                { 'label': 'LogResult', 'value': 'LogResult' },
                { 'label': 'Payload', 'value': 'Payload' },
                { 'label': 'ExecutedVersion', 'value': 'ExecutedVersion' }
            ], 'out');
        }
    }
};
