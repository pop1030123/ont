package com.songshu.smarthome;

import org.json.JSONObject;
import org.osgi.framework.BundleContext;

import com.huawei.smarthome.proxy.device.DeviceRepository;


import com.huawei.smarthome.proxy.log.LogService;
import com.huawei.smarthome.proxy.log.LogServiceFactory;

public class SQRDeviceRepository extends DeviceRepository {
	
	private final static LogService logger = LogServiceFactory.getLogService(SQRDeviceRepository.class);

	public SQRDeviceRepository(BundleContext context) throws NullPointerException {
		super(context);
	}
	
	@Override
	public void executeDeviceAction(String sn, String actionParameter,
            JSONObject parameter) {
		logger.i("设备操作");
		logger.i("设备:" + sn);
		logger.i("操作参数:" + actionParameter);
		logger.i("参数:" + parameter.toString());
	}

}
