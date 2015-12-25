var __initFlag = false;
var _successCallback = null;
var _processCallback = null;
var _failCallback = null;
var _currentBridge = null;
var isAndroid = false;
var isIOS = false;
var isPC = false;
var tempCallback = null;
var _language = null;

// html页面中iframe跨域调用监听。
var OnMessage = function(e) {
	var json = JSON.parse(e.data);
	var funN = eval(json["callback"]);
	new funN(json["response"]);
}


var callBackObj = {
		success:{},
		error:{}
};

var reqNum = 0;
var maxReqNumOnce = 10;

//设定同一时间内最大的请求数量，防止回调被覆盖。
function getMagicNum(){
	reqNum++
	var templeNum = "ABCDEFGHIGKLMNOPQRSTUVWXYZ";
	var tmpNum = reqNum%maxReqNumOnce;
	return templeNum.charAt(tmpNum);
}

//注册回调方法。
var regesterCallback = function(data){
	var callback = {};
	var tmp = getMagicNum();
	callBackObj.success[tmp] = function(res){
		_onSuccess(data.success,res);
	}
	
	callBackObj.error[tmp] = function(res){
		var errorCB = (data.error)? data.error:data.fail;
		_onFail(errorCB,res);
	}
	callback.success = "callBackObj.success."+tmp;
	callback.error = "callBackObj.error."+tmp;
	return callback;
}

//捕获所有的成功回调，统一做处理。
var _onSuccess = function(fun,data){
	var res = data;
	if(typeof(data) != "object"){
		try{
			res = JSON.parse(data);
		}catch(e){
			res = data;
		}
	}
	
	fun(res);
}

//捕获所有的异常回调，统一作处理。
var _onFail = function(fun,data){
	var res = data;
	if(typeof(data) != "object"){
		try{
			res = JSON.parse(data);
		}catch(e){
			res = data;
		}
	}
	fun(res);
}


window.AppJsBridge = {
	ready:function(fun){
		setTimeout(function(){fun();},200);
	},
	
	callDevice : function(data) {
		try {
			var parameter = data.parameter;
			_successCallback = data.success;
			_failCallback = data.error;
			_init();
			// 调用请求
			getData(parameter, _successCallback, _failCallback);
		} catch (e) {
			// 参数异常。
		}
	},

	getSmartDevice : function(data) {
		var callback = regesterCallback(data);
		_init();
		_getSmartDevice(callback.success, callback.error);
	},

	swithDevice : function(data) {
		var parameter = data.parameter;
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		swith(parameter, _successCallback, _failCallback);
	},

	sendMsgToOnt : function(data) {
		var parameter = data.parameter;
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_sendMsgToOnt(parameter, _successCallback);
	},

	goBack : function(data) {
		_init();
		_successCallback = data.success;
		_failCallback = data.error;
		back(_successCallback, _failCallback);
	},
	
	getResource : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		findResource(_successCallback, _failCallback);
	},
	getCurrentUserInfo : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_getCurrentUserInfo(_successCallback, _failCallback);
	},

	getDefaultResource : function() {
		return _initWithLanguage(language);
	},

	getCurrentLanguage : function() {
		return _language;
	},

	setItem : function(key, value) {
		window.AppJSBridge.setItem(key, value);
	},

	getItem : function(key) {
		return window.AppJSBridge.getItem(key);
	},

	service : {
		openActivity : function(data) {
			_successCallback = data.success;
			_failCallback = data.error;
			_init();
			_openActivity(data.params, _successCallback);
		},

		openControlEntry : function(data) {
			_successCallback = data.success;
			_failCallback = data.error;
			_init();
			_openControlEntry(data.sn, _successCallback);
		},

		openConfirm : function(data) {
			_successCallback = data.success;
			_failCallback = data.error;
			_init();
			_openConfirm(data.msg, _successCallback);
		}
	}

}

window.AppJsBridge.service.localeService = {
	getResource:function(data){
		var callback = regesterCallback(data)
		_init();
		_getResource(window.location.href,callback.success);
	}
}

//应用的操作
window.AppJsBridge.service.appService = {
	openURL:function(data){
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_openURL(data, _successCallback, _failCallback)
	}
}

window.AppJsBridge.service.storageService = {
	getFamilyId : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_getFamilyId(_successCallback);
	},

	listObjects : function(data) {
		var type = data.type;
		var url = data.url;
		_successCallback = data.success;
		_init();
		_listObjects(type, url, _successCallback);
	},

	chooseFiles : function(data) {
		var type = data.type;
		var source = data.source;
		_successCallback = data.success;
		_init();
		_chooseFiles(type, source, _successCallback);
	},

	putObject : function(data) {
		var type = data.type;
		var url = data.url;
		var files = data.files;
		_successCallback = data.success;
		_processCallback = data.process;
		_init();
		_putObject(type, url, files, _processCallback, _successCallback);
	},

	createDirectory : function(data) {
		var type = data.type;
		var url = data.url;
		var name = data.name;
		_successCallback = data.success;
		_init();
		_createDirectory(type, url, name, _successCallback);
	},

	getObject : function(data) {
		var type = data.type;
		var url = data.url;
		_successCallback = data.success;
		_init();
		_getObject(type, url, _successCallback);
	},

	renameObject : function(data) {
		var type = data.type;
		var url = data.url;
		var newName = data.newName;
		_successCallback = data.success;
		_init();
		_renameObject(type, url, newName, _successCallback);
	},

	deleteObject : function(data) {
		var type = data.type;
		var url = data.url;
		_successCallback = data.success;
		_init();
		_deleteObject(type, url, _successCallback);
	},

	moveObject : function(data) {
		var type = data.type;
		var srcPath = data.srcPath;
		var destPath = data.destPath;
		_successCallback = data.success;
		_init();
		_moveObject(type, srcPath, destPath, _successCallback);
	}
}

window.AppJsBridge.service.device = {
	getDeviceList : function(data) {
		_successCallback = data.success;
		if (data.error) {
			_failCallback = data.error;
		} else if (data.fail) {
			_failCallback = data.fail;
		}
		_init();
		_getDeviceList(_successCallback, _failCallback);
	}
}

window.AppJsBridge.service.videoplayer = {
	createVideoView : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_createVideoView(data, _successCallback, _failCallback)
	},

	initVedio : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_initVedio(_successCallback, _failCallback);
	},
	
	stop : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_stopDisplayCamera(_successCallback, _failCallback);
	},
	
	snapshot : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_cameraSnapShot(_successCallback, _failCallback);
	},
	
	record : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_cameraRecord(_successCallback, _failCallback);
	},
	
	stopRecord : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_cameraStopRecord(_successCallback, _failCallback);
	},
	
	startAudioTalk : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_cameraStartAudioTalk(_successCallback, _failCallback);
	},
	
	stopAudioTalk : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_cameraStopAudioTalk(_successCallback, _failCallback);
	},
	
	move : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_cameraMove(data.direction, _successCallback, _failCallback);
	}
}

