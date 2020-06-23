#!/usr/bin/env node

const https = require('https');

// read access token from first argument of the process
const access_token = process.argv[2];
const api_key = process.env.LFM_API_KEY;

https.request({
    protocol: 'https:',    
    port: 443,
    path: '/v20200626/dictionary/datasets',
    host: 'api.lfmdev.in',
    headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${access_token}`,
        "x-api-key": api_key
    }
}, (res) => {
    res.setEncoding("utf-8");
    res.on("data", (chunk) => {
        let data = JSON.parse(chunk);
        console.log(`status code: ${res.statusCode}`);
        console.log(data);
        
    });
}).end();

