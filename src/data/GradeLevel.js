/**
 * Writing Task
 *
 * This provides basic data for a list of tasks to be taken
 */
export default class GradeLevel {

    static order(level1, level2) {
        return level1.min_points < level2.min_points ? -1
            : level1.min_points > level2.min_points ? 1
                : 0
    }

    static buildKey(id) {
        return 'L' + id;
    }

    /**
     * Id of the level
     * @type {integer}
     */
    id = null;

    /**
     * Key of the level
     */
    key = null;

    /**
     * minimum points to reach this level
     * @type {number}
     */
    min_points = 0;


    /**
     * Title of the level
     * @type {string}
     */
    title = null;

    /**
     * Statement to be shown with the title
     * @type {string}
     */
    statement = null;


    /**
     * Constructor - gets properties from a data object
     * @param {object} data
     */
    constructor(data = {}) {
        if (data.id !== undefined && data.id !== null) {
            this.id = parseInt(data.id);
        }
        if (data.min_points !== undefined && data.min_points !== null) {
            this.min_points = parseFloat(data.min_points);
        }
        if (data.title !== undefined && data.title !== null) {
            this.title = data.title.toString();
        }
        if (data.statement !== undefined && data.statement !== null) {
            this.statement = data.statement.toString();
        }
        if (this.key === null) {
            this.key = GradeLevel.buildKey(this.id);
        }
    }

    /**
     * Get a string key of the level
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