window.AppJsBridge.service.snapshot = {
	getLatestSnapshot : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_getLatestSnapshot(_successCallback, _failCallback);
	},
	openVideoView : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		var url = data.url;
		_init();
		_openVideoView(url, "_successCallback");
	}
}

/**
 * 安防模式
 */
window.AppJsBridge.service.security = {
	setArmState : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_setArmState(data.state, _successCallback, _failCallback);
	},
	getArmState : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_getArmState(_successCallback, _failCallback)
	},

	getCurrentMode : function(data) { // 获取当前设防模式
		_successCallback = data.success;
		_failCallback = data.fail;
		_init();
		_getCurrentMode(_successCallback, _failCallback)
	},

	setCurrentMode : function(data) { // 设置当前设防模式
		_successCallback = data.success;
		_failCallback = data.fail;
		_init();
		_setCurrentMode(data.mode, _successCallback, _failCallback)
	},

	getModeDetail : function(data) { // 获取当前设防模式详细信息
		_successCallback = data.success;
		_failCallback = data.fail;
		_init();
		_getModeDetail(data.mode, _successCallback, _failCallback)
	},

	setModeDetail : function(data) { // 设置当前设防模式详细信息
		_successCallback = data.success;
		_failCallback = data.fail;
		_init();
		_setModeDetail(data.content, _successCallback, _failCallback)
	}
}

window.AppJsBridge.service.userInfo = {
	initUserInfo : function(data) {

	},
	createUserView : function(data) {

	}
}

window.AppJsBridge.service.homeNet = {
	getConnectedDevice : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_queryDevicesInfo(_successCallback, _failCallback);

	},
	registerTrafficHandler : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_registerTrafficHandler(_successCallback, _failCallback);
	}

}

window.AppJsBridge.service.appStore = {
	getPluginList : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_queryHotPluginList(_successCallback, _failCallback)
	}
}

window.AppJsBridge.service.smartScene = {
	getClickSceneList : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_queryClickSceneList(_successCallback, _failCallback)
	}
}

/**
 * 获取环境监控数据。
 */
window.AppJsBridge.service.environment = {
	getCurrentData : function(data) {
		_successCallback = data.success;
		_failCallback = data.fail;
		_init();
		_getEnviCurrentData(_successCallback, _failCallback)
	}
}

/**
 * 获取存储容量数据
 */
window.AppJsBridge.service.queryStorageCapacity = {
	//获取云存储容量大小
	getCloudStorageData : function(data) {
		_successCallback = data.success;
		_failCallback = data.fail;
		_init();
		_getCloudStorageData(_successCallback, _failCallback)
	},
	//获取ONT本地外置存储容量大小(usb)
	getExternalStorageStorageData : function(data) {
		_successCallback = data.success;
		_failCallback = data.fail;
		_init();
		_getExternalStorageData(_successCallback, _failCallback)
	}

}

/**
 * 获取智能设备数据
 */
window.AppJsBridge.service.deviceService = {
	//获取设备对象列表
	getDeviceList : function(data) {
		var callback = regesterCallback(data);
		_init();
		_getSmartDeviceList(callback.success, callback.error)
	},
	//通过sn获取设备列表 (传入的sn是一个数组)
	 getDevice:function(data) {
		 var callback = regesterCallback(data);
		_init();
		_getSmartDeviceList(data.sn,callback.success, callback.error)
	},
	//通过sn获取设备列表 (传入的sn是一个数组)
	getDeviceBySnList : function(data) {
		 var callback = regesterCallback(data);
		_init();
		_getSmartDeviceBySnList(data.snList,callback.success, callback.error)
	},
	//通过设备类型来获取设备列表 (参数 设备类型)
	getDeviceByClass : function(data) {
		 var callback = regesterCallback(data);
		_init();
		_getSmartDeviceByClass(data.deviceClass,callback.success, callback.error)
	},
	//通过设备类型来获取设备列表 (参数 设备类型数组)
	getDeviceByClasses : function(data) {
		 var callback = regesterCallback(data);
		_init();
		_getSmartDeviceByClasses(data.deviceClasses,callback.success, callback.error)
	},
	//智能设备对应的--执行动作
	doAction : function(data) {
		 var callback = regesterCallback(data);
		_init();
		_smartDeviceDoAction(data,callback.success, callback.error)
	},
	
	getCurentDeviceSn:function(){
		var sn = decodeURIComponent(getUrlParams(location.href).sn);
		return sn;
	}

}


/**
 * 新增需求 (TCP/UDP SOCKET API 实现与ONT近端SOCKET请求的JS端API)
 */
window.AppJsBridge.service.socketService = {
		//1.1 连接
		connect:function(data) {
			_successCallback = data.success;
			_failCallback = data.error;
			_init();
			_serviceSocketConnect(data.mode,data.ip,data.port,data.timeout,_successCallback);
		},
		//1.2 断开连接
		disconnect:function(data) {
			var connectId = data.connectId;
			_successCallback = data.success;
			_init();
			_serviceSocketDisconnect(connectId, _successCallback);
		},
		//1.3发送数据
		send :function(data) {
			var connectId = data.connectId;
			var sendData  = data.data;
			_successCallback = data.success;
			_init();
			_serviceSocketSend(connectId, sendData, _successCallback);
		}
}


/**
 * 增加applicationService调用应用插件  
 */
window.AppJsBridge.service.applicationService = {
	
	//插件调用--执行动作
	doAction : function(data) {
		 var callback = regesterCallback(data);
		_init();
		_applicationServiceDoAction(data,callback.success,callback.error);
	}

}





/*
 // 获取ＯＮＴ下挂设备
 window.AppJsBridge.service.homeNet.getConnectedDevice({
 success : function(res) {
 var deviceList = res.deviceList
 for ( var index in deviceList) {
 var name = deviceList[index].deviceName; // 设备名称
 var mac = deviceList[index].deviceMac; // 设备mac
 var ip = deviceList[index].deviceIp; // 设备对应的ip
 }
 },
 fail : function() {
 }
 })

 // 获取ＯＮＴ的上下行流量
 window.AppJsBridge.service.homeNet.registerTrafficHandler({
 callback : function(res) {
 var upTraffic = res.upTraffic; // 上行流量 Kbps
 var downTraffic = res.downTraffic // 下行流量 Kbps
 },
 fail : function() {
 }
 })

 */
/**
 * 转发请求消息到第三方服务器
 */
