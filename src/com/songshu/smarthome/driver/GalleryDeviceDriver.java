/**
 * 
 */
package com.songshu.smarthome.driver;

import java.io.InputStream;

import org.json.JSONObject;

import com.huawei.smarthome.api.exception.ActionException;
import com.huawei.smarthome.api.storage.IStorageService;
import com.huawei.smarthome.api.storage.IStorageServiceManager;
import com.huawei.smarthome.api.storage.StorageObject;
import com.huawei.smarthome.api.storage.StorageType;
import com.huawei.smarthome.driver.IDeviceService;
import com.huawei.smarthome.driver.ip.IIPDeviceDriver;
import com.huawei.smarthome.localapi.ServiceApi;
import com.huawei.smarthome.log.LogService;
import com.huawei.smarthome.log.LogServiceFactory;
import com.songshu.smarthome.UploadSttatusManager;
import com.songshu.smarthome.UploadTaskStatus;
import com.songshu.smarthome.api.API;

/**
 * <div class="English"> </div><br>
 * <br>
 * <div class="Chinese"> </div><br>
 * <br>
 * 
 * @author Hong Cai
 * @since Openlife SDK 1.0 2015-12-9
 */
public class GalleryDeviceDriver implements IIPDeviceDriver {
	private IDeviceService deviceService;
	private static final LogService log = LogServiceFactory.getLogService(GalleryDeviceDiscoverer.class);
	private IStorageService storageService;

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void setDeviceService(IDeviceService deviceService) {
		this.deviceService = deviceService;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public JSONObject doAction(String sn, String action, JSONObject parameter, String deviceClass)
			throws ActionException {
		JSONObject output = new JSONObject();

		try {
			if (action.equals("upload")) {
				API api = new API();
				JSONObject moment = parameter.getJSONObject("Message");
				String squirrelNo = moment.getString("sn");
				String familyId = moment.getString("family_id");
				String path = moment.getString("pic");
				String filekey = moment.getString("key");
				InputStream file = getStorageFileInputStream(storageService, path);
				if (file == null) {
					UploadSttatusManager.getInstance().UpdateTaskStatus(filekey,
							UploadSttatusManager.STATUS_CODE_FILE_LOST,
							UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_FILE_LOST), 0);
					returnCurrentStatus(filekey, output);
				}

				String songshutoken = api.getFamilyOAuthToken(familyId);
				String upToken = api.getQiniuToken(songshutoken);
				long fileSize = getFileSize(storageService, path);
				api.uploadFile(squirrelNo, songshutoken, upToken, file, fileSize, filekey);

				UploadSttatusManager.getInstance().UpdateTaskStatus(filekey, UploadSttatusManager.STATUS_CODE_PROCESS,
						UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_PROCESS), 0);

				return returnCurrentStatus(filekey, output);
			} else if (action.equals("getUploadProgress")) {

				JSONObject checkObject = parameter.getJSONObject("Message");
				String key = checkObject.getString("key");

				return returnCurrentStatus(key, output);
			}
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
		return null;
	}

	InputStream getStorageFileInputStream(IStorageService service, String url) throws Exception {
		log.i("文件路径:" + url);
		StorageObject dest = service.getObject(StorageType.CLOUD_FAMILY, url);
		if (dest == null) {
			return null;
		}
		InputStream file = dest.getInput();
		log.i("文件字节大小:" + dest.getSize());

		return file;
	}

	long getFileSize(IStorageService service, String url) throws Exception {
		StorageObject dest = service.getObject(StorageType.CLOUD_FAMILY, url);
		if (dest == null) {
			return 0;
		}
		return dest.getSize();
	}

	private JSONObject returnCurrentStatus(String key, JSONObject output) {
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

		log.i("-----------------********>return json:" + output);
		return output;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void init() {
		IStorageServiceManager ssm = (IStorageServiceManager) ServiceApi.getService(IStorageServiceManager.class, null);
		String app = "songshu"; // 插件名称
		IStorageService storageService = ssm.getStorageService(app);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void destroy() {
		// TODO Auto-generated method stub

	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onUserDeviceAdd(String sn, JSONObject data) {
		// TODO Auto-generated method stub

	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onUserDeviceDel(String sn) {
		// TODO Auto-generated method stub

	}

}
