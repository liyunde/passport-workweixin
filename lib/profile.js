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

    profile.id = json.userid;
    profile.username = json.name;
    profile.displayName = json.name;

    profile.department = json.department;

    profile.gender = json.gender;

    profile.email = json.email;
    profile.mobile = json.mobile;

    profile.position = json.position;

    profile.photos = [{value: json.avatar}];

    return profile;
};
