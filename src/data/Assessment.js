/**
 * Assessment
 *
 * This provides basic data for a list of assessments
 */
export default class Assessment {

    static order(ass1, ass2) {
        return ass1.parent_title < ass2.parent_title ? -1
            : ass1.title > ass2.title ? 1
                : 0
    }

    static buildKey(ass_id, context_id) {
        return 'A' + ass_id + '_' + context_id
    }

    /**
     * id of the assessment
     * @type {integer}
     */
    ass_id = null;

    /**
     * Context id of the assessment
     * @type {integer}
     */
    context_id = null;

    /**
     * Title of the assessment's parent
     * @type {string}
     */
    parent_title = null;

    /**
     * Title of the assessment
     * @type {string}
     */
    title = null;

    /**
     * Start date of the correction
     * @type {string}
     */
    correction_start = null;

    /**
     * End date of the correction
     * @type {string}
     */
    correction_end = null;

    /**
     * Assigned gradings
     * @type {integer}
     */
    assigned_gradings = null;

    /**
     * Finished gradings
     * @type {string}
     */
    finished_gradings = null;

    /**
     * Calculated key
     * @type {string}
     */
    key = null;

    /**
     * Constructor - gets properties from a data object
     * @param {object} data
     */
    constructor(data = {}) {
        if (data.ass_id !== undefined && data.ass_id !== null) {
            this.ass_id = parseInt(data.ass_id);
        }
        if (data.context_id !== undefined && data.context_id !== null) {
            this.context_id = parseInt(data.context_id);
        }
        if (data.parent_title !== undefined && data.parent_title !== null) {
            this.parent_title = data.parent_title.toString();
        }
        if (data.title !== undefined && data.title !== null) {
            this.title = data.title.toString();
        }
        if (data.correction_start !== undefined && data.correction_start !== null) {
            this.correction_start = data.correction_start.toString();
        }
        if (data.correction_end !== undefined && data.correction_end !== null) {
            this.correction_end = data.correction_end.toString();
        }
        if (data.assigned_gradings !== undefined && data.assigned_gradings !== null) {
            this.assigned_gradings = parseInt(data.assigned_gradings);
        }
        if (data.finished_gradings !== undefined && data.finished_gradings !== null) {
            this.finished_gradings = parseInt(data.finished_gradings);
        }
        this.key = Assessment.buildKey(this.ass_id, this.context_id);
    }

    /**
     * Get a string key of the assessment
     * @return {string}
     */
    getKey() {
        return this.key;
    }

    /**
     * Get a plain data object from the public properties
     * @return {object}
     */
    getData() {
        return Object.assign({}, this)
    }
}
