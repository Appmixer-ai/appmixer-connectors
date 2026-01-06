'use strict';

const { PublishCommand } = require('@aws-sdk/client-sns');
const commons = require('../../aws-commons');

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

        const { sns } = commons.init(context);

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
    }
};
