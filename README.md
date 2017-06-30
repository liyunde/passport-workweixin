
# passport-workweixin

[Passport](http://passportjs.org/) strategy for authenticating with workweixin
using the OAuth 2.0 API.

This module lets you authenticate using Workweixin in your Node.js applications.
By plugging into Passport, workweixin authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install

    $ npm install passport-workweixin --save

## Usage

#### Create an Application

Before using `passport-workweixin`, you must register an application with
workweixin.  Your application will
be issued an app ID and app secret, which need to be provided to the strategy.
You will also need to configure a redirect URI which matches the route in your
application.

#### Configure Strategy

The Workweixin authentication strategy authenticates users using a Workweixin
account and OAuth 2.0 tokens.  The app ID and secret obtained when creating an
application are supplied as options when creating the strategy.  The strategy
also requires a `verify` callback, which receives the access token and optional
refresh token, as well as `profile` which contains the authenticated user's
Workweixin profile.  The `verify` callback must call `cb` providing a user to
complete authentication.

```js
passport.use(new WorkweixinStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/workweixin/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ workweixinId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'workweixin'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```js
app.get('/auth/workweixin',
  passport.authenticate('workweixin'));

app.get('/auth/workweixin/callback',
  passport.authenticate('workweixin', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
```

##### How do I re-ask for for declined permissions?

Set the `authType` option to `rerequest` when authenticating.

```js
app.get('/auth/workweixin',
  passport.authenticate('workweixin', { authType: 'rerequest', scope: ['user_friends', 'manage_pages'] }));
```

##### How do I obtain a user profile with specific fields?

The workweixin profile contains a lot of information about a user.  By default,
not all the fields in a profile are returned.  The fields needed by an application
can be indicated by setting the `profileFields` option.

```js
new WorkweixinStrategy({
  clientID: FACEBOOK_APP_ID,
  clientSecret: FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/workweixin/callback",
  profileFields: ['id', 'displayName', 'photos', 'email']
}), ...)
```

##### How do I include app secret proof in API requests?

Set the `enableProof` option when creating the strategy.

```js
new WorkweixinStrategy({
  clientID: FACEBOOK_APP_ID,
  clientSecret: FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/workweixin/callback",
  enableProof: true
}, ...)
```


## Contributing

#### Tests

The test suite is located in the `test/` directory.  All new features are
expected to have corresponding test cases.  Ensure that the complete test suite
passes by executing:

```bash
$ make test
```

#### Coverage

The test suite covers 100% of the code base.  All new feature development is
expected to maintain that level.  Coverage reports can be viewed by executing:

```bash
$ make test-cov
$ make view-cov
```

## Configuration

```js
// config/config.default.js
exports.passportWorkweixin = {
  key: 'your oauth key',
  secret: 'your oauth secret',
  agentId: 0,
  callbackURL: '/passport/workweixin/callback'
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Questions & Suggestions

Please open an issue [here](https://github.com/liyunde/passport-workweixin/issues).

## License

[Apache 2.0](LICENSE)
