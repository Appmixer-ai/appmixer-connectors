'use strict';

module.exports = {
    picklistValuesToSelectArray: (fields = {}) => {

        const fieldProperties = fields?.fields[0];
        if (Array.isArray(fieldProperties?.picklistValues)) {

            return fieldProperties.picklistValues.map(item => {

                return {
                    value: item.value,
                    label: item.label
                };
            });
        }

        return [];
    },

    fieldsToSelectOptions: (fields = {}) => {

        if (Array.isArray(fields?.fields)) {

            return fields.fields.map(item => {

                return {
                    label: item.label ? `${item.label} - (${item.name})` : item.name,
                    value: item.name
                };
            });
        }
        return [];
    }
};
