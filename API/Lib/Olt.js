import TelnetClient from '../Class/Class.Telnet.js';



export default class libOlt {
    async getOnu(id) {
        try {
           
            const telnet = new TelnetClient();
            
            telnet.username = id.username;
            telnet.password = id.password;
            telnet.hostname = id.hostname;
            telnet.host = id.host;
            telnet.port = id.port;
            
          
            const conn = await telnet.Login();

           

            const getConf = async () => {
                const onu = await conn.send(`show running-config interface ${id.onu} \n show onu running config ${id.onu}`);
                await conn.end();

                const removeString = onu.replace(`show running-config interface ${id.onu}`, '').replace('Building configuration...', '').replace('\r', '').replace('end', '').replace('\n', '').replace(id.hostname + `# show onu running config ${id.onu}`, '').replace(id.hostname + `#`, '').trim();

                const splitString = removeString.split('\n').filter(Boolean);

                const removeNewLine = splitString.map((item) => {
                    return item.replace('\r', '').trim();
                });

                return removeNewLine;

            };


            

            const [onu] = await Promise.all([getConf()]);

          
            
            return onu;



           





            // return onu;
        }
        catch (error) {
            throw error;
        }
    }

}