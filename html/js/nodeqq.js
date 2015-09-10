var doc = document;

var config = {};
config.host = 'localhost:8884';
config.route = {
	reg: 'reg.html'
};

var global = {};
global.login = false;//默认不登录

window.onload = function () {
	var _sock = io.connect('ws://' + config.host + '/');//ws://localhost:8884/ 一个浏览器就是一个sock
	var sock = null;
	
	_sock.on('open', function (data) {
		sock = _sock;
    global.sock = sock;
		
		if(!sock) {
			alert('没有连接到服务器');
			return;
		}

		var app = new App();
		app.init(sock);
		
		/*var app_01 = new AppMain();
		app_01.init(sock);
		*/
	});
};

// 主程序
function AppMain(sock) {
  this.obj = null;
	this.elm = {};
	this.elm.btn = {};
	this.sock = null;
	this.move = false;
	this.user = {};
	this.user.type = [];  // 存储分类列表
}

//给对象添加方法
AppMain.prototype = {
	init: function (sock) {
		var _this = this;
		this.elm.main = doc.querySelectorAll('.window_main')[0];
		this.elm.outer = this.elm.main.querySelectorAll('.window_outer')[0];
		this.elm.bodyOuter = this.elm.main.querySelectorAll('.window_body_outer')[0];
		this.elm.listContainer = this.elm.main.querySelectorAll('.eqq_list_container')[0];
		this.elm.mianPanel = this.elm.main.querySelectorAll('.eqq_main_panel')[0];
		this.elm.myPanel = this.elm.main.querySelectorAll('.user_my_panel')[0];
		this.elm.listPanel = this.elm.main.querySelectorAll('.eqq_buddy_list_panel')[0];
		this.elm.listBottom = this.elm.main.querySelectorAll('.eqq_list_bottom')[0];
		this.elm.mainBuddyListWrap = this.elm.main.querySelectorAll('.main_buddy_list_wrap')[0];
		this.elm.userSign = this.elm.main.querySelectorAll('.eqq_my_signature')[0];
		this.elm.searchTxt = this.elm.main.querySelectorAll('.eqq_search_box')[0];
		this.elm.searchBtn = this.elm.main.querySelectorAll('.eqq_search_button')[0];
		this.elm.btnMsgManage = this.elm.main.querySelectorAll('.message_manage_icon')[0];
		this.elm.btn.queryBuddy = this.elm.main.querySelectorAll('.search_buddy')[0];
		this.elm.btn.topMin = this.elm.main.querySelectorAll('.window_min')[0];
		this.elm.btn.topClose = this.elm.main.querySelectorAll('.window_close')[0];
		this.msgbox = null;
		this.winfind = null;
		this.data = {};
		this.data.user = {};
		this.data.user.list = [];
		this.user.json = {};  // 存储用户信息
		this.myinfo = {};  // 存储账号信息
		this.sock = sock;

		// 添加事件
		this.addEvent();
	},
	addEvent: function () {
		var _this = this;
		
		// 绘制主程序
		this.draw(viewHeight());
		
		// 获取用户信息
		this.getUserInfo();
		
		// 获取用户分类
		this.getUserType();
		
		// 绑定用户上线
		this.userOnline();
		
		// 绑定用下线
		this.userOffline();
		
		// 绑定签名鼠标移入
		this.elm.userSign.onmouseover = this.signOver;
		
		// 绑定签名鼠标移出
		this.elm.userSign.onmouseout = this.signOut;
		
		// 绑定快捷搜索好友功能
		this.elm.searchTxt.onkeyup = this.elm.searchBtn.onclick = function () {
			_this.searchBuddy.call(_this);
		};
		
		this.elm.searchTxt.onfocus = this.searchTxtFocus;
		this.elm.searchTxt.onblur = this.searchTxtBlur;
		
		this.elm.userSign.onclick = function (ev) {
			_this.signClick(this, ev)
		};
		
		// 查找好友按钮
		this.elm.btn.queryBuddy.onclick = function () {
			_this.clcikFindBuddy();
		};
		
		// 绑定窗口调整事件
		window.addEventListener('resize', function () {
			_this.winResize.call(_this);
		}, false);
		
		// 绑定点击头像事件
		this.elm.mainBuddyListWrap.onclick = function (ev) {
			_this.clickUserAvatar(this, ev);
		};
		
		// 绑定接收消息
		this.onSendMsg();
		
		// 消息管理按钮
		this.elm.btnMsgManage.onclick = this.openMsgBox;
		
		// add_buddy_result
		this.sock.removeAllListeners('add_buddy_result');
		this.sock.on('add_buddy_result', function (data) {
			_this.addBuddyResult(data);
		});
		
		// 添加好友申请
		this.sock.removeAllListeners('apply_buddy');
		this.sock.on('apply_buddy', function (data) {
			_this.applyBuddy(data);
		});
		
		// 添加好友申请结果
		this.sock.removeAllListeners('adder_audit_result');
		this.sock.on('adder_audit_result', function (data) {
      _this.adderAuditResult(data);
		});
		
		// 主程序右上角最小化按钮
		this.elm.btn.topMin.onclick = function () {
			_this.minApp();
		};
		
		// 主程序右上角关闭按钮
		this.elm.btn.topClose.onclick = function () {
			_this.exitApp();
		};
	},
	exitApp: function () {
		this.sock.emit('exit');
		this.elm.main.style.display = 'none';
		doc.querySelectorAll('.window_find')[0].style.display = 'none';
		doc.querySelectorAll('.window_add_firend')[0].style.display = 'none';
		doc.querySelectorAll('.window_adder_audit')[0].style.display = 'none';
		doc.querySelectorAll('.bottom_bar')[0].style.display = 'none';
		var arr = doc.querySelectorAll('.window_chat');
		var dis = doc.querySelectorAll('.desktop_container')[0];
		
		for (var i = 0; i < arr.length; i++) {
			dis.removeChild(arr[i]);
		}
		
		global.login = false;
		
	},
	minApp: function () {
		this.elm.main.style.display = 'none';
	},
	adderAuditResult: function (data) {
	  if (!data.err) {
			// 添加好友成功
			this.addUser(data.user);
			data.user.cid = data.user.uid;
			delete data.user.uid;
			this.user.json[data.user.cid] = data.user;
		} else {
			// 添加好友失败
			if (!this.msgbox) this.msgbox = new MsgBox();
			//console.log(data);
			data.msgtype = 'system';
			this.msgbox.init(data);
			
			var json = {};
			
			json.type = 2;
			json.uid = data.uid;
			
			json.msg = '拒绝了您的请求，附加信息(' + (data.msg || '无') + ')';
			json.count = 1;
			
			this.msgbox.addMsg(json);
		}
	},
	applyBuddy: function (data) {
		if (!this.msgbox) this.msgbox = new MsgBox();
		//console.log(data);
		data.msgtype = 'system';
		this.msgbox.init(data);
		
		var json = {};
		
		json.type = 1;
		json.uid = data.cid;
		json.msg = '请求添加您为好友，附加信息(' + (data.msg || '无') + ')';
		json.count = 1;
		
		this.msgbox.addMsg(json);
	},
	addBuddyResult: function (data) {
		if (data.err) {
			alert(data.msg);
		}
	},
	clcikFindBuddy: function () {
		if (!this.winfind) this.winfind = new FindBuddy();
		this.winfind.init(global.sock);
		this.winfind.addEvent();
		this.winfind.show();
		this.winfind.initShow();
	},
	openMsgBox: function () {
		var mb = doc.querySelectorAll('.bubble_container')[0];
		mb.style.display = 'block';
	},
	onSendMsg: function () {
		var _this = this;
		this.sock.removeAllListeners('send_msg');
		this.sock.on('send_msg', function (data) {

			_this.receiveMsg(this, data);
		});
	},
	receiveMsg: function (obj, data) {
		// 1.闪头像
		// 2.插入消息
		// 3.创建底部消息
		// this.user.json[data.uid].nick -> 昵称
		// data.msg -> 消息
		// data.id -> 发送消息用户id
		// data.time -> 发送消息时间

    data.nick = this.user.json[data.uid].nick;
		
		this.flashAvatar(data.uid);
		this.insertMsg(data.uid, data);
		this.createMsgBox(data);
		
		// 设置页面标题
		doc.title = '来消息了...' + data.nick + ' - ' + data.msg;
	},
	createMsgBox: function (data) {
		this.msgbox = new MsgBox();
		this.msgbox.init(data);
		this.msgbox.addMsg();
	},
	insertMsg: function (uid, data) {
		// 创建聊天窗口
		var win = doc.querySelectorAll('.win_chat_' + uid)[0];
		
		if (!win) {
		  // 不存在就创建后插入
			var winChat = new WinChat();
			winChat.init(this.sock, this.user.json[uid], this.myinfo);
			win = doc.querySelectorAll('.win_chat_' + uid)[0];
			win.style.display = 'none';
		}
		
		if (!win.dataset.unread) win.dataset.unread = 0;
		// 增加未读消息条数
		win.dataset.unread = parseInt(win.dataset.unread) + 1;

		// 拼接字符串插入消息
		var oMsg = document.createElement('dl');
				oMsg.className = 'chat_box_buddy_msg';
				oMsg.innerHTML = '<dt class="msg_head">' +
                         '<span class="nick">' + this.user.json[data.uid].nick + '</span><span class="date">' + formatDate(data.time) + '</span>' +
                         '</dt>' +
												 '<dd class="msg_body default_font_style">' +
                         data.msg +
												 '<br>' +
                         '</dd>';
		win.querySelectorAll('.chat_box_msg_list')[0].appendChild(oMsg);
		
		var oList = win.querySelectorAll('.chat_box_msg_list')[0];
		oList.scrollTop = oList.scrollHeight - oList.offsetHeight;
	},
	flashAvatar: function (uid) {
		// eqq_buddy_list_buddy eqq_jump_up_in_buddy_list
		var avatar = this.elm.main.querySelectorAll('.user_list_buddy_' + uid)[0];
		if (avatar.timer) clearInterval(avatar.timer);
		avatar.timer = null;
		avatar.timer = setInterval(function () {
			if (hasClass(avatar, 'eqq_jump_up_in_buddy_list')) delClass(avatar, 'eqq_jump_up_in_buddy_list');
			else addClass(avatar, 'eqq_jump_up_in_buddy_list');
		}, 100);
	},
	searchTxtFocus: function () {
		if (this.value == '搜索好友...') this.value = '';
	},
	searchTxtBlur: function () {
		if (this.value == '') this.value = '搜索好友...';
	},
	searchBuddy: function (ev) {
		var key = this.elm.searchTxt.value;
		var arr = this.elm.main.querySelectorAll('.user_list_buddy');
		
		// 搜索好友...
		if (key != ('' || '搜索好友...')) {
			for (var i = 0, len = arr.length; i < len; i++) {
				var str = delHtmlTag(arr[i].innerHTML);
				if (new RegExp(key, 'ig').test(str)) {
					arr[i].style.display = 'block';
				} else {
					arr[i].style.display = 'none';
				}
			}
		} else {
			for (var i = 0, len = arr.length; i < len; i++) {
        arr[i].style.display = 'block';
			}
		}
	},
	signClick: function (obj, ev) {
		var _this = this;
		
		var parent = parents(obj, 'eqq_my_signature_wraper');
		addClass(parent, 'eqq_my_signature_edit');
		
		var strSign = obj.value;
		
		obj.onkeydown = function (ev) {
			var ev = ev || window.event;
			var str = this.value;
			
			if (ev.keyCode == 13 && str != strSign) {
				// 修改签名
				_this.sock.emit('update_sign', {sign: str});
			}
		};
		
		obj.onblur = function (ev) {
			var parent = parents(this, 'eqq_my_signature_wraper');
			delClass(parent, 'eqq_my_signature_edit');
		  delClass(parent, 'eqq_my_signature_hover');

			var str = this.value;
			
			if (str != strSign) {
				_this.sock.emit('update_sign', {sign: str});
			}
			
			parent.className = delMultiBlank(parent.className);
		};
	},
	signOver: function () {
		var parent = parents(this, 'eqq_my_signature_wraper');
		addClass(parent, 'eqq_my_signature_hover');
	},
	signOut: function () {
		var parent = parents(this, 'eqq_my_signature_wraper');
		if (!hasClass(parent, 'eqq_my_signature_edit')) delClass(parent, 'eqq_my_signature_hover');
	},
	getUserInfo: function (uid) {
		var _this = this;
		this.sock.removeAllListeners('get_user_info_result');
		this.sock.on('get_user_info_result', function (data) {
			_this.setUserInfo.call(_this, data);
			_this.myinfo = data;
		});
		this.sock.emit('get_user_info', uid ? {uid: uid} : null);
	},
	setUserInfo: function (data) {
		var oAvatar = this.elm.myPanel.querySelectorAll('.eqq_my_avatar')[0];
		var oNick = this.elm.myPanel.querySelectorAll('.eqq_my_nick')[0];
		var oSign = this.elm.myPanel.querySelectorAll('.eqq_my_signature')[0];
		var oEmail = this.elm.bodyOuter.querySelectorAll('.mypanel_toolbar_email')[0];
		
		oAvatar.src = data.avatar;
		oNick.innerHTML = data.nick;
		oNick.title = data.nick + '<' + data.uid + '>';
		oSign.value = data.sign;
		oSign.title = data.sign;
		oEmail.href = 'mailto:' + data.email;
	},
	userOnline: function () {
		var _this = this;
		this.sock.removeAllListeners('online');
		this.sock.on('online', function (data) {
			// data.uid 上线用户id
			// 点亮头像
			// 增加上线人数
			var arr = _this.elm.mainBuddyListWrap.querySelectorAll('.user_list_buddy');
			
			for (var i = 0, len = arr.length; i < len; i++) {
				if (arr[i].dataset.uid == data.uid) {
					delClass(arr[i], 'eqq_offline_buddy');
					arr[i].dataset.online = 'true';
					
					var parent = parents(arr[i], 'eqq_list_class_body');
					var previous = pre(parent);
					var oOnline = previous.querySelectorAll('.eqq_class_online_counter')[0];
					oOnline.innerHTML = parseInt(oOnline.innerHTML) + 1;
				}
			}
		});
	},
	userOffline: function () {
		var _this = this;
		this.sock.removeAllListeners('offline');
		this.sock.on('offline', function (data) {
			// data.uid 下线用户id
			// 点亮头像
			// 增加上线人数
			var arr = _this.elm.mainBuddyListWrap.querySelectorAll('.user_list_buddy');
			
			for (var i = 0, len = arr.length; i < len; i++) {
				if (arr[i].dataset.uid == data.uid) {
					addClass(arr[i], 'eqq_offline_buddy');
					arr[i].dataset.online = 'false';
					
					var parent = parents(arr[i], 'eqq_list_class_body');
					var previous = pre(parent);
					var oOnline = previous.querySelectorAll('.eqq_class_online_counter')[0];
					oOnline.innerHTML = parseInt(oOnline.innerHTML) - 1;
				}
			}
		});
	},
	clickUserAvatar: function (obj, ev) {
		var ev = ev || window.event;
		var target = ev.target || ev.srcElement;
		var parent = parents(target, 'user_list_buddy');
		var userType = parents(target, 'user_list_type');

		if (parent) {
			// 创建聊天窗口
			var uid = parent.dataset.uid;
			var win = doc.querySelectorAll('.win_chat_' + uid)[0];
			
			if (win) {
				//winPopup(win);  // 居中显示
				win.style.display = 'block';
				win.style.zIndex = maxZ() + 1;
			} else {
				var winChat = new WinChat();
				winChat.init(this.sock, this.user.json[uid], this.myinfo);
				win = doc.querySelectorAll('.win_chat_' + uid)[0];
			}
			
			var oList = win.querySelectorAll('.chat_box_msg_list')[0];
			oList.scrollTop = oList.scrollHeight - oList.offsetHeight;
      
			// 1.清除头像消息提示
		  if (parent.timer) clearInterval(parent.timer);
			parent.timer = null;
			delClass(parent, 'eqq_jump_up_in_buddy_list');
			
			// 2.清除底部提示
      if (this.msgbox) this.msgbox.delMsg(uid);
		} else if (userType) {
			// 添加展开收缩功能
			if (hasClass(userType, 'eqq_list_class_head_collapsed')) {
				delClass(userType, 'eqq_list_class_head_collapsed');
				addClass(userType, 'eqq_list_class_head_expand');
				addClass(userType, 'expand');
				next(userType).children[0].style.display = 'block';
			} else if (hasClass(userType, 'eqq_list_class_head_expand')) {
				delClass(userType, 'eqq_list_class_head_expand');
				delClass(userType, 'expand');
				addClass(userType, 'eqq_list_class_head_collapsed');
				next(userType).children[0].style.display = 'none';
			}
		}
	},
	getUserList: function (tid) {
		var _this = this;
		this.sock.removeAllListeners('get_user_list_result');
		this.sock.on('get_user_list_result', function (data) {
			_this.createUserList.call(_this, data);
			_this.countUser.call(_this);
		});
		this.sock.emit('get_user_list', tid ? {tid: tid} : null);
	},
	clearCount: function () {
		var arr1 = this.elm.mainBuddyListWrap.querySelectorAll('.eqq_class_counter');
		var arr2 = this.elm.mainBuddyListWrap.querySelectorAll('.eqq_class_counter');
		for (var i = 0, len = arr1.length; i < len; i++) {
			arr1[i].innerHTML = 0;
			arr2[i].innerHTML = 0;
		}
	},
	countUser: function () {
		// 清除计数
		this.clearCount();
		
		var arr = this.elm.mainBuddyListWrap.querySelectorAll('.eqq_buddy_list_buddy');
		
		for (var i = 0, len = arr.length; i < len; i++) {
			var parent = parents(arr[i], 'eqq_list_class_body');
			
			var previous = pre(parent);
			
			var oCount = previous.querySelectorAll('.eqq_class_counter')[0];
			
			oCount.innerHTML = parseInt(oCount.innerHTML) + 1;
			
			var oOnline = previous.querySelectorAll('.eqq_class_online_counter')[0];
			
			if (arr[i].dataset.online == 'true') {
				oOnline.innerHTML = parseInt(oOnline.innerHTML) + 1;
			}
		}
	},
	addUser: function (data) {
		//console.log(data);
		var _this = this;
		var oDiv = document.createElement('div');
		oDiv.className = 'eqq_buddy_list_buddy user_list_buddy user_list_buddy_' + data.uid + (!data.online ? ' eqq_offline_buddy' : '');
		oDiv.dataset.uid = data.uid;
		oDiv.dataset.online = data.online;
		
		//console.log(oDiv);

		var html = '';
					
		html = '<div class="eqq_buddy_list_client_type" title="手机QQ">' + 
					 '<div class="eqq_buddy_list_client_type_phone"></div>' +
					 '</div>' +
					 '<div class="eqq_buddy_list_avatar_container" title="' + (!data.online ? '离线' : '在线') + '">' +
					 '<img src="' + data.avatar + '" class="eqq_buddy_list_avatar" />' +
					 '</div>' +
					 '<div class="eqq_buddy_list_right_container">' +
					 '<div class="eqq_buddy_list_nick">' + data.nick + '</div>' +
					 '<div class="eqq_buddy_list_sign" title="' + data.sign + '">' + data.sign + '</div>' +
					 '<div class="eqq_buddy_list_uid">' + data.uid + '</div>' +
					 '</div>';
					 
		oDiv.innerHTML = html;
		
		// 创建元素往 this.elm.mainBuddyListWrap 添加
		var arr =  this.elm.mainBuddyListWrap.querySelectorAll('.online_buddy_list');
		
		for (var i = 0, len = arr.length; i < len; i++) {
			//console.log(data.tid, arr[i].dataset.tid);
			if (data.tid == arr[i].dataset.tid) {
				//alert(1);
				arr[i].appendChild(oDiv);
			}
		}
		
		/*oDiv.onclick = function (ev) {
			_this.clickUserAvatar(this, ev);
		};*/
		
		this.countUser();
	},
	createUserList: function (data) {
		// data是获得的所有数据
		// 获取tid循环添加list
		var arr = this.elm.mainBuddyListWrap.querySelectorAll('.online_buddy_list');
		this.data.user.list = [];
		
		// 循环data中的每个数据，再循环分类列表，tid相等时添加
		for (var i = 0, len = data.length; i < len; i++) {
			this.data.user.list.push(data[i].cid);
			
			for (var j = 0; j < arr.length; j++) {
				
				this.user.json[data[i].cid] = data[i];
				
				if (data[i].tid == arr[j].dataset.tid) {
					var html = '';
					
					html = '<div class="eqq_buddy_list_buddy user_list_buddy' + ' user_list_buddy_' + data[i].cid + (!data[i].online ? ' eqq_offline_buddy' : '') + '" data-uid="' + data[i].cid + '" data-online=' + data[i].online + '>' + 
					       '<div class="eqq_buddy_list_client_type" title="手机QQ">' + 
                 '<div class="eqq_buddy_list_client_type_phone"></div>' +
                 '</div>' +
								 '<div class="eqq_buddy_list_avatar_container" title="' + (!data[i].online ? '离线' : '在线') + '">' +
                 '<img src="' + data[i].avatar + '" class="eqq_buddy_list_avatar" />' +
                 '</div>' +
								 '<div class="eqq_buddy_list_right_container">' +
                 '<div class="eqq_buddy_list_nick">' + data[i].nick + '</div>' +
                 '<div class="eqq_buddy_list_sign" title="' + data[i].sign + '">' + data[i].sign + '</div>' +
								 '<div class="eqq_buddy_list_uid">' + data[i].cid + '</div>' +
                 '</div>' +
								 '</div>';
					
					arr[j].innerHTML += html;
				}
			}
		}
	},
	createUserType: function (data) {
		this.elm.mainBuddyListWrap.innerHTML = '';
		var html = '';

		for (var i = 0, len = data.length; i < len; i++) {
			this.user.type[i] = {};
			this.user.type[i].tid = data[i].tid;
			this.user.type[i].tname = data[i].tname;
			
			html += (i == 0 ? '<div class="eqq_list_class_head_expand user_list_type expand" data-tid="' + data[i].tid + '">' : '<div class="eqq_list_class_head_collapsed user_list_type" data-tid="' + data[i].tid + '">') +
              '<div class="eqq_list_class_head_icon">icon</div>' +
              '<div title="' + data[i].tname + '" class="eqq_class_list_right_container">' +
              '<div class="eqq_class_class_name">' + data[i].tname + '&nbsp;</div>' + 
							'[<span class="eqq_class_online_counter">0</span>/<span class="eqq_class_counter">0</span>]' +
							'</div>' +
              '</div>' + 
							// 好友列表
							'<div class="eqq_list_class_body" style="height:auto;">' +
              '<div class="eqq_online_buddy online_buddy_list" data-tid="' + data[i].tid + '" style="display:' + (i == 0 ? 'block' : 'none') + ';"></div></div>';
		}
		
		this.elm.mainBuddyListWrap.innerHTML = html;
		this.getUserList();
	},
	getUserType: function () {
		var _this = this;
		this.sock.removeAllListeners('get_user_type_result');
		this.sock.on('get_user_type_result', function (data) {
			_this.createUserType.call(_this, data);
		});
		this.sock.emit('get_user_type');
	},
	winResize: function () {
		this.draw(viewHeight());
	},
	draw: function (height) {
		this.elm.main.style.display = 'block';
		this.elm.main.style.height = height + 'px';
		var h1 = viewHeight() - parseInt(getStyle(this.elm.outer, 'paddingTop')) - parseInt(getStyle(this.elm.outer, 'paddingBottom'));
		this.elm.outer.style.height = h1 + 'px';
		var h2 = h1 - this.elm.bodyOuter.offsetTop - this.elm.mianPanel.offsetTop - this.elm.listContainer.offsetTop;

		this.elm.listContainer.style.height = h2 + 'px';
		var h3 = this.elm.listContainer.offsetHeight - this.elm.listBottom.offsetHeight;
		this.elm.listPanel.style.height = h3 + 'px';
		this.elm.main.style.left = viewWidth() - this.elm.main.offsetWidth + 'px';
	}
};

