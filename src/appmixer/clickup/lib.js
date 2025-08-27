module.exports = {

    /**
     * Normalizes multiselect field values to ensure consistent array format.
     * This function handles various input formats (strings, arrays, comma-separated values)
     * and converts them to a proper array format for API consumption.
     *
     * @param {string|Array|undefined} value - The value to normalize
     * @returns {Array|undefined} - Normalized array or undefined if input is empty
     */
    normalizeMultiselect(value) {

        if (!value) return undefined;

        // If already an array, return as is
        if (Array.isArray(value)) return value;

        // If string, split by comma and trim whitespace
        if (typeof value === 'string') {
            const result = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
            return result.length > 0 ? result : undefined;
        }

        // For other types, convert to string first then split
        const result = String(value).split(',').map(item => item.trim()).filter(item => item.length > 0);
        return result.length > 0 ? result : undefined;
    }
};
