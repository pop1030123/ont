var resource = null;
var errorList = null ;

function getResource(){
	if(resource == null){
		//取对应的语言文件
		resource = window.AppJsBridge.getDefaultResource();
	}
	return resource;
}

function load(){
  initScale();
  $('#btn1').click(function(){
      // 清理可能存在的定时器
      log("interval:"+intervalObj);
      if(intervalObj != null || intervalObj != undefined){
           clearInterval(intervalObj);
      }
      AppJsBridge.service.storageService.chooseFiles({
          type : 'PICTURE',
          source : 'album',
          maxFile : "9",
          success : function(res){
            isUploading = true;
            var res_data = JSON.parse(res);
            files = res_data['data'];
            var filesCount = files.length ;
            fileIndex = 0 ;
            showLoading(true);
            syncUpload();
          },
          error: function(error){
            updateAndTryNext(getResource().UploadFail+error);
          }
      });
  });
  $('#finish').click(function(){
      if (!isUploading) {
        if(intervalObj != null || intervalObj != undefined){
           clearInterval(intervalObj);
        }
        files = null ;
        fileIndex = 0 ;
        showLoading(false);
      };
  });
  window.AppJsBridge.getResource({
        "success" : function(data) {
            resource = data;
            $('#ss_title').html(getResource().UploadListTxt);
            $('#finish').html(getResource().FinishTxt);
            $('#ss_upload_txt').html(getResource().UploadBtnTxt);
            errorList = { '-1':getResource().PutObjError_1,
                  '-2':getResource().PutObjError_2,
                  '-3':getResource().PutObjError_3,
                  '-4':getResource().PutObjError_4,
                  '-5':getResource().PutObjError_5,
                  '-6':getResource().PutObjError_6,
                  '-7':getResource().PutObjError_7,
                  '-8':getResource().PutObjError_8,
                  '11':getResource().PutObjError11,
                  '12':getResource().PutObjError12,
                  '14':getResource().PutObjError14,
                  '15':getResource().PutObjError15
                } ;
        },
        "error" : function(data) {
        }
    });
}

function showLoading(isShow)
 {
     document.getElementById("ss_load_mask").style.display = isShow?"block":"none";
     document.getElementById("ss_load_img").style.display = isShow?"block":"none";
     if(isShow){
       // 列出所有的上传文件列表
       var file_list = $('#file_list');
       $('#file_list > li').remove();
       $('#log').html('');
       for (var i = 0; i < files.length; i++) {
           var fileObj = files[i] ;
           var li = $('<li/>')
                    .attr("id" ,"file"+i)
                    .addClass("element")
                    .appendTo(file_list);
           $('<img/>').addClass("thumb")
                      .attr("data-original" ,fileObj['path'])
                      .attr("width" ,50)
                      .attr("height" ,50)
                      .lazyload({
                        threshold : 1,
                        effect : "fadeIn"
                      })
                      .appendTo(li);
           $('<span/>').addClass("progress")
                       .text(getResource().UploadPrepare)
                       .appendTo(li);
           var retryDiv = $('<div/>').addClass("retryDiv")
                                     .appendTo(li);
           $('<button/>').attr("id" ,i)
                       .addClass("retryBtn")
                       .text(getResource().UploadRetry)
                       .click(function(){
                           log('retry clicked : '+this.id);
                           var size = uploadList.unshift({'index':this.id ,'fileObj':files[this.id]}) ;
                           log('uploadList size:'+size);
                           // 点击完成后隐藏重试按钮
                           this.style.display = 'none' ;
                           if(isUploading){
                              // 如果其它正在上传，则加入上传列表，准备上传
                              updateUploading(this.id ,getResource().UploadPrepare);
                           }else{
                              // 如果其它处理完了，则上传这个
                              isUploading = true ;
                              syncUpload();
                           }
                           log('retry clicked over : '+this.id);
                       })
                       .appendTo(retryDiv)
                       .hide();
           $('<div/>').addClass("ss_hr")
                      .appendTo(li);
           uploadList.unshift({'index':i,'fileObj':files[i]}) ;
       };
    };
 }
 function updateUploading(index,res){
    $("li#file"+index +" > .progress").html(res) ;
    log(index+':'+res);
 }