function FindBuddy() {
	this.elm = {};
	this.elm.btn = {};
	this.elm.ipt = {};
	this.elm.chk = {};
	this.elm.win = {};
	this.elm.panel = {};
	this.sock = null;
}

FindBuddy.prototype = {
	init: function (sock) {
		this.sock = sock || global.sock;
		this.elm.main = doc.querySelectorAll('.window_find')[0];
		this.elm.chk.exact = this.elm.main.querySelectorAll('.s_option_box .chk_exact')[0];  // 精确查找单选框
		this.elm.chk.onwer = this.elm.main.querySelectorAll('.s_option_box .chk_onwer')[0];  // 查找所有单选框
		this.elm.ipt.panel = this.elm.main.querySelectorAll('.s_ip_box')[0];  // 输入面板
		this.elm.ipt.acc = this.elm.main.querySelectorAll('.s_ip_box .ipt_acc')[0];  // 账号文本框
		this.elm.ipt.nick = this.elm.main.querySelectorAll('.s_ip_box .ipt_nick')[0];  // 昵称文本框
		this.elm.panel.exact = this.elm.main.querySelectorAll('.s_ip_box')[0];  // 精确查找面板
		this.elm.btn.query = this.elm.main.querySelectorAll('.btn_query')[0];  // 查找按钮
		this.elm.btn.cancel = this.elm.main.querySelectorAll('.btn_cancel')[0];  // 取消按钮
		this.elm.btn.quit = this.elm.main.querySelectorAll('.window_close')[0];  // 右上角关闭按钮
		this.elm.panel.s = this.elm.main.querySelectorAll('.s_box')[0];  // 搜索页面
		this.elm.panel.r = this.elm.main.querySelectorAll('.r_box')[0];  // 结果页面
		this.elm.template = this.elm.main.querySelectorAll('.result_template')[0];  // 好友列表模板
		this.elm.listbox = this.elm.main.querySelectorAll('.result_box')[0];  // 查找好友结果列表外层
		this.elm.list = this.elm.main.querySelectorAll('.result_box_list')[0];  // 查找好友结果列表
		this.pagesize = 6;
		this.pageno = 0;
	},
	initShow: function () {
		this.elm.panel.s.style.display = 'block';
		this.elm.panel.r.style.display = 'none';
		this.elm.chk.exact.checked = true;
		this.elm.chk.onwer.checked = false;
		this.elm.ipt.acc.value = '';
		this.elm.ipt.nick.value = '';
		this.elm.ipt.panel.style.display = 'block';
		this.clearList();
	},
	clearList: function () {
		var arr = this.elm.list.children;
		//console.log(arr);
		for (var i = 0, len = arr.length; i < arr.length; i++) {
			if (!hasClass(arr[i], 'result_template')) {
				this.elm.list.removeChild(arr[i]);
				i--;
			}
		}
	},
	show: function () {
		//this.elm.main.style.display = 'block';
		boxPopup(this.elm.main);
	},
	hide: function () {
		this.elm.main.style.display = 'none';
	},
	addEvent: function () {
		var _this = this;

		this.elm.chk.exact.onclick = function () {
			_this.clickExact();
		};
		
		this.elm.chk.onwer.onclick = function () {
			_this.clickOnwer();
		};
		
		this.elm.btn.quit.onclick = this.elm.btn.cancel.onclick = function () {
			_this.clickCancel();
		};
		
		this.elm.btn.query.onclick = function () {
			_this.clickQuery();
		};
		
		// 添加好友至列表
		this.sock.removeAllListeners('query_buddy_result');
		this.sock.on('query_buddy_result', function (data) {
			if (!data.err) _this.addBuddyList(data.data);
			//else alert(data.msg);
		});
		
		// 添加好友列表滚动
		this.elm.listbox.onscroll = function (ev) {
			_this.loadList(this);
		};
		
		// 点击加为好友
		this.elm.list.onclick = function (ev) {
			_this.clickList(ev, this);
		};
	},
	clickList: function (ev, obj) {
		var ev = ev || window.event;
		var target = ev.target || ev.srcElement;
		
		// 加好友
		if (hasClass(target, 'btn_add_buddy')) {
			var uid = target.dataset.uid;
			this.sock.emit('add_buddy', {uid: uid});
		}
	},
	loadList: function (obj) {
		if ((obj.scrollTop + obj.offsetHeight) == obj.scrollHeight) this.clickQuery();
	},
	addBuddyList: function (data) {
		for (var i = 0, len = data.length; i < len; i++) {
			this.addBuddy(data[i]);
		}
		this.pageno++;
	},
	addBuddy: function (data) {
		var buddy = dupElement(this.elm.template);
		this.elm.list.appendChild(buddy);

		var json = {};
		json.avatar = data.avatar;
		json.uid = data.id;
		json.email = data.email;
		json.nick = data.nick;
		json.online = data.online ? '是' : '否';
		
		buddy.innerHTML = format(buddy.innerHTML, json);
		buddy.dataset.uid = data.id;
		
		if (this.elm.list.children.length % 2 != 0) addClass(buddy, 'buddy_finder_tiny_info_fix');
		delClass(buddy, 'result_template');
	},
	clickQuery: function () {
		if (this.elm.chk.exact.checked) this.queryExact();
		if (this.elm.chk.onwer.checked) this.queryOnwer();
	},
	clickExact: function () {
		this.elm.panel.exact.style.display = 'block';
	},
	clickOnwer: function () {
		this.elm.panel.exact.style.display = 'none';
	},
	clickCancel: function () {
		this.elm.main.style.display = 'none';
		this.pageno = 0;
	},
	queryExact: function () {
		var acc = this.elm.ipt.acc.value;
		var nick = this.elm.ipt.nick.value;
		
		if (acc == '' && nick == '') {
			this.elm.ipt.acc.focus();
			return false;
		}
		
		var data = {};
		data.act = 'exact';
		
		if (acc) {
			if (regEmail(acc)) data.email = acc;
			if (regQQ(acc)) data.id = acc;
		}
		
		if (nick) data.nick = nick;
		
		data.desc = 'login_num';
		
		data.rows = this.pageno * this.pagesize;
		data.size = this.pagesize;

		this.sock.emit('query_buddy', data);
				
		this.elm.panel.s.style.display = 'none';
		this.elm.panel.r.style.display = 'block';
	},
	queryOnwer: function () {
		var data = {};
		data.act = 'all';
		
		data.desc = 'login_num';
		
		data.rows = this.pageno * this.pagesize;
		data.size = this.pagesize;
		
		this.sock.emit('query_buddy', data);
				
		this.elm.panel.s.style.display = 'none';
		this.elm.panel.r.style.display = 'block';
	}
};

