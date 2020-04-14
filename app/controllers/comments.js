const Comment = require('../models/comment')
const User = require('../models/user')

class CommentCtl {
    async find(ctx) {
        const { per_page = 10, page = 1 } = ctx.query
        const selectPage = Math.max(page * 1, 1) - 1
        const selectPerPage = Math.max(per_page * 1, 1)
        const q = new RegExp(ctx.query.q)
        const { questionId, answerId } = ctx.params
        const { rootCommentId } = ctx.query
        ctx.body = await Comment
            .find({ content: q, questionId, answerId, rootCommentId })
            .limit(selectPerPage).skip(selectPage * selectPerPage)
            .populate('commentator replyTo')
    }
    // 检测评论是否存在
    async checkCommentExist(ctx, next) {
        const comment = await Comment.findById(ctx.params.id).select('+commentator')
        if (!comment) { ctx.throw(404, '评论不存在') }
        // 只有在删改查回答时检查这个逻辑，赞踩回答不检查
        if (ctx.params.questionId && comment.questionId !== ctx.params.questionId) {
            ctx.throw(404, '该问题下没有这个评论')
        }
        if (ctx.params.answerId && comment.answerId !== ctx.params.answerId) {
            ctx.throw(404, '该答案下没有这个评论')
        }
        // 与更新操作共享
        ctx.state.Comment = comment
        await next()
    }
    async findById(ctx) {
        const { fields = '' } = ctx.query
        const selectFields = fields.split(';').filter(f => f).map(f => '+' + f).join('')
        const comment = await Comment.findById(ctx.params.id).select(selectFields).populate('commentator')
        ctx.body = comment
    }
    async create(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: true },
            rootCommentId: { type: 'string', required: false },
            replyTo: { type: 'string', required: false }
        })
        const commentator = ctx.state.user._id
        const { questionId, answerId } = ctx.params
        const comment = await new Comment({ ...ctx.request.body, commentator, questionId, answerId }).save()
        ctx.body = comment
    }
    // 检测问题是否属于本人
    async checkCommentator(ctx, next) {
        const comment = await Comment.findById(ctx.params.id).select('+commentator')
        if (comment.commentator.toString() !== ctx.state.user._id) { ctx.throw(403, '没有权限修改这个回答') }
        await next()
    }
    async update(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: false }
        })
        const { content } = ctx.request.body
        const comment = await ctx.state.Comment.update({ content })
        ctx.body = comment
    }
    async delete(ctx) {
        await Comment.findByIdAndRemove(ctx.params.id)
        ctx.status = 204
    }
}

module.exports = new CommentCtl()