window.AppJsBridge.service.securityService = {
	redirectURL : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_redirectURL(data, _successCallback, _failCallback);
	}
}

window.AppJsBridge.service.broadbandService = {
	start:function(data){
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_speedupStart(data.data,_successCallback,_failCallback);
	},
	
	stop:function(data){
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_speedupStop(data.data,_successCallback,_failCallback);
	},
	getWanl2tpTunnel:function(data){
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_getWanl2tpTunnel(data.data,_successCallback,_failCallback);
	},
	createWanl2tpTunnel:function(data){
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_createWanl2tpTunnel(data.data,_successCallback,_failCallback);
	},
	attachWanl2tpTunnel:function(data){
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_attachWanl2tpTunnel(data.data,_successCallback,_failCallback);
	},
	removeWanl2tpTunnel:function(data){
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_removeWanl2tpTunnel(data.data,_successCallback,_failCallback);
	}

}

window.AppJsBridge.service.speedupService = {
	// 启动/停止提速
	operate : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_operate(data, _successCallback, _failCallback);
	},
	// 查询用户的宽带账号、基础带宽和最大带宽信息
	queryBandwidths : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_queryBandwidths(data, _successCallback, _failCallback);
	},
	// 查询用户的提速业务信息
	queryService : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_queryService(data, _successCallback, _failCallback);
	},
	// 订购提速业务
	order : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_order(data, _successCallback, _failCallback);
	},
	// 查询用户历史已订购的提速业务信息，包括当前的和6个月内历史订购信息
	queryOrderHistory : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_queryOrderHistory(data, _successCallback, _failCallback);
	},
	// 查询用户提速使用记录，包括当前的和6个月内历史使用信息
	queryUseRecord : function(data) {
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_queryUseRecord(data, _successCallback, _failCallback);
	}
}

/**
 * 对wifi的相关操作。
 */
window.AppJsBridge.service.wifiService = {
	getControllerWifi:function(data){
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_getControllerWifi(_successCallback,_failCallback);
	},

	wifiSwitch:function(data){
		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_wifiSwitch(data.ssid,data.password,_successCallback,_failCallback);
 	},
 	
 	getWifiList:function(data){
 		_successCallback = data.success;
		_failCallback = data.error;
		_init();
		_getWifiList(_successCallback,_failCallback);
 	}
}

/**
 * 二维码扫描
 */
window.AppJsBridge.service.scanService = {
		scan : function(data) {
			_successCallback = data.success;
			_failCallback = data.error;
			_init();
			_scan(_successCallback, _failCallback);
		}
}


// 初始化设备信息。
var _init = function() {

	if (__initFlag == false) {
		__initFlag = true;
		recogniseDevice();
		if (isAndroid) {
			_initAndroidBridge(function(bridge) {
				_currentBridge = bridge;
			});
		} else if (isIOS) {
			_initIOSBridge(function(bridge) {
				_currentBridge = bridge;
				bridge.init(function(message, responseCallback) {
				});

				// js注册 刷新界面的方法
				bridge.registerHandler('refreshPage', function(data,
						responseCallback) {
					var responseData = {
						'Javascript Says' : '...'
					}
					responseCallback(responseData)
				});
			});
		} else {
			_currentBridge = window.parent;
		}
		window.addEventListener("message", OnMessage, false);
	}

}

function recogniseDevice() {
	var sUserAgent = navigator.userAgent.toLowerCase();
	if (sUserAgent.indexOf('android') > -1) {
		isAndroid = true;
	} else if (sUserAgent.indexOf('iphone') > -1) {
		isIOS = true;
	} else {
		isPC = true;
	}
}

var _initIOSBridge = function(callback) {
	if (window.WebViewJavascriptBridge) {
		callback(WebViewJavascriptBridge)
	} else if (parent.window.WebViewJavascriptBridge) {
		iframeFlag = true;
		_currentBridge = parent.currentBridge;

	} else {
		document.addEventListener('WebViewJavascriptBridgeReady', function() {
			callback(WebViewJavascriptBridge)
		}, false)
	}
}

var _initAndroidBridge = function(callback) {
	if (window.AppJSBridge) {
		callback(window.AppJSBridge);
	} else if (window.deviceService) {
		callback(window.deviceService);

	}
}

// 发请求。包括查询状态，及发送操作命令。
var getData = function(params, success, error) {
	var sn = decodeURIComponent(getUrlParams(location.href).sn);
	var frameName = null;
	try {
		if (getUrlParams(location.href).frameName) {
			frameName = decodeURIComponent(getUrlParams(location.href).frameName)
		} else {
			frameName = null;
		}
	} catch (e) {
		frameName = null;
	}

	console.log(frameName);
	var param = {};
	if (frameName != null) {
		param.sn = sn;
		param.frameName = frameName;
		parmm.params = params;
	}

	console.log("sn--" + sn)

	if (isAndroid) {
		// android请求。
		if (frameName == null) {
			_currentBridge.callDevice(params, "_successCallback");
		} else {
			_currentBridge.callDevice(param, "_successCallback",
					"_failCallback");
		}

	} else {
		// IOS请求。
		_currentBridge.send(param, success);
	}
}

var _getSmartDevice = function(success, error) {
	var sn = decodeURIComponent(getUrlParams(location.href).sn);
	var frameName = null;
	try {
		frameName = decodeURIComponent(getUrlParams(location.href).frameName)
	} catch (e) {
		frameName = null;
	}
	// alert(frameName);
	if (isAndroid) {
		// android请求。
		if (window.deviceService) {
			_currentBridge.getSmartDevice(JSON.stringify({
				"sn" : sn,
				"frameName" : frameName,
				"success" : success,
				"error" : error
			}));

		} else {

			if (frameName != null) {
				_currentBridge.initWedgistData(frameName, success);
			} else {
				var data = _currentBridge.getSmartDevice(sn);
				console.log(data);
				console.log(success);
				var callback = eval(success);
				callback(data);
			}
		}

	} else if (isIOS) {
		// IOS请求。
		// 调用原生。
		var param = {};
		param.sn = sn;
		param.request = "getSmartDevice";
		_currentBridge.send(param, success);

		var param2 = {};
		param2.sn = sn;
		param2.request = "getSmartDeviceState";
		_currentBridge.send(param2, success);

	} else {

		_currentBridge.getSmartDevice({
			"sn" : sn,
			"successCallback" : success,
			"errorCallback" : error
		});
	}

}

