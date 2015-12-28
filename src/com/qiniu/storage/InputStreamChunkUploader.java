package com.qiniu.storage;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.qiniu.common.Config;
import com.qiniu.common.QiniuException;
import com.qiniu.http.Client;
import com.qiniu.http.Response;
import com.qiniu.storage.model.ResumeBlockInfo;
import com.qiniu.util.Crc32;
import com.qiniu.util.StringMap;
import com.qiniu.util.StringUtils;
import com.qiniu.util.UrlSafeBase64;
import com.songshu.smarthome.UploadSttatusManager;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import java.util.Map;

import static java.lang.String.format;

/**
 * 分片上传 文档：<a href=
 * "http://developer.qiniu.com/docs/v6/api/overview/up/chunked-upload.html">分片上传
 * </a>
 * <p/>
 * 分片上传通过将一个文件分割为固定大小的块(4M)，然后再将每个块分割为固定大小的片，每次
 * 上传一个分片的内容，等待所有块的所有分片都上传完成之后，再将这些块拼接起来，构成一个
 * 完整的文件。另外分片上传还支持纪录上传进度，如果本次上传被暂停，那么下次还可以从上次 上次完成的文件偏移位置，继续开始上传，这样就实现了断点续传功能。
 * <p/>
 * 分片上传在网络环境较差的情况下，可以有效地实现大文件的上传。
 */
final class InputStreamChunkUploader {

	private final String upToken;
	private final String key;
	private final long size;
	private final StringMap params;
	private final String mime;
	private final String[] contexts;
	private final Client client;
	private byte[] blockBuffer;
	private final byte[] chunkBuffer;
	private InputStream stream;
	private String host;
	private String filePath;
	private long crc32;

	InputStreamChunkUploader(Client client, String upToken, String key, InputStream stream, StringMap params,
			String mime, long fileSize, String filePath) throws IOException {

		this.client = client;
		this.upToken = upToken;
		this.key = key;
		this.stream = stream;
		this.size = fileSize;
		this.params = params;
		this.mime = mime == null ? Client.DefaultMime : mime;
		this.host = Config.zone.upHost;
		long count = (size + Config.BLOCK_SIZE - 1) / Config.BLOCK_SIZE;
		this.contexts = new String[(int) count];
		this.blockBuffer = new byte[Config.BLOCK_SIZE];
		this.chunkBuffer = new byte[Config.CHUNK_SIZE];
		this.filePath = filePath;
	}
	
