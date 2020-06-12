const support = require('./testSupport');
const session = require('./session');
const utils = require('./utils');
const _ = require('lodash');
const querystring = require('querystring');

describe('Performing Analytics', () => {

    test('retrieve a few metrics for a single brand', async () => {        
        let requestData = {
            ids: [176817],
            dataset_id: 'dataset_brand_listenfirst',
            start_date: support.nDaysAgo(7),
            end_date: support.yesterday(),
            metrics: [
                'lfm.audience_ratings.public_fan_acquisition_score',
                'lfm.audience_ratings.public_audience_footprint'	
            ],
            group_by: [
                'lfm.fact.date_str',
                'lfm.brand_view.id'
            ],
            sort: [
                {field: 'lfm.fact.date_str', dir: "DESC"}
            ], 
            source_attributes: ['lfm.brand.name'],            
        }

        //console.log(requestData);

        let fetchOpts = {
            method: 'post',
            body: JSON.stringify(requestData)
        }

        const data = await session.fetch('/v20200626/analytics/fetch', fetchOpts);
        //console.log(data);
        let expectedCols = _.concat(requestData.metrics, requestData.group_by, requestData.source_attributes);
        support.expectTableResponse(data, expectedCols);
    });


    test('retrieve my accounts top 100 facebook videos from last month', async () => {        
        let myBrands = await utils.findBrandSetByName(session, 'My Brands');
        let myBrandViewIDs = await utils.buildBrandViewCohort(session, [], myBrands.id);

        let [som, eom] = support.lastMonth();
        let requestData = {
            ids: myBrandViewIDs,
            dataset_id: 'dataset_content_facebook',
            start_date: som,
            end_date: eom,
            filters: [
                {field: 'lfm.content.channel', 'operator': '=', 'values': ['facebook']},
                {field: 'lfm.content.type', 'operator': '=', 'values': ['video']},
            ],
            metrics: [
                'facebook.post.interactions'
            ],
            group_by: [
                'lfm.content.posted_on_date_str',
                'lfm.content.id',
                'lfm.brand_view.id'
            ],
            sort: [
                {field: 'facebook.post.interactions', dir: "DESC"}
            ], 
            source_attributes: ['lfm.content.author_name', 'lfm.content.link'],
            per_page: 100            
        }

        //console.log(requestData);
        let fetchOpts = {
            method: 'post',
            body: JSON.stringify(requestData)
        }

        const data = await session.fetch('/v20200626/analytics/fetch', fetchOpts);
        //console.log(data);
        let expectedCols = _.concat(requestData.metrics, requestData.group_by, requestData.source_attributes);
        support.expectTableResponse(data, expectedCols);
    });

    test('retrieve private metrics for a brand', async () => {
        let myBrands = await utils.findBrandSetByName(session, 'My Brands');
        let cbsNewsBrandIDs = [];
        await utils.fetchAllPages(session, `/v20200626/brand_view_sets/${myBrands.id}/brand_views`, (data) => {
            data.records.forEach((bv) => {
                if (bv.type == 'CUSTOM' && /CBS News/.test(bv.name)) {
                    cbsNewsBrandIDs.push(bv.id);  
                }
            });
        });

        let requestData = {
            ids: cbsNewsBrandIDs,
            dataset_id: 'dataset_brand_facebook',
            start_date: support.nDaysAgo(14),
            end_date: support.yesterday(),
            metrics: [
                'facebook.page_insight.fbpai_video_views_organic',
                'facebook.page_insight.fbpai_impressions_organic'	
            ],
            group_by: [                
                'lfm.brand_view.id'
            ],
            sort: [
                {field: 'lfm.brand_view.id', dir: "DESC"}
            ], 
            source_attributes: ['lfm.brand.name'], 
        }

        let fetchOpts = {
            method: 'post',
            body: JSON.stringify(requestData)
        }

        const data = await session.fetch('/v20200626/analytics/fetch', fetchOpts);
        console.log(JSON.stringify(data, null, 2));
        let expectedCols = _.concat(requestData.metrics, requestData.group_by, requestData.source_attributes);
        support.expectTableResponse(data, expectedCols);
    });

    async function fetchMixedBrands() {
        let mixedBrandIDs = [];
        let filters = [
            { field: 'lfm.brand.genres', operation: '=', values: ['News']}
        ];
        await utils.fetchAllPages(session, `/v20200626/brand_views`, (data) => {
            data.records.forEach((bv) => {
                if (bv.type == 'CUSTOM' && /CBS News/.test(bv.name)) {
                    console.log(bv.name);
                    mixedBrandIDs.push(bv.id);  
                }

                if (bv.type == 'STANDARD' && /Today Show/.test(bv.name)) {
                    console.log(bv.name);
                    mixedBrandIDs.push(bv.id);  
                }
            });
        });
        return mixedBrandIDs;
    }

    test('test strict private data behavior', async () => {
        let mixedBrandIDs = await fetchMixedBrands();
        
        let requestData = {
            ids: mixedBrandIDs,
            dataset_id: 'dataset_brand_facebook',
            start_date: support.nDaysAgo(14),
            end_date: support.yesterday(),
            metrics: [
                'facebook.page_insight.fbpai_video_views_organic',
                'facebook.page_insight.fbpai_impressions_organic'	
            ],
            group_by: [                
                'lfm.brand_view.id'
            ],
            sort: [
                {field: 'lfm.brand_view.id', dir: "DESC"}
            ], 
            source_attributes: ['lfm.brand.name'], 
        }

        let fetchOpts = {
            method: 'post',
            body: JSON.stringify(requestData)
        }

        try {
            const data = await session.fetch('/v20200626/analytics/fetch', fetchOpts);
            fail('expected error response');
        } catch(err) {
            console.log(JSON.stringify(err, null, 2))
            support.expectError(err, 401, 200010);
        }        
    });

    test('test partial private data behavior', async () => {
        let mixedBrandIDs = await fetchMixedBrands();
        
        let requestData = {
            ids: mixedBrandIDs,
            dataset_id: 'dataset_content_facebook',
            start_date: support.nDaysAgo(14),
            end_date: support.yesterday(),
            metrics: [
                'facebook.post_insight.fbpoi_impressions_paid',
            ],
            group_by: [                
                'lfm.brand_view.id',
                'lfm.content.type'
            ],
            sort: [
                {field: 'lfm.brand_view.id', dir: "DESC"},
                {field: 'lfm.content.type', dir: "ASC"},

            ], 
            source_attributes: ['lfm.brand.name'], 
        }

        console.log(JSON.stringify(requestData, null, 2));
        
        let fetchOpts = {
            method: 'post',
            body: JSON.stringify(requestData)
        }
        
        const data = await session.fetch('/v20200626/analytics/fetch', fetchOpts);
        console.log(JSON.stringify(data, null, 2));
        support.expectTableResponse(data);        
    });
});