package com.songshu.smarthome.demo;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintStream;
import java.net.Socket;
import org.json.JSONObject;

public class Client {

	public static void main(String args[]) throws Exception {
		try {
            Socket socket = new Socket("192.168.8.16", 12080);
            
            JSONObject data = new JSONObject();
            data.put("client_id", "297b49c9571a8aee51e2");
            data.put("client_secret", "32104aefe54d33a71696bb13bfcc50f75b91fd1c");

            OutputStream out = socket.getOutputStream();
            PrintStream printStream = new PrintStream(socket.getOutputStream());
            printStream.println(data.toString());
            printStream.flush();

            BufferedReader bff = new BufferedReader(new InputStreamReader(
                    socket.getInputStream()));
            String line = null;

            String buffer = "";

            while ((line = bff.readLine()) != null) {
                buffer = line + buffer;
            }
            
            System.out.println(buffer);


            out.close();
            bff.close();
            socket.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
	}

}
