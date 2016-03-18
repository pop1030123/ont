var resource = null;
var isContact = false;
var family_id = null;
function getResource(){
	if(resource == null){
		//取对应的语言文件
		resource = window.AppJsBridge.getDefaultResource();
	}
	return resource;
}

function initPage(){
	var spanArray = document.getElementsByTagName("span");
	for(var i = 0; i < spanArray.length; i++){
		var key = spanArray[i].getAttribute("local_key");
		spanArray[i].innerHTML = getResource()[key];
	}
}

function load(){
	window.AppJsBridge.getResource({
		"success":function(data){
						resource = data;
						initPage();
						showLoading(true);
						getFamilyId();
						getGalleryList();
					},
		"error":function(data){}
	})
}

function getGalleryList()
{
    // window.AppJsBridge.getAddedDeviceList({
    window.AppJsBridge.service.deviceService.getDeviceList({
        success: function(res) {
            var data = JSON.parse(res);
            var devices = $('ul.devices');
            for(idx in data) {
                var device = data[idx];
                if((device.sn!=null || device.sn != undefined) && device.deviceTypeName == 'gallery'){
                    var li = $('<li/>')
                            .addClass("element")
                            .appendTo(devices);
                    $('<span/>').addClass("name")
                                .text(getResource().TypeName)
                                .appendTo(li);
                    $('<br>').appendTo(li);
                    $('<span/>').addClass("sqr_no_pre")
                                .text(getResource().SongshuNum)
                                .appendTo(li);
                    $('<span/>').addClass("sqr_no")
                                .text(device.sn)
                                .appendTo(li);							
                    $('<div/>').addClass("ss_hr")
                               .appendTo(devices);
                    li.bind("click", function() {
                        var sn = $(this).find(".sqr_no").html();
                        location.href = "control.html?sn=" + sn + "&family_id=" + family_id;
                    })
                }
            }
            showLoading(false);
            // queryState();
        },
        error: function(error) {
            alert("getAddedDeviceList:err:"+error);
            showLoading(false);
        }
    });	
}

function queryState(){
    window.AppJsBridge.getSmartDevice({"success":successCallback,"error":failCallback});
}

function failCallback(data){
    alert('fail:'+data);
}

function successCallback(data){
    alert('suc:'+data);
}

function showLoading(isShow)
{
    document.getElementById("ss_load_mask").style.display = isShow?"block":"none";
    document.getElementById("ss_load_img").style.display = isShow?"block":"none";
}
		   
function getFamilyId(){
    AppJsBridge.getCurrentUserInfo({
        success: function(res) {
            // alert("getCurrentUserInfo:suc:"+res);
            family_id = res["familyId"];
            var data = {
                "Plugin_Name": "com.songshu.smarthome.chinaunicom-sc.driver",
                "Parameter": {
                    "Event": "OAUTH",
                    "Message": res
                }
            };
            // alert(JSON.stringify(data));
            AppJsBridge.callDevice({
                "parameter": JSON.stringify(data),
                "success":function(res) {
                },
                "error":function(data) {
                    alert(data);
                }
            });
            // alert("end");
        },
        error: function(error) {
            alert("getCurrentUserInfo:err:"+error);
        }
    });
}	

function goBack(){
    window.AppJsBridge.goBack({
        "success":function(data){},
		"error":function(data){}
    });
}

   function _w(){  
        var outer=document.getElementById('outer');  
        var w=outer.offsetWidth;  
        var cw=outer.childNodes[0].offsetWidth;  
        var mlrw=w-cw;  
        if(mlrw<0)return;  
        outer.childNodes[1].style.width=Math.floor(mlrw/w*100)+'%';  
    }  
    window.onresize=_w;