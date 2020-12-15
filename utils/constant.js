const { env } = require('./env')
// 电子书上传路径.
const UPLOAD_PATH = env === 'dev' ? '/Users/zhuyangze/Documents/src/nginx/upload/admin-upload-ebook' : '/root/upload/admin-upload/ebook'
// 电子书URL.
const UPLOAD_URL = env === 'dev' ? 'http://book.lc.com:8089/admin-upload-ebook' : 'http://book.lc.com:8089/ebook'

module.exports = {
  // 错误码.
  CODE_ERROR: -1,
  // jwt token错误码.
  CODE_TOKEN_EXPIRED: -2,
  // 成功码.
  CODE_SUCCESS: 0,
  // 打印日志开关.
  DEBUG: true,
  // 密码加密密钥.
  PWD_SALT: 'admin_imooc_node',
  // jwt token生成密钥key.
  PRIVATE_KEY: 'admin_imooc_node_test_youbaobao_xyz',
  // token过期时间(单位:s)
  JWT_EXPIRED: 60 * 60,
  UPLOAD_PATH,
  // 电子书类型.
  MIME_TYPE_EPUB: 'application/epub+zip',
  // 电子书URL.
  UPLOAD_URL
}