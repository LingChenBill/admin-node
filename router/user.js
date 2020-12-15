const express = require('express')
// 表单校验.
const { body, validationResult } = require('express-validator')
// 错误处理中间件.
const boom = require('boom')
// JWT.
const jwt = require('jsonwebtoken')
// 结果封装类.
const Result = require('../models/Result')
// user login service.
const { login, findUser } = require('../services/user')
// md5.
const { md5, decoded } = require('../utils')
// 常量引入.
const { PWD_SALT, PRIVATE_KEY, JWT_EXPIRED } = require('../utils/constant')

const router = express.Router()

/**
 * user/info路由 获取用户.
 */
router.get('/info', function(request, response, next) {
  // 获取解密信息.
  const decodeUser = decoded(request)
  // 查询用户.
  findUser(decodeUser.username).then(user => {
    if (user) {
      // role构造成数组.
      user.roles = [user.role]
      new Result(user, '用户信息查询成功').success(response)
    } else {
      new Result('用户信息查询失败').fail(response)
    }
  })
})

/**
 * user login.
 * 访问:curl http://book.lc.com:18082/user/login -X POST -d "username=admin&password=admin"
 */
router.post('/login',
  [
    body('username').isString().withMessage('用户名必须为字符'),
    body('password').isString().withMessage('密码必须为字符')
  ],
  function(request, response, next) {
    // 获取校验结果.
    const error = validationResult(request)
    // 校验失败.
    if (!error.isEmpty()) {
      // 获取错误信息.
      const [{ msg }] = error.errors
      // 将错误信息传递.
      next(boom.badRequest(msg))
    } else {
      // 校验成功,继续业务处理.
      let { username, password } = request.body
      // 密码进行md5加密.
      password = md5(`${password}${PWD_SALT}`)

      // 查询DB.
      login(username, password).then(user => {
        if (!user || user.length === 0) {
          new Result('登录失败').fail(response)
        } else {
          // 登录成功.生成token,返回到前端.
          const token = jwt.sign(
            { username },
            PRIVATE_KEY,
            { expiresIn: JWT_EXPIRED }
          )
          new Result({ token }, '登录成功').success(response)
        }
      })
    }
  })

module.exports = router