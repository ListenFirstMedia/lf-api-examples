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
        let myBrands = await utils.findBrandSetByName(session, 'My Brands');
        let myBrandViewIDs = await utils.buildBrandViewCohort(
            session,
            [],
            myBrands.id
        );

        let [som, eom] = support.lastMonth();
        let requestData = {
            dataset_id: 'dataset_content_facebook',
            start_date: som,
            end_date: eom,
            filters: [
                // if the following field is supported, it woulld replace mBrandViewIDs
                // {field: "lfm.brand_view_set.id", operator: '=', values: [myBrands.id]},
                {
                    field: 'lfm.brand_view.id',
                    operator: 'IN',
                    values: myBrandViewIDs,
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
    });

    test('retrieve private metrics for a brand', async () => {
        let myBrands = await utils.findBrandSetByName(session, 'My Brands');
        let cbsNewsBrandIDs = [];
        let filters = JSON.stringify([
            {
                field: 'lfm.brand.name',
                operator: 'ILIKE',
                values: ['CBS News%'],
            },
            { field: 'lfm.brand_view.type', operator: '=', values: ['CUSTOM'] },
        ]);
        let queryParam = querystring.stringify({ filters });
        let path = `/v20200626/brand_view_sets/${myBrands.id}/brand_views?${queryParam}`;
        await utils.fetchAllPages(session, path, (data) => {
            data.records.forEach((bv) => {
                if (bv.type == 'CUSTOM' && /CBS News/.test(bv.name)) {
                    cbsNewsBrandIDs.push(bv.id);
                } else if (bv.type == 'CUSTOM') {
                    fail("ILIKE didn't work");
                } else {
                    fail('brand_view.type filter did not work');
                }
            });
        });

        let requestData = {
            dataset_id: 'dataset_brand_facebook',
            start_date: support.nDaysAgo(14),
            end_date: support.yesterday(),
            filters: [
                // once these are supported, they would replcaes the brand_view.id IN filter
                // { field: 'lfm.brand_vew_set.name', operator: '=', values:['My Brands']},
                // { field: 'lfm.brand.name', operator: 'ILIKE', values:['CBS News%']},
                // { field: 'lfm.brand_view.type', operator: '=', values: ['CUSTOM']},
                {
                    field: 'lfm.brand_view.id',
                    operator: 'IN',
                    values: cbsNewsBrandIDs,
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

    async function fetchMixedBrands() {
        let mixedBrandIDs = [];
        let filters = [
            { field: 'lfm.brand.genres', operator: '=', values: ['News'] },
            {
                field: 'lfm.brand.programmers',
                operator: 'IN',
                values: ['CBS', 'NBC'],
            },
        ];
        let query = querystring.stringify({
            per_page: 1000,
            filters: JSON.stringify(filters),
        });
        let allBrandIDs = [];
        await utils.fetchAllPages(
            session,
            `/v20200626/brand_views?${query}`,
            (data) => {
                data.records.forEach((bv) => {
                    allBrandIDs.push(bv.id);
                    if (bv.type == 'CUSTOM' && /CBS News/.test(bv.name)) {
                        mixedBrandIDs.push(bv.id);
                    }

                    if (bv.type == 'STANDARD' && /Today Show/.test(bv.name)) {
                        mixedBrandIDs.push(bv.id);
                    }
                });
            }
        );
        return mixedBrandIDs;
    }

    test('test strict private data behavior', async () => {
        let mixedBrandIDs = await fetchMixedBrands();

        let requestData = {
            dataset_id: 'dataset_brand_facebook',
            start_date: support.nDaysAgo(14),
            end_date: support.yesterday(),
            filters: [
                {
                    field: 'lfm.brand_view.id',
                    operator: 'IN',
                    values: mixedBrandIDs,
                },
                { field: 'lfm.brand.genres', operator: '=', values: ['News'] },
                {
                    field: 'lfm.brand.programmers',
                    operator: 'IN',
                    values: ['CBS', 'NBC'],
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
        console.log(tvBrandIDs.length);

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
            support.dump(err);
            support.expectError(err);
        }
    });
});
