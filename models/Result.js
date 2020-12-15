/**
 * 返回实体类封装.
 */
const {
  CODE_ERROR,
  CODE_SUCCESS,
  CODE_TOKEN_EXPIRED
} = require('../utils/constant')

class Result {
  constructor(data, msg = '操作成功', options) {
    this.data = null
    if (arguments.length === 0) {
      this.msg = '操作成功'
    } else if (arguments.length === 1) {
      this.msg = data
    } else {
      this.data = data
      this.msg = msg
      if (options) {
        this.options = options
      }
    }
  }

  createResult() {
    if (!this.code) {
      this.code = CODE_SUCCESS
    }
    let base = {
      code: this.code,
      msg: this.msg
    }
    if (this.data) {
      base.data = this.data
    }
    if (this.options) {
      base = { ...base, ...this.options }
    }
    return base
  }

  json(response) {
    response.json(this.createResult())
  }

  success(response) {
    this.code = CODE_SUCCESS
    this.json(response)
  }

  fail(response) {
    this.code = CODE_ERROR
    this.json(response)
  }

  /**
   * jwt失败信息.
   * @param response
   */
  jwtError(response) {
    this.code = CODE_TOKEN_EXPIRED
    this.json(response)
  }
}

module.exports = Result