const _ = require('lodash');
const moment = require('moment');

const FIELD_CLASSES = ["METRIC","DIMENSION"];
const FIELD_DATA_TYPES = ["STRING", "INTEGER", "FLOAT", "TIME", "BOOLEAN", "STRINGSET"];
const FIELD_CAPABILITIES = ['SORTABLE', 'FILTERABLE', 'GROUPABLE', 'SELECTABLE'];
const FIELD_INTERVALS = ["LIFETIME", "DELTA"];

const STABILITY_STATES = ["EXPERIMENTAL", "BETA", "GA", "DEPRECATED", "EOL"];
const DATASET_ATTRIBUTION_MODES = ["LIFETIME", "IN_WINDOW", "IN_ACTION"];
const DATASET_AUTHORIZATION_TYPES = ["STRICT", "PARTIAL"];
const DATASET_TYPES = ['ANALYTIC', 'DIMENSION_GROUP'];
const DATASET_ANALYSIS_TYPES = ['CONTENT', 'BRAND'];

const BRAND_VIEW_TYPES = ["STANDARD", "CUSTOM"];
let TestSupport = {

    expectRecords: function (data) {
        expect(data).toBeDefined();
        expect(data.records).toBeDefined();
        expect(typeof data.records).toBe('object');
        expect(Array.isArray(data.records)).toBeTruthy();        
        expect(data.records.length).toBeGreaterThan(0);
        if (data.records_count !== undefined) {
            expect(data.records_count).toBeEqualOrGreaterThan(data.records.length);
        }
    },

    expectRecord: function(data) {
        expect(data).toBeDefined();
        expect(data.record).toBeDefined();
        expect(typeof data.record).toBe('object');
        expect(Array.isArray(data.record)).toBeFalsy();
    },

    expectPaging: function(data, perPage) {
        expect(data.page).toBeDefined();
        expect(typeof data.page).toBe('number');
        expect(data.page).toBeGreaterThan(0);
        //expect(data.next_page_token).toBeDefined(); // possibly null
        if (perPage !== undefined) {
            expect(data.records.length).toBeLessThanOrEqual(perPage);
        }
    },

    expectFieldBasic: function(field) {
        expect(field.id).not.toBeNull();
        expect(field.name).not.toBeNull();
        expect(field.class).not.toBeNull();
        expect(FIELD_CLASSES).toContain(field.class);
        expect(field.data_type).not.toBeNull();
        expect(FIELD_DATA_TYPES).toContain(field.data_type);
    },

    expectIncludesOnly: function (strVals, expectedVals) {
        expect(strVals).toBeDefined();
        expect(Array.isArray(strVals)).toBe(true);
        expect(strVals.length).toBeGreaterThan(0);

        let rx = new RegExp(`^(${_.join(expectedVals, '|')})$`, 'i');
        strVals.forEach( str => {
            expect(str).toMatch(rx);
        });        
    },

    expectField: function(field) {
        this.expectFieldBasic(field);
        expect(field.public).toBeDefined();
        expect(field.listable).toBeDefined();
        expect(STABILITY_STATES).toContain(field.stability_state);
        let caps = field.capabilities;
        this.expectIncludesOnly(caps, FIELD_CAPABILITIES);        
        if (field.class === 'METRIC') {        
            expect(field.interval).toBeDefined();
            expect(FIELD_INTERVALS).toContain(field.interval);
        }
    },

    expectTableResponse: function(data, expectedCols) {
        this.expectRecords(data);
        this.expectPaging(data);
        expect(data.columns).toBeDefined();
        expect(typeof data.columns).toBe('object');
        expect(Array.isArray(data.columns)).toBeTruthy();                
        expect(data.columns.length).toBe(data.records[0].length);
        data.columns.forEach(field => {            
            this.expectFieldBasic(field);
        });

        if (expectedCols) {
            let cols = _.map(data.columns, (f) => f.id);
            this.expectIncludesOnly(cols, expectedCols);            
        }
    },

    expectBrandView: function(bv, expectedDims) {
        expect(bv.id).toBeGreaterThan(0);
        expect(bv.name).toBeTruthy();
        expect(bv.type).toBeTruthy();
        expect(BRAND_VIEW_TYPES).toContain(bv.type);
        expect(bv.dimensions).toBeDefined();
        if (bv.dimensions && expectedDims) {
            this.expectIncludesOnly(_.keys(bv.dimensions), expectedDims);
        } else if (expectedDims) {
            fail("expected dimensions but didn't receive any");
        } else if (bv.dimensions.length > 0) {
            fail("received dimensions but didn't expect any");
        }
    },

    expectDatasetBasic: function(ds) {
        expect(ds.id).toBeTruthy();
        expect(ds.name).toBeTruthy();
        expect(ds.description).toBeTruthy();
        expect(ds.analysis_type).toBeDefined();
        expect(ds.dataset_type).toBeDefined();
        expect(DATASET_TYPES).toContain(ds.dataset_type);
        if (ds.dataset_type === 'ANALYTIC') {
            expect(ds.analysis_type).toBeDefined();
            expect(DATASET_ANALYSIS_TYPES).toContain(ds.analysis_type);
        } else {
            expect(ds.analysis_type).toBeFalsy();
        }
    },

    expectDataset: function(ds) {
        this.expectDatasetBasic(ds);
        expect(ds.primary_time_field).toBeDefined();
        expect(ds.stability_state).toBeDefined();
        expect(STABILITY_STATES).toContain(ds.stability_state);
        if (ds.analysis_type === 'CONTENT') {            
            this.expectIncludesOnly(ds.stat_attribution_modes, DATASET_ATTRIBUTION_MODES);
        }
        expect(ds.fields).toBeDefined();
        expect(ds.fields.length).toBeGreaterThan(0);
        expect(DATASET_AUTHORIZATION_TYPES).toContain(ds.authorization_type);
    },

    expectError: function(err, expectedCode, expectedServiceCode) {
        expect(err).toBeTruthy();
        expect(err.error_ts).toBeGreaterThan(0);
        expect(err.error_msg).toBeTruthy();
        expect(err.service_code).toBeGreaterThan(0);
        expect(err.error_code).toBeGreaterThan(0);
        if (expectedCode) {
            expect(err.error_code).toBe(expectedCode);
        }
        if (expectedServiceCode) {
            expect(err.service_code).toBe(expectedServiceCode);
        }
        if (err.error_details) {
            expect(typeof err.error_details).toBe('object');
            expect(Array.isArray(err.error_details)).toBe(false);
        }
    },

    yesterday: function() {
        return this.nDaysAgo(1);        
    },

    nDaysAgo: function(n) {
        return moment().subtract(n, 'days').format('YYYY-MM-DD');
    },

    lastMonth: function() {
        let som = moment().subtract(1, 'months').startOf('month');
        let eom = moment(som).endOf('month')
        return _.map([som, eom], (d) => d.format('YYYY-MM-DD'));
    }    
}

module.exports = TestSupport