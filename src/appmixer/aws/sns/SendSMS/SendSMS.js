'use strict';
const commons = require('../../aws-commons');

/**
 * Sends a text message (SMS message) directly to a phone number.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { type, phoneNumber, message, senderId } = context.messages.in.content;
        if (!type) {
            throw new context.CancelError('Message Type. is required');
        }

        if (!phoneNumber) {
            throw new context.CancelError('Phone Number. is required');
        }

        if (!message) {
            throw new context.CancelError('Message. is required');
        }


        const { sns } = commons.init(context);

        const messageAttributes = {
            DefaultSMSType: {
                DataType: 'String',
                StringValue: type
            }
        };

        if (senderId) {
            messageAttributes['SenderID'] = {
                DataType: 'String',
                StringValue: senderId
            };
        }

        const result = await sns.publish({
            PhoneNumber: phoneNumber,
            Message: message,
            MessageAttributes: messageAttributes
        }).promise();

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
