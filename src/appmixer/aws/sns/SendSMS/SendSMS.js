'use strict';

const { PublishCommand } = require('@aws-sdk/client-sns');
const lib = require('../lib');

/**
 * Sends a text message (SMS message) directly to a phone number.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { type, phoneNumber, message, senderId } = context.messages.in.content;
        if (!type) {
            throw new context.CancelError('Message Type is required');
        }

        if (!phoneNumber) {
            throw new context.CancelError('Phone Number is required');
        }

        if (!message) {
            throw new context.CancelError('Message is required');
        }

        const { sns } = lib.init(context);

        const messageAttributes = {
            'AWS.SNS.SMS.SMSType': {
                DataType: 'String',
                StringValue: type
            }
        };

        if (senderId) {
            messageAttributes['AWS.SNS.SMS.SenderID'] = {
                DataType: 'String',
                StringValue: senderId
            };
        }

        try {
            const result = await sns.send(new PublishCommand({
                PhoneNumber: phoneNumber,
                Message: message,
                MessageAttributes: messageAttributes
            }));

            const object = {
                MessageID: result.MessageId,
                SMSType: type,
                PhoneNumber: phoneNumber,
                Message: message,
                SenderID: senderId
            };

            return context.sendJson(object, 'sms');
        } catch (error) {
            // Re-throw with just the error message. Otherwise a
            // [unable to serialize, circular reference is too complex to analyze]
            // error is thrown.
            throw new Error(error.message);
        }
    }
};
