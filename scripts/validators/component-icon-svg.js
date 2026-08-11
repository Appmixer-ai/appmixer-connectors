'use strict';

// What this validator checks
// --------------------------
// Every component.json must carry its own `icon` property, and the icon must
// be an SVG. Component icons render in the designer's component palette and on
// flow canvas nodes; a missing icon falls back to a generic placeholder, and
// raster formats (PNG/JPEG) scale badly on hi-DPI displays and bloat the
// component payload. The accepted forms are:
//
//   - a data URI with the SVG MIME type: "data:image/svg+xml;base64,..." or
//     "data:image/svg+xml;utf8,<svg ...>"
//   - inline SVG markup: "<svg ...>...</svg>"
//
// FAILURE — component.json has no `icon` property.
// FAILURE — `icon` is present but is not an SVG (e.g. a PNG/JPEG data URI).
// FAILURE — `icon` declares the SVG MIME type but the payload does not look
//           like SVG markup (base64 that does not decode to an <svg>/<?xml
//           document).

const { readJson } = require('./_shared');

const SVG_DATA_URI = /^data:image\/svg\+xml\s*[;,]/i;
const OTHER_DATA_URI = /^data:([^;,]+)[;,]/i;

function looksLikeSvgMarkup(text) {

    // The document may open with an XML declaration and/or a DOCTYPE before the
    // <svg> root element — accept any prologue as long as <svg appears early.
    const head = text.replace(/^﻿/, '').trimStart().slice(0, 500).toLowerCase();
    return head.startsWith('<svg') || ((head.startsWith('<?xml') || head.startsWith('<!doctype svg')) && head.includes('<svg'));
}

function decodedSvgPayloadOk(icon) {

    const commaIndex = icon.indexOf(',');
    if (commaIndex === -1) {
        return false;
    }
    const meta = icon.slice(0, commaIndex);
    const payload = icon.slice(commaIndex + 1);
    if (/;base64/i.test(meta)) {
        let decoded;
        try {
            decoded = Buffer.from(payload, 'base64').toString('utf8');
        } catch (error) {
            return false;
        }
        return looksLikeSvgMarkup(decoded);
    }
    // utf8 / percent-encoded payload
    try {
        return looksLikeSvgMarkup(decodeURIComponent(payload));
    } catch (error) {
        return looksLikeSvgMarkup(payload);
    }
}

function validateComponent(componentPath, addFailure) {

    let component;
    try {
        component = readJson(componentPath);
    } catch (error) {
        // JSON parse errors are reported by other validators.
        return;
    }

    const icon = component.icon;

    if (icon === undefined) {
        addFailure(componentPath,
            'component.json has no "icon" property — every component must ship its own SVG icon ' +
            '(data:image/svg+xml data URI).');
        return;
    }

    if (typeof icon !== 'string' || icon.trim() === '') {
        addFailure(componentPath, '"icon" must be a non-empty string with an SVG icon.');
        return;
    }

    if (SVG_DATA_URI.test(icon)) {
        if (!decodedSvgPayloadOk(icon)) {
            addFailure(componentPath,
                '"icon" declares data:image/svg+xml but its payload does not decode to SVG markup.');
        }
        return;
    }

    if (looksLikeSvgMarkup(icon)) {
        return;
    }

    const otherUri = icon.match(OTHER_DATA_URI);
    const found = otherUri ? `a ${otherUri[1]} data URI` : 'not an SVG';
    addFailure(componentPath,
        `"icon" must be an SVG (data:image/svg+xml data URI), found ${found}.`);
}

module.exports = {
    name: 'component-icon-svg',
    description: 'Every component.json must have an "icon" property and it must be an SVG',
    run(context) {
        for (const componentPath of context.componentFiles) {
            validateComponent(componentPath, context.addFailure);
        }
    }
};