// 消息盒子
function MsgBox() {
	this.elm = {};
	this.elm.btnIgnore = null;
}

MsgBox.prototype = {
	init: function (data) {
		this.data = data;
		this.elm.main = doc.querySelectorAll('.bubble_container')[0];
		this.elm.btnIgnore = this.elm.main.querySelectorAll('.cancel_notify')[0];
		this.elm.btnViewAll = this.elm.main.querySelectorAll('.view_all')[0];
		this.elm.list = this.elm.main.querySelectorAll('.bubble_msg_list_container ul')[0];
		this.elm.panel = this.elm.main.querySelectorAll('.bubble_panel')[0];
		this.elm.panelList = this.elm.main.querySelectorAll('.bubble_msg_list')[0];
		this.addEvent();
		//console.log(data);
	},
	show: function () {
		this.elm.main = doc.querySelectorAll('.bubble_container')[0];
		this.elm.main.style.display = 'block';
	},
	hide: function () {
		this.elm.main = doc.querySelectorAll('.bubble_container')[0];
		this.elm.main.style.display = 'none';
	},
	addEvent: function () {
		var _this = this;
		
		// 增加一条消息
		//this.addMsg();
		
		// 添加忽略消息
		this.elm.btnIgnore.onclick = function (ev) {
			_this.clickIgnore(this, ev);
		};
		
		// 添加查看全部
		this.elm.btnViewAll.onclick = function (ev) {
			_this.clickViewAll(this, ev);
		};
		
		// 添加底部读消息
		this.elm.panel.onclick = function (ev) {
			_this.clickPanel(this.dataset.uid, this);
		};
		
		// 移入显示
		this.elm.main.onmouseover = function () {
			_this.mainOver();
		};
		
		// 移出隐藏
		this.elm.main.onmouseout = function () {
			_this.mainOut();
		};
		
		// 添加读消息
		this.elm.list.onclick = function (ev) {
			_this.clickList(ev, this);
		};
	},
	mainOver: function () {
		this.elm.panelList.style.display = 'block';
		this.elm.main.style.zIndex = maxZ() + 1;
	},
	mainOut: function () {
		this.elm.panelList.style.display = 'none';
		this.elm.main.style.zIndex = maxZ() - 1;
	},
	clickPanel: function (uid, obj) {
		if (!this.elm.list.children.length) return false;
		// 删除消息
	  this.delMsg(uid);
			
		if (obj.dataset.type == 1) {
			// 加好友申请
			var audit = new WinAudit();
			var json = {};
			json.uid = uid;
			audit.init(json);
			audit.show();
		} else if (obj.dataset.type == 2) {
			
		} else if (obj.dataset.type == 3) {
			
		} else {
			// 打开聊天窗口
			this.openWindow(uid);
		}
	},
	clickViewAll: function (obj, ev) {
		var oUl = this.elm.list;
		var arr = oUl.children;
		
		for (i = 0, len = arr.length; i < len; i++) {
			if (!arr[i]) return false;
			var uid = arr[i].dataset.uid;
			if (arr[i].dataset.type == 1) {
				// 加好友申请
				var audit = new WinAudit();
				var json = {};
				json.uid = uid;
				audit.init(json);
				audit.show();
			} else if (arr[i].dataset.type == 2) {
				
			} else if (arr[i].dataset.type == 3) {
				
			} else {
				// 打开聊天窗口
				this.openWindow(uid);
			}
			
			// 删除消息
			this.delMsg(uid);
			
			i--;
		}
	},
	clickList: function (ev, obj) {
		var ev = ev || window.event;
		var target = ev.target || ev.srcElement;
		var parent = parents(target, 'item');
		var uid = parent.dataset.uid;

		// 删除消息
		this.delMsg(uid);
		
		// type == 1 -> 加好友申请
		// type == 2 -> 加好友被拒
		if (parent.dataset.type == 1) {
			// 加好友申请
			var audit = new WinAudit();
			var json = {};
			json.uid = uid;
			audit.init(json);
			audit.show();
		} else if (parent.dataset.type == 2) {
			// 加好友被拒
		} else if (parent.dataset.type == 3) {
			
		} else {
			// 打开聊天窗口
		  this.openWindow(uid);
		}
	},
	openWindow: function (uid) {
		// 创建聊天窗口
		var win = doc.querySelectorAll('.win_chat_' + uid)[0];
		
		if (!win) {
		  // 不存在就创建后插入
			var winChat = new WinChat();
			winChat.init(this.sock, this.user.json[uid], this.myinfo);
			win = doc.querySelectorAll('.win_chat_' + uid)[0];
			win.style.display = 'none';
		}
		
		if (!win.dataset.unread) win.dataset.unread = 0;
		win.style.display = 'block';
		
		var avatar = doc.querySelectorAll('.user_list_buddy_' + uid)[0];
		if (avatar.timer) clearInterval(avatar.timer);
		avatar.timer = null;
		delClass(avatar, 'eqq_jump_up_in_buddy_list');
	},
	delMsg: function (uid) {
		var oBox = doc.querySelectorAll('.bubble_container')[0];
		var oUl = oBox.querySelectorAll('.bubble_msg_list_container ul')[0];
		var oItem = oUl.querySelectorAll('.msg_item_' + uid)[0];
		var arr = oUl.querySelectorAll('.item');
		
		for (var i = 0, len = arr.length; i < len; i++) {
			if (arr[i].dataset.uid == uid) {
				oUl.removeChild(arr[i]);
			}
		}
		
		this.updateUnread();
		
		if (oUl.children.length) { 
		  var oFirst = oUl.children[0];
      var msg = this.getMsg(oFirst.dataset.uid);
		  this.setPanel(msg.nick, msg.msg, msg.count);
		} else {
			this.setPanel();
		}
	},
	clickIgnore: function (obj, ev) {
		this.elm.main.style.display = 'none';
	},
	addMsg: function (json) {
    this.elm.main.style.display = 'block';
    // 1.查找是否有uid的信息，没有不创建
		// 2.显示最新的信息和未读条数
		// 3.增加底部信息
		var uid = 0;
		
		if (json) {
			if (json.type) uid = json.uid;
		} else {
			uid = this.data.uid;
		}
		
		var oUl = this.elm.main.querySelectorAll('.bubble_msg_list_container ul')[0];
    var oItem = this.elm.main.querySelectorAll('.msg_item_' + uid)[0];
    
		if (!oItem) {
			var oLi = doc.createElement('li');
			oLi.dataset.uid = uid;
			oLi.className = 'item msg_item_' + uid;
      oLi.innerHTML = '<a href="#">' + 
                      '<span class="count">(<span>0</span>)</span>' +
                      '<img src="images/1.bmp" class="avatar">' +
                      '<span class="content">' +
                      '<span class="content_inner"><span class="nick"></span>：<span class="msg"></span></span>' +
                      '</span>' +
                      '</a>';
			oUl.appendChild(oLi);
			
			if (json) {
				if (json.type) oLi.dataset.type = json.type;
			}
			
			oItem = oLi;
		}
		
		var oFirst = first(oItem.parentNode);
		
		if (oFirst) {
		  oUl.insertBefore(oItem, oFirst);
		} else {
			oUl.appendChild(oItem);
		}

		// 信息列表新增消息
		this.setMsg(uid, json);
		
		// 设置底部信息
		if (json) {
			if (json.type) this.setPanel(json.uid, json.msg, json.count, json.type);
		} else {
			var msg = this.getMsg(uid);
		  this.setPanel(msg.nick, msg.msg, msg.count);
		}
		
		// 更新顶部未读消息数量
		this.updateUnread();
	},
	setMsg: function (uid, json) {
		//console.log(json);
		var oItem = this.elm.main.querySelectorAll('.bubble_msg_list_container .msg_item_' + uid)[0];
		
		var oItemAvatar = oItem.querySelectorAll('.avatar')[0];
		var imgSrc = '';
		if (json) {
			if (json.type == 1 || json.type == 2 || json.type == 3) {
				imgSrc = '';
				var ico = document.createElement('span');
				ico.className = 'avatar system';
				oItemAvatar.parentNode.insertBefore(ico, oItemAvatar);
				oItemAvatar.parentNode.removeChild(oItemAvatar);
			}
		} else {
			imgSrc = doc.querySelectorAll('.user_list_buddy_' + uid)[0].querySelectorAll('.eqq_buddy_list_avatar')[0].src;
			oItemAvatar.src = imgSrc;
		}
		
		var oItemCount = oItem.querySelectorAll('.count span')[0];
    var oItemNick = oItem.querySelectorAll('.content_inner .nick')[0];
    var oItemMsg = oItem.querySelectorAll('.content_inner .msg')[0];

		if (json) {
			if (json.type == 1 || json.type == 2 || json.type == 3) {
				oItemCount.innerHTML = json.count;
		    oItemNick.innerHTML = json.uid;
        oItemMsg.innerHTML = json.msg;
			}
		} else {
      oItemCount.innerHTML = parseInt(doc.querySelectorAll('.win_chat_' + uid)[0].dataset.unread);
		  oItemNick.innerHTML = this.data.nick;
      oItemMsg.innerHTML = delHtmlTag(this.data.msg);
		}
	},
	getMsg: function (uid) {
		var result = {};
		var oItem = doc.querySelectorAll('.bubble_container')[0].querySelectorAll('.bubble_msg_list_container .msg_item_' + uid)[0];
    //console.log(uid);
		result.src = doc.querySelectorAll('.user_list_buddy_' + uid)[0].querySelectorAll('.eqq_buddy_list_avatar')[0].src;
		result.count = parseInt(oItem.querySelectorAll('.count span')[0].innerHTML);
    result.nick = oItem.querySelectorAll('.content_inner .nick')[0].innerHTML;
    result.msg = oItem.querySelectorAll('.content_inner .msg')[0].innerHTML;
    result.unread = parseInt(doc.querySelectorAll('.win_chat_' + uid)[0].dataset.unread);
		
		return result;
	},
	updateUnread: function (n) {
		var num = doc.querySelectorAll('.bubble_container')[0].querySelectorAll('.bubble_msg_list .count')[0];
		var arr = doc.querySelectorAll('.bubble_container')[0].querySelectorAll('.bubble_msg_list_container .item');
		
		if (n) {
			num.innerHTML = n;
			return false;
		}
		
		if (!arr.length) {
			num.innerHTML = 0;
			return false;
		}
		
		var sum = 0;

		/*for (var i = 0, len = arr.length; i < len; i++) {
			var n = parseInt(arr[i].querySelectorAll('.count span')[0].innerHTML);
			sum += n;
		}*/
		
		sum = arr.length;
		
		num.innerHTML = sum;
		
		return sum;
	},
	setPanel: function (nick, msg, count, type) {
		var oItem = doc.querySelectorAll('.bubble_container')[0].querySelectorAll('.bubble_msg_list_container .item')[0];
		var oPanel = doc.querySelectorAll('.bubble_container')[0].querySelectorAll('.bubble_panel')[0];
		var oPanelCount = oPanel.querySelectorAll('.count')[0];
		var oPanelNick = oPanel.querySelectorAll('.nick')[0];
		var oPanelMsg = oPanel.querySelectorAll('.text')[0];
		
		if (!oItem) {
			oPanelCount.innerHTML = 0;
			oPanelNick.innerHTML = '系统';
			oPanelMsg.innerHTML = '暂无消息';
			oPanel.dataset.uid = 0;
		  return false;
		}
		
		var uid = oItem.dataset.uid;
		
		oPanelCount.innerHTML = count;
		oPanelNick.innerHTML = nick;
		oPanelMsg.innerHTML = msg;
		oPanel.dataset.uid = uid;
		
		if (type) oPanel.dataset.type = type;
		else oPanel.dataset.type = '';
	}
};

