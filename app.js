const express = require('express')
const http = require('https')
var cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const path = require("path")
var xss = require("xss")
const datas = require("./data.js")
//var server = http.createServer(app)
const fs = require("fs")

var privateKey = fs.readFileSync('/etc/letsencrypt/live/un.ban.su/privkey.pem').toString();
var certificate = fs.readFileSync('/etc/letsencrypt/live/un.ban.su/cert.pem').toString();
let options  ={
	key:privateKey,
	cert:certificate
}
//options ={}
var server = http.createServer(options, app)
//var server = http.createServer( app)
var io = require('socket.io')(server)

app.use(cors())
app.use(bodyParser.json())

if(process.env.NODE_ENV==='production'){
	app.use(express.static(__dirname+"/build"))
	app.get("*", (req, res) => {
		res.sendFile(path.join(__dirname+"/build/index.html"))
	})
}
app.set('port', (process.env.PORT || 4001))

app.all("/",(async (req,res)=>{
	const json = req.body
	let type = json.type
	let response = {}
	switch (type){
		case "auth":response = await datas()._auth(json); break;
		case "reg":response = await datas()._reg(json); break;
		case "allTrade":response = await datas()._getLink(); break;
		case "setTrade":response =await datas()._genLink(json); break;
	}
	res.send(JSON.stringify(response))

}))
sanitizeString = (str) => {
	return xss(str)
}

connections = {}
messages = {}
timeOnline = {}

io.on('connection', (socket) => {

	socket.on('join-call', (path) => {
	
		if(connections[path] === undefined){
			connections[path] = []
		}
		connections[path].push(socket.id)

		timeOnline[socket.id] = new Date()

		for(let a = 0; a < connections[path].length; ++a){
			io.to(connections[path][a]).emit("user-joined", socket.id, connections[path])
		}

		if(messages[path] !== undefined){
			for(let a = 0; a < messages[path].length; ++a){
				io.to(socket.id).emit("chat-message", messages[path][a]['data'], 
					messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
			}
		}

		console.log(path, connections[path])
	})

	socket.on('signal', (toId, message) => {
		//console.log(message)
		io.to(toId).emit('signal', socket.id, message)
	})

	socket.on('chat-message', (data, sender) => {
		data = sanitizeString(data)
		sender = sanitizeString(sender)

		var key
		var ok = false
		for (const [k, v] of Object.entries(connections)) {
			for(let a = 0; a < v.length; ++a){
				if(v[a] === socket.id){
					key = k
					ok = true
				}
			}
		}

		if(ok === true){
			if(messages[key] === undefined){
				messages[key] = []
			}
			messages[key].push({"sender": sender, "data": data, "socket-id-sender": socket.id})
			console.log("message", key, ":", sender, data)

			for(let a = 0; a < connections[key].length; ++a){
				io.to(connections[key][a]).emit("chat-message", data, sender, socket.id)
			}
		}
	})

	socket.on('disconnect', () => {
		var diffTime = Math.abs(timeOnline[socket.id] - new Date())
		var key
		for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
			for(let a = 0; a < v.length; ++a){
				if(v[a] === socket.id){
					key = k

					for(let a = 0; a < connections[key].length; ++a){
						io.to(connections[key][a]).emit("user-left", socket.id)
					}
			
					var index = connections[key].indexOf(socket.id)
					connections[key].splice(index, 1)

					console.log(key, socket.id, Math.ceil(diffTime / 1000))

					if(connections[key].length === 0){
						delete connections[key]
					}
				}
			}
		}
	})
})

server.listen(app.get('port'), () => {
	console.log("listening on", app.get('port'))
})