import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
import { nextTick } from 'process';
import { create } from 'domain';
moment.locale('id');


export const LayananRoute = (app, client) => {
    app.post('/produk', async (req, res, next) => {
        try {

            const {nama, harga, jenis, download,upload} = req.body;

            if (!nama) {
                throw createError(400, 'Please enter nama');
            }

            if(!harga){
                throw createError(400, 'Please enter harga');
            }

            if(!jenis){
                throw createError(400, 'Please enter jenis');
            }

            if(!download){
                throw createError(400, 'Please enter download');
            }

            if(!upload){
                throw createError(400, 'Please enter upload');
            }

            const produk = await client.db(process.env.MONGO_DB).collection('Produk').findOne({ user: req.user, nama: nama });

            if (produk) {
                throw createError(400, 'Produk already exist');
            }

            const user = req.user;
            const uid = uuidv4();

            const data ={
                user,
                uid,
                nama,
                harga,
                jenis,
                download,
                upload,
                created_at: moment().unix(),
                updated_at: moment().unix()
            };

            const save = await client.db(process.env.MONGO_DB).collection('Produk').insertOne(data);

            if (!save) {
                throw createError(500, 'Failed to save data');
            }

            res.status(200).json({
                status: 200,
                message: 'Data saved successfully',
                data: data
            });

        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });

    app.post('/layanan', async (req, res, next) => {
        try {

            const {pelanggan, produk, odp, onu, tikor,alamat} = req.body;

            if (!pelanggan) {
                throw createError(400, 'Please enter pelanggan');
            }

            if(!produk){
                throw createError(400, 'Please enter produk');
            }

            if(!odp){
                throw createError(400, 'Please enter odp');
            }

            if(!onu){
                throw createError(400, 'Please enter onu');
            }

            if(!tikor){
                throw createError(400, 'Please enter tikor');
            }

            const cekPlanggan = await client.db(process.env.MONGO_DB).collection('Pelanggan').findOne({ user: req.user, uid: pelanggan });

            if (!cekPlanggan) {
                throw createError(400, 'Pelanggan not found');
            }

            const cekProduk = await client.db(process.env.MONGO_DB).collection('Produk').findOne({ user: req.user, uid: produk });

            if (!cekProduk) {
                throw createError(400, 'Produk not found');
            }

            const cekODP = await client.db(process.env.MONGO_DB).collection('ODP').findOne({ user: req.user, uid: odp });

            if (!cekODP) {
                throw createError(400, 'ODP not found');
            }

            const duplicate = await client.db(process.env.MONGO_DB).collection('Layanan').findOne({ user: req.user, onu });

            if (duplicate) {
                throw createError(400, 'ONU already exist');
            }

            const CountData = await client.db(process.env.MONGO_DB).collection('Layanan').countDocuments({ user: req.user });

            const user = req.user;
            const uid = uuidv4();
            const nomor = CountData + 1;
            const cid = `${cekODP.cid}${nomor.toString().padStart(4, '0000')}`;

            const data = {
                user,
                uid,
                pelanggan,
                produk,
                odp,
                onu,
                tikor,
                alamat,
                cid,
                status: 'pending',//pending, active, suspend, terminated
                created_at: moment().unix(),
                updated_at: moment().unix()
            };
            
            const save = await client.db(process.env.MONGO_DB).collection('Layanan').insertOne(data);

            if (!save) {
                throw createError(500, 'Failed to save data');
            }

            res.status(200).json({
                status: 200,
                message: 'Data saved successfully',
                data: data
            });



        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });

    app.get('/produk', async (req, res, next) => {
        try {
            const data = await client.db(process.env.MONGO_DB).collection('Produk').find({ user: req.user }).toArray();

            if (!data) {
                throw createError(404, 'Data not found');
            }

            res.status(200).json({
                message: 'Fetch data successfully',
                data: data
            });

        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });

    app.get('/layanan', async (req, res, next) => {
        try {
            const data = await client.db(process.env.MONGO_DB).collection('Layanan').aggregate([
                {
                    $match: { user: req.user }
                },
                {
                    $lookup: {
                        from: 'Pelanggan',
                        localField: 'pelanggan',
                        foreignField: 'uid',
                        as: 'pelanggan'
                    }
                },
                {
                    $lookup: {
                        from: 'Produk',
                        localField: 'produk',
                        foreignField: 'uid',
                        as: 'produk'
                    }
                },
                {
                    $lookup: {
                        from: 'ODP',
                        localField: 'odp',
                        foreignField: 'uid',
                        as: 'odp'
                    }
                },
                {
                    $project: {
                        _id: 0,
                        user: 0,
                        'pelanggan.user': 0,
                        'pelanggan._id': 0,
                        'produk.user': 0,
                        'produk._id': 0,
                        'odp.user': 0,
                        'odp._id': 0
                    }
                }
            ]).toArray();

           console.log(data)

            res.status(200).json({
                message: 'Fetch data successfully',
                data: data
            });

        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });

    app.get('/layanan/:id', async (req, res, next) => {
        try {


            const data = await client.db(process.env.MONGO_DB).collection('Layanan').aggregate([
                {
                    $match: { user: req.user, uid: req.params.id }
                },
                {
                    $lookup: {
                        from: 'Pelanggan',
                        localField: 'pelanggan',
                        foreignField: 'uid',
                        as: 'pelanggan'
                    }
                },
                {
                    $lookup: {
                        from: 'Produk',
                        localField: 'produk',
                        foreignField: 'uid',
                        as: 'produk'
                    }
                },
                {
                    $lookup: {
                        from: 'ODP',
                        localField: 'odp',
                        foreignField: 'uid',
                        as: 'odp'
                    }
                },
                {
                    $unwind: '$odp',

                },{
                    $lookup: {
                        from: 'ODC',
                        localField: 'odp.odc',
                        foreignField: 'uid',
                        as: 'odp.odc'
                    }
                },
                {
                    $unwind: '$odp.odc',
                },{
                    $lookup: {
                        from: 'OLT',
                        localField: 'odp.odc.olt',
                        foreignField: 'uid',
                        as: 'odp.odc.olt'
                    }
                },

                {
                    $lookup:{
                        from: 'Bras',
                        localField: 'bras',
                        foreignField: 'uid',
                        as: 'bras'
                    }
                },{
                    $lookup:{
                        from: 'Onu',
                        localField: 'uid',
                        foreignField: 'id',
                        as: 'onu'
                    
                    }
                }
            ]).toArray();

            if (!data) {
                throw createError(404, 'Data not found');
            }

            res.status(200).json({
                message: 'Fetch data successfully',
                data: data
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });//Detail Layanan by ID
};

export default LayananRoute;

