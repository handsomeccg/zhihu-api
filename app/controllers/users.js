const User = require('../models/user')
const Question = require('../models/question')
const Answer = require('../models/answer')
const jwt = require('jsonwebtoken')
const { secret } = require('../config')

class UsersCtl {
    // 授权
    async checkOwner(ctx, next) {
        if (ctx.params.id !== ctx.state.user._id) {
            ctx.throw(403, '没有权限')
        }
        await next()
    }
    async getUserList(ctx) {
        const { per_page = 10, page = 1 } = ctx.query
        const selectPage = Math.max(page * 1, 1) - 1
        const selectPerPage = Math.max(per_page * 1, 1)
        const user = await User
            .find({ name: new RegExp(ctx.query.q) })
            .limit(selectPerPage)
            .skip(selectPage * selectPerPage)
        ctx.body = user
    }
    async getUserById(ctx) {
        const { fields = '' } = ctx.query
        const selectFields = fields ? fields.split(';').filter(f => f).map(f => ' +' + f).join('') : ''
        const populateStr = fields.split(';').filter(f => f).map(f => {
            if(f === 'employments') {
                return 'employments.company employments.job'
            }
            if(f === 'educations') {
                return 'educations.school educations.major'
            }
            return f
        }).join(' ')
        const user = await User.findById(ctx.params.id).select(selectFields).populate(populateStr)
        if (!user) {
            ctx.throw('404', '用户不存在')
        }
        ctx.body = user
    }
    async createUser(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: true },
            password: { type: 'string', required: true }
        })
        const name = ctx.request.body.name
        const repeatUser = User.findOne({ name })
        if (repeatUser) {
            ctx.throw(409, '该用户已存在')
        }
        const user = await new User(ctx.request.body).save()
        ctx.body = user
    }
    async updateUserById(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: false },
            password: { type: 'string', required: false },
            avatar_url: { type: 'string', required: false },
            gender: { type: 'string', required: false },
            headline: { type: 'string', required: false },
            locations: { type: 'array', itemType: 'string', required: false },
            business: { type: 'string', required: false },
            employment: { type: 'array', itemType: 'object', required: false },
            education: { type: 'array', itemType: 'object', required: false }
        })
        const user = await User.findByIdAndUpdate(ctx.params.id, ctx.request.body)
        if (!user) {
            ctx.throw('404', '用户不存在')
        }
        ctx.body = user
    }
    async deleteUserById(ctx) {
        const user = await User.findByIdAndDelete(ctx.params.id)
        if (!user) {
            ctx.throw('404', '用户不存在')
        }
        ctx.status = 204
    }
    async login(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: true },
            password: { type: 'string', required: true }
        })
        const user = await User.findOne(ctx.request.body)
        if (!user) {
            ctx.throw(401, '账号或密码不正确')
        }
        const { name, _id } = user
        // token payload中添加name,id,设置加密字符，设置过期时间为一天
        const token = jwt.sign({ name, _id }, secret, { expiresIn: '1d' })
        ctx.body = { token }
    }
    async listFollowing(ctx) {
        const user = await User.findById(ctx.params.id).select('+following').populate('following')
        if (!user) { ctx.throw(404, '用户不存在') }
        ctx.body = user.following
    }
    async listFollowers(ctx) {
        const users = await User.find({ following: ctx.params.id })
        ctx.body = users
    }
    // 检测用户是否存在
    async checkUserExist(ctx, next) {
        const user = await User.findById(ctx.params.id)
        if (!user) { ctx.throw(404, '用户不存在') }
        await next()
    }
    // 关注用户
    async follow(ctx) {
        // 通过token获取当前用户id
        const me = await User.findById(ctx.state.user._id).select('+following')
        if (!me.following.map(id => id.toString()).includes(ctx.params.id)) {
            me.following.push(ctx.params.id)
            me.save()
        }
        // 204: 成功但没有数据返回
        ctx.status = 204
    }
    // 取关用户
    async unfollow(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+following')
        const index = me.following.map(id => id.toString()).indexOf(ctx.params.id)
        if (index > -1) {
            me.following.splice(index, 1)
            me.save()
        }
        ctx.status = 204
    }
    // 获取用户关注的话题
    async listFollowingTopics(ctx) {
        const user = await User.findById(ctx.params.id).select('+followingTopics').populate('followingTopics')
        if (!user) { ctx.throw(404, '用户不存在') }
        ctx.body = user.followingTopics
    }
    // 关注话题
    async followTopic(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+followingTopics')
        if (!me.followingTopics.map(id => id.toString()).includes(ctx.params.id)) {
            me.followingTopics.push(ctx.params.id)
            me.save()
        }
        ctx.status = 204
    }
    // 取关话题
    async unfollowTopic(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+followingTopics')
        const index = me.followingTopics.map(id => id.toString()).indexOf(ctx.params.id)
        if (index > -1) {
            me.followingTopics.splice(index, 1)
            me.save()
        }
        ctx.status = 204
    }
    // 提问列表
    async listQuestions(ctx) {
        const questions = await Question.find({ questioner: ctx.params.id})
        ctx.body = questions
    }
    // 获取用户点赞的回答
    async listLikingAnswers(ctx) {
        const user = await User.findById(ctx.params.id).select('+likingAnswers').populate('likingAnswers')
        if (!user) { ctx.throw(404, '用户不存在') }
        ctx.body = user.likingAnswers
    }
    // 答案点赞
    async likeAnswer(ctx, next) {
        const me = await User.findById(ctx.state.user._id).select('+likingAnswers')
        if (!me.likingAnswers.map(id => id.toString()).includes(ctx.params.id)) {
            me.likingAnswers.push(ctx.params.id)
            me.save()
            await Answer.findByIdAndUpdate(ctx.params.id, { $inc: { voteCount: 1 } })
        }
        ctx.status = 204
        await next()
    }
    // 答案取消点赞
    async unlikeAnswer(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+likingAnswers')
        const index = me.likingAnswers.map(id => id.toString()).indexOf(ctx.params.id)
        if (index > -1) {
            me.likingAnswers.splice(index, 1)
            me.save()
            await Answer.findByIdAndUpdate(ctx.params.id, { $inc: { voteCount: -1 } })
        }
        ctx.status = 204
    }
    // 获取用户踩的回答
    async listDisLikingAnswers(ctx) {
        const user = await User.findById(ctx.params.id).select('+dislikingAnswers').populate('dislikingAnswers')
        if (!user) { ctx.throw(404, '用户不存在') }
        ctx.body = user.dislikingAnswers
    }
    // 答案踩
    async dislikeAnswer(ctx, next) {
        const me = await User.findById(ctx.state.user._id).select('+dislikingAnswers')
        if (!me.dislikingAnswers.map(id => id.toString()).includes(ctx.params.id)) {
            me.dislikingAnswers.push(ctx.params.id)
            me.save()
        }
        ctx.status = 204
        await next()
    }
    // 答案取消踩
    async undislikeAnswer(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+dislikingAnswers')
        const index = me.dislikingAnswers.map(id => id.toString()).indexOf(ctx.params.id)
        if (index > -1) {
            me.dislikingAnswers.splice(index, 1)
            me.save()
        }
        ctx.status = 204
    }
    // 获取用户收藏的回答
    async listCollectingAnswers(ctx) {
        const user = await User.findById(ctx.params.id).select('+collectingAnswers').populate('collectingAnswers')
        if (!user) { ctx.throw(404, '用户不存在') }
        ctx.body = user.collectingAnswers
    }
    // 收藏回答
    async collectAnswer(ctx, next) {
        const me = await User.findById(ctx.state.user._id).select('+collectingAnswers')
        if (!me.collectingAnswers.map(id => id.toString()).includes(ctx.params.id)) {
            me.collectingAnswers.push(ctx.params.id)
            me.save()
        }
        ctx.status = 204
        await next()
    }
    // 取消回答收藏
    async uncollectAnswer(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+collectingAnswers')
        const index = me.collectingAnswers.map(id => id.toString()).indexOf(ctx.params.id)
        if (index > -1) {
            me.collectingAnswers.splice(index, 1)
            me.save()
        }
        ctx.status = 204
    }
}

module.exports = new UsersCtl()