// 加好友弹窗
function WinAudit() {
	this.elm = {};
	this.elm.chk = {};
	this.elm.btn = {};
}

WinAudit.prototype = {
	init: function (json) {
		this.elm.main = doc.querySelectorAll('.window_adder_audit')[0];
		this.elm.avatar = this.elm.main.querySelectorAll('.buddy_adder_area_avatar')[0];  // 头像图片
		this.elm.chk.agree = this.elm.main.querySelectorAll('.chk_audit_agree')[0];  // 同意单选框
		this.elm.chk.refuse = this.elm.main.querySelectorAll('.chk_audit_refuse')[0];  // 拒绝单选框
		this.elm.btn.quit = this.elm.main.querySelectorAll('.window_close')[0];  // 右上角关闭按钮
		this.elm.btn.cancel = this.elm.main.querySelectorAll('.window_cancel')[0];  // 取消按钮
		this.elm.btn.sure = this.elm.main.querySelectorAll('.window_ok')[0];  // 确定按钮
		this.elm.nick = this.elm.main.querySelectorAll('.buddy_adder_area_nick')[0];  // 昵称
		this.data = json;

    this.draw();
		this.addEvent();
	},
	draw: function () {
		this.elm.nick.innerHTML = this.data.uid + '(' + this.data.uid + ')';
	},
	addEvent: function () {
		var _this = this;

		this.elm.btn.sure.onclick = function () {
			_this.clickSure(this);
		};
		
		this.elm.btn.quit.onclick = this.elm.btn.cancel.onclick = function () {
			_this.hide();
		};
	},
	clickSure: function (obj) {
		var data = {};
		data.uid = this.data.uid;
		
		// 同意 1
		// 拒绝 2
		if (this.elm.chk.agree.checked) data.act = 1;
		if (this.elm.chk.refuse.checked) data.act = 2;
		
		global.sock.emit('adder_audit', data);
		
		this.hide();
	},
	show: function () {
		//this.elm.main.style.display = 'block';
		boxPopup(this.elm.main);
	},
	hide: function () {
		this.elm.main.style.display = 'none';
	},
};

