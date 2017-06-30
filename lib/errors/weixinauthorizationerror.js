/**
 * `WeiXinAuthorizationError` error.
 *
 * WeiXinAuthorizationError represents an error in response to an
 * authorization request on Facebook.  Note that these responses don't conform
 * to the OAuth 2.0 specification.
 *
 * @constructor
 * @param {string} [message]
 * @param {number} [code]
 * @access public
 */
function WeiXinAuthorizationError(message, code) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'WeiXinAuthorizationError';
  this.message = message;
  this.code = code;
  this.status = 500;
}

// Inherit from `Error`.
WeiXinAuthorizationError.prototype.__proto__ = Error.prototype;


// Expose constructor.
module.exports = WeiXinAuthorizationError;
