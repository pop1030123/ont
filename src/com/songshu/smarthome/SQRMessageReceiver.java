package com.songshu.smarthome;

import org.json.JSONException;
import org.json.JSONObject;
import org.osgi.framework.BundleContext;

import com.huawei.smarthome.proxy.message.MessageProcessor;
import com.huawei.smarthome.proxy.service.ProxyService;
import com.huawei.smarthome.proxy.util.OsgiUtil;
import com.songshu.smarthome.api.API;

public class SQRMessageReceiver implements MessageProcessor{
	BundleContext context;
	public SQRMessageReceiver(BundleContext ctx) {
		this.context = ctx;
	}

	@Override
	public int getPriority() {
		return MessageProcessor.NORMAL_PRIORITY;
	}

	@Override
	public boolean processMessage(JSONObject input, JSONObject output) {
		try {
			String event = input.getString("Event");
			switch (event) {
				case Event.WLAN_DEV_ONLINE:
					String mac = input.getString("MacAddr");
					ProxyService service = OsgiUtil.getService(context, ProxyService.class, null);
					String ip = service.getIPAddressByMac(mac);
//					API.getDeviceInfo(ip, API.HUAWEI_NETWORK_INTERFACE_NAME);
					break;
			}
		} catch (JSONException e) {
			e.printStackTrace();
			return false;
		}
		
		return true;
	}

}
