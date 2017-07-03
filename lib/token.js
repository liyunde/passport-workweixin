/**
 * Created by liyunde on 2017/7/1.
 */

const curl = require('urllib').curl,
  assert = require('assert'),
  TokenError = require('passport-oauth2/lib/errors/tokenerror');

/**
 * 获取应用的 token
 *
 * @param cb
 */
exports.apptoken = function (cb) {

  const cropId = this._cropId;
  const secret = this._cropSecret;

  assert(cropId, 'tcropId required');
  assert(secret, 'secret required');
  assert(this._cache, 'cache required')

  agent = this._agentId || 0;

  var key = cropId + ":" + agent

  const cache = this._cache;

  function getToken() {
    // 2.获取
    const tokenURL = 'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=' + cropId + '&corpsecret=' + secret;

    const result = curl(tokenURL, {
      // 自动解析 JSON response
      dataType: 'json',
      // 5 秒超时
      timeout: 5000
    });

    console.warn(tokenURL, typeof result);

    result.then(function (value) {
      // success

      if (value.data.errcode === 0) {

        cache.set(key, value.data.access_token);

        cache.expire(key, value.data.expires_in);

        cb(null, value.data.access_token);

      } else {

        console.error("获取 token 出错:", value.data.errcode, value.data.errmsg);

        cb(new TokenError("获取 token 出错:" + value.data.errmsg, value.data.errcode));
      }

    }, function (value) {
      // failure
      console.error(value);

      cb(new TokenError("获取 token 出错:" + value));
    });
  }

  // var token = this._cache.get(key)
  //
  // console.warn('缓存token:',token);
  //
  // this._cache.save(key, token, result.data.expires_in);

  this._cache.get(key).then(function (token) {
    // //1.检测缓存
    if (token) {
      cb(null, token);
    } else {
      getToken();
    }
  }, function (err) {
    console.error('获取缓存token:', err);
    getToken();
  })

  // return "Z6SkXUmgJ3qVAItkzWNs2RIX8QwaP1zJ81Ap0NYsbwxTpAfjSVuBVmmA09CF4sOgVhcHomxyxYieKkD1UIY15Lv_0v9EpADpuSekizEzunxLxXF4iNwGTR1XlUHfKPzEncozoda_noqLYPXqyTGrQQMZmqfurB1nBDjoH_gMUx5pdR1_2UNbtFB-6y0arJHAIxJGDMFhwG8PKM2WZDXrPfF4ebWgajFBGoi4jKrcFxUUK-jb5CFR0zime8u9hyMKuVI3RJ9EjLnsK8jxzJfJMTtjxfQ_rcrikK2frOVSkqo";
  //
  //   if (result.status === 200) {
  //
  //     if (result.data.errcode === 0) {
  //
  //       token = result.data.access_token;
  //
  //       console.info(token)
  //
  //       // this.cache.save(key, token, result.data.expires_in);
  //
  //     } else {
  //
  //       console.error("获取 token 出错:", result.data.errcode, result.data.errmsg);
  //
  //       return new TokenError("获取 token 出错:" + result.data.errmsg, result.data.errcode);
  //     }
  //
  //   } else {
  //
  //     console.error("获取 token 出错,网络故障:", result.status);
  //
  //     return new TokenError("获取 token 出错,网络故障:", result.status, null, result.status);
  //
  //   }
  // }


  // return token;

}