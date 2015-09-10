var http = require('http');
var fs = require('fs');
var mysql = require('mysql'); 
var url = require('url');
var socket = require('socket.io');
var global = {};

global.database = {};
global.database.host = 'localhost';
global.database.user = 'root';
global.database.pass = 'root';
global.database.name = 'nodeqq';

//连接数据库
var db = mysql.createConnection({host: global.database.host, user: global.database.user, password: global.database.pass});


var httpServer = http.createServer(function (request, response) {
	//console.log(request.url);
	
	var url = request.url;
	
	if (url == '/') url = '/index.html';
	
	fs.readFile('html' + url, function (err, data) {//fs.readFile 读取文件
		if (err) return console.log('未找到 ' + url), response.end();
		//response.writeHeader(200, {"Content-Type": "text/html"});
		response.write(data);//得到html/index.html里面的数据 response.write写数据
		response.end();
	});
	
	/*// 处理真正的请求(非favicon.ico的请求)
	if (realReq(request, response)) {
		var db = mysql.createConnection({host: 'localhost', user: 'root', password: 'tq018bz'}); 
	
		querySql(db, 'USE nodejs', function (data) {
			querySql(db, 'INSERT INTO user (user, pass) VALUES("baie", "tq018bz")');
			response.end();
		});
	}*/
});

httpServer.listen(8884);// httpServer.listen(8884)

//socket.listen(httpServer); socket与httpServer相关联 ==》webSocket
var webSocket = socket.listen(httpServer);//socket.listen(httpServer)
var json_user = {};
var json_chat={};//用于存储离线消息

