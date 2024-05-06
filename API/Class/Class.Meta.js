import axios from 'axios';

export default class Meta {
    constructor() {
        this.api = axios.create({
            baseURL: process.env.APIURL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.WHATSAPP_TOKEN
            }
        });
    }

    async sendMessage(data) {
        try {
            const response = await this.api.post(process.env.WHATSAPP_API_URL  + '/' +  process.env.WHATSAPP_PHONE_ID + '/messages', data);
            return response.data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }
}