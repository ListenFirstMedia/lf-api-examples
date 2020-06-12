const _ = require('lodash');
const querystring = require('querystring');

async function findBrandSetByName(session, nameRX) {
    let setData = await session.fetch('/v20200626/brand_view_sets');
    return _.find(setData.records, (bvs) => {
        return new RegExp(nameRX).test(bvs.name)
    });
};


async function filterBrandSetsByName(session, nameRX) {
    let setData = await session.fetch('/v20200626/brand_view_sets');
    return _.filter(setData.records, (bvs) => {
        return new RegExp(nameRX).test(bvs.name)
    });
};

async function fetchAllPages(session, path, opts, pageCallback) {
    let args =   Array.from(arguments)
    let cb = args.slice(-1)[0]
    let pageCount = 0;
    let data = await session.fetch(path, opts);
    //console.log(path);
    cb(data);

    pageCount += 1;
    while (data && data.next_page_token) {
        let pageParam = querystring.stringify({page_token: data.next_page_token});
        let sep = (path.indexOf('?') >= 0) ? '&' : '?';
        let pathWithPageToken = `${path}${sep}${pageParam}`;
        data = await session.fetch(pathWithPageToken, opts);
        pageCount += 1;
        cb(data);        
    }

    return pageCount;
};


async function buildBrandViewCohort(session, filters, brandSetID) {

    let path = '/v20200626/brand_views';
    if (brandSetID) {
        path = `/v20200626/brand_view_sets/${brandSetID}/brand_views`;
    }
    
    if (filters && filters.length > 0) {
        let filterParam = JSON.stringify(filters);    
        let queryStr = querystring.stringify({filters: filterParam});    
        path = `${path}?${queryStr}`;
    }

    let brandViewIDs = [];
    await fetchAllPages(session, path, (data) =>{
        brandViewIDs = _.concat(brandViewIDs, _.map(data.records, (bv) => bv.id))
    });

    return brandViewIDs;
}
    
const Utils = {
    filterBrandSetsByName,
    findBrandSetByName,
    fetchAllPages,
    buildBrandViewCohort    
};

module.exports = Utils;