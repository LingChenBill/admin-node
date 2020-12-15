const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { PRIVATE_KEY } = require('./constant')

/**
 * md5加密.
 * @param s
 * @returns {string}
 */
function md5(s) {
  // 参数要为String类型,否则为出错.
  return crypto.createHash('md5')
    .update(String(s)).digest('hex')
}

/**
 * 解密token信息.
 * @param request
 * @returns {*}
 */
function decoded(request) {
  // 获取request headers中的token信息.
  console.log(request.body)
  console.log(request.get('Authorization'))
  const authorization = request.get('Authorization')
  let token = ''
  if (authorization.indexOf('Bearer ') == 0) {
    token = authorization.replace('Bearer ', '')
  } else {
    token = authorization
  }

  // 返回解密信息.
  return jwt.verify(token, PRIVATE_KEY)
}

/**
 * 判断是否为一个对象.
 * @param o
 * @returns {boolean}
 */
function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]'
}

module.exports = {
  md5,
  decoded,
  isObject
}