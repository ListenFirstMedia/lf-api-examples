const support = require('./testSupport');
const session = require('./session');
const utils = require('./utils');
const _ = require('lodash');
const querystring = require('querystring');

describe('Performing Analytics', () => {
    test('retrieve a few metrics for a single brand', async () => {
        let requestData = {
            dataset_id: 'dataset_brand_listenfirst',
            start_date: support.nDaysAgo(7),
            end_date: support.yesterday(),
            filters: [
                { field: 'lfm.brand_view.id', operator: '=', values: [176817] },
            ],
            metrics: [
                'lfm.audience_ratings.public_fan_acquisition_score',
                'lfm.audience_ratings.public_audience_footprint',
            ],
            group_by: ['lfm.fact.date_str', 'lfm.brand_view.id'],
            sort: [{ field: 'lfm.fact.date_str', dir: 'DESC' }],
            source_attributes: ['lfm.brand.name'],
        };

        //support.dump(requestData);

        let fetchOpts = {
            method: 'post',
            body: JSON.stringify(requestData),
        };

        const data = await session.fetch(
            '/v20200626/analytics/fetch',
            fetchOpts
        );
        //support.dump(data);
        let expectedCols = _.concat(
            requestData.metrics,
            requestData.group_by,
            requestData.source_attributes
        );
        support.expectTableResponse(data, expectedCols);
    });

    test('retrieve my accounts top 100 facebook videos from last month', async () => {
        // myBrandViewIDs used to test the filters.  they are not used in the fetch
        let myBrands = await utils.findBrandSetByName(session, 'My Brands');
        let myBrandViewIDs = await utils.buildBrandViewCohort(
            session,
            [
                {
                    field: 'lfm.brand.programmers',
                    operator: 'IN',
                    values: ['CBS'],
                },
            ],
            myBrands.id
        );

        let [som, eom] = support.lastMonth();
        let requestData = {
            dataset_id: 'dataset_content_facebook',
            start_date: som,
            end_date: eom,
            filters: [
                {
                    field: 'lfm.brand_view.set_names',
                    operator: 'IN',
                    values: ['My Brands'],
                },
                {
                    field: 'lfm.brand.programmers',
                    operator: 'IN',
                    values: ['CBS'],
                },
                {
                    field: 'lfm.content.channel',
                    operator: '=',
                    values: ['facebook'],
                },
                { field: 'lfm.content.type', operator: '=', values: ['video'] },
            ],
            metrics: ['facebook.post.interactions'],
            group_by: [
                'lfm.content.posted_on_date_str',
                'lfm.content.id',
                'lfm.brand_view.id',
            ],
            sort: [{ field: 'facebook.post.interactions', dir: 'DESC' }],
            source_attributes: ['lfm.content.author_name', 'lfm.content.link'],
            per_page: 100,
        };

        //support.dump(requestData);
        let fetchOpts = {
            method: 'post',
            body: JSON.stringify(requestData),
        };

        const data = await session.fetch(
            '/v20200626/analytics/fetch',
            fetchOpts
        );
        //support.dump(data);
        let expectedCols = _.concat(
            requestData.metrics,
            requestData.group_by,
            requestData.source_attributes
        );
        support.expectTableResponse(data, expectedCols);
        let brandViewIdx = _.findIndex(
            data.columns,
            (col) => col.id === 'lfm.brand_view.id'
        );
        expect(brandViewIdx).toBeGreaterThan(0);
        data.records.forEach((row) => {
            let brandViewID = row[brandViewIdx];
            expect(brandViewID).toBeGreaterThan(0);
            expect(myBrandViewIDs).toContain(brandViewID);
        });
    });

    test('retrieve private metrics for a brand', async () => {
        let requestData = {
            dataset_id: 'dataset_brand_facebook',
            start_date: support.nDaysAgo(14),
            end_date: support.yesterday(),
            filters: [
                // once these are supported, they would replcaes the brand_view.id IN filter
                {
                    field: 'lfm.brand_view.set_names',
                    operator: 'IN',
                    values: ['My Brands'],
                },
                // {
                //     field: 'lfm.brand.name',
                //     operator: 'ILIKE',
                //     values: ['CBS News%'],
                // },
                {
                    field: 'lfm.brand.name',
                    operator: 'IN',
                    values: [
                        'CBS News',
                        'CBS News Entertainment',
                        'CBS News Health',
                        'CBS News Politics',
                        'CBS News Sci Tech',
                        'CBS News Sunday Morning',
                    ],
                },
                {
                    field: 'lfm.brand_view.type',
                    operator: '=',
                    values: ['CUSTOM'],
                },
            ],
            metrics: [
                'facebook.page_insight.fbpai_video_views_organic',
                'facebook.page_insight.fbpai_impressions_organic',
            ],
            group_by: ['lfm.brand_view.id'],
            sort: [{ field: 'lfm.brand_view.id', dir: 'DESC' }],
            source_attributes: ['lfm.brand.name'],
        };

        let fetchOpts = {
            method: 'post',
            body: JSON.stringify(requestData),
        };

        const data = await session.fetch(
            '/v20200626/analytics/fetch',
            fetchOpts
        );
        // support.dump(data)
        let expectedCols = _.concat(
            requestData.metrics,
            requestData.group_by,
            requestData.source_attributes
        );
        support.expectTableResponse(data, expectedCols);
    });

    test('test strict private data behavior', async () => {
        let requestData = {
            dataset_id: 'dataset_brand_facebook',
            start_date: support.nDaysAgo(14),
            end_date: support.yesterday(),
            filters: [
                { field: 'lfm.brand.genres', operator: '=', values: ['News'] },
                {
                    field: 'lfm.brand.programmers',
                    operator: 'IN',
                    values: ['CBS', 'NBC'],
                },
                {
                    field: 'lfm.brand.name',
                    operator: 'IN',
                    values: ['CBS News', 'Today Show'],
                },
            ],
            metrics: [
                'facebook.page_insight.fbpai_video_views_organic',
                'facebook.page_insight.fbpai_impressions_organic',
            ],
            group_by: ['lfm.brand_view.id'],
            sort: [{ field: 'lfm.brand_view.id', dir: 'DESC' }],
            source_attributes: ['lfm.brand.name'],
        };

        //support.dump(requestData);
        let fetchOpts = {
            method: 'post',
            body: JSON.stringify(requestData),
        };

        try {
            const data = await session.fetch(
                '/v20200626/analytics/fetch',
                fetchOpts
            );
            fail('expected error response');
        } catch (err) {
            support.expectError(err, 401, 200010);
        }
    });

    test('test partial private data behavior', async () => {
        let requestData = {
            dataset_id: 'dataset_content_facebook',
            start_date: support.nDaysAgo(14),
            end_date: support.yesterday(),
            filters: [
                { field: 'lfm.brand.genres', operator: '=', values: ['News'] },
                {
                    field: 'lfm.brand.programmers',
                    operator: 'IN',
                    values: ['CBS', 'NBC'],
                },
            ],
            metrics: ['facebook.post_insight.fbpoi_impressions_paid'],
            group_by: ['lfm.brand_view.id', 'lfm.content.type'],
            sort: [
                { field: 'lfm.brand_view.id', dir: 'DESC' },
                { field: 'lfm.content.type', dir: 'ASC' },
            ],
            source_attributes: ['lfm.brand.name'],
        };

        //support.dump(requestData)

        let fetchOpts = {
            method: 'post',
            body: JSON.stringify(requestData),
        };

        const data = await session.fetch(
            '/v20200626/analytics/fetch',
            fetchOpts
        );
        //support.dump(data)
        support.expectTableResponse(data);
    });

    test('fetch all pages of analyitcs', async () => {
        let requestData = {
            dataset_id: 'dataset_brand_listenfirst',
            start_date: support.nDaysAgo(365),
            end_date: support.yesterday(),
            filters: [
                { field: 'lfm.brand_view.id', operator: '=', values: [176817] },
            ],
            metrics: [
                'lfm.audience_ratings.public_fan_acquisition_score',
                'lfm.audience_ratings.public_audience_footprint',
            ],
            group_by: ['lfm.fact.date_str', 'lfm.brand_view.id'],
            sort: [{ field: 'lfm.fact.date_str', dir: 'DESC' }],
            source_attributes: ['lfm.brand.name'],
            per_page: 100,
        };

        //support.dump(requestData);

        let fetchOpts = {
            method: 'post',
            body: JSON.stringify(requestData),
        };

        let results = [];
        let columns = null;
        let pageCnt = 0;
        const totalPages = await utils.fetchAllPages(
            session,
            '/v20200626/analytics/fetch',
            fetchOpts,
            (data) => {
                pageCnt += 1;
                expect(data.records).toBeTruthy();
                expect(data.records.length).toBeLessThanOrEqual(
                    requestData.per_page
                );
                if (columns === null) {
                    columns = data.columns;
                }
                results = results.concat(data.records);
            }
        );
        expect(totalPages).toBeGreaterThanOrEqual(365 / requestData.per_page);

        let tbl = { columns: columns, records: results, page: 1 };
        expect(results.length).toBe(365);

        //support.dump(data);
        let expectedCols = _.concat(
            requestData.metrics,
            requestData.group_by,
            requestData.source_attributes
        );
        support.expectTableResponse(tbl, expectedCols);
    });

    test('1000 brand limit', async () => {
        let tvBrands = await utils.findBrandSetByName(session, 'TV Universe');
        let tvBrandIDs = await utils.buildBrandViewCohort(
            session,
            null,
            tvBrands.id
        );
        expect(tvBrandIDs.length).toBeGreaterThan(1000);

        let requestData = {
            dataset_id: 'dataset_brand_facebook',
            start_date: support.nDaysAgo(7),
            end_date: support.yesterday(),
            filters: [
                {
                    field: 'lfm.brand_view.id',
                    operator: 'IN',
                    values: tvBrandIDs,
                },
            ],
            metrics: ['facebook.page.total_post_likes_c'],
            group_by: ['lfm.brand_view.id'],
        };

        let fetchOpts = {
            method: 'post',
            body: JSON.stringify(requestData),
        };

        try {
            const data = await session.fetch(
                '/v20200626/analytics/fetch',
                fetchOpts
            );
            fail('expected brand limit error');
        } catch (err) {
            //support.dump(err);
            support.expectError(err);
        }
    });
});
