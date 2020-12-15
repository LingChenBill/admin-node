const jwt = require('express-jwt')
// jwt密钥key.
const { PRIVATE_KEY } = require('../utils/constant')

module.exports = jwt({
  secret: PRIVATE_KEY,
  algorithms: ['HS256'],
  credentialsRequired: true
}).unless({
  path: [
    '/',
    '/user/login'
  ]
})

