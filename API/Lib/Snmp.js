import { exec as execCb } from "node:child_process";
import { parse } from "node:path";
import { promisify } from "node:util";
const exec = promisify(execCb);

function hex(str) {
    return Buffer.from(str, 'hex').toString('utf8');
}


export default class libSnmp {

    async SystemInformation(id) {
        try {

            const sysDescr = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-MIB::sysDescr`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                let sys = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-MIB::sysDescr.0', '').replace('=', '').replace('STRING:', '').trim().split('.').filter(Boolean);
            
                    sys.push({
                        sysDescr: splitName[0]
                    });
                }

                return sys;
                
            }

            const sysUpTimeInstance = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} DISMAN-EVENT-MIB::sysUpTimeInstance`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                let sys = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('DISMAN-EVENT-MIB::sysUpTimeInstance', '').replace('=', '').replace('Timeticks:', '').trim().split('.').filter(Boolean);
            
                    sys.push({
                        sysUpTimeInstance: splitName[0]
                    });
                }

                return sys;
                
            }

            const sysContact = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-MIB::sysContact`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                let sys = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-MIB::sysContact.0 ', '').replace('=', '').replace('STRING:', '').trim()
                    sys.push({
                        sysContact: splitName
                    });
                }

                return sys;
                
            }

            const sysName = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-MIB::sysName`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                let sys = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-MIB::sysName.0 ', '').replace('=', '').replace('STRING:', '').trim()
                    sys.push({
                        sysName: splitName
                    });
                }

                return sys;
                
            }

            const sysLocation = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-MIB::sysLocation`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                let sys = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-MIB::sysLocation.0 ', '').replace('=', '').replace('STRING:', '').trim()
                    sys.push({
                        sysLocation: splitName
                    });
                }

                return sys;
                
            }

            const [desc, uptime, contact, name, location] = await Promise.all([sysDescr(), sysUpTimeInstance(), sysContact(), sysName(), sysLocation()]);

            return desc.map((item, index) => {
                return {
                    ...item,
                    sysDescr: desc[index].sysDescr,
                    sysUpTimeInstance: uptime[index].sysUpTimeInstance,
                    sysContact: contact[index].sysContact,
                    sysName: name[index].sysName,
                    sysLocation: location[index].sysLocation,
                }
            });
           

        }
        catch (error) {
            throw error;
        }
    };//get system device

    async scanOnu(id) {
        try {

            if (id.int_olt === undefined) {
                id.int_olt = '';
            } else {
                id.int_olt = `.${id.int_olt}`
            }



            // const scanSN = async () => {
            //     const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1082.500.10.2.3.3.1.6${id.int_olt}`);
            //     if (stderr) throw new Error(stderr);

            //     const onuName = stdout.split('\n').filter(Boolean);

            //     let onu = [];

            //     for (let i = 0; i < onuName.length; i++) {
            //         const splitName = onuName[i].split('STRING:'); //array 0=id 2=name
            //         const splitInterfaces = splitName[0].split('=')[0]; //
            //         const replaceInterfaces = splitInterfaces.replace('SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.3.1.6.', '').trim();
            //         const arrayInterfaces = replaceInterfaces.split('.').filter(Boolean); //array 0=interfaces 1=Index Of onu

            //         const sn = splitName[1].replace('\"', '').replace('\"', '').trim();
            //         const replaceSN = sn.replace(/\s/g, '');
            //         const vendorid = replaceSN.substring(0, 8);
            //         const modelid = replaceSN.substring(8, replaceSN.length);

            //         const hexSN = hex(vendorid);
            //         const snOnu = hexSN + modelid;

            //         onu.push({
            //             pon: arrayInterfaces[0],
            //             index: parseInt(arrayInterfaces[1]),
            //             sn: snOnu,
            //         });


            //     }

            //     return onu
            // } //sn hex string


            const scanSN = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.3.1.18${id.int_olt}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.3.1.18.', '').replace('=', '').replace('STRING:', '').trim().replace('"1,', '').replace(' ', '.').replace(/\s/g, '').trim().split('.').filter(Boolean);


                    onu.push({
                        pon: parseInt(splitName[0]),
                        index: parseInt(splitName[1]),
                        sn: splitName[2].replace('"', '').replace('"', '').trim()
                    });


                }

                return onu
            }

            const scanName = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.3.1.2${id.int_olt}`);
                const onuName = stdout.split('\n').filter(Boolean);

                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.3.1.2.', '').replace('=', '').replace('STRING:', '').trim().trim().replace(' ', '::').trim().replace('  ', '').trim().split('::').filter(Boolean);
                    const splitInterface = splitName[0].split('.').filter(Boolean);

                    onu.push({
                        pon: parseInt(splitInterface[0]),
                        index: parseInt(splitInterface[1]),
                        name: splitName[1].replace('\"', '').replace('\"', '').trim()
                    });

                }
                return onu;
            };

            const scanDesc = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.3.1.3${id.int_olt}`);
                const onuName = stdout.split('\n').filter(Boolean);

                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.3.1.3.', '').trim().replace('=', ' ').trim().replace('STRING: ', '_').trim().split('_').filter(Boolean);
                    const splitInterfaces = splitName[0].replace(' ', '').trim().split('.').filter(Boolean);

                    onu.push({
                        pon: parseInt(splitInterfaces[0]),
                        index: parseInt(splitInterfaces[1]),
                        description: splitName[1].replace('\"', '').replace('\"', '').trim()
                    });
                }

                return onu;
            }

            const scanPhaseState = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.8.1.4${id.int_olt}`);
                const onuName = stdout.split('\n').filter(Boolean);

                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].split('INTEGER:'); //array 0=id 2=name
                    const splitInterfaces = splitName[0].split('=')[0]; //
                    const replaceInterfaces = splitInterfaces.replace('SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.8.1.4.', '').trim();
                    const arrayInterfaces = replaceInterfaces.split('.').filter(Boolean); //array 0=interfaces 1=Index Of onu
                    const state = splitName[1].replace('\"', '').replace('\"', '').trim();

                    onu.push({
                        pon: arrayInterfaces[0],
                        index: parseInt(arrayInterfaces[1]),
                        state: parseInt(state),
                    });

                }

                return onu;
            };

            const scanTcont = async () => {

                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.4.1.2${id.int_olt}`);

                const onuName = stdout.split('\n',).filter(Boolean);

                let tcont = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.4.1.2.', '').replace(' = STRING: ', '').replace('\"', '.').replace('\"', '').split('.').filter(Boolean);

                    tcont.push({
                        pon: parseInt(splitName[0]),
                        index: parseInt(splitName[1]),
                        tcont: parseInt(splitName[2]),
                        name: splitName[3]
                    });

                }

                return tcont;

            };

            const scanTcontProfil = async () => {

                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.4.1.3${id.int_olt}`);

                const onuName = stdout.split('\n',).filter(Boolean);

                let tcont = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.4.1.3.', '').replace(' = STRING: ', '').replace('\"', '.').replace('\"', '').split('.').filter(Boolean);

                    tcont.push({
                        pon: parseInt(splitName[0]),
                        index: parseInt(splitName[1]),
                        tcont: parseInt(splitName[2]),
                        name: splitName[3]
                    });

                }

                return tcont;

            };

            const scanGemport = async () => {

                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.5.1.2${id.int_olt}`);

                const onuName = stdout.split('\n',).filter(Boolean);

                let tcont = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.5.1.2.', '').replace(' = STRING: ', '').replace('\"', '.').replace('\"', '').split('.').filter(Boolean);

                    tcont.push({
                        pon: parseInt(splitName[0]),
                        index: parseInt(splitName[1]),
                        gemport: parseInt(splitName[2]),
                        number: splitName[3]
                    });

                }

                return tcont;

            };

            const scanGemportProfil = async () => {

                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.5.1.11${id.int_olt}`);

                const onuName = stdout.split('\n',).filter(Boolean);

                let tcont = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.5.1.11.', '').replace(' = STRING: ', '').replace('\"', '.').replace('\"', '').split('.').filter(Boolean);

                    tcont.push({
                        pon: parseInt(splitName[0]),
                        index: parseInt(splitName[1]),
                        gemport: parseInt(splitName[2]),
                        name: splitName[3]
                    });

                }

                return tcont;

            };

            const scanModel = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.500.20.2.1.2.1.8${id.int_olt}`);

                const onuName = stdout.split('\n',).filter(Boolean);

                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.20.2.1.2.1.8.', '').replace(' = STRING: ', '').replace('\"', '.').replace('\"', '').split('.').filter(Boolean);
                    const splitId = id.int_olt.split('.').filter(Boolean);

                    onu.push({
                        pon: parseInt(splitId[0]),
                        index: parseInt(splitName[1]),
                        model: splitName[2]
                    });
                }

                return onu;
            };

            const scanFirmware = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.500.20.2.1.2.1.2${id.int_olt}`);

                const onuName = stdout.split('\n',).filter(Boolean);

                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.20.2.1.2.1.2.', '').replace(' = STRING: ', '').split('"').filter(Boolean);//
                    const splitInt = splitName[0].split('.').filter(Boolean);
                    const splitId = id.int_olt.split('.').filter(Boolean);



                    onu.push({
                        pon: parseInt(splitId[0]),
                        index: parseInt(splitInt[1]),
                        firmware: splitName[1]
                    });

                }

                return onu;
            };

            const scanDistance = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.10.1.2${id.int_olt}`);

                const onuName = stdout.split('\n',).filter(Boolean);

                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.10.2.3.10.1.2.', '').replace('=', '').replace('INTEGER:', '').replace(' ', '.').replace(/\s/g, '').split('.').filter(Boolean);

                    const splitId = id.int_olt.split('.').filter(Boolean);

                    onu.push({
                        pon: parseInt(splitId[0]),
                        index: parseInt(splitName[1]),
                        distance: parseInt(splitName[2])
                    });
                }

                return onu;
            };

            const scanRxOlt = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.500.1.2.4.2.1.2${id.int_olt}`);

                const onuName = stdout.split('\n',).filter(Boolean);

                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.1.2.4.2.1.2.', '').replace('=', '').replace('INTEGER:', '').replace(' ', '.').replace(/\s/g, '').split('.').filter(Boolean);

                    const splitInt = splitName[0].split('.').filter(Boolean);
                    const splitId = id.int_olt.split('.').filter(Boolean);
                    const rx = parseInt(splitName[2]) / 1000;
                    const fixdecimal = rx.toFixed(2);


                    onu.push({
                        pon: parseInt(splitId[0]),
                        index: parseInt(splitName[1]),
                        rxOlt: fixdecimal
                    });
                }

                return onu;
            };

            const scanRxOnu = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.500.20.2.2.2.1.10${id.int_olt}`);

                const onuName = stdout.split('\n',).filter(Boolean);

                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.20.2.2.2.1.10.', '').replace('=', '').replace('INTEGER:', '').replace(' ', '.').replace(/\s/g, '').split('.').filter(Boolean);


                    const splitId = id.int_olt.split('.').filter(Boolean);
                    const rx = splitName[3] * 0.002 - 30
                    const fixdecimal = rx.toFixed(2);


                    onu.push({
                        pon: parseInt(splitId[0]),
                        index: parseInt(splitName[1]),
                        rxOnu: fixdecimal
                    });
                }
                return onu;
            };

            const scanTxOnu = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.500.20.2.2.2.1.14${id.int_olt}`);

                const onuName = stdout.split('\n',).filter(Boolean);

                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.20.2.2.2.1.14.', '').replace('=', '').replace('INTEGER:', '').replace(' ', '.').replace(/\s/g, '').split('.').filter(Boolean);


                    const splitId = id.int_olt.split('.').filter(Boolean);
                    const rx = splitName[3] * 0.002 - 30
                    const fixdecimal = rx.toFixed(2);

                    onu.push({
                        pon: parseInt(splitId[0]),
                        index: parseInt(splitName[1]),
                        txOnu: fixdecimal
                    });
                }
                return onu;
            };


            const [sn, name, desc, phaseState, tcont, tcontProfil, gemport, gemporProfil, model, firmware, distance, rxOlt, rxOnu, txOnu] = await Promise.all([scanSN(), scanName(), scanDesc(), scanPhaseState(), scanTcont(), scanTcontProfil(), scanGemport(), scanGemportProfil(), scanModel(), scanFirmware(), scanDistance(), scanRxOlt(), scanRxOnu(), scanTxOnu()]);


            const tcontCombineTcontProfile = tcont.map((item, index) => {
                return {
                    ...item,
                    name: item.name,
                    profile: tcontProfil[index].name,
                }
            })

            const gemportCombineGemportProfile = gemport.map((item, index) => {
                return {
                    ...item,
                    name: item.number,
                    profile: gemporProfil[index].name,
                }
            });


            return sn.map((item, index) => {
                return {
                    ...item,
                    name: name[index].name,
                    description: desc[index].description,
                    state: phaseState[index].state,
                    model: model[index].model,
                    firmware: firmware[index].firmware,
                    distance: distance[index].distance,
                    rx_olt: rxOlt[index].rxOlt,
                    rx_onu: rxOnu[index].rxOnu,
                    tx_onu: txOnu[index].txOnu,
                    tcont: tcontCombineTcontProfile.filter(data => data.pon === item.pon && data.index === item.index),
                    gemport: gemportCombineGemportProfile.filter(data => data.pon === item.pon && data.index === item.index),
                }
            });

        }
        catch (error) {
            return error;
        }
    }

    async ifIndex(id) {
        try {
            if (id.device === undefined) {
                id.device = '';
            } else {
                id.device = `.${id.device}`
            }


            const ifIndex = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} IF-MIB::ifIndex${id.device}`);

                const ifIndex = stdout.split('\n').filter(Boolean);

                let index = [];

                for (let i = 0; i < ifIndex.length; i++) {
                    const splitIndex = ifIndex[i].split('INTEGER:').filter(Boolean);
                    const splitInterfaces = splitIndex[0].split('=')[0].trim();
                    const arrayInterfaces = splitInterfaces.replace('IF-MIB::ifIndex.', '').trim();
                    index.push({
                        ifindex: parseInt(arrayInterfaces)
                    });

                }


                return index;
            }

            const ifName = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} IF-MIB::ifName${id.device}`);

                const ifName = stdout.split('\n').filter(Boolean);

                let index = [];

                for (let i = 0; i < ifName.length; i++) {
                    const splitName = ifName[i].replace('IF-MIB::ifName.', '').replace('=', '').trim().replace('STRING:', '').trim().replace(' ', '').replace(/\s/g, '.').trim().replace('.', '').trim().split('.').filter(Boolean);
                    const alias = splitName[1].replace('gpon_', 'gpon-onu_').replace('\"', '').trim();
                    const splitInterfaces = splitName[1].split('/').filter(Boolean);

                    index.push({
                        ifindex: parseInt(splitName[0]),
                        ifname: splitName[1],
                        index: parseInt(splitInterfaces[2]),
                        alias: alias
                    });

                }
          
                return index;
            }

            const ifDesc = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} IF-MIB::ifDescr${id.device}`);

                const ifDesc = stdout.split('\n').filter(Boolean);



                let index = [];

                for (let i = 0; i < ifDesc.length; i++) {
                    const splitName = ifDesc[i].replace('IF-MIB::ifDescr.', '').replace('=', '').replace('STRING:', '.').trim().split('.').filter(Boolean)
                   // console.log(splitName)
                    if (splitName[1] === undefined) {
                        splitName[1] = '';
                    } else {
                        splitName[1] = splitName[1].trim();
                    }


                    index.push({
                        ifindex: parseInt(splitName[0]),
                        ifDesc: splitName[1],
                    });



                }

                return index;
            }

            const ifType = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} IF-MIB::ifType${id.device}`);

                const ifDesc = stdout.split('\n').filter(Boolean);



                let index = [];

                for (let i = 0; i < ifDesc.length; i++) {
                    const splitName = ifDesc[i].replace('IF-MIB::ifType.', '').replace('=', '').replace('INTEGER:', '.').trim().split('.').filter(Boolean)

                    if (splitName[1] === undefined) {
                        splitName[1] = '';
                    } else {
                        splitName[1] = splitName[1].trim();
                    }


                    index.push({
                        ifindex: parseInt(splitName[0]),
                        type: splitName[1],
                    });



                }

                return index;
            }

            const ifMtu = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} IF-MIB::ifMtu${id.device}`);

                const ifDesc = stdout.split('\n').filter(Boolean);



                let index = [];

                for (let i = 0; i < ifDesc.length; i++) {
                    const splitName = ifDesc[i].replace('IF-MIB::ifMtu.', '').replace('=', '').replace('INTEGER:', '.').trim().split('.').filter(Boolean)

                    if (splitName[1] === undefined) {
                        splitName[1] = '';
                    } else {
                        splitName[1] = splitName[1].trim();
                    }


                    index.push({
                        ifindex: parseInt(splitName[0]),
                        ifMtu: splitName[1],
                    });



                }

                return index;
            }

            const ifSpeed = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} IF-MIB::ifSpeed${id.device}`);

                const ifDesc = stdout.split('\n').filter(Boolean);



                let index = [];

                for (let i = 0; i < ifDesc.length; i++) {
                    const splitName = ifDesc[i].replace('IF-MIB::ifSpeed.', '').replace('=', '').replace('Gauge32:', '.').trim().split('.').filter(Boolean)

                    if (splitName[1] === undefined) {
                        splitName[1] = '';
                    } else {
                        splitName[1] = splitName[1].trim();
                    }


                    index.push({
                        ifindex: parseInt(splitName[0]),
                        ifSpeed: splitName[1],
                    });



                }

                return index;
            }

            const ifAdminStatus = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} IF-MIB::ifAdminStatus${id.device}`);

                const ifDesc = stdout.split('\n').filter(Boolean);



                let index = [];

                for (let i = 0; i < ifDesc.length; i++) {
                    const splitName = ifDesc[i].replace('IF-MIB::ifAdminStatus.', '').replace('=', '').replace('INTEGER:', '.').trim().split('.').filter(Boolean)

                    if (splitName[1] === undefined) {
                        splitName[1] = '';
                    } else {
                        splitName[1] = splitName[1].trim();
                    }


                    index.push({
                        ifindex: parseInt(splitName[0]),
                        ifAdminStatus: splitName[1],
                    });



                }

                return index;
            }

            const ifOperStatus = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} IF-MIB::ifOperStatus${id.device}`);

                const ifDesc = stdout.split('\n').filter(Boolean);



                let index = [];

                for (let i = 0; i < ifDesc.length; i++) {
                    const splitName = ifDesc[i].replace('IF-MIB::ifOperStatus.', '').replace('=', '').replace('INTEGER:', '.').trim().split('.').filter(Boolean)

                    if (splitName[1] === undefined) {
                        splitName[1] = '';
                    } else {
                        splitName[1] = splitName[1].trim();
                    }


                    index.push({
                        ifindex: parseInt(splitName[0]),
                        ifOperStatus: splitName[1],
                    });



                }

                return index;
            }

            const [index, name, desc, type, mtu, speed, adminStatus, operStatus] = await Promise.all([ifIndex(), ifName(), ifDesc(), ifType(), ifMtu(), ifSpeed(), ifAdminStatus(), ifOperStatus()]);


            const IndexIf = index.map((item, index) => {
                return {
                    ...item,
                    ifName: name.filter(data => data.ifindex === item.ifindex),
                    ifDesc: desc.filter(data => data.ifindex === item.ifindex),
                    ifType: type.filter(data => data.ifindex === item.ifindex, item.ifDesc),
                    ifMtu: mtu.filter(data => data.ifindex === item.ifindex),
                    ifSpeed: speed.filter(data => data.ifindex === item.ifindex),
                    ifAdminStatus: adminStatus.filter(data => data.ifindex === item.ifindex),
                    ifOperStatus: operStatus.filter(data => data.ifindex === item.ifindex),
                }
            });

          
            const arrayIndex = IndexIf.map((item, index) => {
                return {
                    ...item,
                    ifName: item.ifName[0].ifname,
                    ifDesc: item.ifDesc[0].ifDesc,
                    ifAlias: item.ifName[0].alias,
                    index: item.ifName[0].index,
                    ifType: item.ifType[0].type,
                    ifMtu: item.ifMtu[0].ifMtu,
                    ifSpeed: item.ifSpeed[0].ifSpeed,
                    ifAdminStatus: item.ifAdminStatus[0].ifAdminStatus,
                    ifOperStatus: item.ifOperStatus[0].ifOperStatus,
                }
            });

           return arrayIndex;
        }
        catch (error) {
            throw error;
        }
    }

    async ifIndexOptical(id) {
        try {
            if (id.interfaces === undefined) {
                id.interfaces = '';
            } else {
                id.interfaces = `.${id.interfaces}`
            }

            const zxAnOpticalVendorPn = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.11${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                if (onuName.includes('No Such Object available on this agent at this OID') === true) {
                    return [];
                }


                let onu = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.11.', '').replace('=', '').replace('STRING:', '').trim().replace(' No Such Instance currently exists at this OID', '').replace('"', '.').trim().replace('"', '.').trim().split('.').filter(Boolean);

                    if (splitName[1] === undefined) {
                        splitName[1] = '';
                    } else {
                        splitName[1] = splitName[1].trim();
                    }

                    onu.push({
                        ifindex: parseInt(splitName[0].trim()),
                        pn: splitName[1],
                    });


                }
                return onu
            };//The optical module vendor part number.



            const zxAnOpticalVendorName = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.12${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                if (onuName.includes('No Such Object available on this agent at this OID') === true) {
                    return [];
                }


                let onu = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.12.', '').replace('=', '').replace('STRING:', '').trim().replace(' No Such Instance currently exists at this OID', '').replace('"', '.').trim().replace('"', '.').trim().split('.').filter(Boolean);

                    if (splitName[1] === undefined) {
                        splitName[1] = '';
                    } else {
                        splitName[1] = splitName[1].trim();
                    }

                    onu.push({
                        ifindex: parseInt(splitName[0].trim()),
                        name: splitName[1],
                    });


                }
                return onu
            };//The optical module vendor name.


            const zxAnOpticalVendorSn = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.13${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                if (onuName.includes('No Such Object available on this agent at this OID') === true) {
                    return [];
                }


                let onu = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.13.', '').replace('=', '').replace('STRING:', '').trim().replace(' No Such Instance currently exists at this OID', '').replace('"', '.').trim().replace('"', '.').trim().split('.').filter(Boolean);

                    if (splitName[1] === undefined) {
                        splitName[1] = '';
                    } else {
                        splitName[1] = splitName[1].trim();
                    }

                    onu.push({
                        ifindex: parseInt(splitName[0].trim()),
                        sn: splitName[1],
                    });


                }
                return onu
            }; //The optical module vendor S/N.


            const zxAnOpticalModuleType = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.15${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                if (onuName.includes('No Such Object available on this agent at this OID') === true) {
                    return [];
                }


                let onu = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.15.', '').replace('=', '').replace('STRING:', '').trim().replace(' No Such Instance currently exists at this OID', '').replace('"', '.').trim().replace('"', '.').trim().split('.').filter(Boolean);

                    if (splitName[1] === undefined) {
                        splitName[1] = '';
                    } else {
                        splitName[1] = splitName[1].trim();
                    }

                    onu.push({
                        ifindex: parseInt(splitName[0].trim()),
                        type: splitName[1],
                    });


                }
                return onu
            };//The optical module type.


            const zxAnOpticalFiberInterfaceType = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.16${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                if (onuName.includes('No Such Object available on this agent at this OID') === true) {
                    return [];
                }


                let onu = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.16.', '').replace('=', '').replace('STRING:', '').trim().replace(' No Such Instance currently exists at this OID', '').replace('"', '.').trim().replace('"', '.').trim().split('.').filter(Boolean);

                    if (splitName[1] === undefined) {
                        splitName[1] = '';
                    } else {
                        splitName[1] = splitName[1].trim();
                    }

                    onu.push({
                        ifindex: parseInt(splitName[0].trim()),
                        con: splitName[1],
                    });


                }
                return onu
            };//The optical module fiber interface type.


            const zxAnOpticalTransDistanceSmLongR = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.40${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                if (onuName.includes('No Such Object available on this agent at this OID') === true) {
                    return [];
                }


                let onu = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.40.', '').replace('=', '').replace('INTEGER:', '').replace('No Such Instance currently exists at this OID', '').replace(' ', '.').trim().split('.').filter(Boolean);

                    if (splitName[1] === undefined) {
                        splitName[1] = 0;
                    } else {
                        splitName[1] = splitName[1].trim();
                    }

                    onu.push({
                        ifindex: parseInt(splitName[0].trim()),
                        distance: parseInt(splitName[1]),
                    });


                }

                return onu
            };//The optical module transmit distance SM long R.


            const zxAnOpticalIfRxPwrCurrValue = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.2${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                if (onuName.includes('No Such Object available on this agent at this OID') === true) {
                    return [];
                }


                let onu = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.2.', '').replace('=', '').replace('INTEGER:', '').replace('No Such Instance currently exists at this OID', '').replace(' ', '.').trim().split('.').filter(Boolean);


                    if (splitName[1] === undefined) {
                        splitName[1] = 0;
                    } else {
                        splitName[1] = splitName[1].trim();
                    }

                    onu.push({
                        ifindex: parseInt(splitName[0].trim()),
                        rx: parseInt(splitName[1]),
                    });


                }

                return onu

            };//The optical module receive optical power current value.


            const zxAnOpticalIfTxPwrCurrValue = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.3${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                if (onuName.includes('No Such Object available on this agent at this OID') === true) {
                    return [];
                }


                let onu = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.3.', '').replace('=', '').replace('INTEGER:', '').replace('No Such Instance currently exists at this OID', '').replace(' ', '.').trim().split('.').filter(Boolean);


                    if (splitName[1] === undefined) {
                        splitName[1] = 0;
                    } else {
                        splitName[1] = splitName[1].trim();
                    }

                    onu.push({
                        ifindex: parseInt(splitName[0].trim()),
                        tx: parseInt(splitName[1]),
                    });


                }

                return onu

            };//The optical module transmit optical power current value.

            const zxAnOpticalBiasCurrent = async () => {

                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.5${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                if (onuName.includes('No Such Object available on this agent at this OID') === true) {
                    return [];
                }


                let onu = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.5.', '').replace('=', '').replace('INTEGER:', '').replace('No Such Instance currently exists at this OID', '').replace(' ', '.').trim().split('.').filter(Boolean);


                    if (splitName[1] === undefined) {
                        splitName[1] = 0;
                    } else {
                        splitName[1] = splitName[1].trim();
                    }

                    onu.push({
                        ifindex: parseInt(splitName[0].trim()),
                        bias: parseInt(splitName[1]),
                    });


                }

                return onu

            };//The optical module bias current.

            const zxAnOpticalSupplyVoltage = async () => {

                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.6${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                if (onuName.includes('No Such Object available on this agent at this OID') === true) {
                    return [];
                }


                let onu = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.6.', '').replace('=', '').replace('INTEGER:', '').replace('No Such Instance currently exists at this OID', '').replace(' ', '.').trim().split('.').filter(Boolean);


                    if (splitName[1] === undefined) {
                        splitName[1] = 0;
                    } else {
                        splitName[1] = splitName[1].trim();
                    }

                    onu.push({
                        ifindex: parseInt(splitName[0].trim()),
                        voltage: parseInt(splitName[1]),
                    });


                }

                return onu


            };//The optical module supply voltage.

            const zxAnOpticalWavelength = async () => {

                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.7${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                if (onuName.includes('No Such Object available on this agent at this OID') === true) {
                    return [];
                }


                let onu = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.7.', '').replace('=', '').replace('INTEGER:', '').replace('No Such Instance currently exists at this OID', '').replace(' ', '.').trim().split('.').filter(Boolean);


                    if (splitName[1] === undefined) {
                        splitName[1] = 0;
                    } else {
                        splitName[1] = splitName[1].trim();
                    }

                    onu.push({
                        ifindex: parseInt(splitName[0].trim()),
                        lamda: parseInt(splitName[1]),
                    });


                }

                return onu

            };//The optical module wavelength.

            const zxAnOpticalTemperature = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.8${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                if (onuName.includes('No Such Object available on this agent at this OID') === true) {
                    return [];
                }


                let onu = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.30.40.2.4.1.8.', '').replace('=', '').replace('INTEGER:', '').replace('No Such Instance currently exists at this OID', '').replace(' ', '.').trim().split('.').filter(Boolean);


                    if (splitName[1] === undefined) {
                        splitName[1] = 0;
                    } else {
                        splitName[1] = splitName[1].trim();
                    }

                    onu.push({
                        ifindex: parseInt(splitName[0].trim()),
                        temperature: parseInt(splitName[1]),
                    });


                }

                return onu

            };//The optical module temperature.


            const [pn, name, sn, type, con, distance, rx, tx, bias, voltage, lamda, temperature] = await Promise.all([zxAnOpticalVendorPn(), zxAnOpticalVendorName(), zxAnOpticalVendorSn(), zxAnOpticalModuleType(), zxAnOpticalFiberInterfaceType(), zxAnOpticalTransDistanceSmLongR(), zxAnOpticalIfRxPwrCurrValue(), zxAnOpticalIfTxPwrCurrValue(), zxAnOpticalBiasCurrent(), zxAnOpticalSupplyVoltage(), zxAnOpticalWavelength(), zxAnOpticalTemperature()]);

            return pn.map((item, index) => {
                return {
                    ...item,
                    pn: pn[index].pn,
                    name: name[index].name,
                    sn: sn[index].sn,
                    type: type[index].type,
                    con: con[index].con,
                    distance: distance[index].distance,
                    rx: rx[index].rx,
                    tx: tx[index].tx,
                    bias: bias[index].bias,
                    voltage: voltage[index].voltage,
                    lamda: lamda[index].lamda,
                    temperature: temperature[index].temperature,
                }
            });


        }
        catch (error) {
            throw error;
        }
    }

    async CardInformation(id) {
        try {
            if (id.interfaces === undefined) {
                id.interfaces = '';
            } else {
                id.interfaces = `.${id.interfaces}`
            }

            const zxAnCardConfMainType = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.10.1.2.4.1.2.1.1${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                let card = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.10.1.2.4.1.2.1.1.', '').replace('=', '').replace('INTEGER:', '').replace(/\s/g, '.').trim().split('.').filter(Boolean);
                    card.push({
                        slot: parseInt(splitName[0]),
                        index: parseInt(splitName[1]),
                    });


                }
               
                return card;

            };//The card main type.


            const zxAnCardActualType = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.10.1.2.4.1.4.1.1${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                let card = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.10.1.2.4.1.4.1.1.', '').replace('=', '.').trim().replace('STRING:', '').replace(/\s/g, '').trim().split('.').filter(Boolean);

                    card.push({
                        slot: parseInt(splitName[0]),
                        type: splitName[1].replace('"', '').trim().replace('"', '').trim()
                    });


                }
                return card;

            };//The card actual type.


            const zxAnSubcardPortNums = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.10.1.2.4.1.7.1.1${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                let card = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.10.1.2.4.1.7.1.1.', '').replace('=', '.').trim().replace('INTEGER:', '').replace(/\s/g, '').trim().split('.').filter(Boolean);

                    card.push({
                        slot: parseInt(splitName[0]),
                        port: parseInt(splitName[1])
                    });


                }

                return card;

            };//The subcard port numbers.

            const zxAnCardTemp = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.10.10.2.1.6.1.2.1.1${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                let card = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.10.10.2.1.6.1.2.1.1.', '').replace('=', '.').trim().replace('INTEGER:', '').replace(/\s/g, '').trim().split('.').filter(Boolean);

                    if(splitName[1] === undefined){
                        splitName[1] = 0;
                    } else if(splitName[1] === '-1000'){
                        splitName[1] = 0;
                    } else {
                        splitName[1] = splitName[1].trim();
                    }

                    card.push({
                        slot: parseInt(splitName[0]),
                        temp: parseInt(splitName[1])
                    });

                }
               return card;
            };//The card temperature.

            const zxAnCardPowerConsumption = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.10.10.2.1.6.1.3.1.1${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                let card = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.10.10.2.1.6.1.3.1.1.', '').replace('=', '.').trim().replace('INTEGER:', '').replace(/\s/g, '').trim().split('.').filter(Boolean);

                    if(splitName[1] === undefined){
                        splitName[1] = 0;
                    } else if(splitName[1] === '-1000'){
                        splitName[1] = 0;
                    } else {
                        splitName[1] = splitName[1].trim();
                    }

                    card.push({
                        slot: parseInt(splitName[0]),
                        power: parseInt(splitName[1])
                    });

                }
               return card;
            }//The card power consumption.

            const zxAnCardOperStatus = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.10.1.2.4.1.5.1.1${id.interfaces}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                let card = [];

                for (let i = 0; i < onuName.length; i++) {

                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.10.1.2.4.1.5.1.1.', '').replace('=', '.').trim().replace('INTEGER:', '').replace(/\s/g, '').trim().split('.').filter(Boolean);

                    if(splitName[1] === undefined){
                        splitName[1] = 0;
                    } else if(splitName[1] === '-1000'){
                        splitName[1] = 0;
                    } else {
                        splitName[1] = splitName[1].trim();
                    }

                    card.push({
                        slot: parseInt(splitName[0]),
                        status: parseInt(splitName[1])
                    });

                }
               return card;
            }//The card power consumption.

           
          const [mainType, actualType, portNums, temp, power, status] = await Promise.all([zxAnCardConfMainType(), zxAnCardActualType(), zxAnSubcardPortNums(), zxAnCardTemp(), zxAnCardPowerConsumption(), zxAnCardOperStatus()]);

            return mainType.map((item, index) => {
                return {
                    ...item,
                    slot: mainType[index].slot,
                    index: mainType[index].index,
                    type: actualType[index].type,
                    port: portNums[index].port,
                    temp: temp[index].temp,
                    power: power[index].power,
                    status: status[index].status,
                }
            });

        }
        catch (error) {
            throw error;
        }
    };//The card information.

    async zxAnGponRmEthUni(id) {
        try {
            if (id.int_olt === undefined) {
                id.int_olt = '';
            } else {
                id.int_olt = `${id.int_olt}`
            }

            const zxAnGponRmEthUniAdminState = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1082.500.20.2.3.2.1.5${id.int_olt}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.20.2.3.2.1.5.', '').replace('=', '.').trim().replace('INTEGER:', '').replace(/\s/g, '').trim().split('.').filter(Boolean);

                    onu.push({
                        pon: parseInt(splitName[0]),
                        index: parseInt(splitName[1]),
                        eth: parseInt(splitName[2]),
                        admin: parseInt(splitName[3]),
                    });


                }

                return onu;

            };//The GPON RM ETH UNI admin state.

            const zxAnGponRmEthUniOperState = async () => {
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} .1.3.6.1.4.1.3902.1082.500.20.2.3.2.1.6${id.int_olt}`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.20.2.3.2.1.6.', '').replace('=', '.').trim().replace('INTEGER:', '').replace(/\s/g, '').trim().split('.').filter(Boolean);

                    onu.push({
                        pon: parseInt(splitName[0]),
                        index: parseInt(splitName[1]),
                        eth: parseInt(splitName[2]),
                        state: parseInt(splitName[3]),
                    });

                }

                return onu;

            };//The GPON RM ETH UNI admin state.


            const [adminState, operState] = await Promise.all([zxAnGponRmEthUniAdminState(), zxAnGponRmEthUniOperState()]);

            return adminState.map((item, index) => {
                return {
                    ...item,
                    pon: adminState[index].pon,
                    index: adminState[index].index,
                    eth: adminState[index].eth,
                    admin: adminState[index].admin,
                    state: operState[index].state,
                }
            });




        }
        catch (error) {
            throw error;
        }

    };//The PON RM ONU interface protocol configuration entry.

    async RebootOnu(id) {
        try {
            if (id.onu === undefined) {
                id.onu = '';
            } else {
                id.onu = `.${id.onu}`
            }

            const zxAnGponRmOnuReboot = async () =>{
                const { stdout, stderr } = await exec(`snmpset -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} SNMPv2-SMI::enterprises.3902.1082.500.20.2.1.10.1.1.285278991.2${id.onu} i 1`);
                if (stderr) throw new Error(stderr);

                const onuName = stdout.split('\n').filter(Boolean);

                let info = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].replace('SNMPv2-SMI::enterprises.3902.1082.500.20.2.1.10.1.1.285278991.2.', '').replace('=', '.').trim().replace('INTEGER:', '').replace(/\s/g, '').trim().split('.').filter(Boolean);

                   info = {
                    pesan: 'onu rebooted'
                   }

                }

                return info;
            }


            return await zxAnGponRmOnuReboot();


        }
        catch (error) {
            throw error;
        }
    };//Reboot Onu

    async OLTVlanList(id) {
        try {
            if (id.vlan === undefined) {
                id.vlan = '';
            } else {
                id.vlan = `.${id.vlan}`
            }
            let vlan = [];

            const VlanList = async () =>{
                const { stdout, stderr } = await exec(`snmpwalk -v2c -c ${id.snmp} udp:${id.ip}:${id.snmp_port} 1.3.6.1.4.1.3902.1082.40.50.2.1.2.1.2${id.vlan}`);
                if (stderr) throw new Error(stderr);

                const vlanName = stdout.split('\n').filter(Boolean);
              
               

                for (let i = 0; i < vlanName.length; i++) {
                    const splitName = vlanName[i].replace('SNMPv2-SMI::enterprises.3902.1082.40.50.2.1.2.1.2.', '').replace('=', '.').trim().replace('STRING:', '').replace(/\s/g, '').trim().replace('"','').trim().replace('"','').trim().split('.').filter(Boolean);

                    vlan.push({
                        id: parseInt(splitName[0]),
                        name: splitName[1],
                    });

                }

                return vlan;
            };

            const [vlanList] = await Promise.all([VlanList()]);

             return vlanList.map((item, index) => {
                return {
                    ...item,
                    id: vlanList[index].id,
                    name: vlanList[index].name,
                }
             });


        }
        catch (error) {
            throw error;
        }
          
               
    };//The OLT VLAN list.

};