// 响应设备点击事件
var swith = function(param, success, error) {
	var sn = decodeURIComponent(getUrlParams(location.href).sn);
	if (isAndroid) {
		// android请求。
		var data = _currentBridge.clickStatusButton(param, sn);
		success(data);
	} else if (isIOS) {
		// IOS请求。
		var params = {};
		params.request = "clickStatus";
		params.sn = sn;
		params.parameter = param;
		_currentBridge.send(param, success);
	} else {
		_currentBridge.swithDevice({
			"sn" : sn,
			"param" : param,
			"successCallback" : success,
			"errorCallback" : error
		});
	}
}

// 响应回退事件
var back = function(success, error) {
	if (isAndroid) {
		// android请求。
		var data = _currentBridge.doAction('exit', '');
		success(data);
	} else if (isIOS) {
		// IOS请求。
		var param = {};
		param.request = "goBack";
		_currentBridge.send(param, success);
	} else {

	}
}

// 获取视频缩略图
var _getLatestSnapshot = function(_successCallback, _failCallback) {
	var frameName = null;
	try {
		frameName = decodeURIComponent(getUrlParams(location.href).frameName)
	} catch (e) {
		frameName = null;
	}
	if (frameName != null) {
		_currentBridge.getSnapShotList(frameName, "_successCallback");
	}
}

var _initVedio = function(_successCallback, _failCallback) {
	var frameName = null;
	try {
		frameName = decodeURIComponent(getUrlParams(location.href).frameName)
	} catch (e) {
		frameName = null;
	}
	if (frameName != null) {
		_currentBridge.initVedio(frameName, "_successCallback");
	}
}

var _openActivity = function(params, _successCallback) {
	if (isAndroid) {
		var frameName = null;
		try {

			frameName = decodeURIComponent(getUrlParams(location.href).frameName)

		} catch (e) {
			frameName = null;
		}
		if (frameName != null) {
			_currentBridge.openActivity(JSON.stringify(params), frameName,
					"_successCallback");
		} else {
			_currentBridge.openActivity(JSON.stringify(params), "",
					"_successCallback");
		}
	} else if (isIOS) {
		params.request = "openActivity";
		_currentBridge.send(params, _successCallback);
	}

}

var _showMore = function() {
	_currentBridge.showMoreAboutCamera();
}

var _openURL = function(data, _successCallback, _failCallback){
	var frameName = null;
	
	try {
		frameName = decodeURIComponent(getUrlParams(location.href).frameName);
	} catch (e) {
		frameName = null;
	}
	
	var title = data.title;
	
	var url = data.url;
	var urlRoot = url.substring(0,url.indexOf("/")+1);
	var currentUrl = window.location.href;
	var realUrl = currentUrl.substring(0,currentUrl.lastIndexOf(urlRoot))+url
	
	realUrl = encodeURI(realUrl);
	
	
	if (frameName != null) {
		_currentBridge.openURL(realUrl,title,frameName,
				"_successCallback");
	} else {
		_currentBridge.openURL(realUrl,title, "",
				"_successCallback");
	}
}

var _stopDisplayCamera = function(_successCallback, _failCallback){
	var frameName = null;
	try {
		if(getUrlParams(location.href).frameName){
			frameName = decodeURIComponent(getUrlParams(location.href).frameName);
		}
	} catch (e) {
		frameName = null;
	}
	
	if(frameName != null){
		_currentBridge.stopDisplayCamera(frameName,"_successCallback");
	}else{
		_currentBridge.stopDisplayCamera("","_successCallback");
	}
}

var _cameraSnapShot = function(_successCallback, _failCallback){
	var frameName = null;
	try {
		if(getUrlParams(location.href).frameName){
			frameName = decodeURIComponent(getUrlParams(location.href).frameName);
		}
	} catch (e) {
		frameName = null;
	}
	
	if(frameName != null){
		_currentBridge.cameraSnapShot(frameName,"_successCallback");
	}else{
		_currentBridge.cameraSnapShot("","_successCallback");
	}
}

var _cameraRecord = function(_successCallback, _failCallback){
	var frameName = null;
	try {
		if(getUrlParams(location.href).frameName){
			frameName = decodeURIComponent(getUrlParams(location.href).frameName);
		}
	} catch (e) {
		frameName = null;
	}
	
	if(frameName != null){
		_currentBridge.cameraRecord(frameName,"_successCallback");
	}else{
		_currentBridge.cameraRecord("","_successCallback");
	}
}

var _cameraStopRecord = function(_successCallback, _failCallback){
	var frameName = null;
	try {
		if(getUrlParams(location.href).frameName){
			frameName = decodeURIComponent(getUrlParams(location.href).frameName);
		}
	} catch (e) {
		frameName = null;
	}
	
	if(frameName != null){
		_currentBridge.cameraStopRecord(frameName,"_successCallback");
	}else{
		_currentBridge.cameraStopRecord("","_successCallback");
	}
}

var _cameraStartAudioTalk = function(_successCallback, _failCallback){
	var frameName = null;
	try {
		if(getUrlParams(location.href).frameName){
			frameName = decodeURIComponent(getUrlParams(location.href).frameName);
		}
	} catch (e) {
		frameName = null;
	}
	
	if(frameName != null){
		_currentBridge.cameraStartAutoTaik(frameName,"_successCallback");
	}else{
		_currentBridge.cameraStartAutoTaik("","_successCallback");
	}
}

var _cameraStopAudioTalk = function(_successCallback, _failCallback){
	var frameName = null;
	try {
		if(getUrlParams(location.href).frameName){
			frameName = decodeURIComponent(getUrlParams(location.href).frameName);
		}
	} catch (e) {
		frameName = null;
	}
	
	if(frameName != null){
		_currentBridge.cameraStopAutoTaik(frameName,"_successCallback");
	}else{
		_currentBridge.cameraStopAutoTaik("","_successCallback");
	}
}

var _cameraMove = function(direction,_successCallback, _failCallback){
	var frameName = null;
	try {
		if(getUrlParams(location.href).frameName){
			frameName = decodeURIComponent(getUrlParams(location.href).frameName);
		}
	} catch (e) {
		frameName = null;
	}
	
	if(frameName != null){
		_currentBridge.cameraMove(direction,frameName,"_successCallback");
	}else{
		_currentBridge.cameraMove(direction,"","_successCallback");
	}
}


var _createVideoView = function(param, _successCallback, _failCallback) {
	var jsonObj = {};
	if (param) {
		if (param.sn) {
			jsonObj.sn = param.sn;
		} else {
			jsonObj.sn = "";
		}
		if (param.layout) {
			jsonObj.layout = {};
			if (param.layout.x) {
				jsonObj.layout.x = param.layout.x;
			} else {
				jsonObj.layout.x = 0;
			}
			if (param.layout.y) {
				jsonObj.layout.y = param.layout.y;
			} else {
				jsonObj.layout.y = 0;
			}
			if (param.layout.width) {
				jsonObj.layout.width = param.layout.width;
			} else {
				jsonObj.layout.width = 0;
			}
			if (param.layout.height) {
				jsonObj.layout.height = param.layout.height;
			} else {
				jsonObj.layout.height = 0;
			}
		}
		_currentBridge.createVideoView(JSON.stringify(jsonObj),
				"_successCallback", "_failCallback");
	}

}

