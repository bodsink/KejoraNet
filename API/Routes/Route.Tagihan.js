import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
import { nextTick } from 'process';
import { count } from 'console';
moment.locale('id');

export const TagihanRoute = (app, client) => {
    app.post('/tagihan', async (req, res, next) => {
        try {

            const {layanan, tgl , due} = req.body;

           

            if (!layanan) {
                throw createError(400, 'Please select layanan');
            }

            if(!tgl){
                throw createError(400, 'Please enter tgl');
            }

            if(!due){
                throw createError(400, 'Please enter due');
            }


            const layananData = await client.db(process.env.MONGO_DB).collection('Layanan').findOne({ user: req.user, uid: layanan });

            if (!layananData) {
                throw createError(400, 'Layanan not found');
            }

            const produkData = await client.db(process.env.MONGO_DB).collection('Produk').findOne({ user: req.user, uid: layananData.produk });

            if (!produkData) {
                throw createError(400, 'Produk not found');
            }


            const CountData = await client.db(process.env.MONGO_DB).collection('Tagihan').countDocuments({ user: req.user });

            const user = req.user;
            const uid = uuidv4();
            const produk = produkData.nama;
            const count = CountData + 1;
            const nomor = `${count.toString().padStart(6, '0')}`;
            const jumlah = produkData.harga;
            const pelanggan = layananData.pelanggan;
            const ppn = jumlah * 11 / 100;
            const total = jumlah + ppn;

            const data = {
                user: req.user,
                uid: uuidv4(),
                nomor,
                pelanggan,
                layanan,
                produk,
                tgl,
                due,
                jumlah,
                ppn,
                total,
                status: 'Open', // Open, Paid, Overdue
                created_at: moment().unix(),
                updated_at: moment().unix()
            }

            const save = await client.db(process.env.MONGO_DB).collection('Tagihan').insertOne(data);

            res.status(201).send({
                success: true,
                message: 'Tagihan berhasil dibuat',
                data
            
            })

        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    }); // Create Invoice

    app.post('/tagihan/cron/overdue', async (req, res, next) => {
        try {

            const tagihanData = await client.db(process.env.MONGO_DB).collection('Tagihan').find({ user: req.user, status: 'Open' }).toArray();

            if (tagihanData.length === 0) {
                return res.status(200).send({
                    message: 'No Invoice found'
                });
            }

            const now = moment().unix();
            const overdue = tagihanData.filter((item) => {
                return item.due < now;
            });

            if (overdue.length === 0) {
                return res.status(200).send({
                    message: 'No Invoice overdue found'
                });
            }

            overdue.forEach(async (item) => {
                const update = await client.db(process.env.MONGO_DB).collection('Tagihan').updateOne({ user: req.user, uid: item.uid }, { $set: { status: 'Overdue' } });
            });

            res.status(200).send({
                message: 'Invoice overdue found',
                count: overdue.length
            });
            

        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    }); // Cron job to check overdue invoice

    app.get('/tagihan/:uid', async (req, res, next) => {
        try {
            const tagihanData = await client.db(process.env.MONGO_DB).collection('Tagihan').aggregate([
                {
                    $match: {
                        user: req.user,
                        uid: req.params.uid
                    }
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
                        from: 'Pembayaran',
                        localField: 'uid',
                        foreignField: 'tagihan',
                        as: 'pembayaran'
                    }
                },
                
            ]).toArray();

            if (tagihanData.length === 0) {
                throw createError(404, 'Invoice not found');
            }

            res.status(200).send({
                success: true,
                data: tagihanData[0]
            });
            

        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    }); // Get Invoice by ID

};

export default TagihanRoute;