	public Response upload() throws QiniuException {
		long uploaded = 0;

		boolean retry = false;
		int len = 0;
		while (uploaded < size) {
			UploadSttatusManager.getInstance().UpdateTaskStatus(filePath, UploadSttatusManager.STATUS_CODE_UPLOADING,
					UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_UPLOADING),
					(int) (uploaded * 100.0 / size));
			System.out.println("已上传:" + uploaded);

			int blockSize = calcBlockSize(uploaded);
			int chunkSize = calcPutSize(uploaded);

			System.out.println("blockSize:" + blockSize + "	chunkSize:" + chunkSize);
			
			if (size > Config.BLOCK_SIZE) {
				if (uploaded % Config.BLOCK_SIZE == 0) {
					try {
						byte[] file = new byte[0];
						byte[] ret = new byte[1024];
						int readsize = 1024;
						while (file.length < blockSize) {
							readsize = (blockSize - file.length) > 1024 ? 1024 : (blockSize - file.length);
							len = stream.read(ret, 0, readsize);
							byte[] r = new byte[len];
							for (int i = 0; i < r.length; i++) {
								r[i] = ret[i];
							}
							file = concat(file, r);
						}
						
						for (int i = 0; i < file.length; i++) {
							blockBuffer[i] = file[i];
						}
						
					} catch (IOException e) {
						close();
						UploadSttatusManager.getInstance().UpdateTaskStatus(filePath, UploadSttatusManager.STATUS_CODE_NETWORK,
								UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_NETWORK),
								0);
						throw new QiniuException(e);
					}	
				}
				
				for (int i = 0; i < chunkSize; i++) {
					chunkBuffer[i] = blockBuffer[(int) (i + uploaded % Config.BLOCK_SIZE)];
				}	
			} else {
				try {
					byte[] file = new byte[0];
					byte[] ret = new byte[1024];
					int readsize = 1024;
					while (file.length < chunkSize) {
						readsize = (chunkSize - file.length) > 1024 ? 1024 : (chunkSize - file.length);
						len = stream.read(ret, 0, readsize);
						byte[] r = new byte[len];
						for (int i = 0; i < r.length; i++) {
							r[i] = ret[i];
						}
						file = concat(file, r);
					}
					
					for (int i = 0; i < file.length; i++) {
						chunkBuffer[i] = file[i];
					}
					
				} catch (IOException e) {
					close();
					UploadSttatusManager.getInstance().UpdateTaskStatus(filePath, UploadSttatusManager.STATUS_CODE_NETWORK,
							UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_NETWORK),
							0);
					throw new QiniuException(e);
				}	
			}
			
			
			if (uploaded % Config.BLOCK_SIZE == 0) {
				Response response = null;
				try {
					response = makeBlock(chunkBuffer, blockSize, chunkSize);
				} catch (QiniuException e) {
					Response response2 = e.response;
					System.out.println(response2);
					try {
						System.out.println(response.bodyString());
					} catch (Exception e2) {
						e2.printStackTrace();
					}

					if (e.code() < 0) {
						host = Config.zone.upHostBackup;
					}
					if (e.response == null || e.response.needRetry()) {
						retry = true;
					} else {
						close();
						UploadSttatusManager.getInstance().UpdateTaskStatus(filePath,
								UploadSttatusManager.STATUS_CODE_TIMEOUT,
								UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_TIMEOUT), 0);
						throw e;
					}
				}

				int retryCount = 3;
				while (retry && retryCount > 0) {
					retryCount--;
					try {
						response = makeBlock(chunkBuffer, blockSize, chunkSize);
						retry = false;
					} catch (QiniuException e) {
						if (retryCount == 0) {
							UploadSttatusManager.getInstance().UpdateTaskStatus(filePath,
									UploadSttatusManager.STATUS_CODE_TIMEOUT,
									UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_TIMEOUT), 0);
						}

						if (e.code() < 0) {
							host = Config.zone.upHostBackup;
						}

						if (e.response == null || e.response.needRetry()) {
							retry = true;
						} else {
							retry = false;
							close();
							UploadSttatusManager.getInstance().UpdateTaskStatus(filePath,
									UploadSttatusManager.STATUS_CODE_TIMEOUT,
									UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_TIMEOUT), 0);
							throw e;
						}
					}
				}

				ResumeBlockInfo blockInfo = response.jsonToObject(ResumeBlockInfo.class);
				contexts[(int) (uploaded / Config.BLOCK_SIZE)] = blockInfo.ctx;
				uploaded += chunkSize;
				continue;
			}

			Response response = null;
			String context = contexts[(int) (uploaded / Config.BLOCK_SIZE)];
			try {
				response = putChunk(uploaded, chunkBuffer, chunkSize, context);
			} catch (QiniuException e) {
				System.out.println("------------->" + e.response.statusCode);
				e.printStackTrace();
				if (e.code() < 0) {
					host = Config.zone.upHostBackup;
				}
				if (e.response == null || e.response.needRetry()) {
					retry = true;
				} else {
					close();
					UploadSttatusManager.getInstance().UpdateTaskStatus(filePath,
							UploadSttatusManager.STATUS_CODE_TIMEOUT,
							UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_TIMEOUT), 0);
					throw e;
				}
			}

			int retryCount = 3;
			while (retry && retryCount > 0) {
				retryCount--;
				try {
					response = putChunk(uploaded, chunkBuffer, chunkSize, context);
					retry = false;
				} catch (QiniuException e) {
					System.out.println("------------->" + e.response.statusCode);
					if (retryCount == 0) {
						UploadSttatusManager.getInstance().UpdateTaskStatus(filePath,
								UploadSttatusManager.STATUS_CODE_TIMEOUT,
								UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_TIMEOUT), 0);
					}

					if (e.code() < 0) {
						host = Config.zone.upHostBackup;
					}

					if (e.response == null || e.response.needRetry()) {
						retry = true;
					} else {
						retry = false;
						close();
						UploadSttatusManager.getInstance().UpdateTaskStatus(filePath,
								UploadSttatusManager.STATUS_CODE_TIMEOUT,
								UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_TIMEOUT), 0);
						throw e;
					}
				}
			}

			ResumeBlockInfo blockInfo = response.jsonToObject(ResumeBlockInfo.class);
			contexts[(int) (uploaded / Config.BLOCK_SIZE)] = blockInfo.ctx;
			uploaded += chunkSize;
			UploadSttatusManager.getInstance().UpdateTaskStatus(filePath, UploadSttatusManager.STATUS_CODE_UPLOADING,
					UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_UPLOADING),
					(int) (uploaded * 100.0 / size));
		}
		close();

		try {
			return makeFile();
		} catch (QiniuException e) {
			e.printStackTrace();
			try {
				return makeFile();
			} catch (QiniuException e1) {
				e1.printStackTrace();
				UploadSttatusManager.getInstance().UpdateTaskStatus(filePath, UploadSttatusManager.STATUS_CODE_NETWORK,
						UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_NETWORK),
						0);
				throw e1;
			}
		} finally {
		}
	}
	
	private void close() {
		try {
			stream.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private byte[] concat(byte[] a, byte[] b) {
		byte[] c = new byte[a.length + b.length];
		System.arraycopy(a, 0, c, 0, a.length);
		System.arraycopy(b, 0, c, a.length, b.length);
		return c;
	}

	/**
	 * 创建块，并上传第一个分片内容
	 *
	 * @param address
	 *            上传主机
	 * @param offset
	 *            本地文件偏移量
	 * @param blockSize
	 *            分块的块大小
	 * @param chunkSize
	 *            分片的片大小
	 * @param progress
	 *            上传进度
	 * @param _completionHandler
	 *            上传完成处理动作
	 */
	private Response makeBlock(byte[] chunkBuffer, int blockSize, int chunkSize) throws QiniuException {
		String path = format(Locale.ENGLISH, "/mkblk/%d", blockSize);
		this.crc32 = Crc32.bytes(chunkBuffer, 0, chunkSize);
		String url = host + path;

		System.out.println("[makeBlock] url: " + url + " chunkSize: " + chunkSize + "chunckBuffer: " + chunkBuffer);
		return post(url, chunkBuffer, 0, chunkSize);
	}

	private Response putChunk(long offset, byte[] chunkBuffer, int chunkSize, String context) throws QiniuException {
		int chunkOffset = (int) (offset % Config.BLOCK_SIZE);
		String path = format(Locale.ENGLISH, "/bput/%s/%d", context, chunkOffset);
		String url = host + path;

		this.crc32 = Crc32.bytes(chunkBuffer, 0, chunkSize);

		System.out.println("[putChunk] url: " + url + " chunkSize: " + chunkSize + "chunckBuffer: " + chunkBuffer);
		return post(url, chunkBuffer, 0, chunkSize);
	}

	private Response makeFile() throws QiniuException {
		String url = fileUrl();
		String s = StringUtils.join(contexts, ",");
		System.out.println("[makeFile] url: " + url + " s: " + s);
		return post(url, StringUtils.utf8Bytes(s));
	}

	private String fileUrl() {
		String url = host + "/mkfile/" + size + "/mimeType/" + UrlSafeBase64.encodeToString(mime);
		final StringBuilder b = new StringBuilder(url);
		if (key != null) {
			b.append("/key/");
			b.append(UrlSafeBase64.encodeToString(key));
		}
		if (params != null) {
			params.forEach(new StringMap.Consumer() {
				@Override
				public void accept(String key, Object value) {
					b.append("/");
					b.append(key);
					b.append("/");
					b.append(value);
				}
			});
		}
		return b.toString();
	}

	private Response post(String url, byte[] data) throws QiniuException {
		return client.post(url, data, new StringMap().put("Authorization", "UpToken " + upToken));
	}

	private Response post(String url, byte[] data, int offset, int size) throws QiniuException {
		return client.post(url, data, offset, size, new StringMap().put("Authorization", "UpToken " + upToken),
				Client.DefaultMime);
	}

	private int calcPutSize(long offset) {
		long left = size - offset;
		return (int) (left < Config.CHUNK_SIZE ? left : Config.CHUNK_SIZE);
	}

	private int calcBlockSize(long offset) {
		long left = size - offset;
		return (int) (left < Config.BLOCK_SIZE ? left : Config.BLOCK_SIZE);
	}
}