// 调用获取ont实时流量
var _registerTrafficHandler = function(_successCallback, _failCallback) {
	// alert("getTraffic");
	if (isAndroid) {
		var frameName = null;
		try {
			if (getUrlParams(location.href).frameName) {
				frameName = decodeURIComponent(getUrlParams(location.href).frameName)
			} else {
				frameName = null;
			}
		} catch (e) {
			frameName = null;
		}
		_currentBridge.getrealtimeTraffic(frameName, "_successCallback");
	} else if (isIOS) {
		// alert("ios");
		var param = {};
		param.request = "getONTDevice";
		// alert(_currentBridge);
		_currentBridge.send(param, _successCallback);
	}
}

// 调用获取ont下挂设备详情
var _queryDevicesInfo = function(_successCallback, _failCallback) {
	var frameName = null;
	try {
		if (getUrlParams(location.href).frameName) {
			frameName = decodeURIComponent(getUrlParams(location.href).frameName)
		} else {
			frameName = null;
		}
	} catch (e) {
		frameName = null;
	}
	_currentBridge.queryDevicesInfo(frameName, "_successCallback");

}

// 根据url打开视频
var _openVideoView = function(url, success) {
	var frameName = null;
	try {
		frameName = decodeURIComponent(getUrlParams(location.href).frameName)
	} catch (e) {
		frameName = null;
	}
	if (url != null) {
		_currentBridge.openVideoView(url, frameName, "_successCallback");
	}
}

var _showMore = function() {
	_currentBridge.showMoreAboutCamera();
}

// 获取热门插件
var _queryHotPluginList = function(_successCallback, _failCallback) {
	var frameName = null;
	try {
		frameName = decodeURIComponent(getUrlParams(location.href).frameName)
	} catch (e) {
		frameName = null;
	}

	if (frameName != null) {
		_currentBridge.queryHotPluginList(frameName, "_successCallback");
	}
}

// 获取点击场景
var _queryClickSceneList = function(_successCallback, _failCallback) {
	var frameName = null;
	try {
		frameName = decodeURIComponent(getUrlParams(location.href).frameName)
	} catch (e) {
		frameName = null;
	}

	if (frameName != null) {
		_currentBridge.queryClickSceneList(frameName, "_successCallback");
	}
}

var _setArmState = function(state, _successCallback, _failCallback) {
	if (isAndroid) {
		var frameName = null;
		try {
			frameName = decodeURIComponent(getUrlParams(location.href).frameName)
		} catch (e) {
			frameName = null;
		}

		if (frameName != null) {
			_currentBridge.setArmState(state, frameName, "_successCallback");
		}
	} else if (isIOS) {
		var param = {};
		// param.sn = sn;
		param.request = "setArmState";
		param.state = state;
		_currentBridge.send(param, _successCallback);
	}

}

var _getArmState = function(_successCallback, _failCallback) {
	if (isAndroid) {
		var frameName = null;
		try {
			frameName = decodeURIComponent(getUrlParams(location.href).frameName)
		} catch (e) {
			frameName = null;
		}

		if (frameName != null) {
			_currentBridge.getArmState(frameName, "_successCallback");
		}

	} else if (isIOS) {
		var param = {};
		// param.sn = sn;
		param.request = "getArmState";
		_currentBridge.send(param, _successCallback);
	}

}

var _openControlEntry = function(sn, _successCallback) {
	if (isAndroid) {
		var frameName = null;
		try {
			frameName = decodeURIComponent(getUrlParams(location.href).frameName)
		} catch (e) {
			frameName = null;
		}

		if (frameName != null) {
			_currentBridge.openControlEntry(sn, frameName, "_successCallback");
		} else {
			_currentBridge.openControlEntry(sn, "", "_successCallback");
		}
	} else if (isIOS) {
		var param = {};
		param.sn = sn;
		param.request = "openControlEntry";
		_currentBridge.send(param, _successCallback);
	}
}

var _openConfirm = function(msg, _successCallback) {
	if (isAndroid) {
		var frameName = null;
		try {
			frameName = decodeURIComponent(getUrlParams(location.href).frameName)
		} catch (e) {
			frameName = null;
		}

		if (frameName != null) {
			_currentBridge.openConfirm(msg, frameName, "_successCallback");
		} else {
			_currentBridge.openConfirm(msg, "", "_successCallback");
		}

	} else if (isIOS) {
		var param = {};
		param.request = "openConfirm";
		param.msg = "showTips";
		_currentBridge.send(param, _successCallback);
	}

}

var _getEnviCurrentData = function(_successCallback, _failCallback) {
	if (isAndroid) {
		var frameName = null;
		try {
			frameName = decodeURIComponent(getUrlParams(location.href).frameName)
		} catch (e) {
			frameName = null;
		}
		if (frameName != null) {
			_currentBridge.getEnvironmentData(frameName, "_successCallback");
		} else {
			_currentBridge.getEnvironmentData("", "_successCallback");
		}
	}
}

/**
 * 获取云存储容量大小
 */
var _getCloudStorageData = function(_successCallback, _failCallback) {
	if (isAndroid) {
		var frameName = null;
		try {
			if (getUrlParams(location.href).frameName) {
				frameName = decodeURIComponent(getUrlParams(location.href).frameName)
			} else {
				frameName = null;
			}
		} catch (e) {
			frameName = null;
		}
		_currentBridge.getCloudStorageData(frameName, "_successCallback");
	} else if (isIOS) {
		var param = {};
		param.request = "getCloudStorageData";
		_currentBridge.send(param, _successCallback);
	}

}

/**
 * 获取外置容量大小
 */
var _getExternalStorageData = function(_successCallback, _failCallback) {
	if (isAndroid) {
		var frameName = null;
		try {
			if (getUrlParams(location.href).frameName) {
				frameName = decodeURIComponent(getUrlParams(location.href).frameName)
			} else {
				frameName = null;
			}
		} catch (e) {
			frameName = null;
		}
		_currentBridge.getExternalStorageStorageData(frameName,
				"_successCallback");
	} else if (isIOS) {
		var param = {};
		param.request = "getExternalStorageStorageData";
		//	      alert(_currentBridge);
		_currentBridge.send(param, _successCallback);
	}

}

/**
 * 获取基本的设备信息(包含SN)
 */
