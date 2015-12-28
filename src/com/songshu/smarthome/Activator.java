package com.songshu.smarthome;

import java.io.InputStream;
import java.util.Timer;

import javax.swing.LookAndFeel;

import org.json.JSONObject;
import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;

import com.huawei.smarthome.api.storage.IStorageService;
import com.huawei.smarthome.api.storage.IStorageServiceManager;
import com.huawei.smarthome.api.storage.StorageObject;
import com.huawei.smarthome.api.storage.StorageType;
import com.huawei.smarthome.proxy.log.LogService;
import com.huawei.smarthome.proxy.log.LogServiceFactory;
import com.huawei.smarthome.proxy.message.MessageDispatcher;
import com.huawei.smarthome.proxy.message.MessageProcessor;
import com.huawei.smarthome.proxy.service.DeviceManageService;
import com.huawei.smarthome.proxy.service.MessageHandleService;
import com.qiniu.storage.InputStreamUploader;
import com.songshu.smarthome.api.API;

/**
 * OSGI插件的 Activator
 */
public class Activator implements BundleActivator {
	private final static LogService logger = LogServiceFactory.getLogService(Activator.class);

	SQRDeviceRepository repository;

	SQRDeviceManageService sqrDeviceMgrService;

	ServiceReference<IStorageServiceManager> sr = null;
	IStorageServiceManager ssm = null;
	IStorageService storage = null;

