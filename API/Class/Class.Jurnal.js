import axios from 'axios';

export default class Jurnal {
    constructor() {
        this.api = axios.create({
            baseURL: 'https://api.jurnal.id',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.jurnal_key}`

            }
        });
    }

    async getInvoice(id){
        try {
            const response = await this.api.get(process.env.jurnalL_url + '/sales_lists' + id);
            return response.data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }




};

