import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
moment.locale('id');


export const SwitchRoute = (app, client) => {
    app.post('/switch', async (req, res, next) => {
        try {
            const { node, ip, brand, model, sn, port } = req.body;

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

            const cekDuplicate = await client.db(process.env.MONGO_DB).collection('Switch').findOne({user:req.user, ip: ip });
            if (cekDuplicate) {
                throw createError(409, 'IP already exist');
            }

            const TotalSwitch = await client.db(process.env.MONGO_DB).collection('Switch').countDocuments({ user: req.user});

            const user = req.user;
            const uid = uuidv4();
            const nomor = TotalSwitch + 1;
            const hostname = `SW${nomor.toString().padStart(2, '0')}.${cekNode.shortname}`;
            const cid = `${cekNode.cid}2${nomor.toString().padStart(2, '0')}`;

            const data = {
                user,
                uid,
                node,
                cid: cid,
                hostname: hostname,
                ip: ip,
                brand: brand,
                model: model,
                sn: sn,
                port: {
                    gigabit: port.gigabit,
                    tengigabit: port.tengigabit,
                },
                created_at: moment().unix(),
                updated_at: moment().unix()
            };

            const result = await client.db(process.env.MONGO_DB).collection('Switch').insertOne(data);

            if (result.insertedCount === 0) {
                throw createError(500, 'Failed to create switch');
            }

            return res.status(201).send({
                success: true,
                message: 'Switch created successfully',
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

export default SwitchRoute;

