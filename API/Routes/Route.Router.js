import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
moment.locale('id');

export const RouterRoute = (app, client) => {
    app.post('/router', async (req, res, next) => {
        try {
            const { node, ip, brand, model, sn, snmp, snmp_port, functions } = req.body;
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

            if(!snmp_port){
                throw createError(400, 'Please enter SNMP Port');
            }

            if (!functions) {
                throw createError(400, 'Please select functions');
            }

            if (functions != 'Border' && functions != 'Bras' && functions != 'Access') {
                throw createError(400, 'Router Functions must be Border, Bras or Access');
            }


            const cekNode = await client.db(process.env.MONGO_DB).collection('Node').findOne({ user: req.user, uid: node });

            if (!cekNode) {
                throw createError(404, 'Node not found');
            }

         

            const cekDuplicateOlt = await client.db(process.env.MONGO_DB).collection('Router').findOne({ user: req.user, ip: ip});
            const cekDuplicateRouter = await client.db(process.env.MONGO_DB).collection('OLT').findOne({ user: req.user, ip: ip });
            const cekDuplicateSwitch = await client.db(process.env.MONGO_DB).collection('Switch').findOne({ user: req.user, ip: ip });

            if(cekDuplicateOlt || cekDuplicateRouter || cekDuplicateSwitch){
                throw createError(409, 'IP already exist');
            }

            let fungsi;

            if (functions == 'Border') {
                fungsi = 'BRDR';
            } else if (functions == 'Bras') {
                fungsi = 'BRAS';
            } else {
                fungsi = 'ACCS';
            }

            const TotalRouter = await client.db(process.env.MONGO_DB).collection('Router').countDocuments({ user: req.user });

            const user = req.user;
            const uid = uuidv4();
            const nomor = TotalRouter + 1;
            const hostname = `${fungsi}${nomor.toString().padStart(2, '0')}.${cekNode.shortname}`;
            const cid = `${cekNode.cid}1${nomor.toString().padStart(2, '0')}`;

            const data = {
                user,
                uid,
                node,
                functions,
                cid: cid,
                hostname: hostname,
                ip: ip,
                brand: brand,
                model: model,
                sn: sn,
                snmp: snmp,
                snmp_port: snmp_port,
                created_at: moment().unix(),
                updated_at: moment().unix()
            };

            const result = await client.db(process.env.MONGO_DB).collection('Router').insertOne(data);

            if (result.insertedCount === 0) {
                throw createError(500, 'Failed to create router');
            }

            return res.status(201).send({
                success: true,
                message: 'Router created successfully',
                data
            });

        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });
};

export default RouterRoute;