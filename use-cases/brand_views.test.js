const support = require('./testSupport');
const session = require('./session');
const utils = require('./utils');
const _ = require('lodash');
const querystring = require('querystring');

describe('Working with Brand Views', () => {
    test('retrieve a brand view by ID', async () => {
        const data = await session.fetch('/v20200626/brand_views/176817');
        //support.dump(data);
        support.expectRecord(data);
        support.expectBrandView(data.record);
    });

    test('list all brand views', async () => {
        const data = await session.fetch('/v20200626/brand_views?per_page=853');
        //support.dump(data);
        support.expectRecords(data);
        data.records.forEach((bv) => {
            support.expectBrandView(bv);
        });
        expect(data.records.length).toBe(853);
    });

    test('page through all brand views', async () => {
        const totalPages = await utils.fetchAllPages(
            session,
            '/v20200626/brand_views?per_page=10000',
            (data) => {
                //support.dump(data)
                support.expectRecords(data);
                data.records.forEach((bv) => {
                    support.expectBrandView(bv);
                });
            }
        );
        expect(totalPages).toBeGreaterThan(1);
    });

    test('limit the list of brand views with per_page', async () => {
        let params = querystring.stringify({ per_page: 2 });
        const data = await session.fetch(`/v20200626/brand_views?${params}`);
        //support.dump(data);
        support.expectRecords(data);
        support.expectPaging(data);
        expect(data.records.length).toBe(2);
        expect(data.has_more_pages).toBe(true);
    });

    test('list my brands', async () => {
        let myBrands = await utils.findBrandSetByName(session, 'My Brands');
        expect(myBrands).toBeTruthy();
        let data = await session.fetch(
            `/v20200626/brand_view_sets/${myBrands.id}/brand_views`
        );

        let checkResponseFn = (data) => {
            support.expectRecords(data);
            data.records.forEach((bv) => support.expectBrandView(bv));
        };

        checkResponseFn(data);
    });

    test('find prime time comedy episodic TV shows from select premier cable programmers', async () => {
        let tvBrandSet = await utils.findBrandSetByName(session, /TV Universe/);
        expect(tvBrandSet).toBeDefined();

        let fields = [
            'lfm.brand.broadcast_dayparts',
            'lfm.brand.name', // always included
            'lfm.brand.genres',
            'lfm.brand.programmers',
            'lfm.brand.programmer_types',
            'lfm.brand.primary_genre',
            //unsupported
            //'lfm.brand.in_season',
            //'lfm.brand_view.id',
        ];

        let filters = [];
        filters.push({
            field: 'lfm.brand.genres',
            operator: '=',
            values: ['Comedy'],
        });
        filters.push({
            field: 'lfm.brand.primary_genre',
            operator: '=',
            values: ['Comedy'],
        });
        filters.push({
            field: 'lfm.brand.broadcast_dayparts',
            operator: '=',
            values: ['Prime Time'],
        });
        filters.push({
            field: 'lfm.brand.programmer_types',
            operator: '=',
            values: ['Premium Cable'],
        });
        filters.push({
            field: 'lfm.brand.programmers',
            operator: 'IN',
            values: ['HBO', 'Showtime', 'Epix'],
        });

        let sort = [];
        sort.push({ field: 'lfm.brand.name', dir: 'DESC' });

        let sortParam = JSON.stringify(sort);
        let filterParam = JSON.stringify(filters);
        let fieldsParam = _.join(fields, ',');

        let queryStr = querystring.stringify({
            fields: fieldsParam,
            sort: sortParam,
            filters: filterParam,
        });

        const data = await session.fetch(
            `/v20200626/brand_view_sets/${tvBrandSet.id}/brand_views?${queryStr}`
        );
        //support.dump(data)
        support.expectRecords(data);
        data.records.forEach((bv) => {
            support.expectBrandView(bv, fields);
        });
        let [stdBrands, customBrands] = _.partition(
            data.records,
            (bv) => bv.type === 'STANDARD'
        );
        expect(stdBrands.length).toBeGreaterThan(0);
        expect(customBrands.length).toBe(0);
    });

    test('find prime time comedy episodic TV shows with brand view endpoint', async () => {
        let fields = [
            'lfm.brand.broadcast_dayparts',
            'lfm.brand.name', // always included
            'lfm.brand.genres',
            'lfm.brand.programmers',
            'lfm.brand.programmer_types',
            'lfm.brand.primary_genre',
            'lfm.brand_view.set_names',
            'lfm.brand_view.set_ids',
            'lfm.brand_view.type',
            //'lfm.brand_view.id',
        ];

        let filters = [];
        filters.push({
            field: 'lfm.brand_view.set_ids',
            operator: 'IN',
            values: [1700],
        });
        filters.push({
            // this is redundant with the set_ids IN 1700 above
            field: 'lfm.brand_view.set_names',
            operator: 'IN',
            values: ['LF // TV Universe'],
        });
        filters.push({
            field: 'lfm.brand.genres',
            operator: '=',
            values: ['Comedy'],
        });
        filters.push({
            field: 'lfm.brand.primary_genre',
            operator: '=',
            values: ['Comedy'],
        });
        filters.push({
            field: 'lfm.brand.broadcast_dayparts',
            operator: '=',
            values: ['Prime Time'],
        });
        filters.push({
            field: 'lfm.brand.programmer_types',
            operator: '=',
            values: ['Premium Cable'],
        });
        filters.push({
            field: 'lfm.brand.programmers',
            operator: 'IN',
            values: ['HBO', 'Showtime', 'Epix'],
        });

        let sort = [];
        sort.push({ field: 'lfm.brand.name', dir: 'DESC' });

        let sortParam = JSON.stringify(sort);
        let filterParam = JSON.stringify(filters);
        let fieldsParam = _.join(fields, ',');
        //support.dump({ sort, filters, fields });
        let queryStr = querystring.stringify({
            fields: fieldsParam,
            sort: sortParam,
            filters: filterParam,
        });

        const data = await session.fetch(`/v20200626/brand_views?${queryStr}`);
        //support.dump(data);
        support.expectRecords(data);
        data.records.forEach((bv) => {
            support.expectBrandView(bv, fields);
        });
        let [stdBrands, customBrands] = _.partition(
            data.records,
            (bv) => bv.type === 'STANDARD'
        );
        expect(stdBrands.length).toBeGreaterThan(0);
        expect(customBrands.length).toBe(0);
    });

    test('find a brand by name', async () => {
        let fields = ['lfm.brand.programmers'];

        let filters = [
            {
                field: 'lfm.brand.name',
                operator: '=',
                values: ['The Righteous Gemstones'],
            },
            {
                field: 'lfm.brand_view.type',
                operator: '=',
                values: ['STANDARD'],
            },
        ];

        let sort = [];
        sort.push({ field: 'lfm.brand.name', dir: 'DESC' });

        let sortParam = JSON.stringify(sort);
        let filterParam = JSON.stringify(filters);
        let fieldsParam = _.join(fields, ',');

        let queryStr = querystring.stringify({
            fields: fieldsParam,
            sort: sortParam,
            filters: filterParam,
        });

        const data = await session.fetch(`/v20200626/brand_views?${queryStr}`);
        //support.dump(data)
        support.expectRecords(data);
        data.records.forEach((bv) => {
            support.expectBrandView(bv, fields);
        });
        let [stdBrands, customBrands] = _.partition(
            data.records,
            (bv) => bv.type === 'STANDARD'
        );
        expect(stdBrands.length).toBeGreaterThan(0);
        expect(customBrands.length).toBe(0);
    });

    test('find a brand by id', async () => {
        let filters = [
            {
                field: 'lfm.brand_view.id',
                operator: '=',
                values: ['144392'],
            },
            {
                field: 'lfm.brand_view.type',
                operator: '=',
                values: ['STANDARD'],
            },
        ];
        let filterParam = JSON.stringify(filters);
        let queryStr = querystring.stringify({
            filters: filterParam,
        });

        const data = await session.fetch(`/v20200626/brand_views?${queryStr}`);
        //support.dump(data)
        support.expectRecords(data);
        data.records.forEach((bv) => {
            support.expectBrandView(bv);
            expect(bv.id).toBe(144392);
        });
        expect(data.records.length).toBe(1);
    });

    test('find all CBS All Access brands', async () => {
        let fields = [
            'lfm.brand.broadcast_dayparts',
            'lfm.brand.genres',
            'lfm.brand.programmers',
            'lfm.brand.programmer_types',
            'lfm.brand.primary_genre',
        ];

        let filters = [];
        filters.push({
            field: 'lfm.brand.programmers',
            operator: '=',
            values: ['CBS All Access'],
        });

        let sort = [];
        sort.push({ field: 'lfm.brand.name', dir: 'DESC' });

        let sortParam = JSON.stringify(sort);
        let filterParam = JSON.stringify(filters);
        let fieldsParam = _.join(fields, ',');

        let queryStr = querystring.stringify({
            fields: fieldsParam,
            sort: sortParam,
            filters: filterParam,
        });

        const data = await session.fetch(`/v20200626/brand_views?${queryStr}`);
        //support.dump(data);
        support.expectRecords(data);
        data.records.forEach((bv) => {
            support.expectBrandView(bv, fields);
        });
        let [stdBrands, customBrands] = _.partition(
            data.records,
            (bv) => bv.type === 'STANDARD'
        );
        expect(stdBrands.length).toBeGreaterThan(0);
        expect(customBrands.length).toBeGreaterThan(0);
    });

    test('find all CBS All Access CUSTOM brands', async () => {
        let fields = ['lfm.brand_view.type'];

        let filters = [];
        filters.push({
            field: 'lfm.brand_view.type',
            operator: '=',
            values: ['CUSTOM'],
        });
        filters.push({
            field: 'lfm.brand.programmers',
            operator: '=',
            values: ['CBS All Access'],
        });

        let sort = [];
        sort.push({ field: 'lfm.brand.name', dir: 'ASC' });

        let sortParam = JSON.stringify(sort);
        let filterParam = JSON.stringify(filters);
        let fieldsParam = _.join(fields, ',');

        let queryStr = querystring.stringify({
            fields: fieldsParam,
            sort: sortParam,
            filters: filterParam,
        });
        const data = await session.fetch(`/v20200626/brand_views?${queryStr}`);
        //support.dump(data);
        support.expectRecords(data);
        data.records.forEach((bv) => {
            support.expectBrandView(bv, fields);
            expect(bv.type).toBe('CUSTOM');
        });
    });

    test('has clear errors', async () => {
        let fields = ['lfm.brand.broadcast_daypart'];
        let fieldsParam = _.join(fields, ',');
        queryStr = querystring.stringify({ fields: fieldsParam });
        try {
            let data = await session.fetch(
                `/v20200626/brand_views?${queryStr}`
            );
            fail('expected error');
        } catch (err) {
            support.expectError(err);
        }

        let filters = [];
        filters.push({
            field: 'lfm.brand.programmer',
            operator: '=',
            values: ['Showtime'],
        });
        let filterParam = JSON.stringify(filters);
        queryStr = querystring.stringify({ filters: filterParam });
        try {
            let data = await session.fetch(
                `/v20200626/brand_views?${queryStr}`
            );
            fail('expected error');
        } catch (err) {
            support.expectError(err);
        }

        filters = [
            {
                field: 'lfm.brand.programmers',
                operator: '==',
                values: ['Showtime'],
            },
        ];
        filterParam = JSON.stringify(filters);
        queryStr = querystring.stringify({ filters: filterParam });
        try {
            let data = await session.fetch(
                `/v20200626/brand_views?${queryStr}`
            );
            fail('expected error');
        } catch (err) {
            support.expectError(err);
        }

        let sort = [];
        sort.push({ field: 'lfm.brand.programmers', dir: 'DESC' });
        let sortParam = JSON.stringify(sort);
        queryStr = querystring.stringify({ sort: sortParam });
        try {
            let data = await session.fetch(
                `/v20200626/brand_views?${queryStr}`
            );
            fail('expected error');
        } catch (err) {
            support.expectError(err);
        }
    });
});
