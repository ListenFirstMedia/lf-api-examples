const _ = require('lodash');
const querystring = require('querystring');

async function delay(ms) {
    return await new Promise((resolve) => setTimeout(resolve, ms));
}

async function findBrandSetByName(session, nameRX) {
    let brandSets = await filterBrandSetsByName(session, nameRX);
    return brandSets[0];
}

async function filterBrandSetsByName(session, nameRX) {
    let brandSets = [];
    await fetchAllPages(session, '/v20200626/brand_view_sets', (data) => {
        brandSets = brandSets.concat(
            _.filter(data.records, (bvs) => {
                return new RegExp(nameRX).test(bvs.name);
            })
        );
    });
    return brandSets;
}

async function fetchAllPages(session, path, opts, pageCallback) {
    let args = Array.from(arguments);
    let cb = args.slice(-1)[0];
    let currentPage = 1;
    let data = await session.fetch(path, opts);
    cb(data);

    while (data && data.has_more_pages === true) {
        currentPage += 1;
        let pathWithPaging = null;
        if (opts && opts.body) {
            let body = JSON.parse(opts.body);
            body.page = currentPage;
            opts.body = JSON.stringify(body);
            pathWithPaging = path;
        } else {
            let pageParam = querystring.stringify({ page: currentPage });
            let sep = path.indexOf('?') >= 0 ? '&' : '?';
            pathWithPaging = `${path}${sep}${pageParam}`;
        }

        //console.log(pathWithPaging);
        await delay(500); // sleep between pages
        data = await session.fetch(pathWithPaging, opts);

        cb(data);
    }

    return currentPage;
}

async function buildBrandViewCohort(session, filters, brandSetID) {
    let path = '/v20200626/brand_views?per_page=1000';
    if (brandSetID) {
        path = `/v20200626/brand_view_sets/${brandSetID}/brand_views?per_page=1000`;
    }

    if (filters && filters.length > 0) {
        let filterParam = JSON.stringify(filters);
        let queryStr = querystring.stringify({ filters: filterParam });
        path = `${path}?${queryStr}`;
    }

    let brandViewIDs = [];
    await fetchAllPages(session, path, (data) => {
        brandViewIDs = _.concat(
            brandViewIDs,
            _.map(data.records, (bv) => bv.id)
        );
    });

    return brandViewIDs;
}

const Utils = {
    filterBrandSetsByName,
    findBrandSetByName,
    fetchAllPages,
    buildBrandViewCohort,
};

module.exports = Utils;
