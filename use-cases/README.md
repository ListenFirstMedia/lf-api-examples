# API Use Cases

This folder contains black box functional tests that were built to
verify core functionality and behavior of the API, as well as to
start to produce example code for documentation purposes.

## Getting Started

1.  npm install
2.  configure the following environment variables:
    -   (required) LFM_API_KEY
    -   (required) LFM_API_CLIENT_ID
    -   (required) LFM_API_CLIENT_SECRET
    -   (optional) LFM_API_AUTH_HOST - defaults to 'auth.lfmdev.in'
    -   (optional) LFM_API_HOST - defaults to 'api.lfmdev.in'
3.  npm run test

NOTE: the tests assume the Client ID used belongs to the CBSi account. The CTO Key
in the dev enviornment is currently configured this way.

```
export LFM_API_KEY="H2NOnUoDHq7ve8CJj5GwW6463oRdIXeg6tHHlTfM"
export LFM_API_CLIENT_ID="7m3md2pfnbntupn96g2rvfjnk7"
export LFM_API_CLIENT_SECRET="< RETRACTED >"
export LFM_API_AUTH_HOST="auth.lfmdev.in"
export LFM_API_HOST="api.lfmdev.in"
```
