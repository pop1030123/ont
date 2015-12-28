package com.songshu.smarthome;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;

import com.huawei.smarthome.proxy.device.Device;
import com.huawei.smarthome.proxy.log.LogService;
import com.huawei.smarthome.proxy.log.LogServiceFactory;
import com.huawei.smarthome.proxy.service.DeviceEventListener;
import com.huawei.smarthome.proxy.service.DeviceManageEventListener;
import com.huawei.smarthome.proxy.service.DeviceManageService;
import com.songshu.smarthome.api.API;
import com.songshu.smarthome.device.SongshuDevice;

public class SQRDeviceManageService implements DeviceManageService
{
        
    private List<Device> devices = new ArrayList<Device>();
    
    private final static LogService logger = LogServiceFactory.getLogService(SQRDeviceManageService.class);
    
    @Override
    public List<Device> getAllDevice()
    {
        return devices;
    }
    
    public void addDevice(Device device)
    {
        if (this.devices.indexOf(device) == -1) {
        	this.devices.add(device);
        } 
        
        if (getDevice(device.getSn()) != null) {
        	getDevice(device.getSn()).online();
		}
    } 
    
    @Override
    public Device getDevice(String sn)
    {
       for (Device device : this.devices) {
    	   if (device.getSn().equals(sn)) {
    		   return device;
    	   }
       }
       return null;
    }

    @Override
    public void executeDeviceAction(String sn, String actionParameter, JSONObject parameter)
    {
        JSONObject data = new JSONObject(actionParameter);
        JSONArray params = data.getJSONArray("params");
        String familyId = "";
        for (int i=0; i < params.length(); i ++) {
        	JSONObject param = (JSONObject) params.get(i);
        	if ("familyId".equals(param.getString("name"))) {
        		familyId = param.getString("value");
        		break;
        	}
        }
        logger.d("华为家庭{}绑定松鼠设备{}", familyId, sn);
        JSONObject device = new JSONObject();
        device.put("sn", sn);
        JSONArray devices = new JSONArray();
        devices.put(device);
        if (!"".equals(familyId)) {
        	API api = new API();
        	String token = api.getFamilyOAuthToken(familyId);
        	String res = api.contacts(new JSONObject().put("devices", devices).toString(), token);
        	
			logger.i(res);
        } else {
        	logger.i("不好意思，获取family id失败！");
        }
    }
    


    @Override
    public void setJoinNetworkSwitch(boolean enabled)
    {

    }

    @Override
    public void addManageEventListener(DeviceManageEventListener listener)
    {

    }

    @Override
    public void removeManageEventListener(DeviceManageEventListener listener)
    {

    }

    @Override
    public void addDeviceEventListener(String sn, String parameter, DeviceEventListener listenter)
    {

    }

    @Override
    public void removeDeviceEventListener(String sn, String parameter, DeviceEventListener listenter)
    {

    }

}
