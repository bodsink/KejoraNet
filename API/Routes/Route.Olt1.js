import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
moment.locale('id');


import TelnetClient from '../Class/Class.Telnet.js';
const telnet = new TelnetClient();

import libSnmp from '../Lib/Snmp.js';
const snmp = new libSnmp();


export const OltRoute = (app, client) => {
    app.post('/olt', async (req, res, next) => {
        try {
            const { node, ip, brand, model, sn, port, pon, hostname } = req.body;
            if (!node) {
                throw createError(400, 'Please select node');

            }

            if (!hostname) {
                throw createError(400, 'Please enter hostname');
            }

            if (!ip) {
                throw createError(400, 'Please enter IP address');
            }
            if (!brand) {
                throw createError(400, 'Please enter brand');
            }

            if (!model) {
                throw createError(400, 'Please enter model');
            }

            if (!pon) {
                throw createError(400, 'Please enter PON');
            }

            if (!sn) {
                throw createError(400, 'Please enter serial number');
            }
            if (!port) {
                throw createError(400, 'Please enter port');
            }

            if (!port.gigabit) {
                throw createError(400, 'Number of Port Gigabit cannot be empty');
            }

            if (!port.tengigabit) {
                throw createError(400, 'Number of Port TenGigabit cannot be empty');
            }

            const cekNode = await client.db(process.env.MONGO_DB).collection('Node').findOne({ user: req.user, uid: node });

            if (!cekNode) {
                throw createError(404, 'Node not found');
            }

            const DuplicateOlt = await client.db(process.env.MONGO_DB).collection('OLT').findOne({ user: req.user, ip: ip });
            const DuplicateRouter = await client.db(process.env.MONGO_DB).collection('Router').findOne({ user: req.user, ip: ip });
            const DuplicateSwitch = await client.db(process.env.MONGO_DB).collection('Switch').findOne({ user: req.user, ip: ip });

            if (DuplicateOlt || DuplicateRouter || DuplicateSwitch) {
                throw createError(400, 'IP address already exists');
            }


            const CountOdc = await client.db(process.env.MONGO_DB).collection('OLT').countDocuments({ user: req.user, node });

            const user = req.user;
            const uid = uuidv4();
            const nomor = CountOdc + 1;
            const cid = `${cekNode.cid}3${nomor.toString().padStart(2, '0')}`;

            const data = {
                user,
                uid,
                node,
                ip,
                brand,
                model,
                sn,
                pon,
                port: {
                    gigabit: port.gigabit,
                    tengigabit: port.tengigabit
                },
                hostname,
                cid,
                created_at: moment().unix(),
                updated_at: moment().unix()
            };

            const result = await client.db(process.env.MONGO_DB).collection('OLT').insertOne(data);

            if (result.insertedCount === 0) {
                throw createError(500, 'Failed to create OLT');
            }

            return res.status(201).send({
                success: true,
                message: 'OLT created successfully',
                data: result
            });
        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });

    app.get('/olt', async (req, res, next) => {
        try {
            const result = await client.db(process.env.MONGO_DB).collection('OLT').aggregate([
                {
                    $match: { user: req.user }
                },
                {
                    $lookup: {
                        from: 'Node',
                        localField: 'node',
                        foreignField: 'uid',
                        as: 'node'
                    }
                },
                {
                    $project: {
                        _id: 0,
                        user: 1,
                        uid: 1,
                        node: { $arrayElemAt: ['$node', 0] },
                        ip: 1,
                        brand: 1,
                        model: 1,
                        sn: 1,
                        port: 1,
                        pon: 1,
                        hostname: 1,
                        cid: 1,
                        created_at: 1,
                        updated_at: 1
                    }
                }
            ]).toArray();

            if (!result) {
                throw createError(404, 'OLT not found');
            }

            return res.status(200).send({
                success: true,
                message: 'Get All OLT',
                data: result
            });
        }
        catch (error) {
            return next(
                createError(500, 'Failed to get OLT'));
        }
    });//Get All OLT

    app.get('/olt/:id', async (req, res, next) => {
        try {
            const olt = await client.db(process.env.MONGO_DB).collection('OLT').aggregate([
                {
                    $match: { user: req.user, uid: req.params.id }
                },
                {
                    $lookup: {
                        from: 'Node',
                        localField: 'node',
                        foreignField: 'uid',
                        as: 'node'
                    }
                }
            ]).toArray();

            if (olt.length === 0) {
                throw createError(404, 'OLT not found');
            }

            const totalOnuOnline = await client.db(process.env.MONGO_DB).collection('IfOnu').countDocuments({ user: req.user, olt: req.params.id, state: 4 });
            const totalOnu = await client.db(process.env.MONGO_DB).collection('IfOnu').countDocuments({ user: req.user, olt: req.params.id });
            const totalOnuLos = await client.db(process.env.MONGO_DB).collection('IfOnu').countDocuments({ user: req.user, olt: req.params.id, state: 2 });
            const totalOnuPowerOff = await client.db(process.env.MONGO_DB).collection('IfOnu').countDocuments({ user: req.user, olt: req.params.id, state: 5 });
            const sysDesc = await client.db(process.env.MONGO_DB).collection('Snmp.Devices').findOne({ user: req.user, id: req.params.id });

            const onu = await client.db(process.env.MONGO_DB).collection('IfOnu').find({ user: req.user, olt: req.params.id }).toArray();



            let a = [];
            for (let i = 0; i < onu.length; i++) {
                a.push({
                    signal: parseInt(onu[i].rx_onu),
                })
            }



            const totalLowSignal = a.filter((item) => item.signal < -25).length;

            return res.status(200).send({
                sys: sysDesc,
                onu:{
                    total: totalOnu,
                    online: totalOnuOnline,
                    offline: totalOnuLos + totalOnuPowerOff,
                    poweroff: totalOnuPowerOff,
                    los: totalOnuLos,
                    low_signal: totalLowSignal

                },
                data: olt
            });
        }
        catch (error) {
            console.log(error)
            return next(
                createError(500, 'Failed to get OLT'));
        }
    });//Get olt by id


    app.post('/olt/onu', async (req, res, next) => {
        try {
            const { pon, type, sn, index } = req.body;

            if (!pon) {
                throw createError(400, 'Please enter Port PON ');
            }

            if (!type) {
                throw createError(400, 'Please enter type ONU');
            }

            if (!sn) {
                throw createError(400, 'Please enter ONU serial number');
            }

            if (!index) {
                throw createError(400, 'Please enter Number index ONU');
            }

            const cekPon = await client.db(process.env.MONGO_DB).collection('OLT.Pon').findOne({ user: req.user, uid: pon });

            if (!cekPon) {
                throw createError(404, 'PON not found');
            }

            const duplicate = await client.db(process.env.MONGO_DB).collection('OLT.Pon.Onu').findOne({ user: req.user, pon, sn });

            if (duplicate) {
                throw createError(400, 'ONU already exists');
            }

            const user = req.user;
            const uid = uuidv4();

            const data = {
                user,
                uid,
                pon,
                type,
                sn,
                index,
                port: cekPon.gpon + ':' + index,
                created_at: moment().unix(),
                updated_at: moment().unix()
            };


            const result = await client.db(process.env.MONGO_DB).collection('OLT.Pon.Onu').insertOne(data);

            if (result.insertedCount === 0) {
                throw createError(500, 'Failed to create ONU');
            }

            return res.status(201).send({
                success: true,
                message: 'ONU created successfully',
                data: data
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });//Register ONU on PON

    app.get('/olt/:olt/onu', async (req, res, next) => {
        try {
            const olt = await client.db(process.env.MONGO_DB).collection('OLT').findOne({ user: req.user, uid: req.params.olt });

            if (!olt) {
                throw createError(404, 'OLT not found');
            }

            const offset = req.query.offset ? parseInt(req.query.offset) : 0;
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const search = req.query.search ? req.query.search : '';
            const pon = req.query.pon ? req.query.pon : '';

            const onu = await client.db(process.env.MONGO_DB).collection('IfOnu').find({
                user: req.user,
                olt: req.params.olt,
                $or: [
                    { sn: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } }
                ]
            }).sort({ pon_index: 1, index: 1 }).skip(offset).limit(limit).toArray();


            const countOnu = await client.db(process.env.MONGO_DB).collection('IfOnu').countDocuments({ user: req.user, olt: req.params.olt });
            const totalOnline = await client.db(process.env.MONGO_DB).collection('IfOnu').countDocuments({ user: req.user, olt: req.params.olt, state: 4 });

            return res.status(200).send({
                pageLength: limit,
                recordsFiltered: onu.length,
                total: countOnu,
                totalNotFiltered: onu.length,
                totalPages: Math.ceil(onu.length / limit),
                totalAll: countOnu,
                state: {
                    online: totalOnline,
                },
                rows: onu
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(500, 'Failed to get ONU'));
        }
    });//get onu by pon

    app.get('/olt/:id/pon', async (req, res, next) => {
        try {

            const pon = await client.db(process.env.MONGO_DB).collection('IfIndex').aggregate([
                {
                    $match: { user: req.user, device: req.params.id, iftype: 'gpon(250)' }
                },
                {
                    $lookup: {
                        from: 'IfOnu',
                        localField: 'ifindex',
                        foreignField: 'pon_id',
                        as: 'onu'
                    }
                },{
                    $project:{
                        _id:0,
                        user:1,
                        device:1,
                        ifindex:1,
                        ifname:1,
                        ifdesc:1,
                        ifalias:1,
                        iftype:1,
                        ifspeed:1,
                        ifmtu:1,
                        ifstatus:1,
                        ifoperstatus:1,
                        optical:1,
                       // onu:1,
                        onu: { $size: '$onu' }
                    }

                }
            ]).sort({index:1, ifindex: 1 }).toArray();

           

            res.status(200).send({
                count: pon.length,
                data: pon
            });


        }
        catch (error) {
            console.log(error)
            return next(
                createError(500, 'Failed to get PON'));
        }
    });//Get PON by OLT

    app.get('/olt/:id/uplink', async (req, res, next) => {
        try {

            const ifIndex = await client.db(process.env.MONGO_DB).collection('IfIndex').aggregate([
                {
                    $match: { 
                        user: req.user, 
                        device: req.params.id, 
                        iftype: 'ethernetCsmacd(6)',
                        ifname: {$not :{$regex: 'Mng1'}}
                    }
                },{
                    $project:{
                        _id:0,
                        user:1,
                        device:1,
                        ifindex:1,
                        ifname: 1,
                        ifdesc:1,
                        ifalias:1,
                        iftype:1,
                        ifspeed:1,
                        ifmtu:1,
                        ifstatus:1,
                        ifoperstatus:1,
                        optical: 1
                    
                    }
                }
            ]).sort({ index: 1,ifindex: 1 }).toArray();

           

            res.status(200).send({
                count: ifIndex.length,
                data: ifIndex
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(500, 'Failed to get Uplink'));
        }
    });//Get Uplink by OLT

    app.get('/olt/:id/cards', async (req, res, next) => {
        try {

            const cards = await client.db(process.env.MONGO_DB).collection('OLT.Cards').find({ user: req.user, olt: req.params.id }).sort({ slot: 1 }).toArray();

           

            res.status(200).send({
                count: cards.length,
                data: cards
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(500, 'Failed to get Cards'));
        }
    });//Get Cards by OLT

};

export default OltRoute;