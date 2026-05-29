'use strict';

module.exports = {

    workflowsToSelectArray({ workflows }) {

        if (!Array.isArray(workflows)) {
            return [];
        }
        return workflows.map(wf => ({
            label: wf.name || String(wf.id),
            value: String(wf.id)
        }));
    }
};
