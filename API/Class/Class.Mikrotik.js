// Date: 2024-04-13
// Creator: Indri
// Description: Class Mikrotik API for Version 7 and above

import axios from 'axios';


export default class Mikrotik {
    async getBras(data) {
        try {
            const response = await axios.get(data.api + '/user-manager/user', {
                headers: {
                    'Authorization': 'Basic ' + data.token,
                }
            });

            return response.data;

        }
        catch (error) {
            console.log(error)
            return error.response;
        }

    }

    async ActiveSession(data) {
        try {
           
            const response = await axios.post(data.api + 'user-manager/monitor', {once: true}, {
                headers: {
                    'Authorization': 'Basic ' + data.token,
                }
            });
            return response.data;

        }
        catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async getAllSessionActive(data) {
        try {
            const response = await axios.get(data.api + '/user-manager/session?active=true', {
                headers: {
                    'Authorization': 'Basic ' + data.token,
                }
            });

            return response.data;

        }
        catch (error) {
            console.log(error)
            return error.response;
        }
    }


    async getRouter(data) {
        try {
            const response = await axios.get(data.api + '/user-manager/router', {
                headers: {
                    'Authorization': 'Basic ' + data.token,
                }
            });

            return response.data;

        }
        catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async getGroup(data) {
        try {
            const response = await axios.get(data.api + '/user-manager/user/group', {
                headers: {
                    'Authorization': 'Basic ' + data.token,
                }
            });

            return response.data;

        }
        catch (error) {
            console.log(error)
            return error.response;
        }
    }



}