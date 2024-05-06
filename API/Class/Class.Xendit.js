import axios from 'axios';


export default class Xendit {
    constructor() {
        this.api = axios.create({
            baseURL: 'https://api.xendit.co',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${process.env.xendit_key}`
            }
        });
    }

    async cekSaldo() {
        try {
            const response = await this.api.get('/balance').then(data=>data);
            return response.data;
        }
        catch (err) {
            throw err;
        }
    }

    async transactionList() {
        try {
            const response = await this.api.get('/transactions').then(data=>data);
            return response.data;
        }
        catch (err) {
            throw err;
        }
    }

    async createVirtualAccount(data) {
        try {
            const response = await this.api.post('/callback_virtual_accounts', data).then(data=>data);
            return response.data;
        }
        catch (err) {
            throw err;
        }
    }

};