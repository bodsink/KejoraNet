//cron snmp walk 

import createError from 'http-errors';
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
moment.locale('id');

const exec = promisify(execCb);


import SnmpClass from '../Class/Class.Snmp.js';
const snmp = new SnmpClass();

import libSnmp from '../Lib/Snmp.js';
const snmpLib = new libSnmp();




function uptime(id) {
    var totalseconds = id

    var day = 86400;
    var hour = 3600;
    var minute = 60;



    var daysout = Math.floor(totalseconds / day);
    var hoursout = Math.floor((totalseconds - daysout * day) / hour);
    var minutesout = Math.floor((totalseconds - daysout * day - hoursout * hour) / minute);
    var secondsout = totalseconds - daysout * day - hoursout * hour - minutesout * minute;

    // return daysout + ' Hari ' + hoursout + ' Jam ' + minutesout + ' Menit ' + secondsout + ' Detik' //lengkap sama menit
    return daysout + ' Hari ' + hoursout + ' Jam'
}

export const snmpRoute = (app, client) => {


    app.get('/snmp/:id/sys', async (req, res, next) => {
        try {

            const devices = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, uid: req.params.id });

            if (!devices) {
                throw createError(404, 'Device not found');
            }

            const data = {
                snmp: devices.snmp,
                ip: devices.ip,
                snmp_port: devices.snmp_port,
            }

            const sys = await snmpLib.SystemInformation(data);

            sys.forEach(async (element) => {
                const cekSys = await client.db(process.env.MONGO_DB).collection('Devices.Sys').findOne({ user: req.user, device: req.params.id });

                if (!cekSys) {
                    const result = await client.db(process.env.MONGO_DB).collection('Devices.Sys').insertOne({
                        uid: uuidv4(),
                        user: req.user,
                        device: req.params.id,
                        sysDescr: element.sysDescr,
                        sysUpTime: element.sysUpTimeInstance,
                        sysContact: element.sysContact,
                        sysName: element.sysName,
                        sysLocation: element.sysLocation,
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    });

                    return console.log(`System ${element.sysName} created`);
                } else {

                    const data = {
                        sysDescr: element.sysDescr,
                        sysUpTime: element.sysUpTimeInstance,
                        sysContact: element.sysContact,
                        sysName: element.sysName,
                        sysLocation: element.sysLocation,
                        updated_at: moment().unix()
                    };

                    const result = await client.db(process.env.MONGO_DB).collection('Devices.Sys').updateOne({ user: req.user, device: req.params.id }, { $set: data });

                    return console.log(`System ${element.sysName} updated`);


                }

            });
        }
        catch (error) {
            return next(
                createError(408, error));
        }
    });//get system info by id

    app.get('/snmp/:id/ifindex', async (req, res, next) => {
        try {

            const devices = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, uid: req.params.id });
            if (!devices) {
                throw createError(404, 'Olt not found');
            }

            const data = {
                snmp: devices.snmp,
                ip: devices.ip,
                snmp_port: devices.snmp_port
            }

            const ifIndex = await snmpLib.ifIndex(data);

            ifIndex.forEach(async (element) => {
                // console.log(element)
                const dataBaru = {
                    user: req.user,
                    device: devices.uid,
                    ifindex: element.ifindex,
                    // index: element.index,
                    ifname: element.ifName,
                    ifalias: element.ifAlias,
                    ifdesc: element.ifDesc,
                    iftype: element.ifType,
                    ifmtu: element.ifMtu,
                    ifspeed: element.ifSpeed,
                    ifadminstatus: element.ifAdminStatus,
                    ifoperstatus: element.ifOperStatus,
                    created_at: moment().unix(),
                    updated_at: moment().unix()
                }


                const ifindex = await client.db(process.env.MONGO_DB).collection('Devices.IfIndex').findOne({ user: req.user, device: devices.uid, ifindex: element.ifindex });

                if (ifindex) {


                    const dataUpdate = {
                        ifindex: element.ifindex,
                        // index: element.index,
                        ifname: element.ifName,
                        ifalias: element.ifAlias,
                        ifdesc: element.ifDesc,
                        iftype: element.ifType,
                        ifmtu: element.ifMtu,
                        ifspeed: element.ifSpeed,
                        ifadminstatus: element.ifAdminStatus,
                        ifoperstatus: element.ifOperStatus,
                        updated_at: moment().unix()
                    }



                    const update = await client.db(process.env.MONGO_DB).collection('Devices.IfIndex').updateOne({ user: req.user, device: devices.uid, ifindex: element.ifindex }, { $set: dataUpdate });


                    if (update) {
                        return console.log(`IfIndex ${element.ifName} updated`)
                    } else {
                        return console.log(`IfIndex ${element.ifName} not updated`)

                    }

                } else {
                    const insert = await client.db(process.env.MONGO_DB).collection('Devices.IfIndex').insertOne(dataBaru);
                    if (insert) {
                        return console.log(`IfIndex ${element.ifName} inserted`)
                    }
                }

            });


        }
        catch (error) {
            return next(
                createError(408, error));
        }
    });//get all ifindex info


    app.get('/snmp/:id/pon', async (req, res, next) => {
        try {

            const { id } = req.params;
            const olt = await client.db(process.env.MONGO_DB).collection('OLT').findOne({ user: req.user, uid: id });
            if (!olt) {
                throw createError(404, 'Olt not found');
            }
            const data = {
                snmp: olt.snmp_community,
                ip: olt.ip,
                snmp_port: olt.snmp_port,
            }

            const getPon = async () => {
                const scanPonInterfaces = await snmp.PonList(data);

                let pon = [];

                scanPonInterfaces.forEach(async (element) => {
                    const splitIdPon = element.split('=')[0];
                    const splitNamePon = element.split('STRING:')[1];
                    const IndexPon = splitNamePon.split('-').filter(Boolean); //name and index of pon
                    const indexId = splitIdPon.replace('SNMPv2-SMI::enterprises.3902.1012.3.13.1.1.2.', '').trim(); //interfaces of pon
                    const namePon = splitNamePon.replace('\"', '').replace('\"', '').trim();//name of pon


                    pon.push({
                        user: req.user,
                        uid: uuidv4(),
                        olt: olt.uid,
                        name: namePon,
                        index: parseInt(IndexPon[1]),
                        interfaces: indexId,
                    })

                });

                return pon;
            };

            const getInterfacesPon = async () => {
                const scanInterfaces = await snmp.InterfacesList(data);
                const getStringGpon = scanInterfaces.filter((item) => item.includes('gpon_'));

                let pon = [];

                for (let i = 0; i < getStringGpon.length; i++) {
                    // const splitIdPon = getStringGpon[i].split('=')
                    const splitNamePon = getStringGpon[i].split('STRING:')[1];
                    const namePon = splitNamePon.replace('\"', '').replace('\"', '').trim();//name of pon
                    const arrayOfPon = splitNamePon.split('/').filter(Boolean); // 1=slot 2=port


                    const splitId = getStringGpon[i].replace('IF-MIB::ifName.', '').replace('=', '').replace('STRING:', '').replace(splitNamePon, '').trim(); //interfaces of pon

                    pon.push({
                        user: req.user,
                        uid: uuidv4(),
                        olt: olt.uid,
                        name: namePon,
                        slot: parseInt(arrayOfPon[1]),
                        port: parseInt(arrayOfPon[2]),
                        interfaces: splitId,

                    })

                }

                return pon;
            };

            const steteInt = async () => {
                const scanInterfaces = await snmp.ifOperStatus(data);

                let int = []

                for (let i = 0; i < scanInterfaces.length; i++) {
                    const split = scanInterfaces[i].split('=');//array 0=interfaces 1=state
                    const splitInterfaces = split[0].replace('IF-MIB::ifOperStatus.', '').trim(); //intefaces id

                    const state = split[1].replace('INTEGER: ', '').trim(); //state of interfaces

                    int.push({
                        interfaces: splitInterfaces,
                        state: state
                    })

                }

                return int;

            };


            const [onu, interfaces, state] = await Promise.all([getPon(), getInterfacesPon(), steteInt()]);

            if (onu.includes('Timeout')) {
                throw createError(500, onu);
            }

            if (interfaces.includes('Timeout')) {
                throw createError(500, interfaces);
            }

            const ponIndex = onu.map((item) => item.index);
            const interfacesIndex = interfaces.map((item) => item.port,);
            const match = ponIndex.filter((item) => interfacesIndex.includes(item));

            const interfacesId = interfaces.map((item) => item.interfaces);
            const stateInterfaces = state.map((item) => item.interfaces);
            const matchState = interfacesId.filter((item) => stateInterfaces.includes(item));

            let status = [];
            for (let i = 0; i < matchState.length; i++) {
                const findState = state.find((item) => item.interfaces === matchState[i]);
                status.push({ findState })
            }


            let int = [];

            for (let i = 0; i < onu.length; i++) {
                int.push({
                    user: req.user,
                    uid: uuidv4(),
                    olt: olt.uid,
                    alias: onu[i].name,
                    name: interfaces[i].name,
                    slot: interfaces[i].slot,
                    port: match[i],
                    pon_id: onu[i].interfaces,
                    olt_id: interfaces[i].interfaces,
                    port_pon: `gpon-onu_1/${interfaces[i].slot}/${match[i]}`,
                    port_olt: `gpon-olt_1/${interfaces[i].slot}/${match[i]}`,
                    state: status[i].findState.state,
                    created_at: moment().unix(),
                    updated_at: moment().unix()
                })


            }

            int.forEach(async (element) => {

                const duplicate = await client.db(process.env.MONGO_DB).collection('Snmp.Pon').findOne({
                    user: req.user,
                    olt: olt.uid,
                    pon_id: element.pon_id,
                    olt_id: element.olt_id
                });

                if (duplicate) {

                    const edit = {
                        state: element.state,
                        updated_at: moment().unix()
                    }

                    const update = await client.db(process.env.MONGO_DB).collection('Snmp.Pon').updateOne({
                        user: req.user,
                        olt: olt.uid,
                        name: element.name
                    }, { $set: edit });

                    if (update) {
                        return console.log(update)
                    }
                } else {
                    const save = await client.db(process.env.MONGO_DB).collection('Snmp.Pon').insertOne(element);
                    if (save) {
                        return console.log(save)
                    }

                }
            });

        }
        catch (error) {
            return next(
                createError(408, error));
        }

    });//get device pon interfaces


    app.get('/snmp/:id/onu', async (req, res, next) => {
        try {

            const ifIndex = await client.db(process.env.MONGO_DB).collection('Devices.IfIndex').aggregate([
                {
                    $match: {
                        user: req.user,
                        device: req.params.id,
                        iftype: 'gpon(250)',
                        ifoperstatus: 'up(1)'
                    }
                }, {
                    $lookup: {
                        from: 'Devices',
                        localField: 'device',
                        foreignField: 'uid',
                        as: 'olt'
                    }
                }, {
                    $unwind: '$olt'
                }, {
                    $project: {
                        snmp: '$olt.snmp',
                        ip: '$olt.ip',
                        snmp_port: '$olt.snmp_port',
                        ifindex: '$ifindex',
                        index: '$index',
                        interfaces: '$interfaces',
                        alias: '$ifalias'
                    }
                }
            ]).sort({ ifindex: 1 }).toArray();

            if (ifIndex.length == 0) {
                throw createError(404, 'No pon interfaces found')
            }

            for (let i = 0; i < ifIndex.length; i++) {
                const data = {
                    snmp: ifIndex[i].snmp,
                    ip: ifIndex[i].ip,
                    snmp_port: ifIndex[i].snmp_port,
                    int_olt: ifIndex[i].ifindex
                }



                const walk = await snmpLib.scanOnu(data);

                if (walk.length == 0) {
                    return createError(404, 'No Onu found')
                } else {

                    walk.forEach(async (element) => {
                        // const findState = element.state == '5';
                        // if (findState == true) {
                        //     return console.log(`Onu ${element.sn} => PowerOff`) //buat notif 
                        // }

                        const datasave = {
                            user: req.user,
                            uid: uuidv4(),
                            olt: req.params.id,
                            pon: element.pon,
                            index: element.index,
                            interface: `${ifIndex[i].alias}:${element.index}`,
                            sn: element.sn,
                            name: element.name,
                            description: element.description,
                            distance: element.distance,
                            state: element.state,
                            model: element.model,
                            firmware: element.firmware,
                            rx_olt: element.rx_olt,
                            rx_onu: element.rx_onu,
                            tx_onu: element.tx_onu,
                            tcont: element.tcont,
                            gemport: element.gemport,
                            created_at: moment().unix(),
                        };


                        const duplicate = await client.db(process.env.MONGO_DB).collection('OLT.Onu').findOne({ user: req.user, olt: req.params.id, pon: datasave.pon, index: datasave.index });
                       
                        if (duplicate) {
                            const dataUpdate = {
                                sn: element.sn,
                                name: element.name,
                                description: element.description,
                                distance: element.distance,
                                state: element.state,
                                rx_olt: element.rx_olt,
                                rx_onu: element.rx_onu,
                                tx_onu: element.tx_onu,
                                model: element.model,
                                firmware: element.firmware,
                                updated_at: moment().unix()
                            }

                           
                            if (duplicate.sn == dataUpdate.sn &&
                                duplicate.name == dataUpdate.name &&
                                duplicate.description == dataUpdate.description &&
                                duplicate.distance == dataUpdate.distance &&
                                duplicate.state == dataUpdate.state &&
                                duplicate.rx_olt == dataUpdate.rx_olt &&
                                duplicate.rx_onu == dataUpdate.rx_onu &&
                                duplicate.tx_onu == dataUpdate.tx_onu &&
                                duplicate.model == dataUpdate.model &&
                                duplicate.firmware == dataUpdate.firmware
                            ) {
                                return console.log(`Onu ${duplicate.interface} => ${element.sn} not updated`)

                            } else {
                                const update = await client.db(process.env.MONGO_DB).collection('OLT.Onu').updateOne({ user: req.user, olt: req.params.id, pon: datasave.pon, index: datasave.index }, { $set: dataUpdate });
                                if (update) {
                                    return console.log(`Onu  ${duplicate.interface} => ${element.sn} updated`)
                                } else {
                                    return console.log(`Onu ${duplicate.sn} not updated`)
                                }
                            }

                        } else {

                            const create = await client.db(process.env.MONGO_DB).collection('OLT.Onu').insertOne(datasave);
                            if (create) {
                                return console.log(`Onu ${datasave.interface}, ${element.sn} registered`)

                            } else {
                                return console.log(`Onu ${datasave.sn} not register`)
                            }
                        }
                    });
                }
            }

        }
        catch (error) {
            return next(
                createError(408, error));
        }
    });//get all onu info

    app.get('/snmp/:id/optical', async (req, res, next) => {
        try {

            const ifIndex = await client.db(process.env.MONGO_DB).collection('Devices.IfIndex').aggregate([
                {
                    $match: {
                        user: req.user,
                        device: req.params.id,
                    }
                }, {
                    $lookup: {
                        from: 'Devices',
                        localField: 'device',
                        foreignField: 'uid',
                        as: 'olt'
                    }
                }, {
                    $unwind: '$olt'
                }
            ]).toArray();

            if (ifIndex.length == 0) {
                throw createError(404, 'interfaces found')
            }


            for (let i = 0; i < ifIndex.length; i++) {
                const data = {
                    snmp: ifIndex[i].olt.snmp,
                    ip: ifIndex[i].olt.ip,
                    snmp_port: ifIndex[i].olt.snmp_port,
                    interfaces: ifIndex[i].ifindex
                }



                const scan = await snmpLib.ifIndexOptical(data);

                scan.forEach(async (element) => {

                    const dataUpdate = {
                        optical: {
                            name: element.name,
                            pn: element.pn,
                            sn: element.sn,
                            type: element.type,
                            con: element.con,
                            distance: element.distance,
                            rx: element.rx,
                            tx: element.tx,
                            bias: element.bias,
                            voltage: element.voltage,
                            lamda: element.lamda,
                            temperature: element.temperature
                        },
                        updated_at: moment().unix()
                    }
                    const cari = await client.db(process.env.MONGO_DB).collection('Devices.IfIndex').findOne({ user: req.user, device: req.params.id, ifindex: ifIndex[i].ifindex });


                    if (cari) {

                        const update = await client.db(process.env.MONGO_DB).collection('Devices.IfIndex').updateOne({ user: req.user, device: req.params.id, ifindex: ifIndex[i].ifindex }, { $set: dataUpdate });
                        if (update) {
                            return console.log(`Optical ${cari.ifalias} ${update.modifiedCount} updated`)
                        } else {
                            return console.log(`Optical ${cari.index} not updated`)
                        }
                    }

                    // return console.log(`Optical ${cari.index} not found`)


                });
            }

        }
        catch (error) {
            return next(
                createError(408, error));
        }
    });//get all optical info

    app.get('/snmp/onu/:id', async (req, res, next) => {
        try {

            const cekOnu = await client.db(process.env.MONGO_DB).collection('Snmp.Onu').findOne({ user: req.user, uid: req.params.id });

            if (!cekOnu) {
                throw createError(404, 'Onu not found');
            }

            const olt = await client.db(process.env.MONGO_DB).collection('OLT').findOne({ user: req.user, uid: cekOnu.olt });

            if (!olt) {
                throw createError(404, 'Olt not found');
            }

            const data = {
                snmp: olt.snmp_community,
                ip: olt.ip,
                snmp_port: olt.snmp_port,
                interfaces: `${cekOnu.interfaces}.${cekOnu.index}`
            }


            const getName = async () => {
                const onuName = await snmp.OnuName(data);

                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].split('=')[1]; //name of onu

                    onu.push({
                        name: splitName.replace('STRING: ', '').replace('\"', '').replace('\"', '').trim(),
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    });

                }

                //check if onu data same with database
                if (cekOnu.name == onu[0].name) {
                    return console.log(`Name: ${onu[0].name} already exist`)
                } else {
                    const update = await client.db(process.env.MONGO_DB).collection('Snmp.Onu').updateOne({ user: req.user, uid: req.params.id }, { $set: onu[0] });
                    return console.log(`Name: ${onu[0].name} updated`)
                }

            };


            const getDesc = async () => {
                const onuName = await snmp.OnuDesc(data);
                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].split('=')[1]; //name of onu

                    onu.push({
                        description: splitName.replace('STRING: ', '').replace('\"', '').replace('\"', '').trim(),
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    });

                }

                //check if onu data same with database
                if (cekOnu.description == onu[0].description) {
                    return console.log(`Description: ${onu[0].description} already exist`)
                } else {
                    const update = await client.db(process.env.MONGO_DB).collection('Snmp.Onu').updateOne({ user: req.user, uid: req.params.id }, { $set: onu[0] });
                    return console.log(`Description: ${onu[0].description} updated`)
                }
            };

            const getModel = async () => {
                const onuName = await snmp.OnuModel(data);
                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].split('=')[1]; //name of onu

                    onu.push({
                        model: splitName.replace('STRING: ', '').replace('\"', '').replace('\"', '').trim(),
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    });

                }

                //check if onu data same with database
                if (cekOnu.model == onu[0].model) {
                    return console.log(`Model: ${onu[0].model} already exist`)
                } else {
                    const update = await client.db(process.env.MONGO_DB).collection('Snmp.Onu').updateOne({ user: req.user, uid: req.params.id }, { $set: onu[0] });
                    return console.log(`Model: ${onu[0].model} updated`)
                }

            };

            const getFirmware = async () => {
                const onuName = await snmp.OnuFirmware(data);
                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].split('=')[1]; //name of onu

                    onu.push({
                        firmware: splitName.replace('STRING: ', '').replace('\"', '').replace('\"', '').trim(),
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    });

                }

                //check if onu data same with database
                if (cekOnu.firmware == onu[0].firmware) {
                    return console.log(`Firmware: ${onu[0].firmware} already exist`)
                } else {
                    const update = await client.db(process.env.MONGO_DB).collection('Snmp.Onu').updateOne({ user: req.user, uid: req.params.id }, { $set: onu[0] });
                    return console.log(`Firmware: ${onu[0].firmware} updated`)
                }

            };

            const getDistance = async () => {
                const onuName = await snmp.OnuDistance(data);
                let onu = [];

                for (let i = 0; i < onuName.length; i++) {
                    const splitName = onuName[i].split('=')[1]; //name of onu
                    const distance = splitName.replace('INTEGER:', '').replace('\"', '').replace('\"', '').trim();

                    onu.push({
                        distance: parseInt(distance),
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    });

                }

                //check if onu data same with database
                if (cekOnu.distance == onu[0].distance) {
                    return console.log(`Distance: ${onu[0].distance} already exist`)
                } else {
                    const update = await client.db(process.env.MONGO_DB).collection('Snmp.Onu').updateOne({ user: req.user, uid: req.params.id }, { $set: onu[0] });
                    return console.log(`Distance: ${onu[0].distance} updated`)
                }
            };

            const getOnuRx = async () => {
                const onuRx = await snmp.OnuRx(data);
                let onu = [];
                let onu_rx;

                for (let i = 0; i < onuRx.length; i++) {
                    const splitName = onuRx[i].split('=')[1]; //name of onu

                    const formulaRX = parseInt(splitName.replace('INTEGER:', '').replace('\"', '').trim()) * 0.002 - 30
                    const fixDecimal = formulaRX.toFixed(2);
                    if (fixDecimal > 100) {
                        onu_rx = 0
                    } else {
                        onu_rx = fixDecimal
                    }

                    onu.push({
                        onu_rx,
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    });

                }

                //check if onu data same with database
                if (cekOnu.onu_rx == onu[0].onu_rx) {
                    return console.log(`onu_rx: ${onu[0].onu_rx} already exist`)
                } else {
                    const update = await client.db(process.env.MONGO_DB).collection('Snmp.Onu').updateOne({ user: req.user, uid: req.params.id }, { $set: onu[0] });
                    return console.log(`onu_rx: ${onu[0].onu_rx} updated`)
                }
            };

            const getOnuTx = async () => {
                const onuTx = await snmp.OnuTx(data);
                let onu = [];
                let onu_tx;

                for (let i = 0; i < onuTx.length; i++) {
                    const splitName = onuTx[i].split('=')[1]; //name of onu

                    const formulaRX = parseInt(splitName.replace('INTEGER:', '').replace('\"', '').trim()) * 0.002 - 30
                    const fixDecimal = formulaRX.toFixed(2);
                    if (fixDecimal > 100) {
                        onu_tx = 0
                    } else {
                        onu_tx = fixDecimal
                    }

                    onu.push({
                        onu_tx,
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    });

                }

                //check if onu data same with database
                if (cekOnu.onu_tx == onu[0].onu_tx) {
                    return console.log(`onu_tx: ${onu[0].onu_tx} already exist`)
                } else {
                    const update = await client.db(process.env.MONGO_DB).collection('Snmp.Onu').updateOne({ user: req.user, uid: req.params.id }, { $set: onu[0] });
                    return console.log(`onu_tx: ${onu[0].onu_tx} updated`)
                }
            };

            const getOnuOltTx = async () => {
                const onuOltRx = await snmp.OnuOltRx(data);
                let onu = [];


                for (let i = 0; i < onuOltRx.length; i++) {
                    const splitName = onuOltRx[i].split('=')[1]; //name of onu

                    onu.push({
                        olt_rx: splitName.replace('INTEGER:', '').replace('\"', '', '').trim() / 1000,
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    });

                }

                //check if onu data same with database
                if (cekOnu.olt_tx == onu[0].olt_rx) {
                    return console.log(`olt_rx: ${onu[0].olt_rx} already exist`)
                } else {
                    const update = await client.db(process.env.MONGO_DB).collection('Snmp.Onu').updateOne({ user: req.user, uid: req.params.id }, { $set: onu[0] });
                    return console.log(`olt_rx: ${onu[0].olt_rx} updated`)
                }
            };

            const getOnuVendor = async () => {
                const onuVendor = await snmp.OnuVendor(data);
                let onu = [];

                for (let i = 0; i < onuVendor.length; i++) {
                    const splitName = onuVendor[i].split('=')[1]; //name of onu

                    onu.push({
                        vendor: splitName.replace('STRING: ', '').replace('\"', '').replace('\"', '').trim(),
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    });

                }

                //check if onu data same with database
                if (cekOnu.vendor == onu[0].vendor) {
                    return console.log(`Vendor: ${onu[0].vendor} already exist`)
                } else {
                    const update = await client.db(process.env.MONGO_DB).collection('Snmp.Onu').updateOne({ user: req.user, uid: req.params.id }, { $set: onu[0] });
                    return console.log(`Vendor: ${onu[0].vendor} updated`)
                }
            };

            const getOnuState = async () => {
                const onuState = await snmp.OnuState(data);
                let onu = [];
                let state;

                for (let i = 0; i < onuState.length; i++) {
                    const splitName = onuState[i].split('=')[1]; //name of onu
                    const StringState = splitName.replace('INTEGER: ', '').replace('\"', '').replace('\"', '').trim();

                    if (StringState == '1') {
                        state = 'Los'
                    } else if (StringState == '3') {
                        state = 'Online'
                    } else if (StringState == '4') {
                        state = 'PowerOff'
                    } else if (StringState == '5') {
                        state = 'Unknown '
                    }


                    onu.push({
                        state,
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    });

                }

                //check if onu data same with database
                if (cekOnu.state == onu[0].state) {
                    return console.log(`State: ${onu[0].state} already exist`)
                } else {
                    const update = await client.db(process.env.MONGO_DB).collection('Snmp.Onu').updateOne({ user: req.user, uid: req.params.id }, { $set: onu[0] });
                    return console.log(`State: ${onu[0].state} updated`)
                }


            };

            await Promise.all([getName(), getDesc(), getModel(), getFirmware(), getDistance(), getOnuRx(), getOnuTx(), getOnuOltTx(), getOnuVendor(), getOnuState()]);

            const hasil = await client.db(process.env.MONGO_DB).collection('Snmp.Onu').findOne({ user: req.user, uid: req.params.id });

            return res.status(200).send({
                data: hasil
            });
        }
        catch (error) {
            return next(
                createError(408, error));
        }
    });//get onu paramater by id


    app.get('/snmp/:id/card', async (req, res, next) => {
        try {

            const olt = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, uid: req.params.id });

            if (!olt) {
                throw createError(404, 'OLT not found');
            }

            const data = {
                snmp: olt.snmp,
                ip: olt.ip,
                snmp_port: olt.snmp_port,
            }

            const card = await snmpLib.CardInformation(data);



            card.forEach(async (element) => {
                const cekCard = await client.db(process.env.MONGO_DB).collection('OLT.Cards').findOne({ user: req.user, olt: req.params.id, slot: element.slot });

                if (!cekCard) {
                    const result = await client.db(process.env.MONGO_DB).collection('OLT.Cards').insertOne({
                        uid: uuidv4(),
                        user: req.user,
                        olt: req.params.id,
                        index: element.index,
                        slot: element.slot,
                        port: element.port,
                        type: element.type,
                        status: element.status,
                        power: element.power,
                        temperature: element.temp,
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    });

                    return console.log(`Card ${element.index} ${element.type} created`);
                } else {

                    const data = {
                        user: req.user,
                        olt: req.params.id,
                        index: element.index,
                        slot: element.slot,
                        port: element.port,
                        type: element.type,
                        status: element.status,
                        power: element.power,
                        temperature: element.temp,
                        updated_at: moment().unix()
                    };

                    const result = await client.db(process.env.MONGO_DB).collection('OLT.Cards').updateOne({ user: req.user, olt: req.params.id, slot: element.slot }, { $set: data });

                    return console.log(`Card ${element.index} ${element.type} updated`);


                }
            });

        }
        catch (error) {
            return next(
                createError(408, error));
        }
    });//get all olt card info


    app.get('/snmp/olt/:id/vlan', async (req, res, next) => {
        try {

            const olt = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, uid: req.params.id });

            if (!olt) {
                throw createError(404, 'OLT not found');
            }

            const data = {
                snmp: olt.snmp,
                ip: olt.ip,
                snmp_port: olt.snmp_port
            }

            const vlan = await snmpLib.OLTVlanList(data);

            vlan.forEach(async (element) => {
                const cekVlan = await client.db(process.env.MONGO_DB).collection('Devices.IfVlan').findOne({ user: req.user, device: req.params.id, id: element.id });

                if (!cekVlan) {
                    const result = await client.db(process.env.MONGO_DB).collection('Devices.IfVlan').insertOne({
                        uid: uuidv4(),
                        user: req.user,
                        device: req.params.id,
                        id: element.id,
                        name: element.name,
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    });

                    return console.log(`Vlan ${element.id} ${element.name} created`);
                } else {

                    const data = {
                        name: element.name,
                        updated_at: moment().unix()
                    };

                    const result = await client.db(process.env.MONGO_DB).collection('OLT.Vlan').updateOne({ user: req.user, device: req.params.id, id: element.id }, { $set: data });

                    return console.log(`Vlan ${element.id} ${element.name} updated`);
                }

            });



        }
        catch (err) {
            return next(
                createError(408, error));
        }
    });

    app.get('/snmp/:id/onulos', async (req, res, next) => {
        try {

            const ifIndex = await client.db(process.env.MONGO_DB).collection('Devices.IfIndex').aggregate([
                {
                    $match: {
                        user: req.user,
                        device: req.params.id,
                        iftype: 'gpon(250)',
                        ifoperstatus: 'up(1)'
                    }
                }, {
                    $lookup: {
                        from: 'Devices',
                        localField: 'device',
                        foreignField: 'uid',
                        as: 'olt'
                    }
                }, {
                    $unwind: '$olt'
                }, {
                    $project: {
                        snmp: '$olt.snmp',
                        ip: '$olt.ip',
                        snmp_port: '$olt.snmp_port',
                        ifindex: '$ifindex',
                        index: '$index',
                        interfaces: '$interfaces',
                        alias: '$ifalias'
                    }
                }
            ]).sort({ ifindex: 1 }).toArray();

            if (ifIndex.length == 0) {
                throw createError(404, 'No pon interfaces found')
            }

            for (let i = 0; i < ifIndex.length; i++) {
                const data = {
                    snmp: ifIndex[i].snmp,
                    ip: ifIndex[i].ip,
                    snmp_port: ifIndex[i].snmp_port,
                    int_olt: ifIndex[i].ifindex
                }



                const walk = await snmpLib.onuState(data);
                walk.forEach(async (element) => {
                    //console.log(element)

                    const duplicate = await client.db(process.env.MONGO_DB).collection('OLT.Onu').findOne({ user: req.user, olt: req.params.id, pon: element.pon, index: element.index });

                    if (duplicate) {
                        const compare = duplicate.pon == element.pon && duplicate.index == element.index && duplicate.state == element.state;
                        if (compare == false) {
                            return console.log(`Onu ${duplicate.sn} state:${duplicate.state} => state:${element.state}`)
                        }
                    }


                });


            }


        }
        catch (error) {
            return next(
                createError(408, error));
        }
    });//Check onu los



};


export default snmpRoute;