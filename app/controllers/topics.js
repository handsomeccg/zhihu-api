const Topic = require('../models/topic')
const User = require('../models/user')
const Question = require('../models/question')

class TopicCtl {
    async find(ctx) {
        const { per_page = 10, page = 1 } = ctx.query
        const selectPage = Math.max(page * 1, 1) - 1
        const selectPerPage = Math.max(per_page * 1, 1)
        ctx.body = await Topic
            .find({ name: new RegExp(ctx.query.q) })
            .limit(selectPerPage)
            .skip(selectPage * selectPerPage)
    }
    // 检测话题是否存在
    async checkTopicExist(ctx, next) {
        const topic = await Topic.findById(ctx.params.id)
        if (!topic) { ctx.throw(404, '话题不存在') }
        await next()
    }
    async listFollowers(ctx) {
        const users = await User.find({ followingTopics: ctx.params.id })
        ctx.body = users
    }
    async findById(ctx) {
        const { fields = '' } = ctx.query
        const selectFields = fields.split(';').filter(f => f).map(f => '+' + f).join('')
        const topic = await Topic.findById(ctx.params.id).select(selectFields)
        ctx.body = topic
    }
    async create(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: true },
            avatar_url: { type: 'string', required: false },
            introduction: { type: 'string', required: false }
        })
        const topic = await new Topic(ctx.request.body).save()
        ctx.body = topic
    }
    async update(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: false },
            avatar_url: { type: 'string', required: false },
            introduction: { type: 'string', required: false }
        })
        const topic = await Topic.findByIdAndUpdate(ctx.params.id, ctx.request.body)
        ctx.body = topic
    }
    async listQuestions(ctx) {
        const questions = Question.find({topics: ctx.params.id})
        ctx.body = questions
    }
}

module.exports = new TopicCtl()