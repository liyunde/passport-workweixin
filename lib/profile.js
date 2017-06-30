/**
 * Parse profile.
 *
 * {    "openid":" OPENID",
 " nickname": NICKNAME,
 "sex":"1",
 "province":"PROVINCE"
 "city":"CITY",
 "country":"COUNTRY",
 "headimgurl":    "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ
4eMsv84eavHiaiceqxibJxCfHe/46",
"privilege":[ "PRIVILEGE1" "PRIVILEGE2"     ],
 "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL"
 *
 * @param {object|string} json
 * @return {object}
 * @access public
 */
exports.parse = function (json) {
    if ('string' === typeof json) {
        json = JSON.parse(json);
    }

    var profile = {};

    profile.id = json.openid;
    profile.username = json.nickname;
    profile.displayName = json.nickname;

    profile.addr = {
        country: json.country,
        province: json.province,
        city: json.city
    };

    profile.gender = json.sex;

    profile.photos = [{value: json.headimgurl}];

    return profile;
};
