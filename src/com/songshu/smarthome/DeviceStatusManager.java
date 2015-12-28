package com.songshu.smarthome;

import java.io.IOException;
import java.net.Socket;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

import org.json.JSONArray;
import org.json.JSONObject;
import org.osgi.framework.BundleContext;

import com.huawei.smartgateway.deviceservice.interfaces.lanservice.ILANService;
import com.huawei.smarthome.proxy.device.Device;
import com.huawei.smarthome.proxy.log.LogService;
import com.huawei.smarthome.proxy.util.OsgiUtil;

public class DeviceStatusManager {
	public static final int CHECK_PERIOD = 5 * 60 * 1000;

	private SQRDeviceManageService repository;
	private LogService logger;
	private BundleContext context;

	private static DeviceStatusManager mInstance;

	private DeviceStatusManager(BundleContext context, SQRDeviceManageService repository, LogService logger) {
		this.context = context;
		this.repository = repository;
		this.logger = logger;
	}

	public static DeviceStatusManager getInstance(BundleContext context, SQRDeviceManageService repository,
			LogService logger) {
		if (mInstance == null) {
			mInstance = new DeviceStatusManager(context, repository, logger);
		}

		return mInstance;
	}

	public void startDeviceMonitor() {
		logger.i("start startDeviceMonitor");
		new Timer().schedule(new MonitorTask(), 5000);
	}

	public void initOnlineDevice() {
		logger.i("start initOnlineDevice");
		new Timer().schedule(new InitTask(), 500);
	}

	class InitTask extends TimerTask {
		public InitTask() {

		}

		@Override
		public void run() {
			ILANService service = OsgiUtil.getService(context, ILANService.class, null);
			String info = service.lanGetNetInfo();
			logger.i("LAN网络信息:" + info);
			JSONArray list = new JSONObject(info).getJSONArray("Info");
			String ip = "";

			for (int i = 0; i < list.length(); i++) {
				JSONObject item = list.getJSONObject(i);
				JSONObject input = new JSONObject();
				input.put("MacAddr", item.getString("MAC"));
//				new Timer().schedule(new PutDeviceTask(context, repository, logger, input), 3000);
				try {
					Thread.sleep(3000);
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
			}

		}
	}

	class MonitorTask extends TimerTask {

		public MonitorTask() {
		}

		@Override
		public void run() {
			logger.i("start MonitorTask");
			List<Device> currentList = repository.getAllDevice();
			logger.i("当前设备数量:" + currentList.size());

			for (Device device : currentList) {
				try {
					Thread.sleep(1000);
				} catch (InterruptedException e2) {
					continue;
				}

				String ip = device.getIp();
				logger.i("设备IP:" + ip);
				Socket socket = null;
				try {
					socket = new Socket(ip, 12080);
				} catch (Exception e) {
					if (socket != null && !socket.isClosed()) {
						try {
							socket.close();
						} catch (IOException e1) {
							e1.printStackTrace();
						}
					}
					device.offline();
					logger.i("设备IP:" + ip + "	-------------device.offline()");
					continue;
				}

				try {
					socket.close();
					device.online();
					logger.i("设备IP:" + ip + "	-------------device.online()");
				} catch (IOException e) {
					e.printStackTrace();
				}
			}

			new Timer().schedule(new MonitorTask(), CHECK_PERIOD);
		}
	}
}
