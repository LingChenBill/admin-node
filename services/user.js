const { querySql, queryOne } = require('../db/index')

/**
 * 查询用户.
 * @param username
 * @param password
 * @returns {Promise<unknown>}
 */
function login(username, password) {
  // 查询DB.
  return querySql(`select * from admin_user where username='${username}' and password='${password}'`)
}

/**
 * 查询用户(根据用户名查询).
 * @param username
 */
function findUser(username) {
  return queryOne(`select id, username, role, nickname, avatar from admin_user where username='${username}'`)
}

module.exports = {
  login,
  findUser
}