// App启动
function App(sock) {
	var startAnimate = new StartAnimate();
	var sideMenu = new SideMenu();
	
	startAnimate.loading(function () {
		sideMenu.init();
	});
}

App.prototype = {
	init: function (sock) {
		var _this = this;
		this.sock = sock;
		this.startAnimate = new StartAnimate();
		this.sideMenu = new SideMenu();
		
		this.startAnimate.loading(function () {
		  _this.sideMenu.init(sock);
	  });
	}
};

// 聊天窗口
function WinChat() {
	this.template = {};
	this.data = {};
	this.elm = {};
}

WinChat.prototype = {
	init: function (sock, data, info) {
		this.template.elm = doc.querySelectorAll('.window_chat_template')[0];
		this.template.html = this.template.elm.innerHTML;
		this.elm.main = null;
		this.sock = sock;
		this.data = data;
		this.info = info;
		this.createWin();
	},
	createWin: function () {
		var _this = this;
		var oWin = document.createElement('div');
		oWin.innerHTML = this.template.html;
		oWin.className = 'window window_chat win_chat_' + this.data.cid;
		oWin.style.display = 'block';
		oWin.style.width = '445px';
		oWin.style.height = '450px';
		
		// obj.insertBefore(newNode, node)        在obj里将newNode插入到node前
		this.template.elm.parentNode.insertBefore(oWin, this.template.elm);
		
		this.elm.main = oWin;
		this.elm.msgList = oWin.querySelectorAll('.chat_box_msg_list')[0];
		
		// 每次点击都在最上层
		oWin.onclick = function () {
			var oListUser = doc.querySelectorAll('.user_list_buddy_' + _this.data.cid)[0];
			if (oListUser.timer) clearInterval(oListUser.timer);
			oListUser.timer = null;
			this.style.zIndex = maxZ() + 1;
			this.dataset.unread = 0;
      
			var mb = new MsgBox();
			mb.delMsg(_this.data.cid);
			if (!mb.updateUnread()) doc.title = '首页';
		};
		
		// 添加拖拽
		var oTitleBar = oWin.querySelectorAll('.window_title_bar')[0];
		
		oTitleBar.onmousedown = function (ev) {
			var _this = this;
			var ev = ev || window.event;
			var parent = parents(_this, 'window_chat');
			
			var disX = ev.clientX - parent.offsetLeft;
			var disY = ev.clientY - parent.offsetTop;
			
			parent.style.zIndex = maxZ() + 1;
			
			if(this.setCapture) {
				this.setCapture();	
			}
			
			document.onmousemove = function (ev) {
				var ev = ev || window.event;
				var l = ev.clientX - disX;
				var t = ev.clientY - disY;

				parent.style.left = l + 'px';
				parent.style.top = t + 'px';
			};
			
			document.onmouseup = function () {
				document.onmousemove = null;
				document.onmouseup = null;
				
				if(_this.releaseCapture) {
					_this.releaseCapture();	
				}
			};
			
			return false;
		};
		
		winPopup(oWin);
		this.setUserInfo();  // 设置用户信息
		
		// 文本编辑框
		this.elm.edit = this.elm.main.querySelectorAll('.rich_editor_div')[0];
		this.elm.edit.onkeydown = function (ev) {
			var ev = ev || window.event;
			var par = parents(this, 'window_chat');
			var str = par.querySelectorAll('.rich_editor_div')[0].innerHTML;
			
			if (ev.ctrlKey && ev.keyCode == 13) _this.sock.emit('send', {cid: _this.data.cid, msg: str});
		};
		
		this.elm.edit.ondragover = function () {
			return false;
		};
		
		//释放拖拽文件
		this.elm.edit.ondrop = function (ev) {
			/*var aFile = ev.dataTransfer.files;  //dataTransfer文件数组
			var oFile = aFile[0];  //获得文件
			
			var oRead = new FileReader(); //创建FileReader对象

			//加载完成
			oRead.onload = function () {
				_this.elm.edit.innerHTML += '<img src="' + this.result + '" />';
			};
			
			//加载出错
			oRead.onerror = function () {
				alert('读取出错');
			};
			
			//调用readAsDataURL方法将图像文件读取出来
			oRead.readAsDataURL(oFile);
			
			return false;*/
			
			
			
			var aFile = ev.dataTransfer.files;
		
			for(var i = 0; i < aFile.length; i++) {
				var oRead = new FileReader();
				switch(aFile[i].type.split('/')[0]) {
					case 'image':
						oRead.onload = function () {
							_this.elm.edit.innerHTML += '<img class="file_img" src="' + this.result + '" />';
						};
						
						oRead.onerror = function () {
							alert('读取图片出错');
						};
						
						oRead.readAsDataURL(aFile[i]);
						break;
					case 'text':
						oRead.onload = function () {
							_this.elm.edit.innerHTML += '<div class="file_text">' + this.result + '</div>';
						};
						oRead.readAsText(aFile[i]);
						break;
					default:
					  oRead.onload = function () {
							_this.elm.edit.innerHTML += '<div class="file_binary">' + this.result + '</div>';
						};
						oRead.readAsBinaryString(aFile[i]);
						break;
				}
			}
			
			return false;
		};

		// 右上角关闭按钮
		this.elm.topBtnClose = this.elm.main.querySelectorAll('.window_close')[0];
		this.elm.topBtnClose.onclick = function () {
			_this.closeWin(this);
		};
		
		// 右上角最小化按钮
		this.elm.topBtnMin = this.elm.main.querySelectorAll('.window_min')[0];
		this.elm.topBtnMin.onclick = function () {
			_this.closeWin(this);
		};
		
		// 右上角最大化按钮
		this.elm.topBtnMax = this.elm.main.querySelectorAll('.window_max')[0];
		
		// 底部关闭按钮
		this.elm.panelBtnClose = this.elm.main.querySelectorAll('.chat_box_control_panel .chat_box_close_button')[0];
		this.elm.panelBtnClose.onclick = function () {
			_this.closeWin(this)
		};
		
		// 移动滚动条至底部
		this.setScrollBottom();
		
		// 绑定发送消息回执事件
		this.sock.removeAllListeners('send_result');
		this.sock.on('send_result', function (data) {

			var recWin = doc.querySelectorAll('.win_chat_' + data.cid)[0];
			var oList = recWin.querySelectorAll('.chat_box_msg_list')[0];
			var oEdit = recWin.querySelectorAll('.rich_editor_div')[0];
			
			if (!data.code) {
				// 发送成功
				// 插入消息，清空输入，移动滚动条
				var oMsg = document.createElement('dl');
				oMsg.className = 'chat_box_my_msg';
				oMsg.innerHTML = '<dt class="msg_head">' +
                         '<span class="nick">' + _this.info.nick + '</span><span class="date">' + formatDate(data.time) + '</span>' +
                         '</dt>' +
												 '<dd class="msg_body default_font_style">' +
                         oEdit.innerHTML +
												 '<br>' +
                         '</dd>';
				oList.appendChild(oMsg);
				oEdit.innerHTML = '';
				
				oList.scrollTop = oList.scrollHeight - oList.offsetHeight;
			} else {
				// 发送失败
				// 插入消息，移动滚动条
				var oMsg = document.createElement('dl');
				oMsg.className = 'chat_box_my_msg chat_box_sys_msg';
				oMsg.innerHTML = '<dt class="msg_head">' +
                         '<span class="nick">系统消息</span><span class="date">' + formatDate(data.time) + '</span>' +
                         '</dt>' +
												 '<dd class="msg_body default_font_style">' +
                         data.msg +
												 '<br>' +
                         '</dd>';
				oList.appendChild(oMsg);
				oList.scrollTop = oList.scrollHeight - oList.offsetHeight;
			}
		});
		
		// 发送按钮
		this.elm.panelBtnPost = this.elm.main.querySelectorAll('.chat_box_control_panel .chat_box_send_msg_button')[0];
		this.elm.panelBtnPost.onclick = function (ev) {
			var par = parents(this, 'window_chat');
			var str = par.querySelectorAll('.rich_editor_div')[0].innerHTML;
			_this.sock.emit('send', {cid: _this.data.cid, msg: str});
		};
		
		// 清除按钮
		this.elm.btnClear = this.elm.main.querySelectorAll('.chat_box_clear_button')[0];
		this.elm.btnClear.onclick = function (ev) {
			var ev = ev || window.event;
			var target = ev.target || ev.srcElement;
			var area = parents(target, 'chat_box_main_area');
			var list = area.querySelectorAll('.chat_box_msg_list')[0];
			
			list.innerHTML = '';
		};
		
		
	},
	setScrollBottom: function () {
		var oList = this.elm.main.querySelectorAll('.chat_box_msg_list')[0];
		oList.scrollTop = oList.scrollHeight - oList.offsetHeight;
	},
	closeWin: function () {
		winPopup(this.elm.main);
		this.elm.main.style.display = 'none';
	},
	setUserInfo: function () {
		var oAvatar = this.elm.main.querySelectorAll('.avatar_in_chatbox')[0];
		oAvatar.src = this.data.avatar;
		
		var oNick = this.elm.main.querySelectorAll('.chat_box_main_name')[0];
		oNick.innerHTML = this.data.nick;
		
		var oSign = this.elm.main.querySelectorAll('.chat_box_announcement_area span')[0];
		oSign.title = this.data.sign;
		oSign.innerHTML = this.data.sign;
	}
};

