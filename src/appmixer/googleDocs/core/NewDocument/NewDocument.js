'use strict';

const GOOGLE_DOCS_MIME_TYPE = 'application/vnd.google-apps.document';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const FOLDER_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetches all subfolder IDs for a given folder using batched breadth-first traversal.
 * @param {Object} context - Appmixer context
 * @param {string} folderId - Parent folder ID
 * @returns {Promise<string[]>} Array of all subfolder IDs
 */
async function getSubfolderIds(context, folderId) {

    const allFolderIds = [];
    let foldersToProcess = [folderId];

    while (foldersToProcess.length > 0) {
        const batch = foldersToProcess.splice(0, 10);

        const batchResults = await Promise.all(
            batch.map(async (parentId) => {
                const { data } = await context.httpRequest({
                    method: 'GET',
                    url: 'https://www.googleapis.com/drive/v3/files',
                    params: {
                        q: `'${parentId}' in parents and mimeType='${FOLDER_MIME_TYPE}' and trashed=false`,
                        fields: 'files(id)',
                        pageSize: 1000
                    },
                    headers: {
                        'Authorization': `Bearer ${context.auth.accessToken}`
                    }
                });
                return data.files || [];
            })
        );

        for (const files of batchResults) {
            for (const folder of files) {
                allFolderIds.push(folder.id);
                foldersToProcess.push(folder.id);
            }
        }
    }

    return allFolderIds;
}

/**
 * Gets the list of folder IDs to monitor, with caching for recursive mode.
 * @param {Object} context - Appmixer context
 * @param {string} folderId - Root folder ID
 * @param {boolean} recursive - Whether to include subfolders
 * @returns {Promise<string[]>} Array of folder IDs to monitor
 */
async function getMonitoredFolderIds(context, folderId, recursive) {

    if (!folderId) {
        return [];
    }

    if (!recursive) {
        return [folderId];
    }

    const cacheKey = `googledocs_subfolders_${folderId}`;
    const cached = await context.staticCache.get(cacheKey);

    if (cached) {
        return cached;
    }

    const subfolderIds = await getSubfolderIds(context, folderId);
    const folderIds = [folderId, ...subfolderIds];
    await context.staticCache.set(cacheKey, folderIds, FOLDER_CACHE_TTL_MS);

    return folderIds;
}

/**
 * Fetches Google Docs documents from Drive API.
 * @param {Object} context - Appmixer context
 * @param {string} folderId - Folder ID to filter by (non-recursive mode only)
 * @param {boolean} recursive - Whether recursive mode is enabled
 * @returns {Promise<Object[]>} Array of document objects
 */
async function fetchDocuments(context, folderId, recursive) {

    let query = `mimeType='${GOOGLE_DOCS_MIME_TYPE}' and trashed=false`;
    if (folderId && !recursive) {
        query += ` and '${folderId}' in parents`;
    }

    const { data } = await context.httpRequest({
        method: 'GET',
        url: 'https://www.googleapis.com/drive/v3/files',
        params: {
            q: query,
            fields: 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink,owners,lastModifyingUser,parents)',
            orderBy: 'createdTime desc',
            pageSize: 100
        },
        headers: {
            'Authorization': `Bearer ${context.auth.accessToken}`
        }
    });

    return data.files || [];
}

/**
 * Filters documents to only include those in monitored folders.
 * @param {Object[]} documents - Array of document objects
 * @param {string[]} folderIds - Array of monitored folder IDs
 * @returns {Object[]} Filtered array of documents
 */
function filterByFolders(documents, folderIds) {

    if (!folderIds.length) {
        return documents;
    }

    return documents.filter(doc =>
        doc.parents?.some(parentId => folderIds.includes(parentId))
    );
}

/**
 * Identifies new documents by comparing with known IDs.
 * @param {Object[]} documents - Array of document objects
 * @param {Set|null} knownIds - Set of previously known document IDs, or null for first run
 * @returns {{ newDocs: Object[], currentIds: string[] }} New documents and current ID list
 */
function identifyNewDocuments(documents, knownIds) {

    const newDocs = [];
    const currentIds = [];

    for (const doc of documents) {
        currentIds.push(doc.id);
        if (knownIds && !knownIds.has(doc.id)) {
            newDocs.push(doc);
        }
    }

    return { newDocs, currentIds };
}

module.exports = {

    async tick(context) {

        let lock;
        try {
            lock = await context.lock(context.componentId, {
                ttl: 5 * 60 * 1000,
                maxRetryCount: 0
            });
        } catch (e) {
            return; // Another tick is already running
        }

        try {
            const { folder = {}, recursive } = context.properties;
            const folderId = typeof folder === 'string' ? folder : folder.id;

            const state = await context.loadState();
            const knownIds = state.known ? new Set(state.known) : null;

            const folderIds = await getMonitoredFolderIds(context, folderId, recursive);
            let documents = await fetchDocuments(context, folderId, recursive);

            if (folderId && recursive) {
                documents = filterByFolders(documents, folderIds);
            }

            const { newDocs, currentIds } = identifyNewDocuments(documents, knownIds);

            for (const doc of newDocs) {
                await context.sendJson(doc, 'out');
            }

            await context.saveState({ ...state, known: currentIds });
        } finally {
            lock?.unlock();
        }
    }
};
