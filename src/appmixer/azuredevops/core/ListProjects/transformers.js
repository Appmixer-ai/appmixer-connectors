'use strict';

/**
 * Transforms ListProjects output into a select-array for inspector dropdowns.
 * @param {object} data
 * @returns {Array}
 */
module.exports.projectsToSelectArray = function(data) {
    const items = Array.isArray(data) ? data : (data.result || data.value || []);
    return items.map(project => ({
        label: project.name,
        value: project.id
    }));
};
