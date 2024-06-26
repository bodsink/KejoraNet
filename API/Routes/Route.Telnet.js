import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
moment.locale('id');

import TelnetClient from '../Class/Class.Telnet.js';

const telnet = new TelnetClient();

export const TelnetRoute = (app, client) => {
    app.get('/olt/:id/system', async (req, res, next) => {
        try {

            const { id } = req.params;
           
            const olt = await client.db(process.env.MONGO_DB).collection('OLT').findOne({ user: req.user, uid: id });
            if (!olt) {
                throw createError(404, 'Olt not found');
            }

            telnet.host = olt.ip;
            telnet.port = olt.telnet_port;
            telnet.username = olt.username;
            telnet.password = olt.password;

            const conn = await telnet.getTelnet();
            const Letsystem = (await conn.send('show system-group \nshow clock')).replace('show system-group', '').replace('end', '').replace('!', '').replace(`${olt.hostname}#`, '');
            // console.log(Letsystem)
            const findDescription = Letsystem.search('System Description:');
            const findSystemObjectId = Letsystem.search('System ObjectId:');
            const findUptime = Letsystem.search('Started before:');
            const findContact = Letsystem.search('Contact with:');
            const findHostname = Letsystem.search('System name:');
            const findLocation = Letsystem.search('Location:');
            const findClock = Letsystem.search('show clock');
            

            const Description = Letsystem.substring(findDescription, findSystemObjectId).replace('System Description:', '').replace(', Copyright (c) by ZTE Corporati\r\non Compiled\r ','').trim();
            const Uptime = Letsystem.substring(findUptime, findContact).replace('Started before:', '').replace('\r ','').trim();
            const Hostname = Letsystem.substring(findHostname, findLocation).replace('System name:', '').replace('\r ','').trim();
            const Clock = Letsystem.substring(findClock).replace('show clock', '').replace('\r ','').trim().split('\n').filter(Boolean);

            conn.end(); // disconnect telnet

            res.status(200).send({
                data: {
                    description: Description,
                    uptime: Uptime,
                    hostname: Hostname,
                    clock: Clock[0].replace('\r', ''),
                }
            })


        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });

    app.get('/olt/:id/onu', async (req, res, next) => {
        try {

            const { id } = req.params;

            const olt = await client.db(process.env.MONGO_DB).collection('OLT').findOne({ user: req.user, uid: id });
            if (!olt) {
                throw createError(404, 'Olt not found');
            }

            telnet.host = olt.ip;
            telnet.port = olt.telnet_port;
            telnet.username = olt.username;
            telnet.password = olt.password;

            if (req.query.port) {
                const conn = await telnet.getTelnet();
                const pon = await conn.send(`show gpon onu detail-info ${req.query.port} \n show card \n show gpon remote-onu interface pon ${req.query.port} \n show gpon remote-onu equip ${req.query.port}`);
                

                const parse = pon.replace(`show gpon onu detail-info ${req.query.port}`, '').replace('--More--\b \b\b \b\b \b\b \b\b \b\b \b\b \b\b \b\b \b', '').replace(`show gpon remote-onu equip ${req.query.port}`, '').replace(`${olt.hostname}#`, '');
               
                const findAdminState = parse.search('Admin state: ');
                const findOperState = parse.search('Phase state: ');
                const findConfigSteta = parse.search('Config state: ');
                const findSerialNumber = parse.search('Serial number: ');
                const findPassword = parse.search('Password: ');
                const findDistance = parse.search('ONU Distance:');
                const findUptime = parse.search('Online Duration:');
                const findFec = parse.search('FEC:');

                const adminState = parse.substring(findAdminState, findOperState).replace('Admin state: ', '').trim();
                const operState = parse.substring(findOperState, findConfigSteta).replace('Phase state: ', '').trim();
                const serialNumber = parse.substring(findSerialNumber, findPassword).replace('Serial number: ', '').trim();
                const distance = parse.substring(findDistance, findUptime).replace('ONU Distance:', '').trim();
                const uptime = parse.substring(findUptime, findFec).replace('Online Duration:', '').trim();



                const findRx = parse.search('Rx optical level:');
                const findLowerRx = parse.search('Lower rx optical threshold:');
                const findTx = parse.search('Tx optical level:');
                const findLowerTx = parse.search('Lower tx optical threshold:');
                const findPowerFeed = parse.search('Power feed voltage:');
                const findBiasCurrent = parse.search('Laser bias current:');
                const findTemperature = parse.search('Temperature:');
                const findVendor = parse.search('Vendor ID:');
                const findVersion = parse.search('Version:');
                const findSN = parse.search('SN:');
                const findModel = parse.search('Model:');
                const findSurvival = parse.search('Survival time:');


                const rx = parse.substring(findRx, findLowerRx).replace('Rx optical level:', '').trim();
                const tx = parse.substring(findTx, findLowerTx).replace('Tx optical level:', '').trim();
                const powerFeed = parse.substring(findPowerFeed, findBiasCurrent).replace('Power feed voltage:', '').trim();
                const biasCurrent = parse.substring(findBiasCurrent, findTemperature).replace('Laser bias current:', '').trim();
                const temperature = parse.substring(findTemperature, findVendor ).replace('Temperature:', '').replace(`${olt.hostname}#`, '').trim();
                const Version = parse.substring(findVersion, findSN).replace('Version:', '').trim();
                const Model = parse.substring(findModel, findSurvival).replace('Model:', '').trim();
               


                const data = {
                    port: req.query.port,
                    sn: serialNumber,
                    admin: adminState,
                    status: operState,
                    distance: distance,
                    uptime: uptime,
                    rx: rx,
                    tx: tx,
                    power: powerFeed,
                    bias: biasCurrent,
                    temperature: temperature,
                    version: Version,
                    model: Model
                }

                res.status(200).send({
                    data: data
                })


                conn.end(); // disconnect telnet
            }



        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });

};

export default TelnetRoute;

// Path: API/Routes/Route.Telnet.js