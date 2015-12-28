package com.songshu.smarthome;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Timer;
import java.util.TimerTask;

public class UploadSttatusManager {
	private final long CLEAR_DELAY = 20 * 60 * 1000;

	public static final int STATUS_CODE_SUCESS = 0;
	public static final int STATUS_CODE_TIMEOUT = 1;
	public static final int STATUS_CODE_FILESIZE_ZERO = 2;
	public static final int STATUS_CODE_PROCESS = 3;
	public static final int STATUS_CODE_ERROR = 4;
	public static final int STATUS_CODE_UPLOADING = 5;
	public static final int STATUS_CODE_FILE_LOST = 6;
	public static final int STATUS_CODE_NONE = 7;
	public static final int STATUS_CODE_NETWORK = 8;

	public final static HashMap<Integer, String> statusCode = new HashMap();
	private HashMap<String, UploadTaskStatus> taskStatusMap = new HashMap<>();

	private static UploadSttatusManager instance;

	public static UploadSttatusManager getInstance() {
		if (instance == null) {
			instance = new UploadSttatusManager();
		}
		return instance;
	}

	private UploadSttatusManager() {
		statusCode.put(STATUS_CODE_SUCESS, "上传成功");
		statusCode.put(STATUS_CODE_TIMEOUT, "超时");
		statusCode.put(STATUS_CODE_FILESIZE_ZERO, "文件长度为0");
		statusCode.put(STATUS_CODE_PROCESS, "正在处理");
		statusCode.put(STATUS_CODE_ERROR, "失败:");
		statusCode.put(STATUS_CODE_UPLOADING, "正在上传");
		statusCode.put(STATUS_CODE_FILE_LOST, "文件不存在");
		statusCode.put(STATUS_CODE_NONE, "查询的状态不存在");
		statusCode.put(STATUS_CODE_NETWORK, "当前网络环境缓慢，请重试");

		final Timer timer = new Timer();
		timer.schedule(new TimerTask() {

			@Override
			public void run() {
				System.out.println("------>Status Clear taskStatusMap: " + taskStatusMap);
				if (taskStatusMap != null) {
					ArrayList<String> removeKey = new ArrayList<>();
					for (UploadTaskStatus status : taskStatusMap.values()) {
						System.out.println("------>Status code:" + status.code + "	time:"
								+ (status.time - System.currentTimeMillis()));
						if (System.currentTimeMillis() - status.time >= CLEAR_DELAY) {
							System.out.println("------>Status Clear code:" + status.code + "	key:" + status.key);
							removeKey.add(status.key);
						}
					}

					synchronized (timer) {
						for (String deleteKey : removeKey) {
							taskStatusMap.remove(deleteKey);
						}
					}
				}
			}
		}, 0, CLEAR_DELAY);
	}

	public synchronized void UpdateTaskStatus(String key, int code, String desc, int progress) {
		UploadTaskStatus uploadTaskStatus = taskStatusMap.get(key);
		if (uploadTaskStatus == null) {
			uploadTaskStatus = new UploadTaskStatus();
		} else {
			if (uploadTaskStatus.code != 3) {
				synchronized (uploadTaskStatus) {
					taskStatusMap.remove(key);
				}	
			}
		}

		uploadTaskStatus.key = key;
		uploadTaskStatus.code = code;
		uploadTaskStatus.desc = desc;
		uploadTaskStatus.progress = progress;
		uploadTaskStatus.time = System.currentTimeMillis();

		taskStatusMap.put(key, uploadTaskStatus);

		System.out.println("----->filepath:" + key + "	UpdateTaskStatus:" + uploadTaskStatus);
	}

	public synchronized UploadTaskStatus getTaskStatus(String key) {
		System.out.println("----->getTaskStatus:" + taskStatusMap.get(key));
		return taskStatusMap.get(key);
	}

	public synchronized void removeTaskStatus(String key) {
		taskStatusMap.remove(key);
	}
}
