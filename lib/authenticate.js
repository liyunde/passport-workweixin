/**
 * Created by liyunde on 2017/7/1.
 */

var passport = require('passport-strategy')
  , url = require('url')
  , util = require('util')
  , utils = require('passport-oauth2/lib/utils')
  , AuthorizationError = require('passport-oauth2/lib/errors/authorizationerror')
;

exports.authenticate = function (req, options) {

  options = options || {};
  var self = this;

  if (req.query && req.query.error) {
    if (req.query.error === 'access_denied') {
      return this.fail({message: req.query.error_description});
    } else {
      return this.error(new AuthorizationError(req.query.error_description, req.query.error, req.query.error_uri));
    }
  }

  var callbackURL = options.callbackURL || this._callbackURL;
  if (callbackURL) {
    var parsed = url.parse(callbackURL);
    if (!parsed.protocol) {
      // The callback URL is relative, resolve a fully qualified URL from the
      // URL of the originating request.
      callbackURL = url.resolve(utils.originalURL(req, {proxy: this._trustProxy}), callbackURL);
    }
  }

  var meta = {
    authorizationURL: this._oauth2._authorizeUrl,
    tokenURL: this._oauth2._accessTokenUrl,
    clientID: this._oauth2._clientId
  }

  if (req.query && req.query.code) {
    function loaded(err, ok, state) {
      if (err) {
        return self.error(err);
      }
      if (!ok) {
        return self.fail(state, 403);
      }

      var code = req.query.code;

      var params = self.tokenParams(options);
      params.grant_type = 'authorization_code';
      if (callbackURL) {
        params.redirect_uri = callbackURL;
      }

      console.info(callbackURL);


      self._convertCodeToUser(code, function (err, userId, ticket, exp) {
        if (err) {
          return self.error(self._createOAuthError('Failed to obtain access token', err));
        }

        const accessToken = ticket;

        self._loadUserProfile(accessToken, function (err, profile) {
          if (err) {
            return self.error(err);
          }

          function verified(err, user, info) {
            if (err) {
              return self.error(err);
            }
            if (!user) {
              return self.fail(info);
            }

            info = info || {};
            if (state) {
              info.state = state;
            }
            self.success(user, info);
          }

          try {
            if (self._passReqToCallback) {
              var arity = self._verify.length;
              if (arity == 6) {
                self._verify(req, accessToken, ticket, params, profile, verified);
              } else { // arity == 5
                self._verify(req, accessToken, ticket, profile, verified);
              }
            } else {
              var arity = self._verify.length;
              if (arity == 5) {
                self._verify(accessToken, ticket, params, profile, verified);
              } else { // arity == 4
                self._verify(accessToken, ticket, profile, verified);
              }
            }
          } catch (ex) {
            return self.error(ex);
          }
        });

      });

    }

    var state = req.query.state;
    try {
      var arity = this._stateStore.verify.length;
      if (arity == 4) {
        this._stateStore.verify(req, state, meta, loaded);
      } else { // arity == 3
        this._stateStore.verify(req, state, loaded);
      }
    } catch (ex) {
      return this.error(ex);
    }
  } else {
    var params = this.authorizationParams(options);
    params.response_type = 'code';
    if (callbackURL) {
      params.redirect_uri = callbackURL;
    }
    var scope = options.scope || this._scope;
    if (scope) {
      if (Array.isArray(scope)) {
        scope = scope.join(this._scopeSeparator);
      }
      params.scope = scope;
    }

    var state = options.state;
    if (state) {
      params.state = state;

      var parsed = url.parse(this._oauth2._authorizeUrl, true);
      utils.merge(parsed.query, params);
      parsed.query['client_id'] = this._oauth2._clientId;
      delete parsed.search;
      var location = url.format(parsed);
      this.redirect(location);
    } else {
      function stored(err, state) {
        if (err) {
          return self.error(err);
        }

        if (state) {
          params.state = state;
        }
        var parsed = url.parse(self._oauth2._authorizeUrl, true);
        utils.merge(parsed.query, params);
        parsed.query['client_id'] = self._oauth2._clientId;
        delete parsed.search;
        var location = url.format(parsed);
        self.redirect(location);
      }

      try {
        var arity = this._stateStore.store.length;
        if (arity == 3) {
          this._stateStore.store(req, meta, stored);
        } else { // arity == 2
          this._stateStore.store(req, stored);
        }
      } catch (ex) {
        return this.error(ex);
      }
    }
  }
};