const fetch = require('node-fetch');

async function fetchAnalytics(api_key, access_token) {
    let requestData = {
        dataset_id: 'dataset_brand_listenfirst',
        start_date: '2020-06-11',
        end_date: '2020-06-24',
        filters: [
            {
                field: 'lfm.brand_view.set_names',
                operator: 'IN',
                values: ['My Brands'],
            },
        ],
        metrics: [
            'lfm.audience_ratings.public_audience_footprint',
            'lfm.owned_videos_score.public_owned_video_views',
        ],
        group_by: ['lfm.brand_view.id'],
        sort: [{ field: 'lfm.brand_view.id', dir: 'DESC' }],
        meta_dimensions: ['lfm.brand.name'],
    };

    let fetchOpts = {
        method: 'post',
        body: JSON.stringify(requestData),
        headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${access_token}`,
            'x-api-key': api_key,
        },
    };

    let res = await fetch(
        'https://listenfirst.io/v20200626/analytics/fetch',
        fetchOpts
    );
    return await res.json();
}
