'use strict';

const FormData = require('form-data');
const componentTool = require('../tool');
const agentModule = require('../agent');
const memory = require('../memory');
const lib = require('../lib');

function getKnowledgebaseApiUrl(context) {
    const base = context.config.knowledgebaseApi || 'https://charismatic-charisma-production.up.railway.app';
    return base.replace(/\/$/, '');
}

async function ingestFile(context, kbFileId) {
    const fileInfo = await context.getFileInfo(kbFileId);
    const content = await context.loadFile(kbFileId);

    const form = new FormData();
    form.append('file', content, {
        filename: fileInfo.filename,
        contentType: fileInfo.contentType || 'application/octet-stream'
    });
    form.append('docId', kbFileId);

    await context.httpRequest({
        url: `${getKnowledgebaseApiUrl(context)}/knowledgebases/${context.componentId}/ingest`,
        method: 'POST',
        data: form,
        headers: form.getHeaders()
    });

    await context.log({ step: 'knowledgebase-ingest', fileId: kbFileId, filename: fileInfo.filename });
}

async function retrieveChunks(context, prompt, topK = 10) {
    const { data } = await context.httpRequest({
        url: `${getKnowledgebaseApiUrl(context)}/knowledgebases/${context.componentId}/retrieve`,
        method: 'POST',
        data: { input: prompt, topK }
    });
    return data?.results || [];
}

async function deleteKnowledgebase(context) {
    await context.httpRequest({
        url: `${getKnowledgebaseApiUrl(context)}/knowledgebases/${context.componentId}`,
        method: 'DELETE'
    });
    await context.log({ step: 'knowledgebase-delete', knowledgebaseId: context.componentId });
}

function getKbFileIds(context) {
    return ((context.properties.knowledgebase?.ADD) || [])
        .map(item => item?.fileId || null)
        .filter(Boolean);
}

module.exports = {

    stop: async function(context) {
        const kbFileIds = getKbFileIds(context);
        if (kbFileIds.length > 0) {
            try {
                await deleteKnowledgebase(context);
            } catch (err) {
                await context.log({ step: 'knowledgebase-delete-error', error: err.message });
            }
        }
    },

    start: async function(context) {
        await componentTool.collectComponentTools(context);

        const kbFileIds = getKbFileIds(context);
        for (const fileId of kbFileIds) {
            try {
                await ingestFile(context, fileId);
            } catch (err) {
                await context.log({ step: 'knowledgebase-ingest-error', fileId, error: err.message });
            }
        }
    },

    receive: async function(context) {

        await lib.publishChatProgressEvent(context, 'start', 'Thinking...');

        const receiveStart = Date.now();
        const { prompt, storeId, threadId, fileId } = context.messages.in.content;

        if (!prompt) {
            throw new context.CancelError('Prompt is required');
        }

        const componentToolsDef = await componentTool.buildComponentToolDefs(context);

        let memoryData = {};
        if (threadId) {
            memoryData = await memory.loadMemory(context, storeId, threadId);
        }

        let instructions = context.properties.instructions || 'You are a helpful assistant.';

        const kbFileIds = getKbFileIds(context);
        if (kbFileIds.length > 0) {
            const chunks = await retrieveChunks(context, prompt);
            if (chunks.length > 0) {
                const contextBlock = chunks
                    .map(c => `[Source: ${c.doc}]\n${c.text}`)
                    .join('\n\n---\n\n');
                instructions += `\n\n## Knowledgebase\n\n
                    Answer using the retrieved context below.
                    If the answer is not in the context, say so.
                    If the answer is in the context,
                    do not mention that you used the knowledgebase as a context,
                    just answer directly with the information provided.\n\n
                    ${contextBlock}`;
            }
        }

        const agentTimeStart = Date.now();

        const response = await agentModule.agent(
            context,
            instructions,
            prompt,
            fileId,
            componentToolsDef,
            memoryData
        );

        await context.log({ step: 'agent-response', latency: Date.now() - agentTimeStart });

        if (threadId) {
            const newMessages = response.messages;
            await memory.appendMessages(context, storeId, threadId, newMessages);
            memoryData.messages = memoryData.messages.concat(newMessages);
            await memory.saveMemory(context, storeId, threadId, memoryData);
        }

        return context.sendJson({
            answer: response.answer,
            prompt,
            usage: await context.stateGet('usage'),
            time: Date.now() - receiveStart
        }, 'out');
    }
};
