import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
moment.locale('id');

import libSnmp from '../Lib/Snmp.js';
const snmp = new libSnmp();

import libOlt from '../Lib/Olt.js';
const olt = new libOlt();

import Acs from '../Class/Class.Acs.js';
const acs = new Acs();


export const OnuRoute = (app, client) => {
    app.post('/onu', async (req, res, next) => {
        try {

            const { sn, port, id } = req.body;

            if (!sn) {
                createError(400, 'Please enter merek');
            }

            if (!port) {
                throw createError(400, 'Please enter port ex: gpon-onu_1/3/1:19, index, ex: 19, olt, ex: gpon-olt_1/3/1');
            }

            if (!id) {
                throw createError(400, 'Please enter id onu, ex: id layanan');
            }


            const layanan = await client.db(process.env.MONGO_DB).collection('Layanan').findOne({ user: req.user, uid: id });
            if (!layanan) {
                throw createError(400, 'Layanan not found');
            }

            const onu = await client.db(process.env.MONGO_DB).collection('Onu').findOne({ user: req.user, sn: sn, status: 'active' });

            if (onu) {
                throw createError(400, 'Onu already active ');
            }

            const user = req.user;
            const uid = uuidv4();

            const data = {
                user,
                uid,
                sn,
                port: {
                    gpon: port.gpon,
                    index: port.index,
                    olt: port.olt
                },
                id,
                created_at: moment().unix(),
                updated_at: moment().unix()
            };

            const save = await client.db(process.env.MONGO_DB).collection('Onu').insertOne(data);

            if (!save) {
                throw createError(500, 'Failed to save data');
            }

            res.status(200).send({
                status: 200,
                message: 'Data saved successfully',
                data: data
            });

        }
        catch (error) {
            return next(
                createError(error.status, error.message));
        }
    });//Post Onu

    app.get('/onu', async (req, res, next) => {
        try {
            const onu = await client.db(process.env.MONGO_DB).collection('Onu').aggregate([
                {
                    $match: {
                        user: req.user
                    }
                },
                {
                    $lookup: {
                        from: 'OnuHistory',
                        localField: 'sn',
                        foreignField: 'onu',
                        as: 'history'
                    }
                }
            ]).toArray();

            if (!onu) {
                throw createError(400, 'Onu not found');
            }

            res.status(200).send({
                status: 200,
                message: 'Data found',
                data: onu
            });
        }
        catch (error) {
            console.log(error)
            res.status(500).send(error.message);
        }
    });//Get All Onu

    app.get('/onu/:id', async (req, res, next) => {
        try {



            const onu = await client.db(process.env.MONGO_DB).collection('OLT.Onu').aggregate([
                {
                    $match: {
                        user: req.user,
                        uid: req.params.id
                    }
                },
                {
                    $lookup: {
                        from: 'Devices',
                        localField: 'olt',
                        foreignField: 'uid',
                        as: 'olt'
                    }
                }, {
                    $unwind: '$olt',
                }, {
                    $lookup: {
                        from: 'Devices.Sys',
                        localField: 'olt.uid',
                        foreignField: 'device',
                        as: 'olt.sys'
                    }
                }, {
                    $unwind: '$olt.sys'
                }
            ]).toArray();

    
            if (onu.length == 0) {
                throw createError(404, 'Onu not found');
            }

            const data = {
                snmp: onu[0].olt.snmp,
                ip: onu[0].olt.ip,
                snmp_port: onu[0].olt.snmp_port,
                int_olt: `${onu[0].pon}.${onu[0].index}`
            }


            const scan = await snmp.scanOnu(data);


            if (scan > 0) {
                return console.log('error')
            }

            const onuEth = await snmp.zxAnGponRmEthUni(data)

            const dataUpdata = {
                sn: scan[0].sn,
                name: scan[0].name,
                description: scan[0].description,
                state: scan[0].state,
                model: scan[0].model,
                firmware: scan[0].firmware,
                rx_olt: scan[0].rx_olt,
                rx_onu: scan[0].rx_onu,
                tx_onu: scan[0].tx_onu,
                tcont: scan[0].tcont,
                gemport: scan[0].gemport,
                ethernet: onuEth,
                updated_at: moment().unix()

            }

            const update = await client.db(process.env.MONGO_DB).collection('OLT.Onu').updateOne({ user: req.user, uid: req.params.id }, { $set: dataUpdata });


            const getUpdate = await client.db(process.env.MONGO_DB).collection('OLT.Onu').findOne({ user: req.user, uid: req.params.id });

            const setting = await client.db(process.env.MONGO_DB).collection('Settings').findOne({ user: req.user });


            const dataAcs = {
                url: setting.acs.url,
                client: setting.acs.CF_Access_Client_Id,
                secret: setting.acs.CF_Access_Client_Secret,
                sn: onu[0].sn
            }

            let bras = [];
            let acsResppnse = [];
            let wifi = [];

            if (onu[0].model == 'HG6145D2' || onu[0].model == 'HG6145F' || onu[0].model == 'F660') {
                const getAcsSN = await acs.getOnu(dataAcs);

                const dataSummon = {
                    url: setting.acs.url,
                    client: setting.acs.CF_Access_Client_Id,
                    secret: setting.acs.CF_Access_Client_Secret,
                    onu: getAcsSN[0]._id,
                    data: {
                        "name": "refreshObject",
                        "objectName": ""
                    }
                }

                // const summon = await acs.Summon(dataSummon);

                // setTimeout(() => {
                //     console.log(summon)
                // }, 1000);



                const getAcs = await acs.getOnu(dataAcs);

                acsResppnse = getAcs;

               // console.log(getAcs[0].InternetGatewayDevice.LANDevice['1'].WLANConfiguration['1'].SSID)

               const totalSecs = getAcs[0].InternetGatewayDevice.DeviceInfo.UpTime._value

                let days = Math.floor(totalSecs / 86400);
                let rem = totalSecs % 86400;
                let hrs = Math.floor(rem / 3600);
                if (hrs < 10) {
                    hrs = "0" + hrs;
                }

                rem = rem % 3600;
                let mins = Math.floor(rem / 60);
                if (mins < 10) {
                    mins = "0" + mins;
                }
                let secs = rem % 60;
                if (secs < 10) {
                    secs = "0" + secs;
                }

                let uptime = days + "d " + hrs + ":" + mins + ":" + secs;


                if (getAcs.length == 0) {
                    bras = null;
                } else {
                    for (let i = 1; i <= 3; i++) {

                        if (getAcs[0].InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i]) {
                           
                            if (getAcs[0].InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i].WANPPPConnection['1']) {
                                bras.push({
                                    id: i,
                                    user: getAcs[0].InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i].WANPPPConnection['1'].Username,
                                    vlan: getAcs[0].InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i].WANPPPConnection['1'].VLANID,
                                    ip: getAcs[0].InternetGatewayDevice.WANDevice['1'].WANConnectionDevice[i].WANPPPConnection['1'].ExternalIPAddress,
                                    uptime: uptime
                                })

                                wifi.push({
                                    ssid: acsResppnse[0].InternetGatewayDevice.LANDevice['1'].WLANConfiguration['1'].SSID,
                                    users: acsResppnse[0].InternetGatewayDevice.LANDevice['1'].WLANConfiguration['1'].WLAN_AssociatedDeviceNumberOfEntries
                                
                                })

                            }
                        }
                    }
                }

               
            } else {
                bras = [];
                wifi= [];
            }

            res.status(200).send({
                data: getUpdate,
                olt: onu[0].olt,
                bras: bras,
                wlan:wifi
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(400, 'Onu not found'));
        }
    });//Get Onu by ID


    app.get('/onu/olt/:id', async (req, res, next) => {
        try {

            const offset = +req.query.offset || 0
            const limit = +req.query.limit || 25
            const search = req.query.search || ''
            const sort = req.query.sort
            const order = req.query.order || 'asc'
            const total = req.query.total
            const filter = JSON.parse(req.query.filter || '{}')
            const sleep = req.query.sleep || 0

            const pon = req.query.pon || '';


            const onu = await client.db(process.env.MONGO_DB).collection('OLT.Onu').aggregate([
                {
                    $match: {
                        user: req.user,
                        olt: req.params.id,
                        $or: [
                            { name: { $regex: search, $options: 'i' } },
                            { sn: { $regex: search, $options: 'i' } },

                        ]

                    }
                },
                {
                    $lookup: {
                        from: 'Snmp.Pon',
                        localField: 'pon',
                        foreignField: 'olt_id',
                        as: 'pon'
                    }
                }, {
                    $unwind: '$pon',
                }
            ]).skip(offset)
                .limit(limit)
                .sort({ pon: 1, index: 1, 'pon.olt_id': 1 })
                .toArray();



            const count = await client.db(process.env.MONGO_DB).collection('OLT.Onu').countDocuments({ user: req.user, olt: req.params.id });


            const totalPage = Math.ceil(count / limit + 1);


            return res.status(200).send({
                pageLength: limit,
                recordsFiltered: count,
                total: count,
                totalNotFiltered: count,
                totalPages: totalPage,
                totalAll: count,
                totalPages: Math.ceil(count / limit),
                rows: onu
            });
        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));

        }
    });//Get Onu by Olt pakai data tables

    app.post('/onu/:id/reboot', async (req, res, next) => {
        try {

            const { id } = req.params;
            const onu = await client.db(process.env.MONGO_DB).collection('OLT.Onu').findOne({ user: req.user, uid: id });

            if (!onu) {
                throw createError(400, 'Onu not found');
            }

            const olt = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, uid: onu.olt });

            const data = {
                snmp: olt.snmp,
                ip: olt.ip,
                snmp_port: olt.snmp_port,
                onu: `${onu.pon}.${onu.index}`
            }

            if(!req.body.reason){
                throw createError(400, 'Please enter reason why you want to reboot onu?');
            }

           const reboot = await snmp.RebootOnu(data);
           console.log(reboot)

           if(reboot){
                const dataHistory = {
                    user: req.user,
                    onu: onu.uid,
                    reason: req.body.reason,
                    created_at: moment().unix()
                }

                await client.db(process.env.MONGO_DB).collection('OnuLogs').insertOne(dataHistory);

                return res.status(200).send({
                     status: 200,
                     message: 'Onu has been rebooted, please wait for a few moments'
                });
           } else {
                throw createError(500, 'Failed to reboot onu');
              
           }

            
            
        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });//reboot onu

};

export default OnuRoute;
