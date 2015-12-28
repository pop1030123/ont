package com.qiniu.storage;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collection;
import java.util.HashMap;
import java.util.Timer;
import java.util.TimerTask;

import com.qiniu.common.Config;
import com.qiniu.common.QiniuException;
import com.qiniu.http.Client;
import com.qiniu.http.Response;
import com.qiniu.storage.model.ResumeBlockInfo;
import com.qiniu.util.StringMap;
import com.qiniu.util.StringUtils;
import com.qiniu.util.UrlSafeBase64;
import com.songshu.smarthome.UploadSttatusManager;
import com.songshu.smarthome.UploadTaskStatus;

/**
 * 分片上传 文档：<a href=
 * "http://developer.qiniu.com/docs/v6/api/overview/up/chunked-upload.html">
 * 分片上传</a>
 * <p/>
 * 分片上传通过将一个文件分割为固定大小的块(4M)，每次上传一个块的内容（服务端只分块，没有分片）。
 * 等待所有块都上传完成之后，再将这些块拼接起来，构成一个完整的文件。 另外分片上传还支持纪录上传进度，如果本次上传被暂停，那么下次还可以从上次
 * 上次完成的文件偏移位置，继续开始上传，这样就实现了断点续传功能。
 * <p/>
 * 服务端网络较稳定，较大文件（如500M以上）才需要将块记录保存下来。 小文件没有必要，可以有效地实现大文件的上传。
 */
public final class InputStreamUploader {
	private final String upToken;
	private final String key;
	private final long size;
	private final StringMap params;
	private final String mime;
	private final String[] contexts;
	private final Client client;
	private byte[] blockBuffer;
	private InputStream stream;
	private String host;
	private String filePath;

	InputStreamUploader(Client client, String upToken, String key, InputStream stream, StringMap params, String mime,
			long fileSize, String filePath) throws IOException {

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
		this.filePath = filePath;
	}

	public Response upload() throws QiniuException {
		long uploaded = 0;

		boolean retry = false;
		int contextIndex = 0;
		int len = 0;
		while (uploaded < size) {
			UploadSttatusManager.getInstance().UpdateTaskStatus(filePath, UploadSttatusManager.STATUS_CODE_UPLOADING,
					UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_UPLOADING),
					(int) (uploaded * 100.0 / size));
			System.out.println("已上传:" + uploaded);
			int blockSize = nextBlockSize(uploaded);
			System.out.println("blockSize:" + blockSize);
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
				UploadSttatusManager.getInstance().UpdateTaskStatus(filePath, UploadSttatusManager.STATUS_CODE_ERROR,
						UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_ERROR) + e.getMessage(),
						0);
				throw new QiniuException(e);
			}

			// long crc = Crc32.bytes(blockBuffer, 0, blockSize);
			Response response = null;
			try {
				response = makeBlock(blockBuffer, blockSize);
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
					throw e;
				}
			}

			int retryCount = 3;
			while (retry && retryCount > 0) {
				retryCount--;
				try {
					response = makeBlock(blockBuffer, blockSize);
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
						throw e;
					}
				}
			}

			ResumeBlockInfo blockInfo = response.jsonToObject(ResumeBlockInfo.class);
			// TODO check return crc32
			// if blockInfo.crc32 != crc{}

			contexts[contextIndex++] = blockInfo.ctx;
			uploaded += blockSize;
			UploadSttatusManager.getInstance().UpdateTaskStatus(filePath, UploadSttatusManager.STATUS_CODE_UPLOADING,
					UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_UPLOADING),
					(int) (uploaded * 100.0 / size));
		}
		close();

		try {
			return makeFile();
		} catch (QiniuException e) {
			try {
				return makeFile();
			} catch (QiniuException e1) {
				UploadSttatusManager.getInstance().UpdateTaskStatus(filePath, UploadSttatusManager.STATUS_CODE_ERROR,
						UploadSttatusManager.statusCode.get(UploadSttatusManager.STATUS_CODE_ERROR) + e.getMessage(),
						0);
				throw e1;
			}
		} finally {
		}
	}

	private byte[] concat(byte[] a, byte[] b) {
		byte[] c = new byte[a.length + b.length];
		System.arraycopy(a, 0, c, 0, a.length);
		System.arraycopy(b, 0, c, a.length, b.length);
		return c;
	}

	private Response makeBlock(byte[] block, int blockSize) throws QiniuException {
		String url = host + "/mkblk/" + blockSize;
		return post(url, block, 0, blockSize);
	}

	private void close() {
		try {
			stream.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
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

	private Response makeFile() throws QiniuException {
		String url = fileUrl();
		String s = StringUtils.join(contexts, ",");
		return post(url, StringUtils.utf8Bytes(s));
	}

	private Response post(String url, byte[] data) throws QiniuException {
		return client.post(url, data, new StringMap().put("Authorization", "UpToken " + upToken));
	}

	private Response post(String url, byte[] data, int offset, int size) throws QiniuException {
		return client.post(url, data, offset, size, new StringMap().put("Authorization", "UpToken " + upToken),
				Client.DefaultMime);
	}

	private int nextBlockSize(long uploaded) {
		if (size < uploaded + Config.BLOCK_SIZE) {
			return (int) (size - uploaded);
		}
		return Config.BLOCK_SIZE;
	}
}
