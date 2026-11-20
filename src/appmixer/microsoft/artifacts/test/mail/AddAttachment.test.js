const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../../test/utils.js');
const AddAttachment = require('../../../mail/AddAttachment/AddAttachment.js');
const DeleteEmail = require('../../../mail/DeleteEmail/DeleteEmail.js');

describe('AddAttachment', function() {

    let context;

    function setFile(content, filename = 'report.txt', contentType = 'text/plain') {
        context.getFileInfo = sinon.stub().resolves({ filename, contentType, length: content.length });
        context.loadFile = sinon.stub().resolves(content);
    }

    beforeEach(function() {
        context = testUtils.createMockContext();
        context.messages = { in: { content: { messageId: 'msg-1', fileId: 'file-1' } } };
    });

    it('requires Message ID and File ID', async function() {
        context.messages.in.content = { fileId: 'file-1' };
        await assert.rejects(AddAttachment.receive(context), /Message ID is required/);
        context.messages.in.content = { messageId: 'msg-1' };
        await assert.rejects(AddAttachment.receive(context), /File ID is required/);
        assert.equal(context.httpRequest.callCount, 0);
    });

    it('posts a small file as base64 contentBytes and omits contentBytes from the output', async function() {
        setFile(Buffer.from('Hello'));
        context.messages.in.content.fileName = 'renamed.txt';
        context.httpRequest.resolves({
            data: { id: 'att-1', name: 'renamed.txt', contentType: 'text/plain', size: 5, isInline: false, contentBytes: 'SGVsbG8=' }
        });

        await AddAttachment.receive(context);

        const request = context.httpRequest.firstCall.args[0];
        assert.equal(request.method, 'POST');
        assert.equal(request.url, 'https://graph.microsoft.com/v1.0/me/messages/msg-1/attachments');
        assert.deepEqual(request.data, {
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: 'renamed.txt',
            contentType: 'text/plain',
            contentBytes: 'SGVsbG8='
        });
        const output = context.sendJson.firstCall.args[0];
        assert.equal(output.id, 'att-1');
        assert.equal(output.contentBytes, undefined);
        assert.equal(context.sendJson.firstCall.args[1], 'out');
    });

    it('uploads a file of 3 MB or more in chunks through an upload session', async function() {
        const size = AddAttachment.CHUNK_SIZE_BYTES + 100;
        setFile(Buffer.alloc(size, 1), 'big.bin', 'application/octet-stream');

        context.httpRequest.onCall(0).resolves({ data: { uploadUrl: 'https://outlook.office.com/upload?token=x' } });
        context.httpRequest.onCall(1).resolves({ status: 200, data: {}, headers: {} });
        context.httpRequest.onCall(2).resolves({
            status: 201,
            data: '',
            headers: { location: "https://outlook.office.com/api/v2.0/Users('u')/Messages('msg-1')/Attachments('att-big')" }
        });
        context.httpRequest.onCall(3).resolves({
            data: { id: 'att-big', name: 'big.bin', contentType: 'application/octet-stream', size, isInline: false }
        });

        await AddAttachment.receive(context);

        const session = context.httpRequest.getCall(0).args[0];
        assert.equal(session.url, 'https://graph.microsoft.com/v1.0/me/messages/msg-1/attachments/createUploadSession');
        assert.deepEqual(session.data, {
            AttachmentItem: { attachmentType: 'file', name: 'big.bin', size, contentType: 'application/octet-stream' }
        });

        const chunk = AddAttachment.CHUNK_SIZE_BYTES;
        const first = context.httpRequest.getCall(1).args[0];
        assert.equal(first.method, 'PUT');
        assert.equal(first.url, 'https://outlook.office.com/upload?token=x');
        assert.equal(first.headers['Content-Range'], `bytes 0-${chunk - 1}/${size}`);
        assert.equal(first.headers.Authorization, undefined);
        const second = context.httpRequest.getCall(2).args[0];
        assert.equal(second.headers['Content-Range'], `bytes ${chunk}-${size - 1}/${size}`);
        assert.equal(second.data.length, size - chunk);

        const get = context.httpRequest.getCall(3).args[0];
        assert.equal(get.url, 'https://graph.microsoft.com/v1.0/me/messages/msg-1/attachments/att-big');
        assert.equal(context.sendJson.firstCall.args[0].id, 'att-big');
    });

    it('rejects a file above 150 MB before loading it', async function() {
        setFile(Buffer.from('x'));
        context.getFileInfo.resolves({ filename: 'huge.bin', length: 151 * 1024 * 1024 });
        await assert.rejects(AddAttachment.receive(context), /up to 150 MB/);
        assert.equal(context.loadFile.callCount, 0);
    });
});

describe('DeleteEmail', function() {

    it('deletes the message and sends an empty object', async function() {
        const context = testUtils.createMockContext();
        context.messages = { in: { content: { messageId: 'msg-1' } } };
        context.httpRequest.resolves({ status: 204, data: '' });

        await DeleteEmail.receive(context);

        const request = context.httpRequest.firstCall.args[0];
        assert.equal(request.method, 'DELETE');
        assert.equal(request.url, 'https://graph.microsoft.com/v1.0/me/messages/msg-1');
        assert.deepEqual(context.sendJson.firstCall.args, [{}, 'out']);
    });

    it('requires Message ID', async function() {
        const context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
        await assert.rejects(DeleteEmail.receive(context), /Message ID is required/);
    });
});
