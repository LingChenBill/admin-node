const express = require('express')
// 文件上传中间件.
const multer = require('multer')
const { UPLOAD_PATH } = require('../utils/constant')
const Result = require('../models/Result')
const Book = require('../models/Book')
const boom = require('boom')
const { decoded } = require('../utils')
const bookService = require('../services/book')

const router = express.Router()

/**
 * 上传电子书.
 */
router.post(
  '/upload',
  multer({
      dest: `${UPLOAD_PATH}/book`
    }).single('file'),
  function(request, response, next) {
    if (!request.file || request.file.length === 0) {
      new Result('上传电子书失败').fail(response)
    } else {
      const book = new Book(request.file)

      // 电子书解析.
      book.parse()
        .then(book => {
          new Result(book,'上传电子书成功').success(response)
        })
        .catch(error => {
          // 发生异常的时候是需要返回错误信息.
          next(boom.badImplementation(error))
        })
    }
  }
)

/**
 * 新增电子书.
 */
router.post(
  '/create',
  function(request, response, next) {
    // 从jwt token中解密用户名(函数名不要使用decode关键字).
    const decode = decoded(request)
    if (decode && decode.username) {
      request.body.username = decode.username
    }
    const book = new Book(null, request.body)
    bookService.insertBook(book).then(() => {
        new Result('添加电子书成功').success(response)
      }
    ).catch(error => {
      next(boom.badImplementation(error))
    })
  }
)

/**
 * 更新电子书.
 */
router.post(
  '/update',
  function(request, response, next) {
    // 从jwt token中解密用户名(函数名不要使用decode关键字).
    const decode = decoded(request)
    if (decode && decode.username) {
      request.body.username = decode.username
    }
    const book = new Book(null, request.body)
    bookService.updateBook(book).then(() => {
        new Result('更新电子书成功').success(response)
      }
    ).catch(error => {
      next(boom.badImplementation(error))
    })
  }
)

/**
 * 获取电子书.
 */
router.get(
  '/get',
  function(request, response, next) {
    const { fileName } = request.query
    if (!fileName) {
      next(boom.badRequest(new Error('参数fileName不能为空')))
    } else {
      // 调用获取电子书服务.
      bookService.getBook(fileName).then(book => {
          new Result(book, '获取电子书信息成功').success(response)
        }).catch(error => {
          next(boom.badImplementation(error))
      })
    }
  }
)

/**
 * 获取电子书类型.
 */
router.get(
  '/category',
  function(request, response, next) {
    bookService.getCategory().then(category => {
      new Result(category, '获取分类成功').success(response)
    }).catch(error => {
      next(boom.badImplementation(error))
    })
  }
)

/**
 * 获取电子书列表.
 */
router.get(
  '/list',
  function(request, response, next) {
    bookService.listBook(request.query).then( ({ list , count, page, pageSize}) => {
      // 将字符串变成number, 可以在变量前加+号.
      new Result({ list, count, page: +page, pageSize: +pageSize }, '获取分类成功').success(response)
    }).catch(error => {
      next(boom.badImplementation(error))
    })
  }
)

/**
 * 删除电子书.
 */
router.get(
  '/delete',
  function(request, response, next) {
    const { fileName } = request.query
    console.log(request)
    if (!fileName) {
      next(boom.badRequest(new Error('参数fileName不能为空')))
    } else {
      // 调用获取电子书服务.
      bookService.deleteBook(fileName).then(book => {
        new Result( '删除电子书信息成功').success(response)
      }).catch(error => {
        next(boom.badImplementation(error))
      })
    }
  }
)

module.exports = router