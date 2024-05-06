import {Telnet} from 'telnet-client';


export default class TelnetClient {
    constructor() {
        this.telnet = new Telnet();
        this.username = '';
        this.password = '';;
        this.hostname = '';
        this.host = '';
        this.port = '';
    }

    async Login() {
        try {
            await this.telnet.connect({
                host: this.host,
                port: this.port,
                shellPrompt: this.hostname  + '#', // hostname kemudian karakter setelah hostname
                timeout: 3500,
                loginPrompt: 'Username:',
                passwordPrompt: 'Password:',
                username: this.username,
                password: this.password,
                failedLoginMatch: '%Error 20209: No username or bad password',
            });
            return this.telnet;
        }
        catch (error) {
            throw error;
        }
    }

    
}