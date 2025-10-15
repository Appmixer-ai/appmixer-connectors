'use strict';
const sinon = require('sinon');
const emailCommons = require('../../../lib');
const SendEmail = require('../../SendEmail');

describe('SendEmail', function() {

    const sandbox = sinon.createSandbox();

    afterEach(function() {
        sandbox.restore();
    });

    it('should send the email and apply labels', async function() {

        const addAttachmentsStub = sandbox.stub(emailCommons, 'addAttachments').resolves([{ filename: 'file.txt' }]);
        const addSignatureStub = sandbox.stub(emailCommons, 'addSignature');
        const buildEmailStub = sandbox.stub(emailCommons, 'buildEmail').resolves(Buffer.from('raw-email'));
        const callEndpointStub = sandbox.stub(emailCommons, 'callEndpoint');

        callEndpointStub.onFirstCall().resolves({ data: { id: '123' } });
        callEndpointStub.onSecondCall().resolves();

        const sendJsonStub = sandbox.stub().resolves();

        const context = {
            profileInfo: { email: 'sender@example.com' },
            messages: {
                in: {
                    content: {
                        to: 'recipient@example.com',
                        cc: 'cc@example.com',
                        bcc: 'bcc@example.com',
                        subject: 'Hello',
                        text: 'Body',
                        signature: 'Regards',
                        labels: {
                            AND: [{ name: 'Label_1' }, { name: '' }]
                        },
                        attachments: { file1: 'data' }
                    }
                }
            },
            sendJson: sendJsonStub
        };

        await SendEmail.receive(context);

        sinon.assert.calledOnceWithExactly(addAttachmentsStub, context, { file1: 'data' });
        sinon.assert.calledOnce(addSignatureStub);

        const mailArg = buildEmailStub.firstCall.args[0];
        sinon.assert.match(mailArg, {
            from: 'sender@example.com',
            to: 'recipient@example.com',
            cc: 'cc@example.com',
            bcc: 'bcc@example.com',
            subject: 'Hello',
            text: 'Body',
            attachments: [{ filename: 'file.txt' }]
        });

        sinon.assert.calledTwice(callEndpointStub);
        sinon.assert.match(callEndpointStub.firstCall.args, [
            context,
            '/users/me/messages/send',
            sinon.match({ method: 'POST', headers: { 'Content-Type': 'application/json' }, data: sinon.match.object })
        ]);

        sinon.assert.match(callEndpointStub.secondCall.args, [
            context,
            '/users/me/messages/123/modify',
            sinon.match({ data: { addLabelIds: ['Label_1'] } })
        ]);

        sinon.assert.calledOnceWithExactly(sendJsonStub, { id: '123' }, 'email');
    });
});
