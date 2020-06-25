const querystring = require('querystring');
const session = require('./session');
const support = require('./testSupport');
const utils = require('./utils');
const _ = require('lodash');

describe('Working with Brand View Sets', () => {
    test('list the brand sets the account has access to', async () => {
        const data = await session.fetch(
            '/v20200626/brand_view_sets?per_page=50'
        );
        //support.dump(data);
        support.expectRecords(data);
        data.records.forEach((bvs) => {
            expect(bvs).toBeDefined();
            expect(bvs.id).toBeGreaterThan(0);
            expect(bvs.name).toBeTruthy();
        });
    });

    test('retrieve a brand view set by ID', async () => {
        const data = await session.fetch('/v20200626/brand_view_sets/4626');
        //support.dump(data);
        support.expectRecord(data);
        expect(data.record.id).toBe(4626);
        expect(data.record.name).toBe('My Brands');
    });

    test('retrieve and page over all members of a brand view set', async () => {
        let fields = [
            'lfm.brand.name',
            'lfm.brand.genres',
            'lfm.brand.programmers',
            'lfm.brand.programmer_types',
        ];

        let sort = [
            { field: 'lfm.brand.name', dir: 'DESC' },
            // not currently supported sort
            // { field: 'lfm.brand_view.id', dir: 'DESC'}
        ];

        let filters = [
            { field: 'lfm.brand_view.type', operator: '=', values: [''] },
        ];
        let queryParams = querystring.stringify({
            fields: _.join(fields, ','),
            sort: JSON.stringify(sort),
            per_page: 1000,
        });

        let path = `/v20200626/brand_view_sets/4626/brand_views?${queryParams}`;
        let pageCount = await utils.fetchAllPages(session, path, (data) => {
            //support.dump(data);
            support.expectRecords(data);
            support.expectPaging(data);
            data.records.forEach((bv) => {
                support.expectBrandView(bv, fields);
            });
        });
        //expect(pageCount).toBeGreaterThan(1);
    });

    test('filter members of a brand view set', async () => {
        let tvBrands = await utils.findBrandSetByName(
            session,
            'LF // TV Universe'
        );
        let tvBrandSetID = tvBrands.id;

        let fields = [
            'lfm.brand.genres',
            'lfm.brand.programmers',
            'lfm.brand.programmer_types',
        ];

        let filters = [
            {
                field: 'lfm.brand.programmers',
                operator: 'IN',
                values: ['Showtime'],
            },
        ];

        let sort = [{ field: 'lfm.brand.name', dir: 'DESC' }];

        let queryParams = querystring.stringify({
            fields: _.join(fields, ','),
            sort: JSON.stringify(sort),
            filters: JSON.stringify(filters),
            per_page: 50,
        });

        let path = `/v20200626/brand_view_sets/${tvBrandSetID}/brand_views?${queryParams}`;

        let pageCount = await utils.fetchAllPages(session, path, (data) => {
            //support.dump(data);
            support.expectRecords(data);
            support.expectPaging(data);
            data.records.forEach((bv) => {
                support.expectBrandView(bv, fields);
                expect(bv.dimensions['lfm.brand.programmers']).toContain(
                    'Showtime'
                );
            });
        });
        expect(pageCount).toBeGreaterThan(1);
    });

    test('limit brand view sets returned with per page param', async () => {
        const data = await session.fetch(
            '/v20200626/brand_view_sets?per_page=2'
        );
        support.expectRecords(data);
        support.expectPaging(data);
        expect(data.records.length).toBe(2);
        expect(data.total_records).toBeGreaterThan(2);
        expect(data.has_more_pages).toBe(true);
    });

    test('limit the members of a brand view set returned with per page param', async () => {
        let myBrands = await utils.findBrandSetByName(session, 'My Brands');
        let myBrandViewID = myBrands.id;
        let path = `/v20200626/brand_view_sets/${myBrandViewID}/brand_views?per_page=2`;
        const data = await session.fetch(path);
        support.expectRecords(data);
        support.expectPaging(data);
        expect(data.records.length).toBe(2);
        expect(data.total_records).toBeGreaterThan(2);
        expect(data.has_more_pages).toBe(true);
    });
});
