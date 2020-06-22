const https = require('https');
const querystring = require('querystring');
const _ = require('lodash');
const _fetch = require('node-fetch');

const LFM_API_CONFIG = {
    api_key: process.env.LFM_API_KEY,
    client_id: process.env.LFM_API_CLIENT_ID,
    client_secret: process.env.LFM_API_CLIENT_SECRET,
    auth_host: process.env.LFM_API_AUTH_HOST || 'auth.lfmdev.in',
    api_host: process.env.LFM_API_HOST || 'api.lfmdev.in',
};

async function obtainAccessToken() {
    return new Promise((resolve, reject) => {
        // prepare the post data
        const authData = querystring.stringify({
            client_id: LFM_API_CONFIG.client_id,
            client_secret: LFM_API_CONFIG.client_secret,
            grant_type: 'client_credentials',
            scope: 'api/basic',
        });

        // prepare the POST request
        const authReqOpts = {
            method: 'POST',
            path: '/oauth2/token',
            host: LFM_API_CONFIG.auth_host,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'content-length': Buffer.byteLength(authData),
            },
        };

        // submit the request
        const req = https.request(authReqOpts, (res) => {
            let token = null;
            res.setEncoding('utf-8');

            res.on('data', (chunk) => {
                let data = JSON.parse(chunk);
                if (res.statusCode !== 200) {
                    reject({
                        status: res.statusCode,
                        error: `Auth endpoint returned status code: ${res.statusCode}`,
                        error_res: data,
                    });
                } else {
                    token = data;
                }
            });

            res.on('end', () => {
                if (token && token.access_token) {
                    resolve(token);
                } else {
                    reject({
                        status: res.statusCode,
                        error: 'Unexpected response',
                    });
                }
            });

            res.on('error', () => {
                reject({
                    status: res.statusCode,
                    error: 'Unexpected response',
                });
            });
        });

        // send the POST data body and finalize the request
        req.write(authData);
        req.end();
    });
}

const Session = {
    getAccessToken: async function () {
        const tok = await new Promise((resolve, reject) => {
            if (this.access_token !== undefined) {
                resolve(this);
            } else {
                resolve(obtainAccessToken());
            }
        });
        this.access_token = tok.access_token;
        return this.access_token;
    },

    fetch: async function (relPath, opts = {}) {
        const access_token = await this.getAccessToken();
        const defaultOpts = {
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${access_token}`,
                'x-api-key': `${LFM_API_CONFIG.api_key}`,
            },
        };
        const fetchOpts = _.merge({}, opts, defaultOpts);
        let fqUrl = `https://${LFM_API_CONFIG.api_host}${relPath}`;
        const res = await _fetch(fqUrl, fetchOpts);
        const data = await res.json();
        if (res.ok) {
            return data;
        } else {
            console.log(data);
            if (res.status === 429) {
                // sleep and retry
                await new Promise((resolve) => setTimeout(resolve, 60000));
                return this.fetch(relPath, opts);
            }

            throw data; //new Error(data);//`fetch ${relPath} returned status: ${res.status}`);
        }
    },
};

module.exports = Session;
