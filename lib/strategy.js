'use strict';
// Load modules.
var OAuth2Strategy = require('passport-oauth2')
  , util = require('util')
  , url = require('url')
  , curl = require('urllib').curl
  , Profile = require('./profile')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError
  // , WeiXinAuthorizationError = require('./errors/weixinauthorizationerror')
  , WeiXinTokenError = require('./errors/weixintokenerror')
  // , WeiXinGraphAPIError = require('./errors/weixingraphapierror')
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

  if (this._skipUserProfile) options.scope = 'snsapi_userinfo';//可以获取用户的详细信息 和 user ticket

  OAuth2Strategy.call(this, options, verify);

  this.name = 'workweixin';

  this._profileURL = options.profileURL || 'https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo';
  this._profileFields = options.profileFields || null;

  this.authenticate = Auth.authenticate;

  this._cache = options.cache;

  this._cropId = options.clientID;

  this._cropSecret = options.clientSecret;

  this._agentId = options.agentId;

  this.token = Token.apptoken;
}

// Inherit from `OAuth2Strategy`.
util.inherits(Strategy, OAuth2Strategy);

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
 * @param accessToken
 * @param ticket
 * @param userId
 * @param done
 * @returns {*}
 * @private
 */
Strategy.prototype._loadUserProfile = function (accessToken, ticket, userId, done) {

  var self = this;

  function loadIt() {
    console.info("load _loadUserProfile,before userProfile,ticket:", ticket);

    return self.userProfile(accessToken, ticket, done);
  }

  function skipIt() {
    console.warn("只取 userId ,不获取详情:" + userId)
    return self._genProfile(null, {userid: userId}, done);
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

    console.info("skip ,增加 ticket 检测:", skip, ticket, !skip && ticket)

    if (!skip && ticket) {
      return loadIt();
    }
    return skipIt();
  }
};


/**
 * Retrieve user profile from Workweixin.
 *
 * @param accessToken
 * @param ticket
 * @param done
 */
Strategy.prototype.userProfile = function (accessToken, ticket, done) {

  this.userDetail(accessToken, ticket, done, this._genProfile);

};

Strategy.prototype._genProfile = function (err, json, cb) {

  if (err) {
    return cb(err);
  }

  var profile = Profile.parse(json);

  profile.provider = 'workweixin';

  profile._json = json;

  cb(null, profile);

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
 * @param accessToken
 * @param code
 * @param cb
 * @private
 */
Strategy.prototype._convertCodeToUser = function (accessToken, code, cb) {

  const getuserinfo_url = this._profileURL + '?access_token=' + accessToken + '&code=' + code

  console.info("in _convertCodeToUser: getuserinfo_url: ", getuserinfo_url)

  var promise = curl(getuserinfo_url, {
    dataType: 'json',
    timeout: 5000
  });

  promise.then(function (ret) {

    console.info(ret.data);

    if (ret.data.errcode === 0) {
      cb(null, ret.data.UserId, ret.data.user_ticket, ret.data.expires_in);
    } else {
      cb(new Error('Failed to parse user profile:' + ret.data.errmsg))
    }
  }, function (ret) {
    console.error(ret);

    cb(new InternalOAuthError('Failed to fetch user profile', ret.data));
  })

  // {
  //   "errcode": 0,
  //   "errmsg": "ok",
  //   "UserId":"USERID",
  //   "DeviceId":"DEVICEID",
  //   "user_ticket": "USER_TICKET"，
  //  "expires_in":7200
  // }
};

/**
 * 使用user_ticket获取成员详情
 *
 * @param accessToken
 * @param userTicket
 * @param cb
 * @param done
 */
Strategy.prototype.userDetail = function (accessToken, userTicket, cb, done) {

  // 请求地址：https://qyapi.weixin.qq.com/cgi-bin/user/getuserdetail?access_token=ACCESS_TOKEN
  // {
  //   "user_ticket": "USER_TICKET"
  // }

  var promise = curl('https://qyapi.weixin.qq.com/cgi-bin/user/getuserdetail?access_token=' + accessToken,
    {
      dataType: 'json',
      timeout: 5000,
      method: 'POST',
      contentType: 'json',
      data: {"user_ticket": userTicket}
    });

  promise.then(function (ret) {
    done(null, ret.data, cb)
  }, function (err) {
    done("出错了:" + err, null, cb)
  })

};

// Expose constructor.
module.exports = Strategy;
