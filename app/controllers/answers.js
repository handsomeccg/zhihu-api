const Answer = require('../models/answer')
const User = require('../models/user')

class AnswerCtl {
    async find(ctx) {
        const { per_page = 10, page = 1 } = ctx.query
        const selectPage = Math.max(page * 1, 1) - 1
        const selectPerPage = Math.max(per_page * 1, 1)
        const q = new RegExp(ctx.query.q)
        ctx.body = await Answer
            .find({ content: q, questionId: ctx.params.questionId })
            .limit(selectPerPage)
            .skip(selectPage * selectPerPage)
    }
    // 检测回答是否存在
    async checkAnswerExist(ctx, next) {
        const answer = await Answer.findById(ctx.params.id).select('+answerer')
        if (!answer) { ctx.throw(404, '回答不存在') }
        // 只有在删改查回答时检查这个逻辑，赞踩回答不检查
        if (ctx.params.questionId && answer.questionId !== ctx.params.questionId) {
            ctx.throw(404, '该问题下没有这个回答')
        }
        // 与更新操作共享
        ctx.state.Answer = answer
        await next()
    }
    async findById(ctx) {
        const { fields = '' } = ctx.query
        const selectFields = fields.split(';').filter(f => f).map(f => '+' + f).join('')
        const answer = await Answer.findById(ctx.params.id).select(selectFields).populate('answerer')
        ctx.body = answer
    }
    async create(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: true }
        })
        const answerer = ctx.state.user._id
        const { questionId } = ctx.params
        const answer = await new Answer({ ...ctx.request.body, answerer, questionId }).save()
        ctx.body = answer
    }
    // 检测问题是否属于本人
    async checkAnswerer(ctx, next) {
        const answer = await Answer.findById(ctx.params.id).select('+answerer')
        if (answer.answerer.toString() !== ctx.state.user._id) { ctx.throw(403, '没有权限修改这个回答') }
        await next()
    }
    async update(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: false }
        })
        const answer = await ctx.state.Answer.update(ctx.request.body)
        ctx.body = answer
    }
    async delete(ctx) {
        await Answer.findByIdAndRemove(ctx.params.id)
        ctx.status = 204
    }
}

module.exports = new AnswerCtl()