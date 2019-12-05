let express = require('express');
let bodyParser = require('body-parser');
let jwt = require('jwt-simple');
let cors = require('cors');
let session = require('express-session');
let MongoStore = require('connect-mongo')(session);
let config = require('./config/dev');
let { UserModel } = require('./db');
let app = express();
app.use(cors({
    origin: config.origin,
    credentials: true,
    allowedHeaders: "Content-Type,Authorization",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
}));
app.use(session({
    secret: config.secret,
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({
        url: config.dbUrl,
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//`/server/api/login/captcha?mobile=15718856132`
app.get('/api/login/captcha', async function (req, res) {
    let mobile = req.query.mobile;
    let captcha = random();
    req.session.captcha = captcha;//在当前用户的会话中放置验证码
    return res.json(captcha);
});
///api/login/account
app.post('/api/login/account', async (req, res) => {
    let user = req.body;
    let query = {};
    if (user.type == 'account') {
        query.mail = user.userName;
    } else if (user.type == 'mobile') {
        query.mobile = user.mobile;
        if (user.captcha !== req.session.captcha) {
            return res.send({
                status: 'error',
                type,
                currentAuthority: 'guest',
            });
        }
    }
    let dbUser = await UserModel.findOne(query);
    if (dbUser) {
        dbUser.userid = dbUser._id;
        dbUser.name = dbUser.mail;
        let token = jwt.encode(dbUser, config.secret);
        res.send({
            status: 'ok',
            type: user.type,
            token,
            currentAuthority: dbUser.currentAuthority,
        });
    } else {
        return res.send({
            status: 'error',
            type,
            currentAuthority: 'guest',
        });
    }

});
app.post('/api/register', async (req, res) => {
    //mail,password,confirm,mobile,captcha,prefix
    let user = req.body;
    console.log(user.captcha, req.session.captcha);
    if (user.captcha !== req.session.captcha) {
        return res.send({ code: 1, error: '验证码不对' });
    }
    let md5Mail = require('crypto').createHash('md5').update(user.mail).digest('hex');
    user.avatar = `https://secure.gravatar.com/avatar/${md5Mail}`;
    await UserModel.create(user);
    res.send({ status: 'ok', currentAuthority: user.currentAuthority });
});
app.get('/api/currentUser', async function (req, res) {
    let authorization = req.headers['authorization'];
    console.log('authorization', authorization);
    if (authorization) {
        let user = jwt.decode(authorization.split(' ')[1], config.secret);
        user.userid = user._id;
        user.name = user.mail;
        if (user) {
            res.json(user);
        } else {
            return res.json({});
        }
    } else {
        return res.json({});
    }
});
app.listen(4000, () => console.log('server started at 4000'));
function random() {
    let min = 1000, max = 9999;
    return Math.floor(Math.random() * (max - min) + min) + "";
}