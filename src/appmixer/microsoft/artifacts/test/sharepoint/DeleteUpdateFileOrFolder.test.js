'use strict';

const assert = require('assert');
const sinon = require('sinon');

const DeleteFileOrFolder = require('../../../sharepoint/DeleteFileOrFolder/DeleteFileOrFolder');
const UpdateFileOrFolder = require('../../../sharepoint/UpdateFileOrFolder/UpdateFileOrFolder');

class CancelError extends Error {}

const DRIVE_ID = 'b!BxU-FIqjQUqH2il5TIEBG0HSUairrrVDhCbcjMh-k1HpggReNXwPS6zVg-Y8qiuC';
const ITEM_ID = '01BYE5RZ6QN3ZWBTUFOFD3GSPGOHDJD36K';

describe('Microsoft SharePoint DeleteFileOrFolder and UpdateFileOrFolder', () => {

    let context;

    const run = (component, content) => {
        context.messages = { in: { content } };
        return component.receive(context);
    };

    beforeEach(() => {
        context = {
            auth: { accessToken: 'test-token' },
            CancelError,
            httpRequest: sinon.stub().resolves({ status: 204, data: '' }),
            sendJson: sinon.stub().resolves()
        };
    });

    describe('DeleteFileOrFolder', () => {

        it('should DELETE the item in the given drive and send {}', async () => {

            await run(DeleteFileOrFolder, { siteId: 'site-1', driveId: DRIVE_ID, itemId: ITEM_ID });

            sinon.assert.calledOnce(context.httpRequest);
            const req = context.httpRequest.firstCall.args[0];
            assert.strictEqual(req.method, 'DELETE');
            assert.strictEqual(req.url, `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${ITEM_ID}`);
            assert.strictEqual(req.headers.Authorization, 'Bearer test-token');
            sinon.assert.calledOnceWithExactly(context.sendJson, {}, 'out');
        });

        it('should cancel without a Drive ID or an Item ID', async () => {

            await assert.rejects(run(DeleteFileOrFolder, { itemId: ITEM_ID }), CancelError);
            await assert.rejects(run(DeleteFileOrFolder, { driveId: DRIVE_ID }), CancelError);
            sinon.assert.notCalled(context.httpRequest);
        });

        it('should propagate a failed Graph call', async () => {

            context.httpRequest.rejects(new Error('Request failed with status code 404'));
            await assert.rejects(run(DeleteFileOrFolder, { driveId: DRIVE_ID, itemId: ITEM_ID }), /404/);
            sinon.assert.notCalled(context.sendJson);
        });
    });

    describe('UpdateFileOrFolder', () => {

        it('should PATCH only the name when no target folder is given and send {}', async () => {

            await run(UpdateFileOrFolder, { driveId: DRIVE_ID, itemId: ITEM_ID, newName: 'renamed.txt' });

            const req = context.httpRequest.firstCall.args[0];
            assert.strictEqual(req.method, 'PATCH');
            assert.strictEqual(req.url, `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${ITEM_ID}`);
            assert.deepStrictEqual(req.data, { name: 'renamed.txt' });
            sinon.assert.calledOnceWithExactly(context.sendJson, {}, 'out');
        });

        it('should move the item when a target folder is given', async () => {

            await run(UpdateFileOrFolder, { driveId: DRIVE_ID, itemId: ITEM_ID, newName: 'renamed.txt', folderId: 'folder-1' });

            assert.deepStrictEqual(context.httpRequest.firstCall.args[0].data, {
                name: 'renamed.txt',
                parentReference: { id: 'folder-1' }
            });
        });

        it('should cancel without a Drive ID, an Item ID or a New Name', async () => {

            await assert.rejects(run(UpdateFileOrFolder, { itemId: ITEM_ID, newName: 'a.txt' }), CancelError);
            await assert.rejects(run(UpdateFileOrFolder, { driveId: DRIVE_ID, newName: 'a.txt' }), CancelError);
            await assert.rejects(run(UpdateFileOrFolder, { driveId: DRIVE_ID, itemId: ITEM_ID }), CancelError);
            sinon.assert.notCalled(context.httpRequest);
        });
    });
});
