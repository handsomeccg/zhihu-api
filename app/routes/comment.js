const Router = require('koa-router')
const router = new Router({ prefix: '/questions/:questionId/answers/:answerId/comments' })
const commentCtl = require('../controllers/comments')
const jwt = require('koa-jwt')
const { secret } = require('../config')

// 登录认证
const auth = jwt({ secret })

router.get('/', commentCtl.find)
router.get('/:id', commentCtl.checkCommentExist, commentCtl.findById)
router.post('/', auth, commentCtl.create)
router.patch('/:id', auth, commentCtl.checkCommentExist, commentCtl.checkCommentator, commentCtl.update)
router.delete('/:id', auth, commentCtl.checkCommentExist, commentCtl.checkCommentator, commentCtl.delete)

module.exports = router