const Router = require('koa-router')
const router = new Router({ prefix: '/questions' })
const questionCtl = require('../controllers/questions')
const jwt = require('koa-jwt')
const { secret } = require('../config')

// 登录认证
const auth = jwt({ secret })

router.get('/', questionCtl.find)
router.get('/:id', questionCtl.checkQuestionExist, questionCtl.findById)
router.post('/', auth, questionCtl.create)
router.patch('/:id', auth, questionCtl.checkQuestionExist, questionCtl.checkQuestioner, questionCtl.update)
router.patch('/delete/:id', auth, questionCtl.checkQuestionExist, questionCtl.checkQuestioner, questionCtl.delete)

module.exports = router