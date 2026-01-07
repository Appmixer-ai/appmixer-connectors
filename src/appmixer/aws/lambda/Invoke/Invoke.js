'use strict';

const { InvokeCommand } = require('@aws-sdk/client-lambda');
const lib = require('../lib');

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

        const { lambda } = lib.init(context);

        // Handle payload - SDK v3 requires Buffer or Uint8Array
        let payloadBuffer;
        if (payload !== undefined && payload !== null) {
            if (typeof payload === 'string') {
                payloadBuffer = Buffer.from(payload, 'utf-8');
            } else if (Buffer.isBuffer(payload)) {
                payloadBuffer = payload;
            } else {
                // Assume it's an object that needs to be serialized
                payloadBuffer = Buffer.from(JSON.stringify(payload), 'utf-8');
            }
        }

        const params = {
            FunctionName: name,
            InvocationType: invocationType,
            // See https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html for clientContext usage.
            ClientContext: clientContext,
            LogType: logType,
            Payload: payloadBuffer,
            Qualifier: qualifier
        };
        try {
            const response = await lambda.send(new InvokeCommand(params));

            // In SDK v3, Payload is a Uint8Array, convert to string using Buffer for Node.js compatibility
            const PayloadString = response.Payload
                ? Buffer.from(response.Payload).toString('utf-8')
                : null;

            return context.sendJson({
                ExecutedVersion: response.ExecutedVersion,
                FunctionError: response.FunctionError,
                LogResult: response.LogResult,
                Payload: PayloadString,
                StatusCode: response.StatusCode
            }, 'out');
        } catch (error) {
            // Re-throw with just the error message. Otherwise a
            // [unable to serialize, circular reference is too complex to analyze]
            // error is thrown.
            throw new Error(error.message);
        }
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
