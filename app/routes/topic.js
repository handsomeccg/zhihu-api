const Router = require('koa-router')
const router = new Router({ prefix: '/topics' })
const topicCtl = require('../controllers/topics')
const jwt = require('koa-jwt')
const { secret } = require('../config')

// 登录认证
const auth = jwt({ secret })

router.get('/', topicCtl.find)
router.get('/:id', topicCtl.checkTopicExist, topicCtl.findById)
router.post('/', auth, topicCtl.create)
router.patch('/:id', auth, topicCtl.checkTopicExist, topicCtl.update)
router.get('/:id/followers', topicCtl.checkTopicExist, topicCtl.listFollowers)
router.get('/:id/questions', topicCtl.checkTopicExist, topicCtl.listQuestions)

module.exports = router