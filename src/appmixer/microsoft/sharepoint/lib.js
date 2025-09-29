const { arrayBuffer } = require('node:stream/consumers');
let pdfjslib;

module.exports = {
    pdfToText: async function(stream) {
        if (!pdfjslib) {
            pdfjslib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        }

        const loadingTask = pdfjslib.getDocument({ data: await arrayBuffer(stream) });
        const pdfDoc = await loadingTask.promise;

        let fullText = '';
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const content = await page.getTextContent();
            if (content.items.length) {
                const strings = content.items.map(item => item.str || '');
                fullText += strings.join(' ') + '\n\n';
            }
        }

        return fullText;
    },

    /**
     * Normalize multiselect input (array or string) to array format.
     * Strings are treated as single values or comma-separated lists.
     * @param {string|string[]} input
     * @param {object} context
     * @param {string} fieldName
     * @returns {string[]}
     */
    normalizeMultiselectInput(input, context, fieldName) {

        if (Array.isArray(input)) {
            return input;
        } else if (typeof input === 'string') {
            // Handle single string value or comma-separated string
            return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
        } else {
            throw new context.CancelError(`${fieldName} must be a string or an array`);
        }
    }
};
