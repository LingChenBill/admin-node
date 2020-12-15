const express = require('express')
const boom = require('boom')
const userRouter = require('./user')
const bookRouter = require('./book')

const {
  CODE_ERROR
} = require('../utils/constant')
const jwtAuth = require('./jwt')
const Result = require('../models/Result')

// 注册路由.
const router = express.Router()
// jwt引入.
router.use(jwtAuth)

router.get('/', function (request, response) {
  response.send('欢迎来到admin-node的后台...')
})

// 通过 userRouter 来处理 /user 路由, 对路由处理进行解耦.
router.use('/user', userRouter)

// 文件上传专用路由.
router.use('/book', bookRouter)

/**
 * 集中处理404请求的中间件.
 * 该中间件必须放在正常处理流程之后,否则,会拦截正常请求.
 */
router.use((request, response, next) => {
  next(boom.notFound('接口不存在...'))
})

/**
 * 自定义路由异常处理中间件.
 * 方法参数不能减少.
 * 方法必须放在路由最后.
 */
router.use((error, request, response, next) => {
  // console.log(error)
  // jwt token验证失败.
  if (error.code && error.code === 'credentials_required') {
    const { status = 401, message = inner.message } = error
    new Result(null, 'Token验证失败', {
      error: status,
      errorMsg: message
    }).jwtError(response.status(status))
  } else {
    const message = (error && error.message) || '系统错误'
    const statusCode = (error.output && error.output.statusCode) || 500
    const errorMsg = (error.output && error.output.payload && error.output.payload.error) || error.message

    // 正常请求失败处理.
    new Result(null, message, {
      error: statusCode,
      errorMsg: errorMsg
    }).fail(response.status(statusCode))
  }
})

module.exports = router