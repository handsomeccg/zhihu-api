const Router = require('koa-router')
const router = new Router({ prefix: '/questions/:questionId/answers' })
const answerCtl = require('../controllers/answers')
const jwt = require('koa-jwt')
const { secret } = require('../config')

// 登录认证
const auth = jwt({ secret })

router.get('/', answerCtl.find)
router.get('/:id', answerCtl.checkAnswerExist, answerCtl.findById)
router.post('/', auth, answerCtl.create)
router.patch('/:id', auth, answerCtl.checkAnswerExist, answerCtl.checkAnswerer, answerCtl.update)
router.delete('/:id', auth, answerCtl.checkAnswerExist, answerCtl.checkAnswerer, answerCtl.delete)

module.exports = router