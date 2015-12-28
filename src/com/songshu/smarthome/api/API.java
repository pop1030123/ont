package com.songshu.smarthome.api;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintStream;
import java.io.UnsupportedEncodingException;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.Socket;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Enumeration;
import java.util.UUID;

import org.json.JSONObject;

import com.huawei.smarthome.proxy.log.LogService;
import com.huawei.smarthome.proxy.log.LogServiceFactory;
import com.qiniu.storage.InputStreamUploader;
import com.qiniu.storage.UploadManager;
import com.songshu.smarthome.UploadSttatusManager;
import com.squareup.okhttp.MediaType;
import com.squareup.okhttp.MultipartBuilder;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.RequestBody;
import com.squareup.okhttp.Response;

public class API {

	private final static LogService logger = LogServiceFactory.getLogService(API.class);

	public static final String HOST = "http://api.songshu.cc";

	public static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

	public static final int DEVICE_PORT = 12080;
	public static final String CLIENT_ID = "297b49c9571a8aee51e2";
	public static final String CLIENT_SECRET = "32104aefe54d33a71696bb13bfcc50f75b91fd1c";

	public static final String HUAWEI_NETWORK_INTERFACE_NAME = "br0";

	public JSONObject getDeviceInfo(String ip, String networkInterfaceName) {
		logger.i("#API#获取设备信息");
		JSONObject res = null;
		Socket socket = null;
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
						socket = new Socket();
						socket.bind(new InetSocketAddress(adr, 0));
						socket.connect(new InetSocketAddress(ip, 12080), 15 * 1000);
						break;
					} catch (Exception e) {
						e.printStackTrace();
						logger.e(e.getMessage(), e);
					}
				}
			}

			JSONObject data = new JSONObject();
			data.put("client_id", CLIENT_ID);
			data.put("client_secret", CLIENT_SECRET);

			OutputStream out = socket.getOutputStream();
			PrintStream printStream = new PrintStream(socket.getOutputStream());
			printStream.println(data.toString());
			printStream.flush();

			BufferedReader bff = new BufferedReader(new InputStreamReader(socket.getInputStream()));
			String line = null;

			String buffer = "";

			while ((line = bff.readLine()) != null) {
				buffer = line + buffer;
			}

			out.close();
			bff.close();
			socket.close();

			res = new JSONObject(buffer);
		} catch (Exception e) {
			logger.i(e.toString());
			return null;
		}
		return res;
	}

	public String getAuthToken(String sn) {
		JSONObject data = new JSONObject();
		try {
			data.put("client_id", CLIENT_ID);
			data.put("client_secret", CLIENT_SECRET);
			data.put("grant_type", "password");
			data.put("username", sn);
			data.put("password", password(sn));

			String url = API.HOST + "/oauth2/access_token";

			String res = post(url, data);
			return new JSONObject(res).getJSONObject("data").getString("access_token");
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return "";
		}
	}

	public String getFamilyOAuthToken(String familyId) {
		JSONObject data = new JSONObject();
		try {
			data.put("client_id", CLIENT_ID);
			data.put("client_secret", CLIENT_SECRET);
			data.put("grant_type", "password");
			data.put("username", familyId);
			data.put("password", "huawei");

			String url = API.HOST + "/oauth2/access_token";

			String res = post(url, data);
			return new JSONObject(res).getJSONObject("data").getString("access_token");
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return "";
		}
	}

	/**
	 * POST /qiniu/uptoken
	 * 
	 * @param sn
	 * @return
	 */
	public String getQiniuToken(String token) {
		String url = API.HOST + "/qiniu/uptoken";

		try {
			String res = post(url, "{}", token);
			return new JSONObject(res).getString("data");
		} catch (IOException e) {
			e.printStackTrace();
			return "";
		}
	}

	public String uploadFile(String token, File file) {
		try {
			UploadManager mgr = new UploadManager();
			String key = Utils.fileMD5(file.getAbsolutePath());
			com.qiniu.http.Response res = mgr.put(file, key, token);
			if (res.statusCode == 200) {
				logger.i("文件成功上传到七牛:" + key);
				return key;
			}
			return null;
		} catch (Exception e) {
			logger.i(e.getMessage());
			return null;
		}
	}

	public String uploadFile(String token, byte[] data) {
		try {
			UploadManager mgr = new UploadManager();
			String key = UUID.randomUUID().toString();
			com.qiniu.http.Response res = mgr.put(data, key, token);
			if (res.statusCode == 200) {
				logger.i("文件成功上传到七牛:" + key);
				return key;
			}
			return null;
		} catch (Exception e) {
			logger.i(e.getMessage());
			return null;
		}
	}

	public void uploadFile(final String sn, final String songshuToken, final String token, final InputStream stream, final long fileSize,
			final String filePath) {
		logger.i("****------------->uploadFile sn:" + sn + "	filePath:" + filePath);
		new Thread() {
			@Override
			public void run() {
				long start = System.currentTimeMillis();

				if (fileSize == 0) {
					UploadSttatusManager.getInstance().UpdateTaskStatus(filePath,
							UploadSttatusManager.STATUS_CODE_FILESIZE_ZERO,
							UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_FILESIZE_ZERO), 0);
				}

				try {
					UploadManager mgr = new UploadManager();
					String key = UUID.randomUUID().toString();
					com.qiniu.http.Response res = mgr.put(stream, key, token, fileSize, filePath);
					if (res.statusCode == 200) {
						logger.i("文件成功上传到七牛:" + key);

						JSONObject body = new JSONObject();
						body.put("ids", sn);
						body.put("photo", key);
						body.put("slug", key);

						moments(body, songshuToken);

						UploadSttatusManager.getInstance().UpdateTaskStatus(filePath,
								UploadSttatusManager.STATUS_CODE_SUCESS,
								UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_SUCESS), 100);
					}
				} catch (Exception e) {
					logger.i(e.getMessage());
				}

				logger.i("上传图片耗时:" + (System.currentTimeMillis() - start) + " ms");
			}
		}.start();
	}

	public String moments(JSONObject params, String token) {
		logger.i("moments:" + params + "	token:" + token);
		String url = API.HOST + "/user/moment/pic";
		try {
			String res = post(url, params, token);
			return res;
		} catch (IOException e) {
			logger.i("moments:" + e.getMessage());
			return "";
		}
	}

	public String auth(String data) {
		logger.i("Auth api");
		String url = API.HOST + "/huawei/auth";
		try {
			String res = post(url, data);
			logger.i(res);
			return res;
		} catch (IOException e) {
			logger.i(e.getMessage());
			return "";
		}
	}

	public String device(String data) {
		String url = API.HOST + "/huawei/device";
		try {
			String res = post(url, data);
			return res;
		} catch (IOException e) {
			logger.i(e.getMessage());
			return "";
		}
	}

	public String contacts(String data, String token) {
		String url = API.HOST + "/huawei/contacts";
		try {
			String res = post(url, data, token);
			return res;
		} catch (IOException e) {
			logger.i(e.getMessage());
			return "";
		}
	}

	public boolean uploadFile(String path) {
		return true;
	}

	private static String stringToMD5(String string) {
		byte[] hash;

		try {
			hash = MessageDigest.getInstance("MD5").digest(string.getBytes("UTF-8"));
		} catch (NoSuchAlgorithmException e) {
			e.printStackTrace();
			return null;
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
			return null;
		}

		StringBuilder hex = new StringBuilder(hash.length * 2);
		for (byte b : hash) {
			if ((b & 0xFF) < 0x10)
				hex.append("0");
			hex.append(Integer.toHexString(b & 0xFF));
		}

		return hex.toString();
	}

	private String subPassword(String password) {
		if (password.length() <= 16)
			return password;
		return password.substring(8, password.length() - 8);
	}

	private String password(String sn) {
		String password = "";

		for (int i = 0; i < sn.length(); i++) {
			password = stringToMD5(subPassword(password) + sn.charAt(i));
			if ("".equals(password) || password == null) {
				password = "";
			}
		}

		return subPassword(password);
	}

	String run(String url, String token) throws IOException {
		OkHttpClient client = new OkHttpClient();

		Request request = new Request.Builder().url(url).header("Authorization", "Bearer " + token).build();

		Response response = client.newCall(request).execute();
		return response.body().string();
	}

	String post(String url, JSONObject json) throws IOException {
		OkHttpClient client = new OkHttpClient();

		MultipartBuilder mb = new MultipartBuilder();
		for (String key : json.keySet()) {
			mb.addFormDataPart(key, json.getString(key));
		}
		mb.type(MediaType.parse("multipart/form-data"));
		RequestBody body = mb.build();
		Request request = new Request.Builder().url(url).post(body).build();

		Response response = client.newCall(request).execute();
		return response.body().string();
	}

	String post(String url, JSONObject json, String token) throws IOException {
		OkHttpClient client = new OkHttpClient();

		MultipartBuilder mb = new MultipartBuilder();
		for (String key : json.keySet()) {
			mb.addFormDataPart(key, json.getString(key));
		}
		mb.type(MediaType.parse("multipart/form-data"));
		RequestBody body = mb.build();
		Request request = new Request.Builder().url(url).header("Authorization", "Bearer " + token).post(body).build();
		Response response = client.newCall(request).execute();
		return response.body().string();
	}

	String post(String url, String json, String token) throws IOException {
		OkHttpClient client = new OkHttpClient();
		RequestBody body = RequestBody.create(JSON, json);
		Request request = new Request.Builder().url(url).addHeader("Authorization", "Bearer " + token).post(body)
				.build();
		Response response = client.newCall(request).execute();
		return response.body().string();
	}

	String post(String url, String json) throws IOException {
		OkHttpClient client = new OkHttpClient();
		RequestBody body = RequestBody.create(JSON, json);
		Request request = new Request.Builder().url(url).post(body).build();
		Response response = client.newCall(request).execute();
		return response.body().string();
	}
}
