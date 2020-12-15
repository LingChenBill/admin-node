const express = require('express')
const router = require('./router')
const app = express()
const http = require('http')
const bodyParser = require('body-parser')
const cors = require('cors')
// 中间件.
// function myLogger(request, response, next) {
//   console.log('myLogger...')
//   // next()不可少
//   next()
// }
//
// app.use(myLogger)

// app.get('/', function (request, response) {
//   // response.send('hello node express!')
//   throw new Error('something has error...')
// })

// // post请求.
// app.post('/user', function (request, response) {
//   response.send('hello post data...')
// })

// // 异常处理要后置在路由之后
// const errorHandler = function (err, request, response, next) {
//   console.log('errorHandler...')
//   response.status(400)
//   response.send('Down...')
// }
//
// app.use(errorHandler)

// 解决跨域问题.
app.use(cors())
// 解析request请求中的参数信息.
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use('/', router)

// 可以构建https服务.
// const credentials = {}
// const httpServer = http.createServer(credentials, app)
const httpServer = http.createServer(app)

const server = app.listen(5000, function () {
  const { address, port } = server.address()
  console.log('HTTP服务启动成功:http://%s:%s', address, port)
})

httpServer.listen(18082, function() {
  console.log('HTTP服务启动成功:http://%s:%s', 'book.lc.com', 18082)
})

