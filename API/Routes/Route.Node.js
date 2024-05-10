import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
import { nextTick } from 'process';
moment.locale('id');

export const NodeRoute = (app, client) => {
    app.post('/node', async (req, res, next) => {
        try {
            const { nama, alamat, cid, shortname, tikor } = req.body;

            if(!nama){
                throw createError(400, 'Nama node tidak boleh kosong');
            }

            if(!alamat){
                throw createError(400, 'Alamat node tidak boleh kosong');
            }

            if(!cid){
                throw createError(400, 'CID node tidak boleh kosong');
            }

            if(!shortname){
                throw createError(400, 'Shortname node tidak boleh kosong');
            }   

            if(!tikor){
                throw createError(400, 'Tikor node tidak boleh kosong');
            }


            const node = await client.db(process.env.MONGO_DB).collection('Node').findOne({ nama });

            if (node) {
                throw createError(400, 'Node already exists');
            }

            const data = {
                user: req.user,
                uid: uuidv4(),
                nama,
                shortname,
                alamat,
                cid,
                tikor,
                created_at: moment().unix(),
                updated_at: moment().unix()
            };

            const result = await client.db(process.env.MONGO_DB).collection('Node').insertOne(data);

            

            return res.status(201).send({
                success: true,
                message: 'Node berhasil ditambahkan',
                data: data
            });
        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });

    app.get('/node', async (req, res, next) => {
        try {
            const node = await client.db(process.env.MONGO_DB).collection('Node').aggregate([
                {
                    $match: { user: req.user }
                },
                {
                    $lookup: {
                        from: 'Router',
                        localField: 'uid',
                        foreignField: 'node',
                        as: 'router'
                    }
                },
                {
                    $lookup: {
                        from: 'Switch',
                        localField: 'uid',
                        foreignField: 'node',
                        as: 'switch'
                    }
                },
                {
                    $lookup: {
                        from: 'OLT',
                        localField: 'uid',
                        foreignField: 'node',
                        as: 'olt'
                    }
                }
            ]).toArray();

            if(node.length === 0){
                return res.status(200).send({
                    message: 'Node tidak dtemukan, silahkan tambahkan node terlebih dahulu',
                    data: []
                });
            }

            const totalOdp = await client.db(process.env.MONGO_DB).collection('ODP').aggregate([
                {
                    $match: { user: req.user }
                }, {
                    $group: {
                        _id: '$splitter',
                        odp: { $sum: 1  },
                        homepass: { $sum: '$splitter' }

                    }
                }
            ]).toArray();


            const totalPelanggan = await client.db(process.env.MONGO_DB).collection('Pelanggan').countDocuments({ user: req.user });

            const totalODC = await client.db(process.env.MONGO_DB).collection('ODC').countDocuments({ user: req.user });

            const totalLayanan = await client.db(process.env.MONGO_DB).collection('Layanan').countDocuments({ user: req.user });

            return res.status(200).send({
                pelanggan: totalPelanggan > 0 ? totalPelanggan : [],
                homepass: totalOdp.length > 0 ? totalOdp : [],
                odc: totalODC > 0 ? totalODC : [],
                layanan: totalLayanan > 0 ? totalLayanan : [],
                data: node.length > 0 ? node : []
            });
        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });

    app.get('/node/:id', async (req, res, next) => {
        try {
            const node = await client.db(process.env.MONGO_DB).collection('Node').aggregate([
                {
                    $match: { user: req.user, uid: req.params.id }
                },
                {
                    $lookup: {
                        from: 'Router',
                        localField: 'uid',
                        foreignField: 'node',
                        as: 'router'
                    }
                },
                {
                    $lookup: {
                        from: 'Switch',
                        localField: 'uid',
                        foreignField: 'node',
                        as: 'switch'
                    }
                },
                {
                    $lookup: {
                        from: 'OLT',
                        localField: 'uid',
                        foreignField: 'node',
                        as: 'olt'
                    }
                }
            ]).toArray();
        

            if(node.length === 0){
                throw createError(404, 'Node not found');
            }

            return res.status(200).send({
                success: true,
                message: 'Node fetched successfully',
                data: node
            });
        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });
};

export default NodeRoute;


