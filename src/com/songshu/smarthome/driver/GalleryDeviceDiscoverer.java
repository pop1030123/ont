package com.songshu.smarthome.driver;

import java.util.Timer;

import org.json.JSONObject;

import com.huawei.smarthome.driver.IDeviceService;
import com.huawei.smarthome.driver.ip.AbstractIPDiscoverer;
import com.huawei.smarthome.log.LogService;
import com.huawei.smarthome.log.LogServiceFactory;
import com.songshu.smarthome.PutDeviceTask;

/**
 * <div class="English"> </div><br>
 * <br>
 * <div class="Chinese"> </div><br>
 * <br>
 * @author Hong Cai
 * @since Openlife SDK 1.0 2015-12-9
 */
public class GalleryDeviceDiscoverer extends AbstractIPDiscoverer
{
    private IDeviceService deviceService;

    private static final LogService log = LogServiceFactory.getLogService(GalleryDeviceDiscoverer.class);

    /**
     * {@inheritDoc}
     */
    @Override
    public void doConfig(String commmand, JSONObject params)
    {
        log.d("GalleryDeviceDiscoverer doConfig");

    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void setDeviceService(IDeviceService deviceService)
    {
        this.deviceService = deviceService;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void discover(JSONObject deviceIpInfo)
    {
        log.d("GalleryDeviceDiscoverer deviceIpInfo={}, localIP={}", deviceIpInfo.toString(), getLocalIpAddress()
                .toString());
        //判断设备是否已经入网
        JSONObject device = deviceService.getDevice(deviceIpInfo.optString("MAC"));
        
        //没有入网，则判断设备是否是驱动管理的设备
        if (null == device)
        {
        	new Timer().schedule(new PutDeviceTask(deviceService, log, deviceIpInfo, getLocalIpAddress().toString()), 3000);
        }
    }
}
