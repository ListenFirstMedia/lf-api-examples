const session = require('./session');
const support = require('./testSupport');
const utils = require('./utils')

describe('Working with Brand View Sets', () => {

    test('list the brand sets the account has access to', async () => {
        const data = await session.fetch('/v20200626/brand_view_sets');
        //console.log(data);
        support.expectRecords(data)        
        data.records.forEach(bvs => {
            expect(bvs).toBeDefined();
            expect(bvs.id).toBeGreaterThan(0);
            expect(bvs.name).toBeTruthy();
            expect(bvs.label).toBeTruthy();            
        });
    });

    test('retrieve a brand view set by ID', async () => {                
        const data = await session.fetch('/v20200626/brand_view_sets/4626');        
        //console.log(data);       
        support.expectRecord(data); 
        expect(data.record.id).toBe(4626);
        expect(data.record.name).toBe('my-brands');
        expect(data.record.label).toBe('My Brands');
    });

    test('retrieve and page over all members of a brand view set', async () => {        
        
        let checkResponseFn = (data) => {
            console.log(data);
            support.expectRecords(data);       
            support.expectPaging(data);
            data.records.forEach(bv => support.expectBrandView(bv))
        }

        let pageCount = await utils.fetchAllPages(session, '/v20200626/brand_view_sets/4626/brand_views', checkResponseFn)
        //let data = await session.fetch('/v20200626/brand_view_sets/4626/brand_views');        
        expect(pageCount).toBeGreaterThan(1);

    });


});