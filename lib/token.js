/**
 * Created by liyunde on 2017/7/1.
 */

const curl = require('urllib').curl,
  assert = require('assert'),
  TokenError = require('passport-oauth2/lib/errors/tokenerror');

/**
 * 获取应用的 token
 *
 * @param cropId
 * @param secret
 * @param agent
 * @returns {string}
 */
exports.apptoken = function () {

  const cropId = this._cropId;
  const secret = this._cropSecret;

  assert(cropId, 'tcropId required');
  assert(secret, 'secret required');
  assert(this.cache, 'this.cache required')

  agent = this._agentId || 0;

  var key = cropId + ":" + agent

  var token = this.cache.get(key)

  //1.检测缓存
  if (!token) {

    // 2.获取
    const tokenURL = 'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=' + cropId + '&corpsecret=' + secret;

    const result = curl(tokenURL, {
      // 自动解析 JSON response
      dataType: 'json',
      // 5 秒超时
      timeout: 5000
    });

    if (result.status === 200) {
      if (result.data.errcode === 0) {

        token = result.data.access_token;

        this.cache.save(key, token, result.data.expires_in);

      } else {

        console.error("获取 token 出错:", result.data.errcode, result.data.errmsg);

        return new TokenError("获取 token 出错:" + result.data.errmsg, result.data.errcode);
      }

    } else {
      console.error("获取 token 出错,网络故障:", result.status);

      return new TokenError("获取 token 出错,网络故障:", result.status, null, result.status);

    }
  }

  return token;

}