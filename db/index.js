const mysql = require('mysql')
const config = require('./config')
const { DEBUG } = require('../utils/constant')
const { isObject } = require('../utils')

/**
 * 创建mysql连接.
 * @returns {Connection}
 */
function connect() {
  return mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    multipleStatements: true
  })
}

/**
 * 查询sql方法.
 * @param sql
 * @returns {Promise<unknown>}
 */
function querySql(sql) {
  // 打印日志信息.
  DEBUG && console.log(sql)
  const conn = connect()
  return new Promise((resolve, reject) => {
    try {
      conn.query(sql, (err, results) => {
        if (err) {
          DEBUG && console.log('查询失败,原因: ', JSON.stringify(err))
          reject(err)
        } else {
          DEBUG && console.log('查询成功: ', JSON.stringify(results))
          resolve(results)
        }
      })
    } catch (e) {
      reject(e)
    } finally {
      conn.end()
    }
  })
}

/**
 * 查询单条记录.
 * @param sql
 * @returns {Promise<unknown>}
 */
function queryOne(sql) {
  return new Promise((resolve, reject) => {
    querySql(sql).then(results => {
      if (results && results.length > 0) {
        // 返回第一条数据.
        resolve(results[0])
      } else {
        resolve(null)
      }
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * 插入记录.
 * @param sql
 */
function insert(model, tableName) {
  return new Promise((resolve, reject) => {
    // 判断model必须为一个对象.
    if (!isObject(model)) {
      reject(new Error('插入数据库失败,插入数据非对象'))
    } else {
      // 数据对象key,values解析.
      const keys = []
      const values = []
      Object.keys(model).forEach(key => {
        if (model.hasOwnProperty(key)) {
          // 加入\`是为sql文中出现特殊字符.
          keys.push(`\`${key}\``)
          values.push(`'${model[key]}'`)
        }
      })

      if (keys.length > 0 && values.length > 0) {
        let sql = `INSERT INTO \`${tableName}\` (`
        const keyString = keys.join(',')
        const valueString = values.join(',')
        sql = `${sql}${keyString}) VALUES (${valueString})`
        console.log(sql)
        // 插入DB.
        const conn = connect()
        try {
          conn.query(sql, (err, result) => {
            if (err) {
              reject(err)
            } else {
              resolve(result)
            }
          })
        } catch (e) {
          reject(e)
        } finally {
          // DB连接关闭.
          conn.end()
        }
      } else {
        reject(new Error('数据对象没有属性'))
      }
    }


  })
}

/**
 * 更新记录.
 * @param model
 * @param tableName
 * @param where
 */
function update(model, tableName, where) {
    return new Promise((resolve, reject) => {
      if (!isObject(model)) {
        reject(new Error('更新数据库失败,更新数据非对象'))
      } else {
        const entry = []
        Object.keys(model).forEach(key => {
          if (model.hasOwnProperty(key)) {
            entry.push(`\`${key}\`='${model[key]}'`)
          }
        })
        if (entry.length > 0) {
          let sql = `UPDATE \`${tableName}\` SET`
          sql = `${sql} ${entry.join(',')} ${where}`
          const conn = connect()
          try {
            conn.query(sql, (error, result) => {
              if (error) {
                reject(error)
              } else {
                resolve(result)
              }
            })
          } catch (e) {
            reject(e)
          } finally {
            conn.end()
          }
        }
      }
    })
}

/**
 * sql文and拼接.
 * @param where
 * @param key
 * @param value
 */
function and(where, key, value) {
  if (where === 'where') {
    return `${where} \`${key}\`='${value}'`
  } else {
    return `${where} and \`${key}\`='${value}'`
  }
}

/**
 * sql文like拼接.
 * @param where
 * @param key
 * @param value
 * @returns {string}
 */
function andLike(where, key, value) {
  if (where === 'where') {
    return `${where} \`${key}\` like '%${value}%'`
  } else {
    return `${where} and \`${key}\` like '%${value}%'`
  }
}

module.exports = {
  querySql,
  queryOne,
  insert,
  update,
  and,
  andLike
}