import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
moment.locale('id');


export const DevicesRoute = (app, client) => {
    app.post('/devices', async (req, res, next) => {
        try {
            const { node, ip, brand, model, sn, snmp, snmp_port, type } = req.body;

            if (!node) {
                throw createError(400, 'Please select node');
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

            if (!sn) {
                throw createError(400, 'Please enter serial number');
            }

            if (!snmp) {
                throw createError(400, 'Please enter SNMP Community');
            }

            if (!snmp_port) {
                throw createError(400, 'Please enter SNMP Port');
            }

            if (!type) {
                throw createError(400, 'Please select Devices Type');
            }

            if (type != 'Router' && type != 'OLT' && type != 'Switch') {
                throw createError(400, 'Device type must be Router, OLT or Switch');
            }

            const cekNode = await client.db(process.env.MONGO_DB).collection('Node').findOne({ user: req.user, uid: node });

            if (!cekNode) {
                throw createError(404, 'Node not found');
            }

            const cekDuplicate = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, ip: ip });

            if (cekDuplicate) {
                throw createError(409, 'IP already exist');
            }

            const data = {
                uid: uuidv4(),
                user: req.user,
                node: node,
                ip: ip,
                brand: brand,
                model: model,
                sn: sn,
                snmp: snmp,
                snmp_port: snmp_port,
                type: type,
                created_at: moment().unix(),
                updated_at: moment().unix()
            }


            const save = await client.db(process.env.MONGO_DB).collection('Devices').insertOne(data);

            if (!save) {
                throw createError(500, 'Internal server error');
            }

            res.status(201).json({
                status: 200,
                message: 'Device has been added',
                data: data
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });

    app.get('/devices/:id', async (req, res, next) => {
        try {
           const devices = await client.db(process.env.MONGO_DB).collection('Devices').findOne({ user: req.user, uid: req.params.id });

            if (!devices) {
                throw createError(404, 'Device not found');
            }

            const sys = await client.db(process.env.MONGO_DB).collection('Devices.Sys').findOne({ user: req.user, device: req.params.id });

            if (!sys) {
                throw createError(404, 'Device not found');
            }

            

            const ifindex = await client.db(process.env.MONGO_DB).collection('Devices.IfIndex').find({ user: req.user, device: req.params.id }).sort({ ifindex: 1 }).toArray();

           
            const data = {
                _id: devices._id,
                uid: devices.uid,
                user: devices.user,
                node: devices.node,
                ip: devices.ip,
                brand: devices.brand,
                model: devices.model,
                sn: devices.sn,
                snmp: devices.snmp,
                snmp_port: devices.snmp_port,
                type: devices.type,
                sys: sys,
                interfaces: ifindex,
                created_at: devices.created_at,
                updated_at: devices.updated_at
            }

           
            res.status(200).send({
                status: 200,
                message: 'Success',
                data: data
            });


        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });
};

export default DevicesRoute;