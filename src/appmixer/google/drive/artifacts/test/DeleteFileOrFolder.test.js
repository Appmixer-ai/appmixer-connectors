'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { google } = require('googleapis');
const component = require('../../DeleteFileOrFolder/DeleteFileOrFolder');

describe('google.drive DeleteFileOrFolder', () => {

    let sandbox;
    let deleteStub;
    let updateStub;
    let context;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        deleteStub = sandbox.stub().resolves({});
        updateStub = sandbox.stub().resolves({ data: { id: 'picked' } });
        sandbox.stub(google, 'drive').returns({ files: { delete: deleteStub, update: updateStub } });
        context = {
            auth: { accessToken: 'test-token', clientId: 'test-id', clientSecret: 'test-secret' },
            messages: { in: { content: {} } },
            sendJson: sandbox.stub().resolves(),
            CancelError: class CancelError extends Error {}
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should emit the declared googleDriveFileId and the historical fileId', async () => {

        context.messages.in.content = { fileId: 'abc123' };

        await component.receive(context);

        assert.deepStrictEqual(deleteStub.firstCall.args[0], { fileId: 'abc123' });
        assert.deepStrictEqual(context.sendJson.firstCall.args, [{ googleDriveFileId: 'abc123', fileId: 'abc123' }, 'out']);
    });

    it('should accept the Google Picker object shape', async () => {

        context.messages.in.content = { fileId: { id: 'picked', name: 'x.txt' } };

        await component.receive(context);

        assert.deepStrictEqual(deleteStub.firstCall.args[0], { fileId: 'picked' });
    });

    it('should move the file to the trash instead of deleting it when moveToTrash is on', async () => {

        context.messages.in.content = { fileId: { id: 'picked' }, moveToTrash: true };

        await component.receive(context);

        assert.strictEqual(deleteStub.callCount, 0);
        assert.deepStrictEqual(updateStub.firstCall.args[0], { fileId: 'picked', resource: { trashed: true }, fields: 'id' });
        assert.deepStrictEqual(context.sendJson.firstCall.args, [{ googleDriveFileId: 'picked', fileId: 'picked' }, 'out']);
    });

    it('should delete permanently when moveToTrash is off', async () => {

        context.messages.in.content = { fileId: 'abc123', moveToTrash: false };

        await component.receive(context);

        assert.strictEqual(updateStub.callCount, 0);
        assert.strictEqual(deleteStub.callCount, 1);
    });

    it('should reject a missing file ID before calling the API', async () => {

        await assert.rejects(() => component.receive(context), context.CancelError);
        assert.strictEqual(deleteStub.callCount, 0);
    });
});
