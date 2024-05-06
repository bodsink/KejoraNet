import axios from 'axios';

export default class Acs {

   
    async getOnu(id) {
        try {
           
            const headers = {
                'CF-Access-Client-Id': id.client,
                'CF-Access-Client-Secret': id.secret,
                'Content-Type': 'application/json',
            }

            const response = await axios.get(id.url  + '/devices/?query={"_deviceId._SerialNumber": "' + id.sn + '"}', { headers: headers }).then(data => data);
            return response.data;

        }
        catch (error) {
            console.log(error)
            throw error.response;
        }
    }


    async Summon(id) {
        try {
           
            const headers = {
                'CF-Access-Client-Id': id.client,
                'CF-Access-Client-Secret': id.secret,
                'Content-Type': 'application/json',
            }

            const response = await axios.post(id.url  + `/devices/${id.onu}/tasks?timeout=50&connection_request`, id.data, { headers: headers }).then(data => data);
            return response.data;

        }
        catch (error) {
            console.log(error)
            throw error.response;
        }
    }




};