#!/usr/bin/env node


const https = require('https');
const querystring = require('querystring');

const LFM_API_CONFIG = {
    api_key: process.env.LFM_API_KEY,
    client_id: process.env.LFM_API_CLIENT_ID,
    client_secret: process.env.LFM_API_CLIENT_SECRET,
    auth_host: (process.env.LFM_API_AUTH_HOST || "auth.lfmdev.in"),
    api_host: (process.env.LFM_API_HOST || "api.lfmdev.in")
};

/**
 * Perform OAuth 2.0 client credential workflow and obtain an access token
 * 
 * @param {Object} creds - the LF_API_CONFIG created at the top of the file
 * @returns {Promise<Object>} - returns the token response on success 
 */
function obtainAccessToken(creds) {
    return new Promise((resolve, reject) => {
        // prepare the post data
        const authData = querystring.stringify({
            client_id: creds.client_id,
            client_secret: creds.client_secret,            
            grant_type: 'client_credentials',
            scope: 'api/basic' // optional
        });

        // prepare the POST request
        const authReqOpts = {
            method: "POST", 
            path: "/oauth2/token",
            host: creds.auth_host,
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "content-length": Buffer.byteLength(authData),        
            }
        };

        // submit the request
        const req = https.request(authReqOpts, (res) => {                        
            let token = null;            
            res.setEncoding("utf-8");

            res.on("data", (chunk) => {                            
                let data = JSON.parse(chunk);                
                if (res.statusCode !== 200) {
                    reject({
                        status: res.statusCode,
                        error: `Auth endpoint returned status code: ${res.statusCode}`,
                        error_res: data
                    });
                } else {                    
                    token = data;
                }
            });

            res.on("end", () => {            
                if (token && token.access_token) {
                    resolve(token);
                } else {
                    reject({
                        status: res.statusCode,
                        error: "Unexpected response"                    
                    });                    
                }
            });

            res.on("error", ()=>{                
                reject({
                    status: res.statusCode,
                    error: "Unexpected response"                    
                });
            })
        });

        // send the POST data body and finalize the request
        req.write(authData);
        req.end();
  });
}


function getAPI(cfg, token, path) {
    return new Promise((resolve, reject) => {
        const reqOpts = {
            method: "GET", 
            path: path,
            host: cfg.api_host,
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${token.access_token}`,
                "x-api-key": cfg.api_key
            }
        };

        const req = https.request(reqOpts, (res) => {                                
            res.setEncoding("utf-8");

            res.on("data", (chunk) => {                            
                let data = JSON.parse(chunk);                
                if (res.statusCode !== 200) {
                    console.log(res.statusCode);
                    reject(data);
                } else {
                    resolve(data);                    
                }
            });

            res.on("error", () => {                
                reject({
                    status: res.statusCode,
                    error: "Unexpected response"                    
                });
            });
        });

        req.end();
  });
}

function listDatasets(config, token) {
    return getAPI(config, token, "/v20200626/datasets");
}

obtainAccessToken(LFM_API_CONFIG)
    .then((token) => {
        console.log("Obtained an access token");
        console.log(token);
        return listDatasets(LFM_API_CONFIG, token);
    })
    .then((datasets) => {
        console.log(datasets);
    })  
    .catch((error) => {
        console.log("Failed to list datasets");
        console.log(error);
    });
    