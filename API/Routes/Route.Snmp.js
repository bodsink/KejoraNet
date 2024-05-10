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


export const snmpRoute = (app, client) => {

    app.post('/snmp/sys', async (req, res, next) => {
        try {

            const { id } = req.body

            if (!id) {
                throw createError(404, 'Device id harus di isi');
            }

            const devices = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, uid: id });

            if (!devices) {
                throw createError(404, 'Perangkat tidak ditemukan');
            }

            const data = {
                snmp: devices.snmp,
                ip: devices.ip,
                snmp_port: devices.snmp_port,
            }

            const sys = await snmpLib.SystemInformation(data);

            for (let i = 0; i < sys.length; i++) {
                const duplicate = await client.db(process.env.MONGO_DB).collection('IfSys').findOne({ user: req.user, device: id });

                if (duplicate) {
                    const dataUpdate = {
                        sysDescr: sys[i].sysDescr,
                        sysUpTime: sys[i].sysUpTimeInstance,
                        sysContact: sys[i].sysContact,
                        sysName: sys[i].sysName,
                        sysLocation: sys[i].sysLocation,
                        updated_at: moment().unix()
                    }

                    const update = await client.db(process.env.MONGO_DB).collection('IfSys').updateOne({ user: req.user, device: id }, { $set: dataUpdate });
                    if (update) {
                        return res.status(200).send({
                            message: `System ${sys[i].sysName} berhasil di update`,
                            data: {
                                uid: uuidv4(),
                                user: req.user,
                                device: id,
                                sysDescr: dataUpdate.sysDescr,
                                sysUpTime: dataUpdate.sysUpTime,
                                sysContact: dataUpdate.sysContact,
                                sysName: dataUpdate.sysName,
                                sysLocation: dataUpdate.sysLocation,
                                created_at: duplicate.created_at,
                                updated_at: dataUpdate.updated_at
                            }
                        })
                    } else {
                        return res.status(400).send({
                            message: `System ${sys[i].sysName} gagal di update`,
                        })

                    }

                } else {
                    const dataSave = {
                        uid: uuidv4(),
                        user: req.user,
                        device: id,
                        sysDescr: sys[i].sysDescr,
                        sysUpTime: sys[i].sysUpTimeInstance,
                        sysContact: sys[i].sysContact,
                        sysName: sys[i].sysName,
                        sysLocation: sys[i].sysLocation,
                        created_at: moment().unix(),
                    }
                    const result = await client.db(process.env.MONGO_DB).collection('IfSys').insertOne(dataSave);

                    if (result) {
                        return res.status(201).send({
                            message: `System ${sys[i].sysName} berhasil disimpan`,
                            data: dataSave
                        })
                    } else {
                        return res.status(400).send({
                            message: `System ${sys[i].sysName} gagal disimpan`,
                        })
                    }
                }
            }
        }
        catch (error) {
            return next(
                createError(408, error));
        }
    });//get system info by id

    app.post('/snmp/ifindex', async (req, res, next) => {
        try {

            const { id } = req.body

            if (!id) {
                throw createError(404, 'Device id harus di isi');
            }

            const devices = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, uid: id });
            if (!devices) {
                throw createError(404, 'Olt not found');
            }

            const data = {
                snmp: devices.snmp,
                ip: devices.ip,
                snmp_port: devices.snmp_port
            }

            const ifIndex = await snmpLib.ifIndex(data);

            let interfaces = [];

            for (let i = 0; i < ifIndex.length; i++) {
                const duplicate = await client.db(process.env.MONGO_DB).collection('IfIndex').findOne({ user: req.user, device: devices.uid, ifindex: ifIndex[i].ifindex });

                if (duplicate) {

                    if (duplicate.ifname == ifIndex[i].ifName &&
                        duplicate.ifalias == ifIndex[i].ifAlias &&
                        duplicate.ifdesc == ifIndex[i].ifDesc &&
                        duplicate.iftype == ifIndex[i].ifType &&
                        duplicate.ifmtu == ifIndex[i].ifMtu &&
                        duplicate.ifspeed == ifIndex[i].ifSpeed &&
                        duplicate.ifadminstatus == ifIndex[i].ifAdminStatus &&
                        duplicate.ifoperstatus == ifIndex[i].ifOperStatus

                    ) {
                        console.log(`IfIndex ${ifIndex[i].ifName} tidak ada perubahan`);
                        interfaces.push(duplicate)
                    } else {
                        const dataUpdate = {
                            ifindex: ifIndex[i].ifindex,
                            ifname: ifIndex[i].ifName,
                            ifalias: ifIndex[i].ifAlias,
                            ifdesc: ifIndex[i].ifDesc,
                            iftype: ifIndex[i].ifType,
                            ifmtu: ifIndex[i].ifMtu,
                            ifspeed: parseInt(ifIndex[i].ifSpeed),
                            ifadminstatus: ifIndex[i].ifAdminStatus,
                            ifoperstatus: ifIndex[i].ifOperStatus,
                            updated_at: moment().unix()
                        }

                        const update = await client.db(process.env.MONGO_DB).collection('IfIndex').updateOne({ user: req.user, device: devices.uid, ifindex: ifIndex[i].ifindex }, { $set: dataUpdate });
                        if (update) {
                            console.log(`IfIndex ${ifIndex[i].ifName} berhasil di update`);
                            interfaces.push(dataUpdate)

                        } else {
                            console.log(`IfIndex ${ifIndex[i].ifName} gagal di update`);

                        }
                    }

                } else {
                    const dataSave = {
                        user: req.user,
                        uid: uuidv4(),
                        device: devices.uid,
                        ifindex: ifIndex[i].ifindex,
                        ifname: ifIndex[i].ifName,
                        ifalias: ifIndex[i].ifAlias,
                        ifdesc: ifIndex[i].ifDesc,
                        iftype: ifIndex[i].ifType,
                        ifmtu: ifIndex[i].ifMtu,
                        ifspeed: parseInt(ifIndex[i].ifSpeed),
                        ifadminstatus: ifIndex[i].ifAdminStatus,
                        ifoperstatus: ifIndex[i].ifOperStatus,
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    }
                    const result = await client.db(process.env.MONGO_DB).collection('IfIndex').insertOne(dataSave);

                    if (result) {
                        console.log(`IfIndex ${ifIndex[i].ifName} berhasil disimpan`);
                        interfaces.push(dataSave)
                    } else {
                        console.log(`IfIndex ${ifIndex[i].ifName} gagal disimpan`)
                    }
                }
            }


            return res.status(200).send({
                count: interfaces.length,
                data: interfaces
            });

        }
        catch (error) {
            return next(
                createError(408, error));
        }
    });//get all ifindex info

    app.post('/snmp/onu', async (req, res, next) => {
        try {

            const { olt } = req.body;

            if (!olt) {
                throw createError(404, 'Olt Id harus di isi!');
            }

            const ifIndex = await client.db(process.env.MONGO_DB).collection('IfIndex').aggregate([
                {
                    $match: {
                        user: req.user,
                        device: olt,
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

            let onu = [];

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
                }

                for (let j = 0; j < walk.length; j++) {

                    const duplicate = await client.db(process.env.MONGO_DB).collection('Onu').findOne({
                        user: req.user,
                        olt: olt,
                        pon: walk[j].pon,
                        index: walk[j].index
                    });



                    if (duplicate) {
                        const dataUpdate = {
                            sn: walk[j].sn,
                            name: walk[j].name,
                            description: walk[j].description,
                            distance: walk[j].distance,
                            state: walk[j].state,
                            rx_olt: walk[j].rx_olt,
                            rx_onu: walk[j].rx_onu,
                            tx_onu: walk[j].tx_onu,
                            model: walk[j].model,
                            firmware: walk[j].firmware,
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
                           console.log(`Onu ${duplicate.interface} => ${walk[j].sn} tidak ada perubahan`)


                        } else {
                            const update = await client.db(process.env.MONGO_DB).collection('Onu').updateOne({
                                user: req.user,
                                olt: olt,
                                pon: datasave.pon,
                                index: datasave.index
                            }, { $set: dataUpdate });

                            if (update && update.modifiedCount > 0) {
                                console.log(`Onu ${duplicate.interface} => ${walk[j].sn} updated`)
                                //onu.push(dataUpdate)
                            } else {
                                console.log(`Onu ${duplicate.sn} not updated`)
                            }

                        }

                    } else {
                        const datasave = {
                            user: req.user,
                            uid: uuidv4(),
                            olt: olt,
                            pon: walk[j].pon,
                            index: walk[j].index,
                            interface: `${ifIndex[i].alias}:${walk[j].index}`,
                            sn: walk[j].sn,
                            name: walk[j].name,
                            description: walk[j].description,
                            distance: walk[j].distance,
                            state: walk[j].state,
                            model: walk[j].model,
                            firmware: walk[j].firmware,
                            rx_olt: walk[j].rx_olt,
                            rx_onu: walk[j].rx_onu,
                            tx_onu: walk[j].tx_onu,
                            tcont: walk[j].tcont,
                            gemport: walk[j].gemport,
                            created_at: moment().unix(),
                        };
                        
                        const save = await client.db(process.env.MONGO_DB).collection('Onu').insertOne(datasave);
                        if (save) {
                            console.log(`Onu found sn:${walk[j].sn}=>${datasave.interface}, success registered`);
                            // onu.push(datasave)
                        } else {
                            console.log(`Onu ${datasave.sn} failed register`)
                        }
                    }


                }

                // return res.status(200).send({
                //     count: onu.length,
                //     data: onu
                // });


            }
        }
        catch (error) {
            return next(
                createError(408, error));
        }
    });//get all onu info

    app.post('/snmp/optical', async (req, res, next) => {
        try {

            const { id } = req.body;

            if (!id) {
                throw createError(404, 'Device id harus di isi');
            }

            const ifIndex = await client.db(process.env.MONGO_DB).collection('IfIndex').aggregate([
                {
                    $match: {
                        user: req.user,
                        device: id
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
                throw createError(404, 'Device not found')
            }

            let optical = [];
            for (let i = 0; i < ifIndex.length; i++) {
                const dataSnmp = {
                    snmp: ifIndex[i].olt.snmp,
                    ip: ifIndex[i].olt.ip,
                    snmp_port: ifIndex[i].olt.snmp_port,
                    interfaces: ifIndex[i].ifindex
                }

                const opticalInfo = await snmpLib.ifIndexOptical(dataSnmp);

                for (let j = 0; j < opticalInfo.length; j++) {


                    const duplicate = await client.db(process.env.MONGO_DB).collection('IfOptical').findOne({ user: req.user, device: id, ifindex: ifIndex[i].ifindex });

                    if (duplicate) {

                        const dataUpdate = {
                            name: opticalInfo[j].name,
                            pn: opticalInfo[j].pn,
                            sn: opticalInfo[j].sn,
                            type: opticalInfo[j].type,
                            con: opticalInfo[j].con,
                            distance: opticalInfo[j].distance,
                            rx: opticalInfo[j].rx,
                            tx: opticalInfo[j].tx,
                            bias: opticalInfo[j].bias,
                            voltage: opticalInfo[j].voltage,
                            lamda: opticalInfo[j].lamda,
                            temperature: opticalInfo[j].temperature,
                            updated_at: moment().unix()
                        }

                        const update = await client.db(process.env.MONGO_DB).collection('IfOptical').updateOne({ user: req.user, device: id, ifindex: ifIndex[i].ifindex }, { $set: dataUpdate });

                        if (update) {
                            optical.push({
                                user: req.user,
                                uid: uuidv4(),
                                device: id,
                                ifindex: ifIndex[i].ifindex,
                                name: opticalInfo[j].name,
                                pn: opticalInfo[j].pn,
                                sn: opticalInfo[j].sn,
                                type: opticalInfo[j].type,
                                con: opticalInfo[j].con,
                                distance: opticalInfo[j].distance,
                                rx: opticalInfo[j].rx,
                                tx: opticalInfo[j].tx,
                                bias: opticalInfo[j].bias,
                                voltage: opticalInfo[j].voltage,
                                lamda: opticalInfo[j].lamda,
                                temperature: opticalInfo[j].temperature,
                                updated_at: moment().unix()
                            })
                        }

                    } else {
                        const dataSave = {
                            user: req.user,
                            uid: uuidv4(),
                            device: id,
                            ifindex: ifIndex[i].ifindex,
                            name: opticalInfo[j].name,
                            pn: opticalInfo[j].pn,
                            sn: opticalInfo[j].sn,
                            type: opticalInfo[j].type,
                            con: opticalInfo[j].con,
                            distance: opticalInfo[j].distance,
                            rx: opticalInfo[j].rx,
                            tx: opticalInfo[j].tx,
                            bias: opticalInfo[j].bias,
                            voltage: opticalInfo[j].voltage,
                            lamda: opticalInfo[j].lamda,
                            temperature: opticalInfo[j].temperature,
                            created_at: moment().unix(),
                            updated_at: moment().unix()
                        }

                        const result = await client.db(process.env.MONGO_DB).collection('IfOptical').insertOne(dataSave);

                        if (result) {
                            optical.push({
                                user: req.user,
                                uid: uuidv4(),
                                device: id,
                                ifindex: ifIndex[i].ifindex,
                                name: opticalInfo[j].name,
                                pn: opticalInfo[j].pn,
                                sn: opticalInfo[j].sn,
                                type: opticalInfo[j].type,
                                con: opticalInfo[j].con,
                                distance: opticalInfo[j].distance,
                                rx: opticalInfo[j].rx,
                                tx: opticalInfo[j].tx,
                                bias: opticalInfo[j].bias,
                                voltage: opticalInfo[j].voltage,
                                lamda: opticalInfo[j].lamda,
                                temperature: opticalInfo[j].temperature,
                                created_at: moment().unix(),
                                updated_at: moment().unix()
                            })
                        }
                    }

                }

            }

            return res.status(200).send({
                count: optical.length,
                data: optical
            })

        }
        catch (error) {
            console.log(error)
            return next(
                createError(408, error));
        }
    });//get all optical info


    app.post('/snmp/olt/cards', async (req, res, next) => {
        try {

            const { id } = req.body;

            if (!id) {
                throw createError(404, 'Device id harus di isi');
            }

            const olt = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, uid: id });

            if (!olt) {
                throw createError(404, 'OLT not found');
            }

            const data = {
                snmp: olt.snmp,
                ip: olt.ip,
                snmp_port: olt.snmp_port,
            }

            const card = await snmpLib.CardInformation(data);

            let cards = [];

            for (let i = 0; i < card.length; i++) {

                const duplicate = await client.db(process.env.MONGO_DB).collection('OLT.Cards').findOne({ user: req.user, device: id, slot: card[i].slot });
                if (duplicate) {
                    if (duplicate.index == card[i].index &&
                        duplicate.slot == card[i].slot &&
                        duplicate.port == card[i].port &&
                        duplicate.type == card[i].type &&
                        duplicate.status == card[i].status &&
                        duplicate.power == card[i].power &&
                        duplicate.temperature == card[i].temp
                    ) {
                        console.log(`Card ${card[i].index} ${card[i].type} tidak ada perubahan`)
                    } else {
                        const dataUpdate = {
                            index: card[i].index,
                            slot: card[i].slot,
                            port: card[i].port,
                            type: card[i].type,
                            status: card[i].status,
                            power: card[i].power,
                            temperature: card[i].temp,
                            updated_at: moment().unix()
                        }

                        const update = await client.db(process.env.MONGO_DB).collection('OLT.Cards').updateOne({ user: req.user, device: id, slot: card[i].slot }, { $set: dataUpdate });

                        if (update && update.modifiedCount > 0) {
                            console.log(`Card ${card[i].index} ${card[i].type} updated`)
                            cards.push(dataUpdate)
                        } else {
                            console.log(`Card ${card[i].index} ${card[i].type} not updated`)
                            cards.push(duplicate)
                        }

                    }
                } else {
                    const dataSave = {
                        uid: uuidv4(),
                        user: req.user,
                        device: id,
                        index: card[i].index,
                        slot: card[i].slot,
                        port: card[i].port,
                        type: card[i].type,
                        status: card[i].status,
                        power: card[i].power,
                        temperature: card[i].temp,
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    }

                    const result = await client.db(process.env.MONGO_DB).collection('OLT.Cards').insertOne(dataSave);

                    if (result) {
                        console.log(`Card ${card[i].index} ${card[i].type} created`)
                        cards.push(dataSave)
                    } else {
                        console.log(`Card ${card[i].index} ${card[i].type} not created`)
                    }
                }
            }

            return res.status(200).send({
                count: cards.length,
                data: cards
            })

        }
        catch (error) {
            return next(
                createError(408, error));
        }
    });//get all olt card info


    app.post('/snmp/vlans', async (req, res, next) => {
        try {

            const { id } = req.body;

            if (!id) {
                throw createError(404, 'Device id harus di isi');
            }

            const olt = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, uid: id });

            if (!olt) {
                throw createError(404, 'Device not found');
            }

            const data = {
                snmp: olt.snmp,
                ip: olt.ip,
                snmp_port: olt.snmp_port
            }

            const vlan = await snmpLib.OLTVlanList(data);

            let vlans = [];

            for (let i = 0; i < vlan.length; i++) {
                const duplicate = await client.db(process.env.MONGO_DB).collection('IfVlan').findOne({ user: req.user, device: id, id: vlan[i].id });

                if (duplicate) {

                    const dataUpdate = {
                        name: vlan[i].name,
                        updated_at: moment().unix()
                    }

                    const update = await client.db(process.env.MONGO_DB).collection('IfVlan').updateOne({ user: req.user, device: id, id: vlan[i].id }, { $set: dataUpdate });

                    if (update && update.modifiedCount > 0) {
                        console.log(`Vlan ${vlan[i].id} ${vlan[i].name} updated`)
                        vlans.push(dataUpdate)
                    } else {
                        console.log(`Vlan ${vlan[i].id} ${vlan[i].name} not updated`)
                    }

                } else {
                    const dataSave = {
                        uid: uuidv4(),
                        user: req.user,
                        device: id,
                        id: vlan[i].id,
                        name: vlan[i].name,
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    }

                    const result = await client.db(process.env.MONGO_DB).collection('IfVlan').insertOne(dataSave);

                    if (result) {
                        console.log(`Vlan ${vlan[i].id} ${vlan[i].name} telah di simpan`)
                        vlans.push(dataSave)
                    } else {
                        console.log(`Vlan ${vlan[i].id} ${vlan[i].name} gagal di simpan`)
                    }
                }
            }

            return res.status(200).send({
                count: vlans.length,
                data: vlans
            })

        }
        catch (err) {
            return next(
                createError(err.status, err));
        }
    });

    app.post('/snmp/onu/los', async (req, res, next) => {
        try {

            const { id } = req.body;

            const olt = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, uid: id });

            const onu = await client.db(process.env.MONGO_DB).collection('Onu').aggregate([
                {
                    $match: {
                        user: req.user,
                        olt:id
                    }
                }, {
                    $lookup: {
                        from: 'IfIndex',
                        localField: 'pon',
                        foreignField: 'ifindex',
                        as: 'pon'
                    }
                }, {
                    $unwind: '$pon'
                }
            ]).sort({ ifindex: 1 }).toArray();

            for (let i = 0; i < onu.length; i++) {
                const data = {
                    snmp: olt.snmp,
                    ip: olt.ip,
                    snmp_port: olt.snmp_port,
                    onu: `${onu[i].pon.ifindex}.${onu[i].index}`
                }

              
               const walk = await snmpLib.onuState(data);
               console.log(walk)
                


            }


        }
        catch (error) {
            return next(
                createError(408, error));
        }
    });//Check onu los

    app.post('/snmp/onu/uncfg', async (req, res, next) => {
        try {

            const { id } = req.body;
            if (!id) {
                throw createError(404, 'Device id harus di isi');
            }

            const olt = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, uid: id });

            if (!olt) {
                throw createError(404, 'OLT not found');
            }

            const data = {
                snmp: olt.snmp,
                ip: olt.ip,
                snmp_port: olt.snmp_port
            }

            const uncfg = await snmpLib.unconfiguredOnu(data);

            let onu = [];

            for (let i = 0; i < uncfg.length; i++) {
                const cekPon = await client.db(process.env.MONGO_DB).collection('IfIndex').findOne({ user: req.user, device: id, ifindex: uncfg[i].pon });
                onu.push({
                    pon: cekPon.ifalias,
                    index: uncfg[i].index,
                    sn: uncfg[i].sn,
                    date: moment().unix(),

                })
            }

            return res.status(200).send({
                count: onu.length,
                data: onu
            })

        }
        catch (error) {
            return next(
                createError(408, error));
        }
    });//get all unconfigured onu



};


export default snmpRoute;