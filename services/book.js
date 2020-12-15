const Book = require('../models/Book')
const db = require('../db')
const _ = require('lodash')
const { DEBUG } = require('../utils/constant')

/**
 * 新增电子书(async:将异步变为同步方法.await)
 * @param book
 * @returns {Promise<unknown>}
 */
function insertBook(book) {
  return new Promise(async (resolve, reject) => {
    try {
      // 验证book对象是否合法.
      if (book instanceof Book) {
        // 判断电子书是否存在.
        const result = await exist(book)
        if (result) {
          // 删除电子书.
          await removeBook(book)
          reject(new Error('电子书已存在'))
        } else {
          // 新增电子书.
          await db.insert(book.toDb(), 'book')
          await insertContents(book)
          resolve()
        }
      } else {
        reject(new Error('添加的图书对象不合法'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * 更新电子书
 * @param book
 * @returns {Promise<unknown>}
 */
function updateBook(book) {
  return new Promise(async (resolve, reject) => {
    try {
      // 验证book对象是否合法.
      if (book instanceof Book) {
        // 判断电子书是否存在.
        const result = await getBook(book.fileName)
        if (result) {
          const model = book.toDb()
          if (+result.updateType === 0) {
            reject(new Error('内置图书不能编辑'))
          } else {
            await db.update(model, 'book', `where fileName = '${book.fileName}'`)
            resolve()
          }
        }
      } else {
        reject(new Error('添加的图书对象不合法'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * 判断电子书是否存在.
 * @param book
 */
function exist(book) {
  const { title, author, publisher } = book
  const sql = `select * from book where title='${title}' and author='${author}' and publisher='${publisher}'`
  return db.queryOne(sql)
}

/**
 * 删除电子书.
 * @param book
 */
async function removeBook(book) {
  if (book) {
    // 删除电子书资源.
    book.reset()
    // 删除DB中的电子书数据.
    if (book.fileName) {
      const removeBookSql = `delete from book where fileName='${book.fileName}'`
      const remvoeContentsSql = `delete from book where fileName='${book.fileName}'`
      await db.querySql(removeBookSql)
      await db.querySql(remvoeContentsSql)
    }
  }
}

/**
 * 插入电子书内容.
 * @param book
 */
async function insertContents(book) {
  // 获取目录结构内容.
  const contents = book.getContents()
  if (contents && contents.length > 0) {
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i]
      const _content = _.pick(content, [
        'fileName',
        'id',
        'href',
        'order',
        'level',
        'text',
        'label',
        'pid',
        'navId'
      ])
      // 插入目录结构内容.
      await db.insert(_content, 'contents')
    }
  }
}

/**
 * 获取电子书.
 * @param fileName
 * @returns {Promise<unknown>}
 */
function getBook(fileName) {
  return new Promise(async (resolve, reject) => {
    // 查询电子书sql.
    const bookSql = `select * from book where fileName='${fileName}'`
    // 查询电子书目录sql.
    const contentsSql = `select * from contents where fileName = '${fileName}' order by \`order\``
    // 查询.
    const book = await db.queryOne(bookSql)
    const contents = await db.querySql(contentsSql)

    if (book) {
      try {
        // 获取电子书树状目录.
        book.contentsTree = Book.getContentsTree(contents)
        resolve(book)
      } catch (error) {
        reject(new Error(error))
      }
    } else {
      reject(new Error("电子书不存在"))
    }
  })
}

/**
 * 获取电子书类型.
 */
async function getCategory() {
  return new Promise(async (resolve, reject) => {
    const sql = 'select * from category order by category asc'
    const result = await db.querySql(sql)
    const categoryList = []
    result.forEach(item => {
      categoryList.push({
        label: item.categoryText,
        value: item.category,
        num: item.num
      })
    })
    resolve(categoryList)
  })
}

/**
 * 获取电子书列表.
 */
async function listBook(query) {
  DEBUG && console.log('query: ', query)
  const {
    category,
    author,
    title,
    page = 1,
    pageSize = 20,
    sort
  } = query
  // 分页偏移量.
  const offset = (page - 1) * pageSize
  let bookSql = 'select * from book'
  let where = 'where'
  // 类型.
  category && (where = db.and(where, 'category', category))
  // 书名.
  title && (where = db.andLike(where, 'title', title))
  // 作者.
  author && (where = db.andLike(where, 'author', author))

  if (where !== 'where') {
    bookSql = `${bookSql} ${where}`
  }
  // 排序处理.
  if (sort) {
    // +, -.
    const symbol = sort[0]
    // 排序字段.
    const column = sort.slice(1, sort.length)
    const order = symbol === '+' ? 'asc' : 'desc'
    bookSql = `${bookSql} order by \`${column}\` ${order}`
  }
  let countSql = `select count(*) as count from book`
  if (where !== 'where') {
    countSql = `${countSql} ${where}`
  }
  const count = await db.querySql(countSql)
  console.log('count: ', count)
  bookSql = `${bookSql} limit ${pageSize} offset ${offset}`
  const list = await db.querySql(bookSql)
  // return new Promise(async (resolve, reject) => {
  //   reslove(list)
  // })
  return { list, count: count[0].count, page, pageSize }
}

module.exports = {
  insertBook,
  updateBook,
  getBook,
  getCategory,
  listBook
}