const session = require('./session');
const support = require('./testSupport');


describe('Working with Datasets', () => {

    test('can list all datasets', async () => {
        const data = await session.fetch('/v20200626/datasets');
        //console.log(data);
        support.expectRecords(data);        
        data.records.forEach(ds => {
            support.expectDatasetBasic(ds);
        });
    });

    test('can describe a datasets', async () => {
        const data = await session.fetch('/v20200626/datasets/dataset_content_listenfirst');
        //console.log(data);
        support.expectRecord(data);
        let ds = data.record;
        support.expectDataset(ds);                
    });

    test('can list values of a listable brand dimension', async () => {
        const data = await session.fetch('/v20200626/list_values?field=lfm.brand.genres');
        support.expectTableResponse(data);        
    });

    test('can list values of a listable content dimension', async () => {
        const data = await session.fetch('/v20200626/list_values?field=lfm.content.channel');
        //support.dump(data);
        support.expectTableResponse(data);        
    });
});
