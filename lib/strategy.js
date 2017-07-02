'use strict';
// Load modules.
var OAuth2Strategy = require('passport-oauth2')
  , util = require('util')
  , url = require('url')
  , curl = require('urllib').curl
  , Profile = require('./profile')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError
  , WeiXinAuthorizationError = require('./errors/weixinauthorizationerror')
  , WeiXinTokenError = require('./errors/weixintokenerror')
  , WeiXinGraphAPIError = require('./errors/weixingraphapierror')
  , Token = require("./token")
  , Auth = require('./authenticate');

/**
 * `Strategy` constructor.
 *
 * The Workweixin authentication strategy authenticates requests by delegating to
 * Workweixin using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Workweixin application's App ID
 *   - `clientSecret`  your Workweixin application's App Secret
 *   - `callbackURL`   URL to which Workweixin will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new WorkweixinStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/facebook/callback'
 *       },
 *       function(accessToken, refreshToken, profile, cb) {
 *         User.findOrCreate(..., function (err, user) {
 *           cb(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://open.weixin.qq.com/connect/oauth2/authorize';

  options.scopeSeparator = options.scopeSeparator || ',';

  options.tokenURL = options.tokenURL || 'https://qyapi.weixin.qq.com/cgi-bin/gettoken';

  options.scope = options.scope || 'snsapi_base'; // snsapi_userinfo

  this._skipUserProfile = options._skipUserProfile || false;

  OAuth2Strategy.call(this, options, verify);

  this.name = 'workweixin';
  this._profileURL = options.profileURL || 'https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo';
  this._profileFields = options.profileFields || null;

  this.authenticate = Auth.authenticate;

  this.cache = options.cache;

  this.token = Token.apptoken(options.clientID, options.clientSecret, options.agentId);
}

// Inherit from `OAuth2Strategy`.
util.inherits(Strategy, OAuth2Strategy);

/**
 * Authenticate request by delegating to Workweixin using OAuth 2.0.
 *
 * @param {http.IncomingMessage} req
 * @param {object} options
 * @access protected
 */
// Strategy.prototype.authenticate = Auth.authenticate;
// Strategy.prototype.authenticate = function (req, options) {
//
//   // Workweixin doesn't conform to the OAuth 2.0 specification, with respect to
//   // redirecting with error codes.
//   //
//   if (req.query && req.query.error_code && !req.query.error) {
//     return this.error(new WeiXinAuthorizationError(req.query.error_message, parseInt(req.query.error_code, 10)));
//   }
//
//   // this._oauth2.authenticate(req,options)
//
//   OAuth2Strategy.prototype.authenticate.call(this, req, options);
// };

/**
 * Return extra Workweixin-specific parameters to be included in the authorization
 * request.
 *
 * Options:
 *  - `display`  Display mode to render dialog, { `page`, `popup`, `touch` }.
 *
 * @param {object} options
 * @return {object}
 * @access protected
 */
Strategy.prototype.authorizationParams = function (options) {
  var params = {};

  if (options.display) {
    params.display = options.display;
  }

  if (options.authType) {
    params.auth_type = options.authType;
  }
  if (options.authNonce) {
    params.auth_nonce = options.authNonce;
  }

  return params;
};


/**
 * 根据配置决定是否加载用户详情
 *
 * @param ticket
 * @param userId
 * @param done
 * @returns {*}
 * @private
 */
Strategy.prototype._loadUserProfile = function (ticket, userId, done) {

  var self = this;

  function loadIt() {
    return self.userProfile(accessToken, done);
  }

  function skipIt() {
    return done(null, {userid: userId});
  }

  if (typeof this._skipUserProfile === 'function' && this._skipUserProfile.length > 1) {
    // async
    this._skipUserProfile(accessToken, function (err, skip) {
      if (err) {
        return done(err);
      }
      if (!skip) {
        return loadIt();
      }
      return skipIt();
    });
  } else {
    var skip = (typeof this._skipUserProfile === 'function') ? this._skipUserProfile() : this._skipUserProfile;
    if (!skip) {
      return loadIt();
    }
    return skipIt();
  }
};