// 左侧菜单
function SideMenu() {
	this.loaded = false;
	this.app = {};
}

SideMenu.prototype = {
	init: function (sock) {
		this.menu = doc.querySelectorAll('.left_bar')[0];
		this.main = doc.querySelectorAll('.window_main')[0];
		this.app.qq = doc.querySelectorAll('.dock_item_list .app_button_qq')[0];
		this.app.qq.ui = doc.querySelectorAll('.ui_boxy_qq')[0];
		this.app.qq.dialog = new DialogQQ(sock);
		this.initAnimal();
		this.addEvent();
	},
	addEvent: function () {
		var _this = this;
		
		this.app.qq.onclick = function () {
			if (!global.login) _this.disLoad(this);
			else _this.disMain(this);
		};
	},
	initAnimal: function () {
		transitionMove(this.menu, {left: 0}, 500);
	},
	disLoad: function (obj) {
		popup(this.app.qq.ui, true);
		this.app.qq.ui.querySelectorAll('.err_m')[0].style.display = 'none';
	},
	disMain: function () {
		this.main.style.display = 'block';
	}
};

// 开场动画
function StartAnimate() {};

StartAnimate.prototype = {
	loading: function (fn) {
		var loading = doc.querySelectorAll('.loading')[0];
		transitionMove(loading, {opacity: 1}, 1000);
		
		var disktop = doc.querySelectorAll('.disktop')[0];
		var bg = disktop.querySelectorAll('img')[0];
		var timer = null;
		
		timer = setTimeout(function () {
			bg.onload = function () {
				transitionMove(loading, {opacity: 0}, 1000, function () {
					loading.style.display = 'none';
				});
				transitionMove(disktop, {opacity: 1}, 1000, function () {
					if (fn) fn();
				});
			};
			bg.src = bg.getAttribute('_src');
		}, 1000);
	}
};

