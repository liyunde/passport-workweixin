/**
 * 转换用户信息到 profile
 *
 * @param json
 * @returns {{}}
 */
exports.parse = function (json) {

  if ('string' === typeof json) {
    json = JSON.parse(json);
  }

  var profile = {};

  profile.id = json.userid;
  profile.username = json.userid;
  profile.displayName = json.name || '';

  profile.department = json.department || '';

  profile.gender = json.gender || '';

  profile.email = json.email || '';
  profile.mobile = json.mobile || '';

  profile.position = json.position || '';

  profile.photos = json.avatar || '';

  return profile;
};
