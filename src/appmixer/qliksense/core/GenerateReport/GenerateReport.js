'use strict';

const lib = require('../../lib');

// Default and maximum wait for a report, in minutes (Qlik's export deadline is at most 4 hours).
const DEFAULT_TIMEOUT_MINUTES = 30;
const MAX_TIMEOUT_MINUTES = 240;
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;
const OUTPUT_ID = 'appmixer';

const FINAL_FAILED = ['failed', 'aborted'];

const EXTENSIONS = { pdf: 'pdf', pptx: 'pptx', png: 'png' };
const toPixels = (value, fallback) => {

    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
};

/**
 * The report request body. sense-sheet-1.0 renders a sheet (PDF or PPTX), sense-image-1.0 a single
 * visualization (PDF, PPTX or PNG); the output object must match the output type.
 * @param {object} input
 * @returns {object}
 */
const buildRequest = ({ appId, objectType, objectId, format, widthPx, heightPx, timeoutMinutes }) => {

    const output = { outputId: OUTPUT_ID };
    if (format === 'png') {
        output.type = 'image';
        output.imageOutput = { outFormat: 'png' };
    } else if (format === 'pptx') {
        output.type = 'pptx';
        output.pptxOutput = {};
    } else {
        output.type = 'pdf';
        output.pdfOutput = {};
    }

    const request = {
        output,
        meta: { exportDeadline: 'PT' + timeoutMinutes + 'M' }
    };
    if (objectType === 'visualization') {
        request.type = 'sense-image-1.0';
        request.senseImageTemplate = {
            appId,
            visualization: {
                id: objectId,
                type: 'visualization',
                widthPx: toPixels(widthPx, DEFAULT_WIDTH),
                heightPx: toPixels(heightPx, DEFAULT_HEIGHT)
            }
        };
    } else {
        const sheet = { id: objectId };
        if (widthPx) {
            sheet.widthPx = toPixels(widthPx, DEFAULT_WIDTH);
        }
        if (heightPx) {
            sheet.heightPx = toPixels(heightPx, DEFAULT_HEIGHT);
        }
        request.type = 'sense-sheet-1.0';
        request.senseSheetTemplate = { appId, sheet };
    }
    return request;
};

const exportErrorMessage = (outputs) => {

    const errors = [];
    for (const output of outputs) {
        for (const error of (output.exportErrors || [])) {
            errors.push([error.code, error.title, error.detail].filter(Boolean).join(': '));
        }
    }
    return errors.join('; ');
};

/**
 * Generate a report and save the file once it is done.
 *
 * The report is polled through a continuation chain (context.setTimeout). The Reports API also
 * offers a callback URI, but its request is not documented, so the component does not rely on it.
 */
module.exports = {

    buildRequest,

    async receive(context) {

        if (context.messages.timeout) {
            const job = context.messages.timeout.content;
            const { data: status } = await lib.apiRequest(context, {
                path: '/api/v1/reports/' + encodeURIComponent(job.reportId) + '/status'
            });

            if (status.status === 'done' || FINAL_FAILED.includes(status.status)) {
                const { data } = await lib.apiRequest(context, {
                    path: '/api/v1/reports/' + encodeURIComponent(job.reportId) + '/outputs'
                });
                const outputs = (data && data.data) || [];
                const output = outputs.find(item => item.outputId === OUTPUT_ID) || outputs[0];
                if (status.status !== 'done' || !output || output.status !== 'done' || !output.location) {
                    const detail = exportErrorMessage(outputs);
                    throw new context.CancelError('The report ' + job.reportId + ' failed (' + status.status + ')'
                        + (detail ? ': ' + detail : '.'));
                }
                // The download link points at the tenant; resolveApiUrl() refuses any other host.
                const url = lib.resolveApiUrl(context, output.location);
                const response = await lib.apiRequest(context, { url, responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data);
                const fileName = job.fileName + '.' + EXTENSIONS[job.format];
                const file = await context.saveFileStream(fileName, buffer);
                return context.sendJson({
                    fileId: file.fileId,
                    fileName,
                    fileSize: buffer.length,
                    reportId: job.reportId,
                    appId: job.appId,
                    objectId: job.objectId,
                    format: job.format
                }, 'out');
            }
            if (Date.now() >= job.deadline) {
                throw new context.CancelError('The report ' + job.reportId + ' was not ready within '
                    + job.timeoutMinutes + ' minutes (status ' + status.status + ').');
            }
            return context.setTimeout(job, lib.POLL_INTERVAL_MS);
        }

        const {
            appId, objectType, objectId, format, widthPx, heightPx, fileName, timeoutMinutes
        } = context.messages.in.content;
        if (!appId) {
            throw new context.CancelError('App is required!');
        }
        if (!objectType) {
            throw new context.CancelError('Export is required!');
        }
        if (!objectId) {
            throw new context.CancelError('Sheet or Visualization ID is required!');
        }
        if (!format || !EXTENSIONS[format]) {
            throw new context.CancelError('Format is required!');
        }
        if (format === 'png' && objectType !== 'visualization') {
            throw new context.CancelError('PNG is available for a visualization only. Export the sheet as PDF or PowerPoint.');
        }

        const minutes = Number(timeoutMinutes) > 0
            ? Math.min(Number(timeoutMinutes), MAX_TIMEOUT_MINUTES)
            : DEFAULT_TIMEOUT_MINUTES;
        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: '/api/v1/reports',
            data: buildRequest({ appId, objectType, objectId, format, widthPx, heightPx, timeoutMinutes: minutes })
        });
        if (!data || !data.requestId) {
            throw new context.CancelError('Qlik Cloud accepted the report but returned no request ID.');
        }

        return context.setTimeout({
            reportId: data.requestId,
            appId,
            objectId,
            format,
            fileName: fileName || objectId,
            deadline: lib.deadlineFrom(minutes, DEFAULT_TIMEOUT_MINUTES, MAX_TIMEOUT_MINUTES),
            timeoutMinutes: minutes
        }, lib.POLL_INTERVAL_MS);
    }
};