// 登录框
function DialogQQ(sock) {
	this.appMain = null;  // 主程序
	this.appIcon = null;  // 右下角快捷方式
	this.main = {};
	this.task = {};
	this.init(sock);
	this.addEvent();
}

DialogQQ.prototype = {
	init: function (sock) {
	  this.obj = doc.querySelectorAll('.ui_boxy_qq')[0];
		this.main.elm = doc.querySelectorAll('.window_main')[0];
		this.task.elm = doc.querySelectorAll('.bottom_bar')[0];
	  this.tips = this.obj.querySelectorAll('.err_m')[0];
	  this.linkReg = this.obj.querySelectorAll('.link_reg')[0];
	  this.btnLogin = this.obj.querySelectorAll('.logins .signin_btn')[0];
		this.btnClose = this.obj.querySelectorAll('.close')[0];
		this.iptUser = this.obj.querySelectorAll('.ipt_user')[0];
		this.iptPass = this.obj.querySelectorAll('.ipt_pass')[0];
		this.login = false;
		this.sock = sock;
	},
	addEvent: function () {
		var _this = this;
		this.linkReg.onclick = this.gotoReg;
		this.btnLogin.onclick = function () {
			_this.clickLogin(this);
		};
		this.btnClose.onclick = function () {
			_this.clickClose(this);
		};
		this.task.elm.onclick = function () {
			_this.showApp();
		};
	},
	showApp: function () {
		doc.querySelectorAll('.window_main')[0].style.display = 'block';
	},
	gotoReg: function () {
		window.location.href = config.route.reg;
	},
	clickLogin: function (obj) {
		// 如果检测成功则登录
		if (this.checkUser() && this.checkPass()) {
			this.openLogin();
		}
	},
	clickClose: function () {
		closePop(this.obj);
	},
	openLogin: function (data) {
		var _this = this;
		this.sock.removeAllListeners('login_result');
		
		// 查询 -> 查询成功登录
		this.sock.on('login_result', function (data) {
			if (data.code == 0) {
				_this.showTips.call(_this, '正在登录...');
				_this.showMain();
				_this.showTask();
        
				// 创建主程序
				var appMainWin = new AppMain();
		    appMainWin.init(_this.sock);

				global.login = true;
			} else {
				switch (data.code) {
					case 1: _this.showTips.call(_this, '您输入的帐号或密码不正确，请重新输入。'); break;
					case 2: _this.showTips.call(_this, '此账号已登录，请换其它账号登录。'); break;
					default: break;
				}
				global.login = false;
			}
		});
		
		// 检测 -> 检测成功发送
    this.sock.emit('user_login', {user: this.iptUser.value, pass: this.iptPass.value});
	},
	showMain: function () {
		closePop(this.obj);
		this.main.elm.style.display = 'block';
	},
	showTask: function () {
		this.task.elm.style.display = 'block';
	},
	showTips: function (str) {
		this.tips.innerHTML = str;
		this.tips.style.display = 'block';
	},
	hideTips: function () {
		this.tips.innerHTML = '';
		this.tips.style.display = 'none';
	},
	checkUser: function () {
		if (regEmail(this.iptUser.value) || regQQ(this.iptUser.value) && this.iptUser.value.length) {
			this.hideTips();
			return true;
		} else {
			this.showTips('请输入正确的QQ帐号！');
			this.tips.style.display = 'block';
			return false;
		}
	},
	checkPass: function () {
		if (this.iptPass.value) {
			this.hideTips();
			return true;
		} else {
			this.showTips('您还没有输入密码！');
			return false;
		}
	}
};

function formatDate(times) {
	// 2013-04-05 22:56:02
	var dt = new Date(times);
	return dt.getFullYear() + '-' + toDouble(dt.getMonth()) + '-' + toDouble(dt.getDate()) + ' ' + toDouble(dt.getHours()) + ':' + toDouble(dt.getMinutes()) + ':' + toDouble(dt.getSeconds());
}

function toDouble(str) {
	return parseInt(str) < 10 ? '0' + str : str;
}

function regEmail(str) {
	var re = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
	return re.test(str);
}

function regQQ(str) {
	var re = /^\d{1,13}$/;
	return re.test(str);
}

function boxPopup(obj, mask) {
	var z = maxZ();

  obj.css = {};
	obj.css.z = getStyle(obj, 'zIndex');
	obj.css.position = getStyle(obj, 'position');
	obj.css.left = getStyle(obj, 'left');
	obj.css.top = getStyle(obj, 'top');
	obj.css.marginLeft = getStyle(obj, 'marginLeft');
	obj.css.marginTop = getStyle(obj, 'marginTop');
	
	obj.style.display = 'block';
	obj.style.position = 'absolute';
	obj.style.zIndex = z + 2;
	obj.style.left = viewWidth()/2 + 'px';
	obj.style.top = viewHeight()/2 + 'px';
	obj.style.marginLeft = -obj.offsetWidth / 2 + 'px';
	obj.style.marginTop = -obj.offsetHeight / 2 + 'px';
	
	if (mask) {
		var oMask = doc.querySelectorAll('.ui_mask')[0];
		oMask.style.opacity = 0.5;
		oMask.style.zIndex = z + 1;
		oMask.style.display = 'block';
	}
}

function winPopup(obj, mask) {
	var z = maxZ();

  obj.css = {};
	obj.css.z = getStyle(obj, 'zIndex');
	obj.css.position = getStyle(obj, 'position');
	obj.css.left = getStyle(obj, 'left');
	obj.css.top = getStyle(obj, 'top');
	obj.css.marginLeft = getStyle(obj, 'marginLeft');
	obj.css.marginTop = getStyle(obj, 'marginTop');
	
	obj.style.position = 'absolute';
	obj.style.zIndex = z + 2;
	obj.style.left = (viewWidth() - obj.offsetWidth) / 2 + 'px';
	obj.style.top = (viewHeight() - obj.offsetHeight) / 2 + 'px';
	obj.style.display = 'block';
	
	if (mask) {
		var oMask = doc.querySelectorAll('.ui_mask')[0];
		oMask.style.opacity = 0.5;
		oMask.style.zIndex = z + 1;
		oMask.style.display = 'block';
	}
}

