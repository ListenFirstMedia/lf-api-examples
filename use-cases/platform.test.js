const support = require('./testSupport');
const session = require('./session');
const utils = require('./utils');
const _ = require('lodash');
const querystring = require('querystring');

const UPDATE_TYPES = [
    'ENHANCEMENT',
    'BUG_FIX',
    'LIFECYCLE_OR_STABILITY_CHANGE',
];
const UPDATE_SCOPE = ['DOCS', 'DATA', 'API'];
describe('Working with Platform Endpoints', () => {
    test('retrieve the release notes', async () => {
        const data = await session.fetch('/v20200626/platform/release_notes');
        //support.dump(data);
        support.expectRecords(data);
        data.records.forEach((release) => {
            expect(release.release_number).toBeGreaterThan(0);
            expect(release.released_on).toBeTruthy();
            //expect(release.summary).toBeTruthy();
            expect(release.updates).toBeTruthy();
            expect(release.updates.length).toBeGreaterThan(0);
            release.updates.forEach((update) => {
                expect(UPDATE_TYPES).toContain(update.update_type);
                support.expectIncludesOnly(update.update_scope, UPDATE_SCOPE);
                expect(update.update_msg).toBeTruthy();
                expect(update.breaking_change).toBeDefined();
            });
        });
    });

    test('list all errors', async () => {
        const data = await session.fetch('/v20200626/platform/error_codes');
        //support.dump(data);

        support.expectRecords(data);
        data.records.forEach((error) => {
            expect(error.error_service_code).toBeGreaterThan(0);
            expect(error.error_msg).toBeTruthy();
        });
        let codes = _.uniq(
            _.map(data.records, (error) => error.error_service_code)
        );
        expect(codes.length).toBe(data.records.length);
    });
});
