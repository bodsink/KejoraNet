import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
moment.locale('id');


import libSnmp from '../Lib/Snmp.js';
const snmp = new libSnmp();

export const OltRoute = (app, client) => {
    app.get('/olt', async (req, res, next) => {
        try {
            const olt = await client.db(process.env.MONGO_DB).collection('Devices').find({ user: req.user, type: 'OLT' }).toArray();

          
            let dataOlt = [];

            for (let i = 0; i < olt.length; i++) {
                const sys = await client.db(process.env.MONGO_DB).collection('Devices.Sys').findOne({ user: req.user, device: olt[i].uid });

                const node = await client.db(process.env.MONGO_DB).collection('Node').findOne({ user: req.user, uid: olt[i].node });
                const pon = await client.db(process.env.MONGO_DB).collection('Devices.IfIndex').countDocuments({ user: req.user, device: olt[i].uid, iftype: 'gpon(250)' });
                const onu = await client.db(process.env.MONGO_DB).collection('OLT.Onu').countDocuments({ user: req.user, olt: olt[i].uid });
               
                dataOlt.push({
                    _id: olt[i]._id,
                    uid: olt[i].uid,
                    user: olt[i].user,
                    ip: olt[i].ip,
                    brand: olt[i].brand,
                    model: olt[i].model,
                    sn: olt[i].sn,
                    node: node,
                    sys: sys,
                    pon: pon,
                    onu
                    
                })
              
            }
           

            return res.status(200).send({
                count: olt.length,
                data: dataOlt
            });


        }
        catch (err) {
            console.log(err)
            return next(
                createError(err.status, err.message));
        }
    });

    app.get('/olt/:id', async (req, res, next) => {
        try {
            const olt = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, uid: req.params.id });

            if(!olt){
                throw createError(404, 'OLT not found');
            }

            const dataCek = {
                snmp: olt.snmp,
                snmp_port: olt.snmp_port,
                ip: olt.ip
            }

            

            const updateSys = async () => {
                const cekSys = await snmp.SystemInformation(dataCek);
            
              //  const findSys = await client.db(process.env.MONGO_DB).collection('Devices.Sys').findOne({ user: req.user, device: olt.uid });
                const dataUpdate = {
                    sysUpTimeInstance: cekSys[0].sysUpTimeInstance,
                    sysName: cekSys[0].sysName,
                    sysDescr: cekSys[0].sysDescr,
                    sysContact: cekSys[0].sysContact,
                    sysLocation: cekSys[0].sysLocation,
                    updated_at: moment().format('LLLL')
                }

                const update = await client.db(process.env.MONGO_DB).collection('Devices.Sys').updateOne({ user: req.user, device: olt.uid }, { $set: dataUpdate });
                console.log(`Update Sys ${olt.uid} ${update.sysUpTimeInstance}`);
            };

            await updateSys();


            const node = await client.db(process.env.MONGO_DB).collection('Node').findOne({ user: req.user, uid: olt.node });

            const sys = await client.db(process.env.MONGO_DB).collection('Devices.Sys').findOne({ user: req.user, device: olt.uid });
            
            const countOnu = await client.db(process.env.MONGO_DB).collection('OLT.Onu').countDocuments({ user: req.user, olt: olt.uid});
            
            const onuOnline = await client.db(process.env.MONGO_DB).collection('OLT.Onu').countDocuments({ user: req.user, olt: olt.uid, state: 4 });

            const onuLos = await client.db(process.env.MONGO_DB).collection('OLT.Onu').countDocuments({ user: req.user, olt: olt.uid, state: 2 });

            const onuPowerOff = await client.db(process.env.MONGO_DB).collection('OLT.Onu').countDocuments({ user: req.user, olt: olt.uid, state: 5 });

            const onuOffline = await client.db(process.env.MONGO_DB).collection('OLT.Onu').countDocuments({ user: req.user, olt: olt.uid, state: 7 });

            const onu = await client.db(process.env.MONGO_DB).collection('OLT.Onu').find({ user: req.user, olt: req.params.id }).toArray();
            const vlan = await client.db(process.env.MONGO_DB).collection('Devices.IfVlan').find({ user: req.user, device: olt.uid}).sort({id: 1}).toArray();
           
            const uplink = await client.db(process.env.MONGO_DB).collection('Devices.IfIndex').find({
                 user: req.user, 
                 device: olt.uid,
                  iftype: 'ethernetCsmacd(6)',
                  ifname: {$not :{$regex: 'Mng1'}}
                 }).sort({ifindex: 1}).toArray();


            const cards = await client.db(process.env.MONGO_DB).collection('OLT.Cards').find({ user: req.user, olt: olt.uid}).sort({slot: 1}).toArray();

            const removeNumberString = (str) => {
                return str.replace(/[0-9]/g, '');
            }

            let a = [];
            for (let i = 0; i < onu.length; i++) {
                a.push({
                    signal: parseInt(onu[i].rx_onu),
                })
            }



            const totalLowSignal = a.filter((item) => item.signal < -25).length;

            const pon = await client.db(process.env.MONGO_DB).collection('Devices.IfIndex').aggregate([
                {
                    $match: {
                        user: req.user,
                        device: olt.uid,
                        iftype: 'gpon(250)'
                    }
                },
                {
                    $lookup: {
                        from: 'OLT.Onu',
                        localField: 'ifindex',
                        foreignField: 'pon',
                        as: 'onu'
                    }
                },
                {
                    $project:{
                        _id: 1,
                        user: 1,
                        uid: 1,
                        device: 1,
                        ifindex: 1,
                        ifalias: 1,
                        ifdesc: 1,
                        ifspeed: 1,
                        ifmtu: 1,
                        ifadminstatus: 1,
                        ifoperstatus: 1,
                        optical: 1,
                        onu_count:{$size: '$onu'},
                        created_at: 1,
                        updated_at: 1
                    }
                }
            ]).sort({ifindex: 1}).toArray();

           
         
            const data = {
                _id:olt._id,
                uid: olt.uid,
                user: olt.user,
                ip: olt.ip,
                brand: olt.brand,
                model: olt.model,
                sn: olt.sn,
                snmp: olt.snmp,
                snmp_port: olt.snmp_port,
                sys: sys,
                node: node,
                pon: pon,
                uplink: uplink,
                cards: cards,
                vlan: vlan,
                onu:{
                    total: countOnu,
                    online: onuOnline,
                    los: onuLos,
                    offline: onuOffline,
                    totalOffline: onuPowerOff + onuLos + onuOffline,
                    low_signal: totalLowSignal,
                    poweroff:onuPowerOff
                }
            }

            return res.status(200).send({
                data: data
            });
            
          

        }
        catch (err) {
            console.log(err.status)
            return next(
                createError(err.status, err.message));
        }
    });

    app.get('/olt/:id/onu', async (req, res, next) => {
        try {
            const olt = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, uid: req.params.id });

            if (!olt) {
                throw createError(404, 'OLT not found');
            }

           
            const onu = await client.db(process.env.MONGO_DB).collection('OLT.Onu').find({
                user: req.user,
                olt: req.params.id,
               
            }).sort({ pon: 1, index: 1 }).toArray();


            const countOnu = await client.db(process.env.MONGO_DB).collection('OLT.Onu').countDocuments({ user: req.user, olt: req.params.id });
            const totalOnline = await client.db(process.env.MONGO_DB).collection('OLT.Onu').countDocuments({ user: req.user, olt: req.params.id, state: 4 });

            return res.status(200).send({
                // pageLength: limit,
                // recordsFiltered: onu.length,
                // total: countOnu,
                // totalNotFiltered: onu.length,
                // totalPages: Math.ceil(onu.length / limit),
                // totalAll: countOnu,
                state: {
                    online: totalOnline,
                },
                rows: onu
            });

        }
        catch (err) {
            console.log(err)
            return next(
                createError(401, err.message));
        }
    });

   

    // app.get('/olt/:id/onu', async (req, res, next) => {
    //     try {
    //         const olt = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, uid: req.params.id });

    //         if (!olt) {
    //             throw createError(404, 'OLT not found');
    //         }

    //         const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    //         const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    //         const search = req.query.search ? req.query.search : '';
    //         const pon = req.query.pon ? req.query.pon : '';

    //         const onu = await client.db(process.env.MONGO_DB).collection('OLT.Onu').find({
    //             user: req.user,
    //             olt: req.params.id,
    //             $or: [
    //                 { sn: { $regex: search, $options: 'i' } },
    //                 { name: { $regex: search, $options: 'i' } }
    //             ]
    //         }).sort({ pon: 1, index: 1 }).skip(offset).limit(limit).toArray();


    //         const countOnu = await client.db(process.env.MONGO_DB).collection('OLT.Onu').countDocuments({ user: req.user, olt: req.params.id });
    //         const totalOnline = await client.db(process.env.MONGO_DB).collection('OLT.Onu').countDocuments({ user: req.user, olt: req.params.id, state: 4 });

    //         return res.status(200).send({
    //             pageLength: limit,
    //             recordsFiltered: onu.length,
    //             total: countOnu,
    //             totalNotFiltered: onu.length,
    //             totalPages: Math.ceil(onu.length / limit),
    //             totalAll: countOnu,
    //             state: {
    //                 online: totalOnline,
    //             },
    //             rows: onu
    //         });

    //     }
    //     catch (err) {
    //         console.log(err)
    //         return next(
    //             createError(401, err.message));
    //     }
    // });

   
};


export default OltRoute;