function urlParam(name){
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
  if (results==null){
    return null;
  }
  else{
    return results[1] || 0;
  }
};
function syncUpload(){
     if (uploadList.length == 0) {
        fileIndex = 0 ;
        isUploading = false;
     }else{
        var uploadObj = uploadList.pop() ;
        fileIndex = uploadObj['index'] ;
        var fileObj = uploadObj['fileObj'] ;
        upload(fileObj);
     };
};

// 保存当前进度，主要是为了相同的进度就不用再刷新UI了。
var m_curProg ;
function upload(fileObj){
    log(fileIndex+':upload:'+fileObj['path']);
    updateUploading(fileIndex ,getResource().UploadPreparing) ;
    AppJsBridge.service.storageService.putObject({
        type: 'CLOUD_FAMILY',
        files: JSON.stringify(fileObj),
        url:"",
        process: function(res_process) {
          var res_data = JSON.parse(res_process);
          var curProg = res_data['data']['percent'] ;
          if(m_curProg != curProg){
             m_curProg = curProg ;
             var progStr = curProg.substr(0,curProg.length-1);
             var progInt = parseInt(progStr);
             updateUploading(fileIndex ,getResource().UploadDoing+progInt/2+"%") ;
             log(fileIndex+':'+res_process);
          }
        },
        success: function(res_success) {
          log(fileIndex+':callDevice:MOMENTS:suc:'+res_success);
            var response = JSON.parse(res_success);
            if (response['result'] == "0") {
                var message = {
                    "sn":sn,
                    "family_id":family_id,
                    "pic": response["data"],
                    "key":response["data"]
                }
                curFileKey = response["data"];
                var request = {
                    "Plugin_Name": "com.songshu.smarthome.chinaunicom-sc.driver",
                    "Parameter": {
                        "Event": "MOMENTS",
                        "Message": message
                    }
                }
                log(fileIndex+':callDevice:MOMENTS:'+curFileKey);
                AppJsBridge.callDevice({
                    "parameter": JSON.stringify(request),
                    "success":function(res_suc_cd) {
                      var resObj = JSON.parse(res_suc_cd);
                      if (resObj['errcode'] == '-1') {
                        // 可能立即返回超时，但是ONT还会执行上传 : 
                        // {"errmsg":"httptimeout","retrun_message":"","errcode":"-1"}
                        updateAndTryNext(getResource().UploadFail+getResource().UploadReason_Timeout) ;
                      }else if(resObj['errCode'] == '0'){
                        // {“errCode”:”0”,”return_Parameter”:””}
                        updateAndTryNext(getResource().UploadReason_RouteErr) ;
                      }else{
                        handleUploadSuc(res_suc_cd);
                      }
                    },
                    "error":function(data) {
                      updateAndTryNext(getResource().UploadFail+data) ;
                    }
                });
             } else {
              // 暂时不处理，原因如下：
              // 1.有可能回调到错误，然后还在process，最后回调到成功，就是不会影响正常上传。
              log(fileIndex+':上传沃云失败2:'+JSON.stringify(response));
              var res_code = response['result'] ;
              if(res_code != null && res_code != undefined){
                var image_name = response['data'];
                if(image_name != null && image_name != undefined){
                  // 错误结构类似于 {"data":"DAimG_2015021933600531V28C.jpg","result":"-8"}
                  var err_str = errorList[res_code] ;
                  if(err_str != null && err_str != undefined){
                    updateAndTryNext(getResource().PutObjErr+errorList[res_code]) ;   
                  }else{
                    updateAndTryNext(getResource().PutObjErr+res_code) ; 
                  }    
                }
              }
            }
      },
      error: function(error) {
        updateAndTryNext(getResource().PutObjErr+error);
      }
    });
}
/**
    0 ：上传成功
    1 ：上传到七牛超时;(七牛分片4MB，ONT重试3次)
    2 ：沃云查询到文件长度为0
    3 ：callDevice立即返回，避免超时
    4 ：失败:Connection reset或者其它ONT错误
    5 ：正在上传进度查询
    6 ：沃云上文件不存在
    7 ：查询的状态不存在
    8 ：网络缓慢（Connect timeout;Connect reset;Socket close;）
*/
function handleUploadSuc(result){
    var res_data = JSON.parse(result);
    var code = res_data['code'];
    if(code == '0'){
      updateAndTryNext(getResource().UploadSuccess,true) ;
    }else if(code == '1'){
      updateAndTryNext(getResource().UploadFail+getResource().ONTError1) ;
    }else if(code == '2'){
      updateAndTryNext(getResource().UploadFail+getResource().ONTError2) ;
    }else if(code == '4'){
      updateAndTryNext(getResource().UploadFail+getResource().ONTError3) ;
    }else if(code == '6'){
      updateAndTryNext(getResource().UploadFail+getResource().ONTError6) ;
    }else if(code == '7'){
      updateAndTryNext(getResource().UploadFail+getResource().ONTError7) ;
    }else if(code == '8'){
      updateAndTryNext(getResource().UploadReason_SocketOut) ;
    }else if(code == '3'){
      updateUploading(fileIndex ,getResource().UploadDoing+"50.1%") ;
      if(intervalObj != null || intervalObj != undefined){
         clearInterval(intervalObj);
      }
      intervalObj = setInterval('checkProgress(curFileKey)' ,5000);
    }else if(code == '5'){
      var progress = res_data['progress'];
      progress = progress/2<1? 1:progress/2 ;
      var curProg = progress+50 ;
      updateUploading(fileIndex ,getResource().UploadDoing+curProg+"%") ;
    }else{
      updateAndTryNext(getResource().UploadFail+result) ;
    }
}
function updateAndTryNext(res){
  updateAndTryNext(res ,false);
}
function updateAndTryNext(res ,isSuc){
  if(intervalObj != null || intervalObj != undefined){
    clearInterval(intervalObj);
  }
  if(!isSuc){
     // 显示重试按钮
     $('.retryBtn').get(fileIndex).style.display = 'block' ;
  }
  updateUploading(fileIndex ,res);
  syncUpload();
}
// 标识上一个文件处理状态，不包括请求进度的5
var m_progress_key ;
var m_progress_value = -1 ;

