package com.songshu.smarthome;

import org.json.JSONObject;

import com.huawei.smarthome.proxy.log.LogService;
import com.huawei.smarthome.proxy.log.LogServiceFactory;

public class SQRMessageHandler {
	private final static LogService logger = LogServiceFactory.getLogService(Activator.class);
	public void OAUTH(JSONObject input, JSONObject output) {
		logger.i(input.toString());
	}
}
