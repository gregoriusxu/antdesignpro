const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
let config = require('./config/dev');
let conn = mongoose.createConnection(config.dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const UserModel = conn.model('User', new Schema({
    mail: { type: String },
    password: { type: String },
    mobile: { type: String },
    avatar: { type: String },
    currentAuthority: { type: String }//代表当前用户
    //角色权限模型  权限 角色 用户 
}));

exports.UserModel = UserModel;