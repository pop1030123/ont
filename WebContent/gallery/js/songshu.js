var statusFlag = null;
var SN = null;
var resource = null;
var ifSmartDeviceFailed = false;
var ifConnectDevFailed = false;
var ifReturn = false;
var loadingTimer = null;

var initFrameHeight = function() {
	var frameId = getUrlParams(window.location.href).frameId;
	var iframe = parent.document.getElementById(frameId);
	iframe.parentNode.style.display = "block";
	iframe.height = document.documentElement.scrollHeight;
}

function getResource() {
	if (resource == null) {
		// 取对应的语言文件
		resource = window.AppJsBridge.getDefaultResource();
	}
	return resource;
}

function initPage() {
	var spanArray = document.getElementsByTagName("span");
	for ( var i = 0; i < spanArray.length; i++) {
		if (spanArray[i].getAttribute("local_key")) {
			var key = spanArray[i].getAttribute("local_key")
			spanArray[i].innerHTML = getResource()[key];
		}
	}
}

var load = function() {
	initFrameHeight();
	window.AppJsBridge.getResource({
		"success" : function(data) {
			resource = data;
			initPage();
			showLoadingImg();
		},
		"error" : function(data) {
		}
	});
}

function songshuClick(){
	//调用api
}

function showMore(){
	window.AppJsBridge.service.openActivity({
		"params" : {
			"target" : "plugin",
			"params" : {
				"href" : window.location.href
			}
		},
		"success" : function(data) {

		},
		"error" : function(data) {
			var strPre = getRes("ShowMore") + ' ';
			showErr(strPre + getRes("Failed"));
		}
	});
}




function getUrlParams(url) {
	var params = {};
	url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str, key, value) {
		params[key] = value;
	});
	return params;
}

var $dom = function(tagName) {
	return document.createElement(tagName);
}

function showMoreTouchDown(obj) {
//	obj.style.backgroundColor = "#aaa";
}

function showMoreTouchUp(obj) {
	obj.style.backgroundColor = "#aaa";
	setTimeout(function() {
		obj.style.backgroundColor = "#fff";
		showMore();
	}, 500);
}

function refreshPage(){
	location.reload()
}

function showLoadingImg(){
	var img = document.getElementById("refresh_img");
	img.src = "../images/refresh.gif";
	loadingTimer = setTimeout(function(){finishedLoading();},6000); 
}

function finishedLoading(){
	if(loadingTimer != null){
		clearTimeout(loadingTimer);
	}
	var img = document.getElementById("refresh_img");
	img.src = "../images/refresh.png";
}
