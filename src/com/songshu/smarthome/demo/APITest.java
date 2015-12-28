package com.songshu.smarthome.demo;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;

import com.qiniu.storage.Recorder;
import com.qiniu.storage.UploadManager;
import com.songshu.smarthome.api.API;
import com.songshu.smarthome.api.DataRecorder;
import com.songshu.smarthome.api.Utils;

public class APITest {
	static byte[] concat(byte[] a, byte[] b) {
		byte[] c = new byte[a.length + b.length];
		System.arraycopy(a, 0, c, 0, a.length);
		System.arraycopy(b, 0, c, a.length, b.length);
		return c;
	}
	
	public static void main(String[] args) throws IOException {
//		String token = API.getQiniuToken("13227");
//		System.out.println(Utils.fileMD5("/Users/Jia/Desktop/1.png"));
//		API.uploadFile(token, new File("/Users/Jia/Desktop/1.png"));
//		JSONObject params = new JSONObject();
//		params.put("family_id", "40ab9659-8823-4ece-9da5-0e80d0f97f8b");
//		params.put("family_name", "松鼠家庭");
//		System.out.print(API.auth(params.toString()));
		API api = new API();
		File file = new File("/Users/Jia/Desktop/2.JPG");
		FileInputStream fi = new FileInputStream(file);
		
//		System.out.println(fi.hashCode());
//		
//		byte[] ret = new byte[1024];
//		byte[] b = new byte[0];
//		int len = 0;
//		while ((len=fi.read(ret)) != -1)
//		{
//			byte[] r = new byte[len];
//			for (int i = 0; i < r.length; i ++) {
//				r[i] = ret[i];
//			}
//			b = APITest.concat(b, r);
//		}
//		System.out.println(b.length);
		Map<String, InputStream> m = new HashMap<String, InputStream>();
		m.put("zheshiwode", fi);
		UploadManager mgr = new UploadManager();
		String upToken = api.getQiniuToken("0fe8e0e7153fd24fb4d97b23031866125638488d");
//		mgr.put(fi, "zheshiwode", upToken);
//		
//		fi.close();
//		JSONObject d1 = new JSONObject();
//		d1.put("sn", "53468");
//		JSONObject d2 = new JSONObject();
//		d2.put("sn", "13227");
//		JSONArray devices = new JSONArray();
//		devices.put(d1);
//		devices.put(d2);
//		JSONObject dd = new JSONObject();
//		dd.put("devices", devices);
//		System.out.println(dd.toString());
	}
}
