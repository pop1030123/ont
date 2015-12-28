package com.songshu.smarthome;

public class UploadTaskStatus {
	public String key;
	public int code;
	public String desc;
	public int progress;
	public long time;

	public String toString() {
		return "key:" + key + "code:" + code + "	desc:" + desc + "	progress:" + progress + "	time" + time;
	}
}