	/**
	 * OSGI插件启动函数
	 * 
	 * @param context
	 *            OSGI上下文
	 */
	public void start(BundleContext context) {
		// repository = new SQRDeviceRepository(context);
		// repository.start();

		sqrDeviceMgrService = new SQRDeviceManageService();
		context.registerService(DeviceManageService.class, sqrDeviceMgrService, null);

		logger.i("Songshu repository started.");

		MessageDispatcher.setup(context);

		try {
			sr = context.getServiceReference(IStorageServiceManager.class);
			ssm = context.getService(sr);
			storage = ssm.getStorageService("com.songshu.smarthome.chinaunicom-sc.driver");
		} catch (Exception e) {
			return;
		}
		
		DeviceStatusManager.getInstance(context, sqrDeviceMgrService, logger).initOnlineDevice();
		DeviceStatusManager.getInstance(context, sqrDeviceMgrService, logger).startDeviceMonitor();
		
		MessageDispatcher dispatcher = MessageDispatcher.getInstance(context);
		dispatcher.addMessageHandler(new MessageProcessor() {

			@Override
			public int getPriority() {
				return MessageProcessor.NORMAL_PRIORITY;
			}

			@Override
			public boolean processMessage(JSONObject input, JSONObject output) {
				logger.i("------【新消息】-----:" + input.toString());
				try {
					String event = input.getString("Event");
					switch (event) {
					case Event.WLAN_DEV_ONLINE:
						new Timer().schedule(new PutDeviceTask(context, sqrDeviceMgrService, logger, input), 3000);
						break;
					case Event.OAUTH:
						logger.i("华为家庭用户认证.");
						JSONObject message = input.getJSONObject("Message");
						JSONObject reqData = new JSONObject();
						reqData.put("family_id", message.getString("familyId"));
						reqData.put("family_name", message.getString("familyName"));
						logger.i(reqData.toString());
						logger.i("##############");
						try {
							API api = new API();
							String res = api.auth(reqData.toString());
							logger.i(res);
						} catch (Throwable e) {
							e.printStackTrace();
						}

						break;
					case Event.HUAWEI_CONTACTS:
						API contactsApi = new API();
						JSONObject contactsMessage = input.getJSONObject("Message");
						String fid = contactsMessage.getString("family_id");
						String contactsToken = contactsApi.getFamilyOAuthToken(fid);
						logger.i("沃宝和松鼠设备进行绑定！");
						String contactsRes = contactsApi.contacts(contactsMessage.toString(), contactsToken);
						logger.i(contactsRes);
						break;
					case Event.POST_MOMENT:
						API api = new API();
						JSONObject moment = input.getJSONObject("Message");
						String sn = moment.getString("sn");
						String familyId = moment.getString("family_id");
						String path = moment.getString("pic");
						String filekey = moment.getString("key");
						InputStream file = getStorageFileInputStream(storage, path);
						if (file == null) {
							UploadSttatusManager.getInstance().UpdateTaskStatus(filekey,
									UploadSttatusManager.STATUS_CODE_FILE_LOST,
									UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_FILE_LOST), 0);
							returnCurrentStatus(filekey, output);
							break;
						}

						String songshutoken = api.getFamilyOAuthToken(familyId);
						String upToken = api.getQiniuToken(songshutoken);
						long fileSize = getFileSize(storage, path);
						api.uploadFile(sn, songshutoken, upToken, file, fileSize, filekey);

						UploadSttatusManager.getInstance().UpdateTaskStatus(filekey,
								UploadSttatusManager.STATUS_CODE_PROCESS,
								UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_PROCESS), 0);

						returnCurrentStatus(filekey, output);
						break;
					case Event.PROCESS_CHECK:
						JSONObject checkObject = input.getJSONObject("Message");
						String key = checkObject.getString("key");

						returnCurrentStatus(key, output);
						break;
					}
				} catch (Exception e) {
					e.printStackTrace();
					return false;
				}

				logger.i("------【新消息】-----output:" + output);
				return true;
			}

		});

		final MessageHandleService messageService = new MessageHandleService(context);
		messageService.addMessageHandler("SQRMessageHandler", new SQRMessageHandler());
		logger.i("New message handle service.");
	}

	private void returnCurrentStatus(String key, JSONObject output) {
		UploadTaskStatus uploadTaskStatus = UploadSttatusManager.getInstance().getTaskStatus(key);

		output.put("key", key);
		if (uploadTaskStatus != null) {
			output.put("code", uploadTaskStatus.code);
			output.put("desc", uploadTaskStatus.desc);
			output.put("progress", uploadTaskStatus.progress);
		} else {
			output.put("code", UploadSttatusManager.STATUS_CODE_NONE);
			output.put("desc", UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_NONE));
			output.put("progress", 0);
		}

		logger.i("-----------------********>return json:" + output);
	}

	byte[] getStorageFile(IStorageService service, String url) throws Exception {

		logger.i("文件路径:" + url);
		StorageObject dest = service.getObject(StorageType.CLOUD_FAMILY, url);
		InputStream is = dest.getInput();
		byte[] ret = new byte[1024];
		byte[] file = new byte[0];
		int len = 0;
		while ((len = is.read(ret)) != -1) {
			byte[] r = new byte[len];
			for (int i = 0; i < r.length; i++) {
				r[i] = ret[i];
			}
			file = concat(file, r);
		}
		logger.i("文件字节大小:" + file.length);
		is.close();

		return file;
	}

	InputStream getStorageFileInputStream(IStorageService service, String url) throws Exception {
		logger.i("文件路径:" + url);
		StorageObject dest = service.getObject(StorageType.CLOUD_FAMILY, url);
		if (dest == null) {
			return null;
		}
		InputStream file = dest.getInput();
		logger.i("文件字节大小:" + dest.getSize());

		return file;
	}

	long getFileSize(IStorageService service, String url) throws Exception {
		StorageObject dest = service.getObject(StorageType.CLOUD_FAMILY, url);
		if (dest == null) {
			return 0;
		}
		return dest.getSize();
	}

	byte[] concat(byte[] a, byte[] b) {
		byte[] c = new byte[a.length + b.length];
		System.arraycopy(a, 0, c, 0, a.length);
		System.arraycopy(b, 0, c, a.length, b.length);
		return c;
	}

	/**
	 * OSGI插件停止函数
	 * 
	 * @param context
	 *            OSGI上下文
	 */
	public void stop(BundleContext context) {
		/**
		 * Does nothing since the framework will automatically unregister any
		 * registered services.
		 **/
	}

}
