const support = require('./testSupport');
const session = require('./session');
const utils = require('./utils');
const _ = require('lodash');
const querystring = require('querystring');

describe('Working with Brand Views', () => {
    test('retrieve a brand view by ID', async () => {        
        const data = await session.fetch('/v20200626/brand_views/176817');
        //console.log(data);
        support.expectRecord(data);
        support.expectBrandView(data.record);        
    });

    test('list all brand views', async() => {
        const data = await session.fetch('/v20200626/brand_views?per_page=853');
        //console.log(data);
        support.expectRecords(data);
        data.records.forEach(bv => {
            support.expectBrandView(bv)
        });
        expect(data.records.length).toBe(853);
        //support.expectPaging(data);
    });

    test('page through all brand views', async() => {        
        const totalPages = await utils.fetchAllPages(session, '/v20200626/brand_views?per_page=10000', (data) =>{
        //console.log(data);
            support.expectRecords(data);
            data.records.forEach(bv => {
                support.expectBrandView(bv)
            });
        });
        expect(totalPages).toBeGreaterThan(1);
        //support.expectPaging(data);
    });

    test('limit the list of brand views with per_page', async() => {
        let params = querystring.stringify({per_page: 2});
        const data = await session.fetch(`/v20200626/brand_views?${params}`);
        //console.log(data);
        support.expectRecords(data);
        support.expectPaging(data);
        //expect(data.record_count).toBeGreaterThan(2);
        expect(data.records.length).toBe(2);
        expect(data.has_more_pages).toBe(true);
    });

    test('list my brands', async () => {
        let myBrands = await utils.findBrandSetByName(session, 'My Brands');
        expect(myBrands).toBeTruthy();
        let data = await session.fetch(`/v20200626/brand_view_sets/${myBrands.id}/brand_views`);        
        
        let checkResponseFn = (data) => {
            support.expectRecords(data);       
            //support.expectPaging(data);
            data.records.forEach(bv => support.expectBrandView(bv))
        }

        checkResponseFn(data);
    });


    test('find prime time comedy episodic TV shows', async () => {
        let tvBrandSet = await utils.findBrandSetByName(session, /TV Universe/);
        expect(tvBrandSet).toBeDefined();

        let fields = [
            'lfm.brand.broadcast_dayparts',
            //'lfm.brand.name',
            'lfm.brand.genres',
            'lfm.brand.programmers',
            'lfm.brand.programmer_types',
            //'lfm.brand.in_season',
            'lfm.brand.primary_genre' 
            //'lfm.brand_view.id'
        ];

        let filters = [];
        //filters.push({ field: 'lfm.brand.in_season', operator: '=', values: [true] });
        filters.push({ field: 'lfm.brand.genres', operator: '=', values: ['Comedy'] });
        filters.push({ field: 'lfm.brand.primary_genre', operator: '=', values: ['Comedy'] });
        filters.push({ field: 'lfm.brand.broadcast_dayparts', operator: '=', values: ['Prime Time'] });
        filters.push({ field: 'lfm.brand.programmer_types', operator: '=', values: ['Premium Cable'] });
        filters.push({ field: 'lfm.brand.programmers', operator: 'IN', values: ['HBO', 'Showtime', 'Epix'] });
        //filters.push({ field: 'lfm.brand_view.id', operator: 'IN', values: [ 170749, 168428 ]});
        //filters.push({ field: 'lfm.brand.name', operator: '=', values: ['The Righteous Gemstones'] })

        
        let sort = [];
        sort.push({field: 'lfm.brand.name', dir: 'DESC'});

        let sortParam = JSON.stringify(sort);
        let filterParam = JSON.stringify(filters);
        let fieldsParam = _.join(fields, ',');

        let queryStr = querystring.stringify({fields: fieldsParam, sort: sortParam, filters: filterParam});
        //console.log(queryStr);
        

        const data = await session.fetch(`/v20200626/brand_view_sets/${tvBrandSet.id}/brand_views?${queryStr}`);     
        //console.log(data);   
        support.expectRecords(data);
        data.records.forEach(bv => {
            support.expectBrandView(bv, fields)
            //console.log(JSON.stringify(bv));
        });
        //support.expectPaging(data);
        let [stdBrands, customBrands] = _.partition(data.records, (bv) => bv.type === 'STANDARD');
        expect(stdBrands.length).toBeGreaterThan(0);
        expect(customBrands.length).toBe(0);
    });

    test('find all Showtime brands', async () => {        
        let fields = [
            'lfm.brand.broadcast_dayparts',
            //'lfm.brand.name',
            'lfm.brand.genres',
            'lfm.brand.programmers',
            'lfm.brand.programmer_types',
            //'lfm.brand.in_season',
            'lfm.brand.primary_genre' 
            //'lfm.brand_view.id'
        ];

        let filters = [];
        //filters.push({ field: 'lfm.brand.in_season', operator: '=', values: [true] });
        // filters.push({ field: 'lfm.brand.genres', operator: '=', values: ['Comedy'] });
        // filters.push({ field: 'lfm.brand.primary_genre', operator: '=', values: ['Comedy'] });
        // filters.push({ field: 'lfm.brand.broadcast_dayparts', operator: '=', values: ['Prime Time'] });
        // filters.push({ field: 'lfm.brand.programmer_types', operator: '=', values: ['Premium Cable'] });
        // filters.push({ field: 'lfm.brand.programmers', operator: 'IN', values: ['HBO', 'Showtime', 'Epix'] });
        
        //filters.push({ field: 'lfm.brand_view.type', operator: '=', values: ['CUSTOM'] });
        filters.push({ field: 'lfm.brand.programmers', operator: '=', values: ['Showtime'] });

        //filters.push({ field: 'lfm.brand_view.id', operator: 'IN', values: [ 170749, 168428 ]});
        //filters.push({ field: 'lfm.brand.name', operator: '=', values: ['The Righteous Gemstones'] })

        
        let sort = [];
        sort.push({field: 'lfm.brand.name', dir: 'DESC'});

        let sortParam = JSON.stringify(sort);
        let filterParam = JSON.stringify(filters);
        let fieldsParam = _.join(fields, ',');

        let queryStr = querystring.stringify({fields: fieldsParam, sort: sortParam, filters: filterParam});
        //console.log(queryStr);
        

        const data = await session.fetch(`/v20200626/brand_views?${queryStr}`);     
        //console.log(data);   
        support.expectRecords(data);        
        data.records.forEach(bv => {
            support.expectBrandView(bv, fields)            
            //console.log(JSON.stringify(bv));
        });
        let [stdBrands, customBrands] = _.partition(data.records, (bv) => bv.type === 'STANDARD');
        expect(stdBrands.length).toBeGreaterThan(0);
        expect(customBrands.length).toBeGreaterThan(0);
        //support.expectPaging(data);
    });
});