function popup(obj, mask) {
	var z = maxZ();

  obj.css = {};
	obj.css.z = getStyle(obj, 'zIndex');
	obj.css.position = getStyle(obj, 'position');
	obj.css.left = getStyle(obj, 'left');
	obj.css.top = getStyle(obj, 'top');
	obj.css.marginLeft = getStyle(obj, 'marginLeft');
	obj.css.marginTop = getStyle(obj, 'marginTop');
	
	obj.style.position = 'absolute';
	obj.style.zIndex = z + 2;
	obj.style.left = '50%';
	obj.style.top = '50%';
	obj.style.display = 'block';
	obj.style.marginLeft = -obj.offsetWidth/2 + 'px';
	obj.style.marginTop = -obj.offsetHeight/2 + 'px';
	
	if (mask) {
		var oMask = doc.querySelectorAll('.ui_mask')[0];
		oMask.style.opacity = 0.5;
		oMask.style.zIndex = z + 1;
		oMask.style.display = 'block';
	}
}

function closePop(obj) {
	var oMask = doc.querySelectorAll('.ui_mask')[0];
	oMask.style.opacity = 0;
	oMask.style.zIndex = 0;
	oMask.style.display = 'none';
	
	obj.style.display = 'none';
	
	if (obj.css) {
		var css = obj.css;
		obj.style.zIndex = css.z;
		obj.style.position = css.position;
		obj.style.left = parseInt(css.left);
		obj.style.top = parseInt(css.top);
		obj.style.marginLeft = parseInt(css.marginLeft);
		obj.style.marginTop = parseInt(css.marginTop);
	}
}

function maxZ() {
  var elements = doc.getElementsByTagName("*");
  for(var i = 0, z = 0; i < elements.length; i++){
    z = Math.max(z, !isNaN(getStyle(elements[i], 'zIndex')) ? getStyle(elements[i], 'zIndex') : 0 );
  }
  return z;
}

function getStyle(obj, attr) {
	return obj.currentStyle ? obj.currentStyle[attr] : getComputedStyle(obj, false)[attr];
}

function setStyle3(obj, name, value) {
	//transform、transition、borderRadius、boxShadow、textShadow
	var aCss3 = ['transform', 'transition', 'borderRadius', 'boxShadow', 'textShadow', 'background'];
	
	if (aCss3.indexOf(name) != -1) {
		obj.style['Webkit' + name.charAt(0).toUpperCase() + name.substring(1)] = value;
		obj.style['Moz' + name.charAt(0).toUpperCase() + name.substring(1)] = value;
		obj.style['ms' + name.charAt(0).toUpperCase() + name.substring(1)] = value;
		obj.style['O' + name.charAt(0).toUpperCase() + name.substring(1)] = value;
	}
	
	obj.style[name] = value;
}

function transitionMove(obj, json, iTime, fnEnd) {
	if (!iTime) iTime = 500;
	
	obj.style.WebkitTransition = iTime + 'ms all ease';
	obj.style.MozTransition = iTime + 'ms all ease';
	
	for (var i in json) {
		setStyle3(obj, i, json[i]);
	}
	
	setTimeout(function () {
		obj.style.WebkitTransition = 'none';
		obj.style.MozTransition = 'none';
		if (fnEnd) fnEnd();
	}, iTime + 50);
}

function getScroll() {
	return document.documentElement.scrollTop || document.body.scrollTop;
}

function getObjScroll(obj) {
  return obj.scrollTop;
}

function viewWidth() {
	return document.documentElement.clientWidth;
}

function viewHeight() {
	return document.documentElement.clientHeight;
}

function documentHeight() {
	return Math.max(document.body.offsetHeight, document.documentElement.clientHeight);
}

function format(str, json) {
	for (var i in json) {
		var re = new RegExp('{tag:' + i + '}', 'g');
		
		str = str.replace(re, json[i]);
	}
	
	return str;
}

function parents(obj, klass) {
	var re = new RegExp('\\b' + klass + '\\b', 'ig');
	while (obj) {
		if (re.test(obj.className)) return obj;
		obj = obj.parentNode;
	}
}

function hasClass(obj, klass) {
	var re = new RegExp('\\b' + klass + '\\b');	
	
	if (re.test(obj.className)) {
		return true;	
	}
	
	return false;
}

function addClass(obj, klass) {
	//匹配类名
	var re = new RegExp('\\b' + klass + '\\b');

	if (!re.test(obj.className)) {
		obj.className += ' ' + klass;
	}
	
	//去除重复类名
	obj.className = delRepeatClass(obj.className);

	//去除多余空格
	obj.className = delMultiBlank(obj.className);
	
	//去除首尾空格
	obj.className = delBothBlank(obj.className);
}

function trim(str) {
	return str.replace(/(\b|\s)+/, '');
}

function delMultiBlank(str) {
	var result = '';
	var re = /\s+/g;
	
	if (re.test(str)) {
		result = str.replace(re, ' ');	
	}
	
	return result;
}

function delBothBlank(str) {
	var result = '';
	var re = /^\s*|\s*$/g;
	
	if(re.test(str)) {
		result = str.replace(re, '');
	}
	
	return result;
}

//去除重复类名
function delRepeatClass(str) {
	//var result = delBothBlank(delMultiBlank(str));
	
	/*	if(re.test(str))
	{
		result = str.replace(re, '$1');
	}*/
	
	str = delBothBlank(delMultiBlank(str)).split(' ');
	
	var result = str;
	var arr = str;
	
	for (var i=0; i<arr.length; i++) {
		for (var j=i+1; j<arr.length; j++) {
			if (arr[i] == arr[j]) {
				result[i] = '';
			};
		}
	}
	
	result = delBothBlank(delMultiBlank(result.join(' ')));
	
	return result;	
}

function delClass(obj, klass) {
	klass = delBothBlank(klass);
	
	var re = new RegExp('\\b' + klass + '\\b');
	
	if (re.test(obj.className)) {
		obj.className = obj.className.replace(re, '');	
	}
	
/*	//去除重复类名
	obj.className = delRepeatClass(obj.className);
	
	//去除多余空格
	obj.className = delMultiBlank(obj.className);
	
	//去除首尾空格
	obj.className = delBothBlank(obj.className);*/
}

function getByClassName(oParent, klass) {
	var result = [];
	var aEle = oParent.getElementsByTagName('*');
	var re = new RegExp('\\b' + klass + '\\b', 'g');
	
	for (var i=0; i<aEle.length; i++) {
		if (re.test(aEle[i].className)) {
			result.push(aEle[i]);	
		}
	}
	
	return result;
}

function copy(obj1, obj2){
	for (var attr in obj2) {
		if(obj2.hasOwnProperty(attr)) {
			obj1[attr] = obj2[attr];
		}
	}
	return obj1;
}

function first(obj) {
    return obj.firstElementChild || obj.firstChild;
}

function last(obj) {
    return obj.lastElementChild || obj.lastChild;
}

function next(obj) {
    return obj.nextElementSibling || obj.nextSibling;
}

function pre(obj) {
    return obj.previousElementSibling || obj.previousSibling;
}

function siblings(obj) {
	if (!obj.parentNode) return false;
	
	var arr = obj.parentNode.children;
	var result = [];
	
	for (var i = 0, len = arr.length; i < len; i++) {
		if (arr[i] !== obj) {
			//arr.splice(i, 1);
			result.push(arr[i]);
		}
	}
	
	return result;
}

function delHtmlTag(str) {
	return str.replace(/<[^<>]+>/ig, '');
}

//复制元素
function dupElement(obj) {
	var oDiv = document.createElement('div');
	
	var oTmpDiv = document.createElement('div');
	
	//tmp替obj占位置
	obj.parentNode.replaceChild(oTmpDiv, obj);
	
	oDiv.appendChild(obj);
	
	//把内容复制出来
	var str = oDiv.innerHTML;
	
	//把obj放回去
	oTmpDiv.parentNode.replaceChild(obj, oTmpDiv);
	
	//复制
	oDiv.innerHTML = str;
	
	return oDiv.children[0];
}

function getFullPath(obj) { 
  if (obj) { 
    //ie 
    if (window.navigator.userAgent.indexOf("MSIE") >= 1) { 
      obj.select(); 

      return document.selection.createRange().text; 
    } else if (window.navigator.userAgent.indexOf("Firefox") >= 1) { 
      //firefox 
			return window.URL.createObjectURL(obj.files.item(0));
      if (obj.files) { 
        return obj.files.item(0).getAsDataURL(); 
      }
      return obj.value; 
    }
    return obj.value; 
  } 
}