var _getSmartDeviceList = function(sn,success, error) {
	if (isAndroid) {
		var frameName = null;
		try {
			if (getUrlParams(location.href).frameName) {
				frameName = decodeURIComponent(getUrlParams(location.href).frameName)
			} else {
				frameName = null;
			}
		} catch (e) {
			frameName = null;
		}
		
		if (window.deviceService) {
			_currentBridge.getSmartDeviceList(JSON.stringify({
				"sn" : sn,
				"frameName" : frameName,
				"success" : success,
				"error" : error
			}));

		} else{
			 if(sn != null){
					_currentBridge.getSmartDeviceList(sn,frameName, success);
			  }else{
					_currentBridge.getSmartDeviceList(frameName, success); 
			  }
		}
		
		
	 
	} else if (isIOS) {
		var param = {};
		if(params.sn != null){
			_currentBridge.getSmartDeviceList(params.sn,frameName, "_successCallback");
			param.sn =params.sn ;
		}
		param.request = "getSmartDeviceList";
		_currentBridge.send(param, eval(success));
	}

}

/**
 * 通过SN获取设备列表
 */
var _getSmartDeviceBySnList = function(params,success, error) {
	 //这里传入的params是一个sn的json数组
	if (isAndroid) {
		var frameName = null;
		try {
			if (getUrlParams(location.href).frameName) {
				frameName = decodeURIComponent(getUrlParams(location.href).frameName)
			} else {
				frameName = null;
			}
		} catch (e) {
			frameName = null;
		}
		_currentBridge.getSmartDeviceBySnList(JSON.stringify(params),frameName, success);
	} else if (isIOS) {
		param.request = "getSmartDeviceBySnList";
		_currentBridge.send(param, eval(success));
	}

}

/**
 * 通过设备类型来获取设备列表 (参数 设备类型)
 */
var _getSmartDeviceByClass = function(params,success, error) {
	//这里的params是一个字符串，是deviceClass的名称
	if (isAndroid) {
		var frameName = null;
		try {
			if (getUrlParams(location.href).frameName) {
				frameName = decodeURIComponent(getUrlParams(location.href).frameName)
			} else {
				frameName = null;
			}
		} catch (e) {
			frameName = null;
		}
		_currentBridge.getSmartDeviceByClass(deviceClass,frameName, success);
	} else if (isIOS) {
		param.request = "getSmartDeviceByClass";
		_currentBridge.send(param, eval(success));
	}

}

/**
 *通过设备类型来获取设备列表 (参数 设备类型数组)
 */
var _getSmartDeviceByClasses = function(params,success, error) {
	//这里的params是一个字符串，是deviceClass的名称的json数组集合
	
	if (isAndroid) {
		var frameName = null;
		try {
			if (getUrlParams(location.href).frameName) {
				frameName = decodeURIComponent(getUrlParams(location.href).frameName)
			} else {
				frameName = null;
			}
		} catch (e) {
			frameName = null;
		}
		_currentBridge.getSmartDeviceByClasses(JSON.stringify(params),frameName,success);
	} else if (isIOS) {
		param.request = "getSmartDeviceByClasses";
		_currentBridge.send(param, eval(success));
	}
}

/**
 *智能设备对应的--执行动作
 */
var _smartDeviceDoAction = function(params,success, error) {
	//这里传入的params包含了deviceClass 设备类型, action 执行动作,parameter 条件数组
	if (isAndroid) {
		var frameName = null;
		try {
			if (getUrlParams(location.href).frameName) {
				frameName = decodeURIComponent(getUrlParams(location.href).frameName)
			} else {
				frameName = null;
			}
		} catch (e) {
			frameName = null;
		}
		_currentBridge.smartDeviceDoAction(params.deviceClass,params.action,params.sn,JSON.stringify(params.parameters),frameName, success);
		
	} else if (isIOS) {
		var param = {};
		param.request = "smartDeviceDoAction";
		param.sn = params.sn;
		param.parameter = params.parameters;
		_currentBridge.send(param, eval(success));
	}
}


/**
 *applicationService调用应用插件--执行动作
 */
var _applicationServiceDoAction = function(params,success, error) {
	//这里传入的params包含了applicationName ,serviceName, action 执行动作,parameter 条件数组
	var applicationName = params.applicationName;//应用名称
	var serviceName = params.serviceName;//服务名称
	var action = params.action;//执行动作名称
	var parameter = params.parameters; //用户传递过来的数据
	
	if (isAndroid) {
		var frameName = null;
		try {
			if (getUrlParams(location.href).frameName) {
				frameName = decodeURIComponent(getUrlParams(location.href).frameName)
			} else {
				frameName = null;
			}
		} catch (e) {
			frameName = null;
		}
		if (window.deviceService) {
			_currentBridge.applicationServiceDoAction(applicationName,serviceName,action,JSON.stringify(parameter),frameName, success);
		}else{
			_currentBridge.applicationServiceDoAction(applicationName,serviceName,action,JSON.stringify(parameter),frameName, success);
		}
	} else if (isIOS) {
		var param = {};
		param.request = "applicationServiceDoAction";
		param.applicationName = params.applicationName;
		param.serviceName = params.serviceName;
		param.action = params.action;
		param.parameter = params.parameter;
		_currentBridge.send(param, eval(success));
	}

}


/**
 * 新增Socket通讯接口
 * 1.1* 连接connect
 * mode: "", //tcp udp
 *ip: "", //对端ip
 *port : "", //对端端口
 *timeout : "", //连接超时时间
 */
var _serviceSocketConnect = function(mode,ip,port,timeout,_successCallback) {
	 //这里传入的params是一个sn的json数组
	if (isAndroid) {
		var frameName = null;
		try {
			if (getUrlParams(location.href).frameName) {
				frameName = decodeURIComponent(getUrlParams(location.href).frameName)
			} else {
				frameName = null;
			}
		} catch (e) {
			frameName = null;
		}
		_currentBridge.socketConnect(mode,ip,port,timeout, "_successCallback");
	} else if (isIOS) {
		param.request = "serviceSocketConnect";
		param.ip = ip;
		param.port = port;
		param.timeout = timeout;
		_currentBridge.send(param, _successCallback);
	}

}



/**
 * 1.2* 断开连接
 * connectId 要断开连接的目标IP地址
 */
var _serviceSocketDisconnect = function(connectId,_successCallback) {
	 //这里传入的params是一个sn的json数组
	if (isAndroid) {
		var frameName = null;
		try {
			if (getUrlParams(location.href).frameName) {
				frameName = decodeURIComponent(getUrlParams(location.href).frameName)
			} else {
				frameName = null;
			}
		} catch (e) {
			frameName = null;
		}
		_currentBridge.socketDisconnect(connectId, "_successCallback");
	} else if (isIOS) {
		param.request = "serviceSocketConnect";
		param.connectId = connectId;
		_currentBridge.send(param, _successCallback);
	}

}


