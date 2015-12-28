package com.songshu.smarthome.api;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Map;

import org.apache.commons.io.IOUtils;

import com.qiniu.storage.Recorder;

public class DataRecorder implements Recorder{

	Map<String, byte[]> input;
	
	public DataRecorder(Map<String, byte[]> input) {
		this.input = input;
	}

	@Override
	public void del(String key) {
		if (this.input.get(key) != null) {
			this.input.remove(key);
		}
	}

	@Override
	public byte[] get(String key) {
        byte[] input = this.input.get(key);
        InputStream stream = new ByteArrayInputStream(input);
        byte[] data = new byte[input.length];
        int read = 0;
        try {
            read = stream.read(data);
        } catch (IOException e) {
            e.printStackTrace();
        }
        if (input != null) {
            try {
            	stream.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        if (read == 0) {
            return null;
        }
        return data;
	}

	@Override
	public void set(String key, byte[] data) {
		byte[] input = this.input.get(key);
		InputStream stream = new ByteArrayInputStream(input);
        OutputStream out = null;
        try {
        	out = new ByteArrayOutputStream();
        	IOUtils.copy(stream, out);
        	out.write(data);
        } catch (IOException e) {
            e.printStackTrace();
        }
        if (out != null) {
            try {
            	out.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
	}

}
