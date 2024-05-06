import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
import { nextTick } from 'process';
moment.locale('id');

export const PembayaranRoute = (app, client) => {
    app.post('/pembayaran', async (req, res, next) => {
        try {
            const { tagihan, tgl, jumlah, bank, ref } = req.body;

            if (!tagihan) {
                throw createError(400, 'Please select tagihan');
            }

            if (!tgl) {
                throw createError(400, 'Please enter tgl');
            }

            if (!jumlah) {
                throw createError(400, 'Please enter jumlah');
            }

            if (!bank) {
                throw createError(400, 'Please select bank');
            }

            if (!ref) {
                throw createError(400, 'Please enter Bank Transaction Code');
            }

            const tagihanData = await client.db(process.env.MONGO_DB).collection('Tagihan').findOne({ user: req.user, uid: tagihan });

            if (!tagihanData) {
                throw createError(400, 'Tagihan not found');
            }

            // if(tagihanData.status === 'Paid'){
            //     throw createError(400, 'Tagihan already paid');
            // }

            const CountData = await client.db(process.env.MONGO_DB).collection('Pembayaran').countDocuments({ user: req.user });

            const user = req.user;
            const uid = uuidv4();
            const nomor = `${moment().format('YYMMDDhhmmss')}${CountData.toString().padStart(2, '0') + 1}`;
            const total = tagihanData.total;
            const bayar = jumlah;
            const kembali = bayar - total;

            const data = {
                user,
                uid,
                nomor,
                tagihan,
                tgl,
                jumlah,
                bank,
                ref,
                created_at: moment().unix(),
                updated_at: moment().unix()
            };

           const save = await client.db(process.env.MONGO_DB).collection('Pembayaran').insertOne(data);

            if (save.insertedCount === 0) {
                throw createError(500, 'Failed to save data');
            }

            const updateTagihan = await client.db(process.env.MONGO_DB).collection('Tagihan').updateOne({ user: req.user, uid: tagihan }, { $set: { status: 'Paid' } });

            if (updateTagihan.modifiedCount === 0) {
                throw createError(500, 'Failed to update tagihan');
            }

            res.status(201).send({
                status: 'success',
                message: 'Data saved',
                data: data,updateTagihan
            
            })
          
        } catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });
};

export default PembayaranRoute;