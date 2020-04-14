const Koa = require('koa')
const koaBody = require('koa-body')
const error = require('koa-json-error')
const parameter = require('koa-parameter')
const koaStatic = require('koa-static')
const mongoose = require('mongoose')
const path = require('path')
const app = new Koa()
const routing = require('./routes')
const { connectionStr } = require('./config')

// 连接到MongoDB
mongoose.connect(connectionStr, { useNewUrlParser: true, useUnifiedTopology: true }, () => console.log('mongoDB 连接成功了！'))
mongoose.connection.on('error', console.error)

// 静态文件地址
app.use(koaStatic(path.join(__dirname, '/public')))

app.use(error({
    postFormat: (e, { stack, ...rest }) => process.env.NODE_ENV === 'production' ? rest : { stack, ...rest }
}))
app.use(koaBody({
    multipart: true,
    formidable: {
        // 上传文件目录
        uploadDir: path.join(__dirname, '/public/uploads'),
        // 保留扩展名
        keepExtensions: true
    }
}))
app.use(parameter(app))
routing(app)

app.listen(3000, () => console.log('程序已启动在 3000端口'))

// app.use里面可以传一个函数(这个函数也叫作中间件)