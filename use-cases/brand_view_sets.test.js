const querystring = require('querystring');
const session = require('./session');
const support = require('./testSupport');
const utils = require('./utils')
const _ = require('lodash');

describe('Working with Brand View Sets', () => {

    test('list the brand sets the account has access to', async () => {
        const data = await session.fetch('/v20200626/brand_view_sets');
        //console.log(data);
        support.expectRecords(data)        
        data.records.forEach(bvs => {
            expect(bvs).toBeDefined();
            expect(bvs.id).toBeGreaterThan(0);
            expect(bvs.name).toBeTruthy();
        });
    });

    test('retrieve a brand view set by ID', async () => {                
        const data = await session.fetch('/v20200626/brand_view_sets/4626');        
        //console.log(data);       
        support.expectRecord(data); 
        expect(data.record.id).toBe(4626);
        expect(data.record.name).toBe('My Brands');
    });

    test('retrieve and page over all members of a brand view set', async () => {        
        
        let checkResponseFn = (data) => {
            //console.log(data);
            support.expectRecords(data);       
            support.expectPaging(data);
            data.records.forEach(bv => {
                //console.log(JSON.stringify(bv));
                support.expectBrandView(bv)
            })
        }

        let fields = [
            //'lfm.brand.name',
            'lfm.brand.genres',
            'lfm.brand.programmers',
            'lfm.brand.programmer_types'
        ];        

        let sort = [
            { field: 'lfm.brand.name', dir: 'DESC'},
            //{ field: 'lfm.brand_view.id', dir: 'DESC'}            
        ]

        let queryParams = querystring.stringify({
            //fields: _.join(fields, ','), 
            sort: JSON.stringify(sort)
        }); 
        
        let path = `/v20200626/brand_view_sets/4626/brand_views?${queryParams}`;
        let pageCount = await utils.fetchAllPages(session, path, checkResponseFn)
        //expect(pageCount).toBeGreaterThan(1);

    });


    test('filter members of a brand view set', async () => {        
        let myBrands = await utils.findBrandSetByName(session, 'My Brands');
        let myBrandViewID = myBrands.id;
        let checkResponseFn = (data) => {
            //console.log(data);
            support.expectRecords(data);       
            support.expectPaging(data);
            data.records.forEach(bv => {
                //console.log(JSON.stringify(bv));
                support.expectBrandView(bv, fields)

                expect(bv.dimensions['lfm.brand.programmers']).toContain('Showtime');
            })
        }

        let fields = [
            //'lfm.brand.name',
            'lfm.brand.genres',
            'lfm.brand.programmers',
            'lfm.brand.programmer_types'
        ];        

        let filters = [
            { field: 'lfm.brand.programmers', operator: '=', values:['Showtime']}
        ];

        let sort = [
            { field: 'lfm.brand.name', dir: 'DESC'},
            //{ field: 'lfm.brand_view.id', dir: 'DESC'}            
        ]

        let queryParams = querystring.stringify({
            fields: _.join(fields, ','), 
            sort: JSON.stringify(sort),
            filters: JSON.stringify(filters)
        }); 
        
        let path = `/v20200626/brand_view_sets/${myBrandViewID}/brand_views?${queryParams}`;
        let pageCount = await utils.fetchAllPages(session, path, checkResponseFn)
        //expect(pageCount).toBeGreaterThan(1);

    });


    test('limit brand view sets returned with per page param', async () => {        
        const data = await session.fetch('/v20200626/brand_view_sets?per_page=2');
        support.expectRecords(data);
        support.expectPaging(data);
        expect(data.records.length).toBe(2);
        expect(data.record_count).toBeGreaterThan(2);
        expect(data.next_page_token).toBeTruthy();
    });

    test('limit the members of a brand view set returned with per page param', async () => {     
        let myBrands = await utils.findBrandSetByName(session, 'My Brands');
        let myBrandViewID = myBrands.id;   
        let path = `/v20200626/brand_view_sets/${myBrandViewID}/brand_views?per_page=2`
        const data = await session.fetch(path);
        support.expectRecords(data);
        support.expectPaging(data);
        expect(data.records.length).toBe(2);
        expect(data.record_count).toBeGreaterThan(2);
        expect(data.next_page_token).toBeTruthy();
    });
});