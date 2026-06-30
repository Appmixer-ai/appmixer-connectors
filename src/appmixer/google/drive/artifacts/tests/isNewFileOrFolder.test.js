'use strict';

const assert = require('assert');
const { isNewFileOrFolder } = require('../../NewFileOrFolder/NewFileOrFolder');

describe('google.drive.NewFileOrFolder', () => {

    describe('isNewFileOrFolder', () => {

        it('should detect new file from shared folder (no viewedByMeTime)', () => {

            const change = {
                file: {
                    parents: [
                        '1CR4Cq5L3NW4EdcVUu2QlJPX0QV3a6Kuu'
                    ],
                    kind: 'drive#file',
                    id: '1XMd5dC3cWhtjrhK4cdaluUTVZmX1eRxQ',
                    name: 'Kopie souboru Kopie souboru 15_Post Use Node.js.txt',
                    mimeType: 'text/plain',
                    starred: false,
                    trashed: false,
                    explicitlyTrashed: false,
                    version: '3',
                    viewedByMe: false,
                    createdTime: '2025-12-11T10:48:44.135Z',
                    modifiedTime: '2025-12-11T10:48:44.135Z',
                    modifiedByMe: false,
                    shared: true,
                    ownedByMe: false,
                    viewersCanCopyContent: true,
                    copyRequiresWriterPermission: false,
                    writersCanShare: true,
                    originalFilename: 'Kopie souboru Kopie souboru 15_Post Use Node.js.txt',
                    fullFileExtension: 'js.txt',
                    fileExtension: 'txt',
                    md5Checksum: '8610bbd4d24db5bdf1c571ea8022dbad',
                    sha1Checksum: 'f7372992fb24cb859b2ee61387cab8dbd660cdcb',
                    sha256Checksum: '95536c1fe4c1802859efc9fac11182f85a031e65a538c130aa3e891f9d71a181',
                    size: '308',
                    quotaBytesUsed: '308',
                    headRevisionId: '0B_biKojru1jjOGZlNnlnaEZZaGtnQ1MwdE9lRlY4VytrWmpRPQ',
                    isAppAuthorized: false,
                    inheritedPermissionsDisabled: false
                },
                kind: 'drive#change',
                type: 'file',
                changeType: 'file',
                time: '2025-12-11T10:49:03.748Z',
                removed: false,
                fileId: '1XMc5dC3cWhtjrhK4cdaluUTVZmX1eRxQ'
            };

            assert.strictEqual(isNewFileOrFolder(change), true);
        });

        it('should NOT detect viewed file as new (has viewedByMeTime)', () => {

            const change = {
                file: {
                    parents: [
                        '1CR4Cq5L3NW4EdcVUu2QlJPX0QV3a6Kuu'
                    ],
                    kind: 'drive#file',
                    id: '1XMd5dC3cWhtjrhK4cdaluUTVZmX1eRxQ',
                    name: 'Kopie souboru Kopie souboru 15_Post Use Node.js.txt',
                    mimeType: 'text/plain',
                    starred: false,
                    trashed: false,
                    explicitlyTrashed: false,
                    version: '3',
                    viewedByMe: true,
                    viewedByMeTime: '2025-12-11T10:48:44.135Z',
                    createdTime: '2025-12-11T10:48:44.135Z',
                    modifiedTime: '2025-12-11T10:48:44.135Z',
                    modifiedByMeTime: '2025-12-11T10:48:44.135Z',
                    modifiedByMe: true,
                    shared: true,
                    ownedByMe: true,
                    viewersCanCopyContent: true,
                    copyRequiresWriterPermission: false,
                    writersCanShare: true,
                    originalFilename: 'Kopie souboru Kopie souboru 15_Post Use Node.js.txt',
                    fullFileExtension: 'js.txt',
                    fileExtension: 'txt',
                    md5Checksum: '8610bbd4d24db5bdf1c571ea8022dbad',
                    sha1Checksum: 'f7372992fb24cb859b2ee61387cab8dbd660cdcb',
                    sha256Checksum: '95536c1fe4c1802859efc9fac11182f85a031e65a538c130aa3e891f9d71a181',
                    size: '308',
                    quotaBytesUsed: '308',
                    headRevisionId: '0B_biKojru1jjOGZlNnlnaEZZaGtnQ1MwdE9lRlY4VytrWmpRPQ',
                    isAppAuthorized: false,
                    inheritedPermissionsDisabled: false
                },
                kind: 'drive#change',
                type: 'file',
                changeType: 'file',
                time: '2025-12-11T10:49:06.646Z',
                removed: false,
                fileId: '1XMc5dC3cWhtjrhK4cdaluUTVZmX1eRxQ'
            };

            assert.strictEqual(isNewFileOrFolder(change), true);
        });

        it('should return false for removed files', () => {

            const change = {
                file: {
                    createdTime: '2025-12-11T10:48:44.135Z',
                    modifiedTime: '2025-12-11T10:48:44.135Z'
                },
                changeType: 'file',
                removed: true
            };

            assert.strictEqual(isNewFileOrFolder(change), false);
        });

        it('should return false for trashed files', () => {

            const change = {
                file: {
                    createdTime: '2025-12-11T10:48:44.135Z',
                    modifiedTime: '2025-12-11T10:48:44.135Z',
                    trashed: true
                },
                changeType: 'file',
                removed: false
            };

            assert.strictEqual(isNewFileOrFolder(change), false);
        });

        it('should return false when file is missing', () => {

            const change = {
                file: null,
                changeType: 'file',
                removed: false
            };

            assert.strictEqual(isNewFileOrFolder(change), false);
        });

        it('should return false for non-file changes', () => {

            const change = {
                file: {
                    createdTime: '2025-12-11T10:48:44.135Z',
                    modifiedTime: '2025-12-11T10:48:44.135Z'
                },
                changeType: 'folder',
                removed: false
            };

            assert.strictEqual(isNewFileOrFolder(change), false);
        });

        it('should return false when createdTime is invalid', () => {

            const change = {
                file: {
                    createdTime: 'invalid-date',
                    modifiedTime: '2025-12-11T10:48:44.135Z'
                },
                changeType: 'file',
                removed: false
            };

            assert.strictEqual(isNewFileOrFolder(change), false);
        });

        it('should return false when file is modified after creation', () => {

            const change = {
                file: {
                    createdTime: '2025-12-11T10:48:44.135Z',
                    modifiedTime: '2025-12-11T11:00:00.000Z'
                },
                changeType: 'file',
                removed: false
            };

            assert.strictEqual(isNewFileOrFolder(change), false);
        });
    });
});
