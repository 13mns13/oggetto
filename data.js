const MongoClient = require("mongodb").MongoClient;
var xss = require("xss")
var uuid = require('uuid');
const url = "mongodb://localhost:27017/";
const rand = () =>{
    return Math.random().toString(36).substr(2);
};

const gen_token = ()=> {
    let res = ""
    for (i=0;i<3;i++)res+=rand()
    
    return res;
};
let data_users =null;
let data_link =null;
const mongoClient =  new MongoClient(url, { useUnifiedTopology: true });
mongoClient.connect(async (err, client)=>{     
    
 
    const db = await client.db("usersdb");
    data_users= await db.collection("data_users");
    data_link = await db.collection("data_link");
});


const reg =async (data)=>{
    _username = data.username.toString()
    _pwd1 =  data.pwd1.toString()
    pwd2 =  data.pwd2.toString()

    if (_pwd1!=pwd2)return {
        error:-1,
        message:"Пароли не совпадают"
    }
    if (_pwd1.length<6)return{
        error:-1,
        message:"Короткий пароль"
    }
    if (_username.length<3)return {
        error:-1,
        message:"Короткий логин"
    }

    const res = await data_users.findOne({username:_username})
    if (res) return {
        error:1,
        message:"Логин занят"
    }

    const _token = gen_token()
    const json = {
        username:_username,
        pwd:_pwd1,
        token:_token
    }
    const qq = await data_users.insertOne(json)

    return {
        token:token,
        success:true,
        message:"Успех!",
        id:qq.theidID 
    }
    
}

const auth = async (data)=>{
    const _username = data.username
    const _pwd = data.pwd
    const _token = gen_token()

    const res = await data_users.findOne({username:_username,pwd:_pwd})
    if (!res) return {
        error:-1,
        message:"Неверный логин или пароль"
    }
    const qq = await data_users.updateOne({username:_username,pwd:_pwd},{ $set:{
        token:_token
    }}, {upsert: true})
    return {
        success:true,
        token:_token,
        message:"Успех!",
        id:qq.theidID 
    }
}

const genLink = async (data) =>{
    const token = data.token.toString()
    const title = xss(data.title.toString())
    const url = xss(data.url.toString())
    const datetimeStart = xss(data.date.toString())
    const text = xss(data.text.toString())
    const date = new Date().getTime()
    const id_link = uuid.v1()
    const price = data.price
    const res = await data_users.findOne({token:token})
    if (!res) return {
        error:-1,
        message:"Токен недействительный"
    }
    const json = {
        id_user:res._id,
        title:title,
        datetime:date,
        start:datetimeStart,
        url:url,
        id_link:id_link,
        text:text,price
    }
    await data_link.insertOne(json)
    return {
        success:true,
        message:"Успех"
    }

}

const getLink = async () =>{
   
    const r = await data_link.find({})
    response = []
    await r.forEach(e=>response.push(e))

    
    return {
        success:true,
        message:"Успех",
        data:response
    }
}

const Datas = () =>{
    return {
        _reg:reg,
        _auth:auth,
        _getLink:getLink,
        _genLink:genLink
    }
}


const  ParseData =()=>{
    fs = require("fs")
    let fileContent = JSON.parse(fs.readFileSync("e.json", "utf8"));
    console.log(fileContent)
}
//ParseData()
/*
setTimeout(async()=>{
    getLink()
    z = await auth({
        username:"1111",
        pwd:"111111"
    })
    const token = z.token
    q = await genLink({
        token:token,
        url:"vk.com",
        title:"тест",
        date:"12.10.2030",
        text:"тест",
    })
    console.log(z)
},3000)*/


module.exports = Datas;