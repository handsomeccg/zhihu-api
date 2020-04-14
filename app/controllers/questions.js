const Question = require('../models/question')
const User = require('../models/user')

class QuestionCtl {
    async find(ctx) {
        const { per_page = 10, page = 1 } = ctx.query
        const selectPage = Math.max(page * 1, 1) - 1
        const selectPerPage = Math.max(per_page * 1, 1)
        const q = new RegExp(ctx.query.q)
        ctx.body = await Question
            .find({ $or: [{ title: q }, { description: q }] })
            .limit(selectPerPage)
            .skip(selectPage * selectPerPage)
    }
    // 检测问题是否存在
    async checkQuestionExist(ctx, next) {
        const question = await Question.findById(ctx.params.id).select('+questioner')
        if (!question) { ctx.throw(404, '问题不存在') }
        // 与更新操作共享
        ctx.state.question = question
        await next()
    }
    async findById(ctx) {
        const { fields = '' } = ctx.query
        const selectFields = fields.split(';').filter(f => f).map(f => '+' + f).join('')
        const question = await Question.findById(ctx.params.id).select(selectFields).populate('questioner topics')
        ctx.body = question
    }
    async create(ctx) {
        ctx.verifyParams({
            title: { type: 'string', required: true },
            description: { type: 'string', required: false }
        })
        const question = await new Question({...ctx.request.body, questioner: ctx.state.user._id}).save()
        ctx.body = question
    }
    // 检测问题是否属于本人
    async checkQuestioner(ctx, next) {
        const question = await Question.findById(ctx.params.id).select('+questioner')
        if (question.questioner.toString() !== ctx.state.user._id) { ctx.throw(403, '没有权限修改这个问题') }
        await next()
    }
    async update(ctx) {
        ctx.verifyParams({
            title: { type: 'string', required: false },
            description: { type: 'string', required: false }
        })
        const question = await ctx.state.question.update(ctx.request.body)
        ctx.body = question
    }
    async delete(ctx) {
        await Question.findByIdAndRemove(ctx.params.id)
        ctx.status = 204
    }
}

module.exports = new QuestionCtl()