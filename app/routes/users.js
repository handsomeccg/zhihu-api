const Router = require('koa-router')
const router = new Router({ prefix: '/users' })
const userCtl = require('../controllers/users')
const jwt = require('koa-jwt')
const { secret } = require('../config')
const topicCtl = require('../controllers/topics')
const answerCtl = require('../controllers/answers')

/*
const auth = async (ctx, next) => {
    const { authorization = '' } = ctx.request.header
    const token = authorization.replace('Bearer ', '')
    try {
        const user = jwt.verify(token, secret)
        ctx.state.user = user
    } catch (error) {
        // 401 未认证错误
        ctx.throw('401', error.message)
    }
    await next()
}
*/
// 登录认证
const auth = jwt({ secret })

router.get('/', userCtl.getUserList)
router.post('/', userCtl.createUser)
router.get('/:id', userCtl.getUserById)
router.patch('/:id', auth, userCtl.checkOwner, userCtl.updateUserById)
router.delete('/:id', auth, userCtl.checkOwner, userCtl.deleteUserById)
router.post('/login', userCtl.login)
router.get('/:id/following', userCtl.listFollowing)
router.get('/:id/followers', userCtl.listFollowers)
router.put('/following/:id', auth, userCtl.checkUserExist, userCtl.follow)
router.delete('/following/:id', auth, userCtl.checkUserExist, userCtl.unfollow)
router.get('/:id/followingTopics', userCtl.listFollowingTopics)
router.put('/followingTopic/:id', auth, topicCtl.checkTopicExist, userCtl.followTopic)
router.delete('/followingTopic/:id', auth, topicCtl.checkTopicExist, userCtl.unfollowTopic)
// 获取提问列表
router.get('/:id/questions', userCtl.listQuestions)
// 点赞答案
router.get('/:id/likingAnswers', userCtl.listLikingAnswers)
router.put('/likingAnswer/:id', auth, answerCtl.checkAnswerExist, userCtl.likeAnswer, userCtl.undislikeAnswer)
router.delete('/likingAnswer/:id', auth, answerCtl.checkAnswerExist, userCtl.unlikeAnswer)
// 踩答案
router.get('/:id/dislikingAnswers', userCtl.listDisLikingAnswers)
router.put('/dislikingAnswer/:id', auth, answerCtl.checkAnswerExist, userCtl.dislikeAnswer, userCtl.unlikeAnswer)
router.delete('/dislikingAnswer/:id', auth, answerCtl.checkAnswerExist, userCtl.undislikeAnswer)
// 收藏答案
router.get('/:id/collectingAnswers', userCtl.listCollectingAnswers)
router.put('/collectingAnswer/:id', auth, answerCtl.checkAnswerExist, userCtl.collectAnswer)
router.delete('/collectingAnswer/:id', auth, answerCtl.checkAnswerExist, userCtl.uncollectAnswer)

module.exports = router