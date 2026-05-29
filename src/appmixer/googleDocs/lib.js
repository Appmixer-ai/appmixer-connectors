'use strict';

/**
 * Converts an HTML string into an array of Google Docs batchUpdate requests.
 *
 * Supported HTML tags:
 *   <b>, <strong>    → bold
 *   <i>, <em>        → italic
 *   <u>              → underline
 *   <s>, <strike>    → strikethrough
 *   <a href="...">   → link
 *   <h1>–<h6>        → HEADING_1–HEADING_6 paragraph style
 *   <p>              → paragraph (NORMAL_TEXT)
 *   <ul>/<li>        → unordered list (BULLET_DISC_CIRCLE_SQUARE)
 *   <ol>/<li>        → ordered list (NUMBERED_DECIMAL_ALPHA_ROMAN)
 *   <br>             → newline
 *   <table>/<tr>/<td>/<th> → plain text rendering with tab/newline separators
 *   All other tags   → stripped, inner text preserved
 *
 * @param {string} html - HTML content string
 * @param {number} [startIndex=1] - Starting document index (default: 1)
 * @returns {{ requests: Array<object>, endIndex: number }}
 */
function htmlToGoogleDocsRequests(html, startIndex = 1) {

    const requests = [];
    let currentIndex = startIndex;

    // Track open formatting marks: { bold, italic, underline, strikethrough, link, startIndex }
    const styleStack = [];

    // Track list context
    const listStack = []; // elements: { type: 'ul'|'ol' }

    // Pending paragraph style (applied after text is inserted)
    let pendingParaStyle = null;
    let paraStartIndex = currentIndex;

    /**
     * Flush any pending text styling requests.
     * Called when we close a formatting tag.
     */
    function flushStyle(endIndex) {

        if (styleStack.length === 0) return;

        const top = styleStack[styleStack.length - 1];
        if (top.startIndex >= endIndex) return;

        const textStyle = {};
        if (top.bold) textStyle.bold = true;
        if (top.italic) textStyle.italic = true;
        if (top.underline) textStyle.underline = true;
        if (top.strikethrough) textStyle.strikethrough = true;
        if (top.link) textStyle.link = { url: top.link };

        if (Object.keys(textStyle).length > 0) {
            const fields = Object.keys(textStyle).join(',');
            requests.push({
                updateTextStyle: {
                    range: {
                        startIndex: top.startIndex,
                        endIndex: endIndex
                    },
                    textStyle,
                    fields
                }
            });
        }
    }

    /**
     * Insert a text run and track the current index.
     */
    function insertText(text) {

        if (!text) return;

        requests.push({
            insertText: {
                location: { index: currentIndex },
                text
            }
        });
        currentIndex += text.length;
    }

    /**
     * Apply a paragraph style to the last paragraph.
     */
    function applyParaStyle(style, startIdx, endIdx) {

        requests.push({
            updateParagraphStyle: {
                range: {
                    startIndex: startIdx,
                    endIndex: endIdx
                },
                paragraphStyle: { namedStyleType: style },
                fields: 'namedStyleType'
            }
        });
    }

    /**
     * Apply a list style to the last paragraph.
     */
    function applyListStyle(listId, nestingLevel) {

        requests.push({
            createParagraphBullets: {
                range: {
                    startIndex: paraStartIndex,
                    endIndex: currentIndex
                },
                bulletPreset: listId === 'ul' ? 'BULLET_DISC_CIRCLE_SQUARE' : 'NUMBERED_DECIMAL_ALPHA_ROMAN'
            }
        });
    }

    // Simple HTML tokeniser: splits into text/tag tokens
    const TOKEN_RE = /(<[^>]+>|&[a-zA-Z0-9#]+;)/g;
    let lastIndex = 0;
    let match;

    // Decode basic HTML entities
    function decodeEntities(str) {

        return str
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
            .replace(/&nbsp;/g, ' ');
    }

    while ((match = TOKEN_RE.exec(html)) !== null) {
        // Capture plain text before this token
        const textBefore = html.slice(lastIndex, match.index);
        if (textBefore) {
            const decoded = decodeEntities(textBefore);
            insertText(decoded);
        }
        lastIndex = TOKEN_RE.lastIndex;

        const token = match[0];

        if (token.startsWith('&')) {
            // HTML entity
            insertText(decodeEntities(token));
            continue;
        }

        // It's a tag
        const tagMatch = token.match(/^<(\/?)([a-zA-Z0-9]+)([^>]*)>$/);
        if (!tagMatch) continue;

        const closing = tagMatch[1] === '/';
        const tagName = tagMatch[2].toLowerCase();
        const attrs = tagMatch[3];

        if (tagName === 'br') {
            insertText('\n');
            continue;
        }

        if (tagName === 'hr') {
            insertText('\n');
            continue;
        }

        // Inline formatting tags
        const INLINE_TAGS = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'a'];

        if (INLINE_TAGS.includes(tagName)) {
            if (!closing) {
                // Push new style frame
                const prev = styleStack.length > 0 ? styleStack[styleStack.length - 1] : {};
                const frame = {
                    bold: prev.bold || tagName === 'b' || tagName === 'strong',
                    italic: prev.italic || tagName === 'i' || tagName === 'em',
                    underline: prev.underline || tagName === 'u',
                    strikethrough: prev.strikethrough || tagName === 's' || tagName === 'strike',
                    link: prev.link || (tagName === 'a' ? (attrs.match(/href="([^"]*)"/) || [])[1] : null),
                    startIndex: currentIndex
                };
                styleStack.push(frame);
            } else {
                // Pop and flush
                if (styleStack.length > 0) {
                    flushStyle(currentIndex);
                    styleStack.pop();
                    // Update startIndex of new top to current position
                    if (styleStack.length > 0) {
                        styleStack[styleStack.length - 1].startIndex = currentIndex;
                    }
                }
            }
            continue;
        }

        // Block-level tags
        const HEADING_MAP = { h1: 'HEADING_1', h2: 'HEADING_2', h3: 'HEADING_3', h4: 'HEADING_4', h5: 'HEADING_5', h6: 'HEADING_6' };

        if (HEADING_MAP[tagName]) {
            if (!closing) {
                paraStartIndex = currentIndex;
                pendingParaStyle = HEADING_MAP[tagName];
            } else {
                insertText('\n');
                if (pendingParaStyle) {
                    applyParaStyle(pendingParaStyle, paraStartIndex, currentIndex);
                    pendingParaStyle = null;
                }
            }
            continue;
        }

        if (tagName === 'p') {
            if (!closing) {
                paraStartIndex = currentIndex;
                pendingParaStyle = 'NORMAL_TEXT';
            } else {
                insertText('\n');
                if (pendingParaStyle) {
                    applyParaStyle(pendingParaStyle, paraStartIndex, currentIndex);
                    pendingParaStyle = null;
                }
            }
            continue;
        }

        if (tagName === 'div') {
            if (closing) {
                // Ensure a newline after divs if not already ending with one
                insertText('\n');
            }
            continue;
        }

        if (tagName === 'ul' || tagName === 'ol') {
            if (!closing) {
                listStack.push({ type: tagName });
            } else {
                listStack.pop();
                if (listStack.length === 0) {
                    // After list, ensure a newline
                    insertText('\n');
                }
            }
            continue;
        }

        if (tagName === 'li') {
            if (!closing) {
                paraStartIndex = currentIndex;
            } else {
                insertText('\n');
                if (listStack.length > 0) {
                    const list = listStack[listStack.length - 1];
                    applyListStyle(list.type, 0);
                }
            }
            continue;
        }

        // Table handling — render as plain text with separators
        if (tagName === 'td' || tagName === 'th') {
            if (closing) {
                insertText('\t');
            }
            continue;
        }

        if (tagName === 'tr') {
            if (closing) {
                insertText('\n');
            }
            continue;
        }

        // Ignore other tags (table, tbody, thead, etc.)
    }

    // Capture remaining text after last token
    const remaining = html.slice(lastIndex);
    if (remaining) {
        insertText(decodeEntities(remaining));
    }

    // Flush any unclosed inline styles
    if (styleStack.length > 0) {
        flushStyle(currentIndex);
    }

    // Ensure document ends with a newline (required by Google Docs)
    // Google Docs always has a trailing newline at the end, so we don't need to add one manually.

    return { requests, endIndex: currentIndex };
}

module.exports = { htmlToGoogleDocsRequests };
