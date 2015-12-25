/**
 * 
 */
package com.songshu.smarthome.driver;

import org.json.JSONObject;

import com.huawei.smarthome.api.exception.ActionException;
import com.huawei.smarthome.driver.IDeviceService;
import com.huawei.smarthome.driver.ip.IIPDeviceDriver;

/**
 * <div class="English"> </div><br>
 * <br>
 * <div class="Chinese"> </div><br>
 * <br>
 * @author Hong Cai
 * @since Openlife SDK 1.0 2015-12-9
 */
public class GalleryDeviceDriver implements IIPDeviceDriver
{
    private IDeviceService deviceService;

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
    public JSONObject doAction(String sn, String action, JSONObject parameter, String deviceClass)
            throws ActionException
    {
        // TODO Auto-generated method stub
        return null;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void init()
    {
        // TODO Auto-generated method stub

    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void destroy()
    {
        // TODO Auto-generated method stub

    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void onUserDeviceAdd(String sn, JSONObject data)
    {
        // TODO Auto-generated method stub

    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void onUserDeviceDel(String sn)
    {
        // TODO Auto-generated method stub

    }

}