webSocket.on('connection', function (s) {//自定义connection之后的处理事件webSocket.on
	// 连接成功 s.emit触发open事件，即表调用某事件
	s.emit('open', '连接成功');
	
	// 当前用户的 id
	var cur_uid = '';
	
	// 检查邮箱，定义方法 s.on表定义方法
	s.on('check_email', function (data) {
		querySql(db, 'USE ' + global.database.name, function (result) {
			querySql(db, 'SELECT COUNT(*) AS e FROM user WHERE email="' + data.email + '"', function (result) {
				// 1代表邮箱存在, 0代表邮箱不存在
				if (result[0].e > 0) s.emit('check_email_result', {code: 1});
				else s.emit('check_email_result', {code: 0});//触发该方法
			});
		});
	});
	
	// 用户注册
	s.on('user_reg', function (data) {
		querySql(db, 'USE ' + global.database.name, function (result) {
			querySql(db, 'INSERT INTO user (nick, pass, email) VALUES ("' + data.nick + '", "' + data.pass + '", "' + data.email + '")', function (data) {
				var uid = data.insertId;
				// 往 user_type 里插默认数据
				querySql(db, 'INSERT INTO user_type (uid) VALUES("' + uid + '")', function (data) {
					s.emit('user_reg_result', {code: 0, uid: uid});
                    //注册成功
                    json_chat[uid]=[];//得到空数组
				}, function (err) {
				  s.emit('user_reg_result', {code: 1, error: err});
			  });
			},function(err){
				console.log("出错了");
				s.emit('user_reg_result',{code:1,error:err});
			});
		});
	});
	
	// 用户登录
	s.on('user_login', function (data) {
		querySql(db, 'USE ' + global.database.name, function (result) {
			//此时nick表单里可以是email也可以是nick名称
			querySql(db, 'SELECT pass,id,login_num ,nick,avatar,sign ,email FROM user WHERE email="' + data.nick + '" OR nick="' + data.nick + '"', function (result) {

			 if (result.length == 1 && (result[0].pass == data.pass)) {

				if (json_user[result[0].id]) {
					s.emit('login_result', {code: 2});
					return false;
				} else {
					s.emit('login_result', {code: 0,user:result[0]});//返回user对象
				}
				
				// 登录成功
				cur_uid = result[0].id;
				json_user[cur_uid] = {s: s};//json_user[uid]={s:s};s对应的是这个用户的socket.
				console.log("json_use结果：");
				 console.log(json_user);
				// 增加登录次数
				querySql(db, 'UPDATE user SET login_num="' + (parseInt(result[0].login_num) + 1) + '" WHERE id=' + cur_uid);
				
				for (var i in json_user) {
					if (i == cur_uid) continue;
					
					// 从数据库中查找好友并从 json_user 中找到在线的好友发通知
					querySql(db, 'SELECT cid FROM user_contact WHERE uid=' + cur_uid, function (result) {
						for (var i = 0, len = result.length; i < len; i++) {//有几个好友
							if (json_user[result[i].cid]) json_user[result[i].cid].s.emit('online', {uid: cur_uid});//调用上线事件
						}
					});
				}
                 if(json_chat[cur_uid].length>0){//离线数据存在,接收信息
                     json_chat[cur_uid].forEach(
                         function(e){
                             var messages=e;
                             s.emit('send_msg',messages);
                         }
                     );
                 }

			 } else {
			   s.emit('login_result', {code:1, tips: '您输入的帐号或密码不正确，请重新输入。'});
			 }
			});
		});
	});
	
	// 获取用户分类
	s.on('get_user_type', function (data) {
		querySql(db, 'USE ' + global.database.name, function (result) {
			querySql(db, 'SELECT tid,tname FROM user_type WHERE uid="' + cur_uid + '"', function (result) {
				var arr = [];
				for (var i = 0, len = result.length; i < len; i ++) {
					arr[i] = {};
					arr[i].tid = result[i].tid;
					arr[i].tname = result[i].tname;
				}
				s.emit('get_user_type_result', arr);
			});
		});
	});
	
	// 获取用户好友列表
	s.on('get_user_list', function (data) {
		querySql(db, 'USE ' + global.database.name, function (result) {
		//	var sql = 'SELECT user_contact.cid, user_contact.tid, user.nick, user.sign, user.avatar FROM user_contact, user WHERE user_contact.cid=user.id and user_contact.uid=' + cur_uid  + (data ? (data.tid != null ? ' and tid=' + data.tid : '') : '');
      var sql="select `user`.* ,user_type.tid,user_type.tname" +
		  " from user,user_contact,user_type where `user`.id in (select uid from user_contact where cid="+data.id+")group by `user`.id";
			querySql(db, sql, function (result) {
				var arr = [];
				for (var i = 0, len = result.length; i < len; i++) {
				  arr[i] = result[i];
				  //if (json_user[arr[i].cid]) arr[i].online = true;
				  //else arr[i].online = false;
					if (json_user[arr[i].id]) arr[i].online = true;
					else arr[i].online = false;
					s.emit('get_user_list_result', arr);
					var sql_chat="select content,uid from user_chat_records where (uid="+arr[i].id +" and cid="+data.id+") or (uid="+data.id +" and cid="+arr[i].id+") order by inserttime  desc limit 1";
					querySql(db,sql_chat,function(results){
						if(results.length>0)
						s.emit('get_user_list_last_result',results[0]);

					});

				}

			});
		});
	});

	s.on("getChats",function(param){//得到所有的聊天内容
		querySql(db, 'USE ' + global.database.name, function (result) {
			var sql = "select * from user_chat_records where (cid=" + param.cid + " and uid=" + param.uid+") or (cid="+param.uid+" and uid="+param.cid+")";
			console.log(sql);
			querySql(db, sql, function (result) {
				s.emit("getChatsResults",result);
			});
		});
	})

	// 用户断开下线
	s.on('disconnect', function (){
		console.log(cur_uid + '下线');
		delete json_user[cur_uid];
		
		for(var i in json_user) {
			json_user[i].s.emit('offline', {uid: cur_uid});//告诉所有用户已经下线 offline,上线是online
		}
	});
	
	// 退出程序
	s.on('exit', function () {
		console.log(cur_uid + '退出');
		delete json_user[cur_uid];
	});
	
	// 获取用户信息
	s.on('get_user_info', function (data) {
		querySql(db, 'USE ' + global.database.name, function (result) {
			var uid = data ? data.uid : cur_uid;

			querySql(db, 'SELECT * FROM user WHERE id=' + uid, function (result) {
				var json = {};
				json = result[0];
				json.uid = result[0].id;
				delete json.id;
				delete json.pass;
				s.emit('get_user_info_result', json);
			});
		});
	});
	
	// 设置签名
	s.on('update_sign', function (data) {
		querySql(db, 'USE ' + global.database.name, function (result) {
			var uid = data.uid || cur_uid;
			querySql(db, 'UPDATE user SET sign="' + data.sign + '" WHERE id=' + uid, function (result) {
				// 修改签名成功
				s.emit('update_sign_result', {code: 0});
			}, function (result) {
				// 修改签名失败
				s.emit('update_sign_result', {code: 1});
			});
		});
	});
	
	var lastTime = 0;
	
	// 接收消息
	s.on('send', function (data) {
		var oDate = new Date();
		if (oDate.getTime() - lastTime < 3000) {
			s.emit('send_result', {code: 1, msg: '发言过于频繁，3秒之内发言一次'});
		} else {
			// 正式发送消息 去掉不在线不能发的情况
			//if (!json_user[data.cid]) s.emit('send_result', {code: 2, msg: '发送失败：此用户不在线', time: oDate.getTime(), uid: cur_uid, cid: data.cid});
			//else {
				s.emit('send_result', {code: 0, msg: '成功', time: oDate.getTime(), uid: cur_uid, cid: data.cid});
             var params={msg: data.msg, uid: cur_uid, time: oDate.getTime(), cid: data.cid};
              if(json_user[data.cid]){//如果存在就发送事件，如果不存在另外再算
                  json_user[data.cid].s.emit('send_msg',params);
              }else{
                  json_chat[data.cid].push(params);//把内容都放在数据当中去
              }

			//}
		}
	});
	
	// 在线查找
	s.on('query_buddy', function (data) {
		//console.log(data);
    querySql(db, 'USE ' + global.database.name, function (result) {
			var sql = '';
			var arr = [];

			if (data.id) {
				arr.push('id=' + data.id);
			}
			
			if (data.email) {
				arr.push('email=\'' + data.email + '\'');
			}
			
			if (data.nick) {
				arr.push('nick LIKE \'%' + data.nick + '%\'');
			}
			
			if (cur_uid) {
			  arr.push('id!=' + cur_uid);
			}
			
			if (arr.length) {
				sql = 'SELECT id, nick, email, avatar, login_num FROM user WHERE ' + arr.join(' AND ');
			} else {
				sql = 'SELECT id, nick, email, avatar, login_num FROM user';
			}
			
			
			if (data.desc) {
		    sql += ' ORDER BY ' + data.desc + ' DESC';
			}
			
			if (data.asc) {
				sql += ' ORDER BY ' + data.asc + ' ASC';
			}
			
			if (data.rows) {
				sql += ' LIMIT ' + data.rows;
			} else {
				sql += ' LIMIT 0';
			}
			
			if (data.size) {
				sql += ', ' + data.size;
			}
				
			querySql(db, sql, function (result) {
				var arrUser = [];
				
				for (var i = 0, len = result.length; i < len; i++) {
					arrUser[i] = result[i];
					
					if (json_user[arrUser[i].id]) arrUser[i].online = true;
					else arrUser[i].online = false;
				}

				if (arrUser.length) s.emit('query_buddy_result', {err: 0, data: arrUser});
				else s.emit('query_buddy_result', {err: 1, msg: '无数据'});
			});
		});
	});
	
	// 加好友
	s.on('add_buddy', function (data) {
		querySql(db, 'USE ' + global.database.name, function (result) {
			querySql(db, 'SELECT * FROM user_contact WHERE uid=' + cur_uid + ' AND cid=' + data.uid, function (result) {
				if (!result.length) {
					if (json_user[data.uid]) {
						var result = {};
						result.uid = cur_uid;
						if (data.msg) result.msg = data.msg;
						json_user[data.uid].s.emit('apply_buddy', result);
					} else {
						s.emit('add_buddy_result', {err: 1, msg: '此用户不在线，不能添加好友'});
					}
				} else {
					s.emit('add_buddy_result', {err: 2, msg: '不能重复添加好友'});
				}
			});
		});

	});
	
	// 加好友审核
	s.on('adder_audit', function (data) {
		// 同意 1
		// 拒绝 2
		
		if (data.act == 1) {
			// 同意
			// 插入数据
			querySql(db, 'USE ' + global.database.name, function (result) {
				//querySql(db, 'INSERT INTO user_contact (uid, ' + (data.tid ? data.tid + 'tid, ' : '') + 'cid) VALUES ("' + cur_uid + '", ' + (data.tid ? '"' + data.tid + '", ' : '') + ')');
				querySql(db, 'INSERT INTO user_contact (uid, ' + (data.tid ? data.tid + 'tid, ' : '') + 'cid) VALUES ("' + cur_uid + '", ' + (data.tid ? '"' + data.tid + '", ' : '') + '"' + data.uid + '")', function (result) {
					querySql(db, 'INSERT INTO user_contact (uid, ' + (data.tid ? data.tid + 'tid, ' : '') + 'cid) VALUES ("' + data.uid + '", ' + (data.tid ? '"' + data.tid + '", ' : '') + '"' + cur_uid + '")', function (result) {
						var user_c = {};
						var user_u = {};
						
						
						querySql(db, 'SELECT * FROM user WHERE id=' + cur_uid, function (result) {
							var json = {};
							
							json = result[0];
							json.uid = result[0].id;
							json.tid = 0;
							
							if (json_user[json.uid]) json.online = true;
							else json.online = false;

							if (data.tid) json.tid = data.tid;
							
							delete json.id;
							delete json.pass;
							
							user_c = json;
							
							querySql(db, 'SELECT * FROM user WHERE id=' + data.uid, function (result) {
								var json = {};
								
								json = result[0];
								json.uid = result[0].id;
								json.tid = 0;
								
								if (json_user[json.uid]) json.online = true;
							  else json.online = false;

							  if (data.tid) json.tid = data.tid;
								
								delete json.id;
								delete json.pass;
								
								user_u = json;
								
								s.emit('adder_audit_result', {err: 0, user: user_u});
								json_user[data.uid].s.emit('adder_audit_result', {err: 0, user: user_c});
							});
						});
					});
				});
			});
		} else if (data.act == 2){
			//console.log(data.uid, cur_uid);
			// 拒绝
			json_user[data.uid].s.emit('adder_audit_result', {err: 1, uid: cur_uid});
		}
	});
});

function regEmail(str) {
	var re = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
	return re.test(str);
}

function querySql(objConnect, strSql, fnSucc, fnError) {
	objConnect.query(strSql, function (err, data) {
	  if (err) {
			if (fnError) fnError(err);
		} else {
			if (fnSucc) fnSucc(data);
		}
	});
}

function realReq(req, res) {
	var re = /favicon\.ico/ig;
	var str = url.parse(req.url).pathname.replace(/^\//, '');
	
	if (re.test(str)){
		res.end();
		return false;
	} else {
		return true;
	}
}