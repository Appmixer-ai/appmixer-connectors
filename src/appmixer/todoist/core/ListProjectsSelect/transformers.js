'use strict';

module.exports = {

    projectsToSelectArray(projects) {

        return (projects || []).map(project => ({
            label: project.name,
            value: project.id.toString()
        }));
    }
};