/**
 * 1.3*  发送数据
 * connectId 目标Ip
 * sendData 发送的数据 
 */
var _serviceSocketSend = function(connectId,sendData,_successCallback) {
	 //这里传入的params是一个sn的json数组
	if (isAndroid) {
		var frameName = null;
		try {
			if (getUrlParams(location.href).frameName) {
				frameName = decodeURIComponent(getUrlParams(location.href).frameName)
			} else {
				frameName = null;
			}
		} catch (e) {
			frameName = null;
		}
		_currentBridge.socketSend(connectId,sendData, "_successCallback");
	} else if (isIOS) {
		param.request = "serviceSocketConnect";
		param.connectId = connectId;
		param.sendData = sendData;
		_currentBridge.send(param, _successCallback);
	}

}



var _getCurrentMode = function(_successCallback, _failCallback) {
	if (isAndroid) {
		var frameName = null;
		try {
			frameName = decodeURIComponent(getUrlParams(location.href).frameName)
		} catch (e) {
			frameName = null;
		}
		if (frameName != null) {
			_currentBridge
					.getCurrentSecurityMode(frameName, "_successCallback");
		}
	}
}

var _setCurrentMode = function(mode, _successCallback, _failCallback) {
	if (isAndroid) {
		var frameName = null;
		try {
			frameName = decodeURIComponent(getUrlParams(location.href).frameName)
		} catch (e) {
			frameName = null;
		}
		if (frameName != null) {
			_currentBridge.setCurrentSecurityMode(mode, frameName,
					"_successCallback");
		}
	}
}

var _setModeDetail = function(content, _successCallback, _failCallback) {
	if (isAndroid) {
		var frameName = null;
		try {
			frameName = decodeURIComponent(getUrlParams(location.href).frameName)
		} catch (e) {
			frameName = null;
		}
		if (frameName != null) {
			_currentBridge.setSecurityModeDetail(JSON.stringify(content),
					"_successCallback");
		} else {
			_currentBridge.setSecurityModeDetail(JSON.stringify(content),
					"_successCallback");
		}
	}
}

var _getModeDetail = function(mode, _successCallback, _failCallback) {
	if (isAndroid) {
		var frameName = null;
		try {
			frameName = decodeURIComponent(getUrlParams(location.href).frameName);
		} catch (e) {
			frameName = null;
		}
		if (frameName) {
			_currentBridge.getSecurityModeDetail(mode, "_successCallback");
		} else {
			_currentBridge.getSecurityModeDetail(mode, "_successCallback");
		}
	}
}

var _getDeviceList = function(_successCallback, _failCallback) {
	if (isAndroid) {
		var frameName = null;
		try {
			frameName = decodeURIComponent(getUrlParams(location.href).frameName);
		} catch (e) {
			frameName = null;
		}
		if (frameName) {
			_currentBridge.getDeviceList("_successCallback");
		} else {
			_currentBridge.getDeviceList("_successCallback");
		}
	}
}

// 获取国际化资源。
var findResource = function(success1, error) {
	if (isAndroid) {
		// android请求。
		var language = "zh";
		try {
			language = _currentBridge.getLanguage();
		} catch (e) {
			language = _currentBridge.getCurrentLanguage();
		}
		_language = language;
		// alert(language);
		success1(_initWithLanguage(language));
		console.log(language);

	} else if (isIOS) {
		// IOS请求。
		var param = {};
		param.request = "userLanguage";
		tempCallback = success1;

		setTimeout(function() {
			_currentBridge.send(param, iosLanguageCallback);
		}, 100);
	} else {
		var language = _currentBridge.getLanguageType();
		_language = language;
		success1(_initWithLanguage(language));
	}
}

var _getCurrentUserInfo = function(success, error) {
	if (isAndroid) {
		// android请求。
		var userInfo = _currentBridge.getCurrentUserInfo();
		
		success(JSON.parse(userInfo));
		console.log(userInfo);

	} else if (isIOS) {
		// IOS请求。
		
	} else {
		
	}
}

var _sendMsgToOnt = function(params, _successCallback) {
	if (isAndroid) {
		// android请求。
		_currentBridge.sendMsgToOnt(params, "_successCallback");
	}
}

var _getFamilyId = function(_successCallback) {
	if (isAndroid) {
		// android请求。
		_currentBridge.getFamilyId("_successCallback");
	}
}

var _listObjects = function(type, url, _successCallback) {
	if (isAndroid) {
		// android请求。
		_currentBridge.listObjects(type, url, "_successCallback");
	}
}

var _chooseFiles = function(type, source, _successCallback) {
	if (isAndroid) {
		// android请求。
		_currentBridge.chooseFiles(type, source, "_successCallback");
	}
}

var _putObject = function(type, url, files, _processCallback, _successCallback) {
	if (isAndroid) {
		// android请求。
		_currentBridge.putObject(type, url, files, "_processCallback",
				"_successCallback");
	}
}

var _createDirectory = function(type, url, name, _successCallback) {
	if (isAndroid) {
		// android请求。
		_currentBridge.createDirectory(type, url, name, "_successCallback");
	}
}

var _getObject = function(type, url, _successCallback) {
	if (isAndroid) {
		// android请求。
		_currentBridge.getObject(type, url, "_successCallback");
	}
}

var _renameObject = function(type, url, newName, _successCallback) {
	if (isAndroid) {
		// android请求。
		_currentBridge.renameObject(type, url, newName, "_successCallback");
	}
}

var _deleteObject = function(type, url, _successCallback) {
	if (isAndroid) {
		// android请求。
		_currentBridge.deleteObject(type, url, "_successCallback");
	}
}

var _moveObject = function(type, srcPath, destPath, _successCallback) {
	if (isAndroid) {
		// android请求。
		_currentBridge.moveObject(type, srcPath, destPath, "_successCallback");
		}
		}
// 启动提速的接口
var _speedupStart=function(params,success,error){

	if(isAndroid){
		//android请求。
		_currentBridge.speedupStart(JSON.stringify(params),"_successCallback","_failCallback");
	}
	else if (isIOS) {
		params.request = "speedupStart";
		_currentBridge.send(params, _successCallback);
	}
}
// 停止提速的接口
var _speedupStop=function(params,success,error){

	if(isAndroid){
		//android请求。
		_currentBridge.speedupStop(JSON.stringify(params),"_successCallback","_failCallback");
	}
	else if (isIOS) {
		params.request = "speedupStop";
		_currentBridge.send(params, _successCallback);
	}
}

