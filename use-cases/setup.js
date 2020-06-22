const session = require('./session');

beforeAll(() => {
    return session
        .getAccessToken()
        .then((access_token) => expect(access_token).toBeDefined());
});