/**
 * Retrieve user profile from Workweixin.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `workweixin`
 *   - `id`               the user's workweixin ID
 *   - `username`         the user's workweixin username
 *   - `displayName`      the user's full name
 *   - `name.familyName`  the user's last name
 *   - `name.givenName`   the user's first name
 *   - `name.middleName`  the user's middle name
 *   - `gender`           the user's gender: `male` or `female`
 *   - `profileUrl`       the URL of the profile for the user on Workweixin
 *   - `emails`           the proxied or contact email address granted by the user
 *
 * @param {string} accessToken
 * @param {function} done
 * @access protected
 */
Strategy.prototype.userProfile = function (ticket, done) {

  // var url = uri.parse(this._profileURL);
  //
  // if (this._profileFields) {
  //   var fields = this._convertProfileFields(this._profileFields);
  //   if (fields !== '') {
  //     url.search = (url.search ? url.search + '&' : '') + 'fields=' + fields;
  //   }
  // }
  // url = uri.format(url);

  // this._oauth2.get(url, accessToken, code, function (err, body, res) {
  this.userDetail(this.token, ticket, function (err, json) {

    if (err) {
      return done(err);
    }

    var profile = Profile.parse(json);

    profile.provider = 'workweixin';

    profile._raw = body;

    profile._json = json;

    done(null, profile);

  });
};

/**
 * Parse error response from Workweixin OAuth 2.0 token endpoint.
 *
 * @param {string} body
 * @param {number} status
 * @return {Error}
 * @access protected
 */
Strategy.prototype.parseErrorResponse = function (body, status) {
  var json = JSON.parse(body);
  if (json.error && typeof json.error === 'object') {
    return new WeiXinTokenError(json.error.message, json.error.type, json.error.code, json.error.error_subcode, json.error.fbtrace_id);
  }
  return OAuth2Strategy.prototype.parseErrorResponse.call(this, body, status);
};

/**
 * Convert Workweixin profile to a normalized profile.
 *
 * @param {object} profileFields
 * @return {string}
 * @access protected
 */
Strategy.prototype._convertProfileFields = function (profileFields) {

  var map = {
    'id': 'openid',
    'username': 'nickname',
    'displayName': 'nickname',

    'addr': ['country', 'province', 'city'],
    'gender': 'sex',

    // 'birthday': 'birthday',
    // 'profileUrl': 'link',
    // 'emails': 'email',
    'photos': 'photos'
  };

  var fields = [];

  profileFields.forEach(function (f) {
    // return raw Workweixin profile field to support the many fields that don't
    // map cleanly to Portable Contacts

    if (typeof map[f] === 'undefined') {
      return fields.push(f);
    }

    if (Array.isArray(map[f])) {
      Array.prototype.push.apply(fields, map[f]);
    } else {
      fields.push(map[f]);
    }
  });

  return fields.join(',');
};

/**
 * 转换 code 到 user id
 *
 * @param code
 * @returns {*}
 * @private
 */
Strategy.prototype._convertCodeToUser = function (code, cb) {

  var ret = curl(this._profileURL + '?access_token=' + this.token + '&code=' + code, {dataType: 'json', timeout: 5000});

  if (ret.status === 200 && ret.data.errcode === 0) {

    cb(null, ret.data.UserId, ret.data.user_ticket, ret.data.expires_in);

  } else if (ret.data) {

    cb(new Error('Failed to parse user profile:' + ret.data.errmsg));
  }

  cb(new InternalOAuthError('Failed to fetch user profile', ret.data));

  // {
  //   "errcode": 0,
  //   "errmsg": "ok",
  //   "UserId":"USERID",
  //   "DeviceId":"DEVICEID",
  //   "user_ticket": "USER_TICKET"，
  //  "expires_in":7200
  // }
}

/**
 * 使用user_ticket获取成员详情
 *
 * @param accessToken
 * @param userTicket
 * @param done
 */
Strategy.prototype.userDetail = function (accessToken, userTicket, done) {

  // 请求地址：https://qyapi.weixin.qq.com/cgi-bin/user/getuserdetail?access_token=ACCESS_TOKEN
  // {
  //   "user_ticket": "USER_TICKET"
  // }

  var ret = curl('https://qyapi.weixin.qq.com/cgi-bin/user/getuserdetail?access_token=' + this.token,
    {
      dataType: 'json',
      timeout: 5000,
      method: 'POST',
      contentType: 'json',
      data: {"user_ticket": userTicket}
    });

  if (ret.status === 200)
    done(null, ret.data)

};

// Expose constructor.
module.exports = Strategy;
