import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execCb);

export default class SnmpClass{

    async InterfacesList(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port}  1.3.6.1.2.1.31.1.1.1.1`);
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async ifOperStatus(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port}  1.3.6.1.2.1.2.2.1.8`);
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }


    async PonList(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port}  .1.3.6.1.4.1.3902.1012.3.13.1.1.2`);
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }
    

    async OnuName(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port}  .1.3.6.1.4.1.3902.1012.3.28.1.1.2`);
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async OnuDesc(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port}  .1.3.6.1.4.1.3902.1012.3.28.1.1.3.${id.interfaces} \n `);
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }


    async OnuModel(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port}  .1.3.6.1.4.1.3902.1012.3.50.11.2.1.9.${id.interfaces} \n `);
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async OnuFirmware(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port}  .1.3.6.1.4.1.3902.1012.3.50.11.2.1.2.${id.interfaces} \n `);
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async OnuDistance(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1012.3.11.4.1.2`);
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async OnuRx(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1012.3.50.12.1.1.10.${id.interfaces} \n `);
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async OnuTx(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1012.3.50.12.1.1.14.${id.interfaces} \n `);
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async OnuOltRx(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1015.1010.11.2.1.2.${id.interfaces} \n `);
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async OnuVendor(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1012.3.50.11.2.1.1.${id.interfaces} \n `);
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async OnuState(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1012.3.28.2.1.4.${id.interfaces} \n `);
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    //versi dari dokument zte
    async GponOnuMgmtSn(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1082.500.10.2.3.3.1.6`); //SN Onu
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async GponOnuMgmtName(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1082.500.10.2.3.3.1.2`); //SN Onu
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    } 
    async GponOnuMgmtDesc(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1082.500.10.2.3.3.1.3`); //SN Onu
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    } 
    async GponOnuPhaseStatus(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1082.500.10.2.3.8.1.4`); //{ logging ( 1 ) , los ( 2 ) , syncMib ( 3 ) , working ( 4 ) , dyingGasp ( 5 ) , authFailed ( 6 ) , offline ( 7 ) }
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async GponTcontIndex(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1082.500.10.2.3.4.1.2`); //Tcont Index
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async GponTcontBwPrfName(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1082.500.10.2.3.4.1.3`); //Tcont Name
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async GponGemPortName(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1082.500.10.2.3.5.1.2`); //Gemport id
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async GponGemPortDsTrafficPrf(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1082.500.10.2.3.5.1.11`); //Gemport Name
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async GponPortUserVid(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1082.110.5.2.2.1.8`); //Service Vlan List
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async GponRxOptLevel(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1082.500.1.2.4.2.1.2`); //RX Receiving Optical Power on the OLT Side
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async PonRxOpticalPower(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1082.500.20.2.2.2.1.10`); //RX Optical Power on the GPON ONU Side
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }

    async GponTxOptLevel(id) {
        try {
            const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1082.500.20.2.2.2.1.14`); //TX Optical Power on the GPON ONU Side
            if(stderr){
                throw new Error(stderr);
            }
           const data = stdout.split('\n').filter(Boolean);
           return data;

            return data;
        } catch (error) {
            console.log(error)
            return error.response;
        }
    }


}