// 查询L2TP VPN通道的接口
var _getWanl2tpTunnel=function(params,success,error){

	if(isAndroid){
		//android请求。
		_currentBridge.getWanl2tpTunnel(JSON.stringify(params),"_successCallback","_failCallback");
	}
	else if (isIOS) {
		params.request = "getWanl2tpTunnel";
		_currentBridge.send(params, _successCallback);
	}
}
		
// 创建L2TP VPN通道的接口
var _createWanl2tpTunnel = function(params,success,error){

	if(isAndroid){
		//android请求。
		_currentBridge.createWanl2tpTunnel(JSON.stringify(params),"_successCallback","_failCallback");
	}
	else if (isIOS) {
		params.request = "createWanl2tpTunnel";
		_currentBridge.send(params, _successCallback);
	}
}

// 关联数据流到L2TP VPN 通道上
var _attachWanl2tpTunnel=function(params,success,error){

	if(isAndroid){
		//android请求。
		_currentBridge.attachWanl2tpTunnel(JSON.stringify(params),"_successCallback","_failCallback");
	}
	else if (isIOS) {
		params.request = "attachWanl2tpTunnel";
		_currentBridge.send(params, _successCallback);
	}
}

// APP提供删除L2TP VPN通道的接口
var _removeWanl2tpTunnel=function(params,success,error){

	if(isAndroid){
		//android请求。
		_currentBridge.removeWanl2tpTunnel(JSON.stringify(params),"_successCallback","_failCallback");
	}
	else if (isIOS) {
		params.request = "removeWanl2tpTunnel";
		_currentBridge.send(params, _successCallback);
	}
}

function iosLanguageCallback(languageType) {
	_language = languageType;
	tempCallback(_initWithLanguage(languageType));
}

function getResourceAjax(jsonPath) {
	// alert(jsonPath);
	var xmlhttp;
	if (window.XMLHttpRequest) {
		xmlhttp = new XMLHttpRequest();
	} else {// code for IE6, IE5
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.open("GET", jsonPath, false);
	xmlhttp.send();
	// alert(xmlhttp.responseText);
	var json = eval('(' + xmlhttp.responseText + ')');
	return json
}

String.prototype.endWith = function(endStr) {
	var d = this.length - endStr.length;
	return (d >= 0 && this.lastIndexOf(endStr) == d)
}

String.prototype.startWith = function(endStr) {
	return (this.indexOf(endStr) == 0)
}

function _initWithLanguage(language) {
	var resource = null;
	try {
		if (language.toLowerCase().endWith("zh")) {
			try{
				resource = getResourceAjax("../resource/resource_zh.json");
			}catch(e){
				resource = getResourceAjax("resource/resource_zh.json");
			}
			
		} else {
			try{
				resource = getResourceAjax("../resource/resource.json");
			}catch(e){
				resource = getResourceAjax("resource/resource.json");
			}
		}
	} catch (e) {
		resource = getResourceAjax("resource/resource.json");
	}
	return resource
}

function getUrlParams(url) {
	var params = {};
	url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str, key, value) {
		params[key] = value;
	});
	return params;
}

/** 集成在手机app上的第三方插件需要向第三方服务器发送请求消息 */
var _redirectURL = function(param, _successCallback, _failCallback) {
	var jsonObj = {};
	if (param) {
		if (param.symbolicName) {
			jsonObj.symbolicName = param.symbolicName;
		} else {
			jsonObj.symbolicName = "";
			return -1;
		}
		if (param.data) {
			jsonObj.data = param.data;
		}
		// 暂时没有对入参做校验
		_currentBridge.redirectAuthURL(JSON.stringify(jsonObj),
				"_successCallback", "_failCallback");
	}
}

var _operate = function(param, _successCallback, _failCallback) {
	if (param.data) {		
		if(isAndroid){
		//android请求。
		_currentBridge.operate(JSON.stringify(param.data), "_successCallback");
	   }
	else if (isIOS) {
		params.request = "speedupoperate";
		_currentBridge.send(params, _successCallback);
	   }
	}
}

var _queryBandwidths = function(param, _successCallback, _failCallback) {
	if (param.data) {		
		if(isAndroid){
		//android请求。
		_currentBridge.queryBandwidths(JSON.stringify(param.data),
				"_successCallback");
	   }
	else if (isIOS) {
		params.request = "queryBandwidths";
		_currentBridge.send(params, _successCallback);
	   }			
	}
}

var _queryService = function(param, _successCallback, _failCallback) {
	if (param.data) {
		// 暂时没有对入参做校验			
		if(isAndroid){
		//android请求。
		_currentBridge.queryService(JSON.stringify(param.data),
				"_successCallback");
	   }
	else if (isIOS) {
		params.request = "speedupQueryService";
		_currentBridge.send(params, _successCallback);
	   }		
	}
}

var _order = function(param, _successCallback, _failCallback) {
	if (param.data) {	
		if(isAndroid){
		//android请求。
		_currentBridge.order(JSON.stringify(param.data), "_successCallback");
	   }
	   else if (isIOS) {
		params.request = "orderSpeedup";
		_currentBridge.send(params, _successCallback);
	   }
	}
}

var _queryOrderHistory = function(param, _successCallback, _failCallback) {
	if (param.data) {			
		if(isAndroid){
		//android请求。
		_currentBridge.queryOrderHistory(JSON.stringify(param.data),
				"_successCallback");
	   }
	   else if (isIOS) {
		params.request = "queryOrderHistory";
		_currentBridge.send(params, _successCallback);
	   }		
	}
}

var _scan = function(_successCallback, _failCallback) {
		if(isAndroid){
		//android请求。
		_currentBridge.scan("_successCallback","_failCallback");
	   }
}

var _wifiSwitch = function(ssid,password,_successCallback,_failCallback){
	var jsonObj = {}; 
	if (ssid)
	{
		if (password)
		{
			jsonObj.ssid = ssid;
			jsonObj.password = password;
    		
	    	_currentBridge.switchWifi(JSON.stringify(jsonObj));
		}					
		else
		{
			return -1;
		}
	}
	else
	{
	    return -1;
	}
}

var _getControllerWifi = function(_successCallback,_failCallback){
	if(isAndroid){
		_currentBridge.currentWifiInfo("_successCallback");
	}
}

var _getWifiList = function(_successCallback,_failCallback){
	if(isAndroid){
		_currentBridge.getWifiList("_successCallback");
	}
}

var _getResource = function(url,success){
	if(isAndroid){
		var frameName = null;
		try {
			frameName = decodeURIComponent(getUrlParams(location.href).frameName)
		} catch (e) {
			frameName = null;
		}
		// android请求。
		if (window.deviceService) {
			_currentBridge.getResource(url,frameName,success);
		} else {
			_currentBridge.getResource(url,"",success);
		}
	}
}

