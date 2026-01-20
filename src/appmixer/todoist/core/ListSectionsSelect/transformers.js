'use strict';

module.exports = {

    sectionsToSelectArray(sections) {

        return (sections || []).map(section => ({
            label: section.name,
            value: section.id.toString()
        }));
    }
};
