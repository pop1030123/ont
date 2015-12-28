package com.songshu.smarthome;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.Socket;
import java.util.Enumeration;
import java.util.List;
import java.util.TimerTask;

import org.json.JSONArray;
import org.json.JSONObject;
import org.osgi.framework.BundleContext;

import com.huawei.smartgateway.deviceservice.interfaces.lanservice.ILANService;
import com.huawei.smarthome.driver.IDeviceService;
import com.huawei.smarthome.log.LogService;
import com.huawei.smarthome.proxy.device.Device;
import com.huawei.smarthome.proxy.util.OsgiUtil;
import com.songshu.smarthome.api.API;
import com.songshu.smarthome.device.SongshuDevice;

public class PutDeviceTask extends TimerTask {
	
	private IDeviceService repository;
	private LogService logger;
	private JSONObject input;
	private String ip;
	
	public PutDeviceTask(IDeviceService repository, LogService logger, JSONObject input, String ip) {
		this.repository = repository;
		this.logger = logger;
		this.input = input;
		this.ip = ip;
	}
	
	@Override
	public void run() {
//		List<Device> currentList = repository.getAllDevice();
//		logger.i("当前设备数量:" + currentList.size());

//		String ip = getLocalIpAddress().toString();
		
		logger.i("设备IP:" + ip);
		JSONObject data = getDeviceInfo(ip, API.HUAWEI_NETWORK_INTERFACE_NAME);
		logger.i("获取设备信息完成");
		
		int retryCounts = 5;
		while (data == null && retryCounts > 0) {
			retryCounts--;
			try {
				Thread.sleep(1000);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			data = getDeviceInfo(ip, API.HUAWEI_NETWORK_INTERFACE_NAME);
		}
		
		if (data != null) {
			logger.i("松鼠设备信息:" + data.toString());
			SongshuDevice device = new SongshuDevice();
			device.setSn(data.getString("sqr_no"));
			device.setName("gallery");
			device.setBrand("songshu");
			device.setIp(ip);
			logger.i("松鼠插件注册设备:" + device.getSn());
			repository.reportIncludeDevice(input.optString("MAC"), "SongShuGallery", new JSONObject());
		}
	}
	
	private JSONObject getDeviceInfo(String ip, String networkInterfaceName) {
		logger.i("#API#获取设备信息");
		JSONObject res = null;
		Socket socket = null;
		OutputStream out = null;
		BufferedReader bff = null;

		try {
			NetworkInterface netIf = NetworkInterface.getByName(networkInterfaceName);
			if (netIf == null) {
				logger.i("结束");
				return null;
			}

			for (Enumeration<InetAddress> adrs = netIf.getInetAddresses(); adrs.hasMoreElements();) {
				InetAddress adr = adrs.nextElement();
				logger.i(adr.getHostName());
				logger.i(adr.getHostAddress());
				if (adr instanceof Inet4Address && !adr.isLoopbackAddress()) {
					try {
						socket = new Socket(ip, 12080);
						break;
					} catch (Exception e) {
						if (socket != null && !socket.isClosed()) {
							socket.close();
						}
						e.printStackTrace();
						logger.e(e.getMessage(), e);
						return null;
					}
				}
			}

			JSONObject data = new JSONObject();
			data.put("client_id", API.CLIENT_ID);
			data.put("client_secret", API.CLIENT_SECRET);

			out = socket.getOutputStream();
			PrintStream printStream = new PrintStream(socket.getOutputStream());
			printStream.println(data.toString());
			printStream.flush();

			bff = new BufferedReader(new InputStreamReader(socket.getInputStream()));
			String line = null;

			String buffer = "";

			while ((line = bff.readLine()) != null) {
				buffer = line + buffer;
			}

			res = new JSONObject(buffer);
		} catch (Exception e) {
			logger.i(e.toString());
			return null;
		} finally {
			try {
				if (out != null) {
					out.close();
				}

				if (bff != null) {
					bff.close();
				}

				if (socket != null && !socket.isClosed()) {
					socket.close();
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		return res;
	}
	
}