function checkProgress(key){
    var request = {
                    "Plugin_Name": "com.songshu.smarthome.chinaunicom-sc.driver",
                    "Parameter": {
                        "Event": "PROCESS_CHECK",
                        "Message": {"key":key}
                    }
                }
    log(fileIndex+':checkProgress:'+key+':m_key:'+m_progress_key);
    AppJsBridge.callDevice({
                    "parameter": JSON.stringify(request),
                    "success":function(res_chk_pro) {
                      var resObj = JSON.parse(res_chk_pro);
                      log(fileIndex+':callDevice:progress:'+res_chk_pro);
                      // 可能立即返回超时 : {"errmsg":"httptimeout","retrun_message":"","errcode":"-1"}
                      if (resObj['errcode'] != '-1') {
                         var code     = resObj['code'] ; 
                         var key      = resObj['key'];
                         var progress = resObj['progress'];
                         if(code == '5' && progress > m_progress_value){
                            m_progress_value = progress ;
                            handleUploadSuc(res_chk_pro);
                         }else if(code != null && code != undefined && code != '5' && key != m_progress_key){
                            m_progress_key  = key ;
                            m_progress_value = -1 ;
                            handleUploadSuc(res_chk_pro);
                         }
                      };
                    },
                    "error":function(data){
                       alert("err:"+data);
                    }
                  });
}
var intervalObj ,curFileKey ;
var sn = urlParam("sn");
var family_id = urlParam("family_id");
var files ;
var uploadList = new Array();
var fileIndex = 0 ;
var isUploading ;

function log(str){
   // $('#log').append(new Date().toLocaleString()+':</br>'+str+'</br>');
}
function initScale(){
    var s_width = window.innerWidth;
    var s_height = window.innerHeight;
    document.querySelector('html').style.fontSize = 10*(s_width/320) + 'px';
}
function goBack(){
    window.AppJsBridge.goBack({
        "success":function(data){},
    "error":function(data){}
    });
}