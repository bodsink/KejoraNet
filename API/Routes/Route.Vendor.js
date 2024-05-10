import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
moment.locale('id');


export const VendorRoute = (app, client) => {
    app.post('/vendor', async (req, res, next) => {
        try {
            const { name, address, phone } = req.body;

            let email;

            if (!name) {
                throw createError(400, 'Please enter vendor name');
            }

            if (!address) {
                throw createError(400, 'Please enter vendor address');
            }

            if (!phone) {
                throw createError(400, 'Please enter vendor phone');
            }

            if (!req.body.email) {
                email = null;
            }

            const cekDuplicate = await client.db(process.env.MONGO_DB).collection('Vendor').findOne({ name: name, phone: phone });

            if (cekDuplicate) {
                throw createError(409, 'Vendor already exist');
            }

            const data = {
                user: req.user,
                uid: uuidv4(),
                name: name,
                address: address,
                phone: phone,
                email: email,
                created_at: moment().unix(),
                updated_at: moment().unix()
            }

            const save = await client.db(process.env.MONGO_DB).collection('Vendor').insertOne(data);

            if (!save) {
                throw createError(500, 'Failed to save data');
            }

            res.status(201).json({
                status: 'success',
                message: 'Vendor successfully added',
                data: data
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });//add vendor

    app.post('/vendor/produk/kategori', async (req, res, next) => {
        try {

            const { name, description } = req.body;

            if (!name) {
                throw createError(400, 'Please enter category name');
            }

            if (!description) {
                throw createError(400, 'Please enter category description');
            }

            const cekDuplicate = await client.db(process.env.MONGO_DB).collection('Vendor.Produk.Kategori').findOne({ name: name, user: req.user });

            if (cekDuplicate) {
                throw createError(409, 'Category already exist');
            }

            const data = {
                user: req.user,
                uid: uuidv4(),
                name: name,
                description: description,
                created_at: moment().unix(),
                updated_at: moment().unix()
            }

            const save = await client.db(process.env.MONGO_DB).collection('Vendor.Produk.Kategori').insertOne(data);

            if (!save) {
                throw createError(500, 'Failed to save data');
            }

            res.status(201).send({
                status: 'success',
                message: 'Category successfully added',
                data: data
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });//add kategori produk vendor

    app.post('/vendor/produk', async (req, res, next) => {
        try {

            const { name, harga, satuan, kategori } = req.body;

            if (!name) {
                throw createError(400, 'Please enter produk name');
            }

            if (!harga) {
                throw createError(400, 'Please enter produk price');
            }

            if (!satuan) {
                throw createError(400, 'Please enter produk unit');
            }

            if (!kategori) {
                throw createError(400, 'Please enter produk category');
            }

            const cekKategori = await client.db(process.env.MONGO_DB).collection('Vendor.Produk.Kategori').findOne({ uid: kategori, user: req.user });

            if (!cekKategori) {
                throw createError(404, 'Category not found');
            }

            const cekDuplicate = await client.db(process.env.MONGO_DB).collection('Vendor.Produk').findOne({ name: name, user: req.user });

            if (cekDuplicate) {
                throw createError(409, 'Produk already exist');
            }

            const data = {
                user: req.user,
                uid: uuidv4(),
                name: name,
                harga: harga,
                satuan: satuan,
                kategori: kategori,
                created_at: moment().unix(),
                updated_at: moment().unix()
            }

            const save = await client.db(process.env.MONGO_DB).collection('Vendor.Produk').insertOne(data);

            if (!save) {
                throw createError(500, 'Failed to save data');
            }

            res.status(201).json({
                status: 'success',
                message: 'Produk successfully added',
                data: data
            });



        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });//add produk vendor

    app.post('/vendor/po', async (req, res, next) => {
        try {
            const { vendor, produk, qty, ekpedisi, ongkir, date, due } = req.body;

            let ppn;

            if (!vendor) {
                throw createError(400, 'Please enter vendor');
            }

            if (!produk) {
                throw createError(400, 'Please enter produk');
            }

            if (!qty) {
                throw createError(400, 'Please enter qty');
            }

            if (!ekpedisi) {
                throw createError(400, 'Please enter ekpedisi');
            }

            if (!ongkir) {
                throw createError(400, 'Please enter ongkir');
            }

            if (!date) {
                throw createError(400, 'Please enter date of po');
            }

            if (!due) {
                throw createError(400, 'Please enter due date of po');
            }


            const cekVendor = await client.db(process.env.MONGO_DB).collection('Vendor').findOne({ uid: vendor, user: req.user });

            if (!cekVendor) {
                throw createError(404, 'Vendor not found');
            }

            const cekProduk = await client.db(process.env.MONGO_DB).collection('Vendor.Produk').findOne({ uid: produk, user: req.user });

            if (!cekProduk) {
                throw createError(404, 'Produk not found');
            }

            if (!ppn) {
                ppn = 0;
            } else {
                ppn = cekProduk.harga * 11 / 100;
            }


            const nomor = 'PO.' + Math.floor(1000 + Math.random() * 9000) + '/BKT/' + moment().format('MM/YYYY');
            console.log(nomor)

            const data = {
                user: req.user,
                uid: uuidv4(),
                nomor: nomor,
                date: date,
                due: due,
                vendor: vendor,
                produk: produk,
                satuan: cekProduk.harga,
                qty: qty,
                ppn: ppn,
                ekpedisi: ekpedisi,
                ongkir: ongkir,
                total: cekProduk.harga * qty + ongkir,
                status: 'pending',
                created_at: moment().unix(),
                updated_at: moment().unix()
            }

            const save = await client.db(process.env.MONGO_DB).collection('Vendor.PO').insertOne(data);

            if (!save) {
                throw createError(500, 'Failed to save data');
            }

            return res.status(201).send({
                status: 'success',
                message: 'PO successfully added',
                data: data
            });


        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });//add po vendor

    app.post('/vendor/po/:id/approve', async (req, res, next) => {
        try {
            const { po } = req.params.id;

           

            const cekPO = await client.db(process.env.MONGO_DB).collection('Vendor.PO').findOne({ uid: po, user: req.user });

            if (!cekPO) {
                throw createError(404, 'PO not found');
            }

            if (cekPO.status === 'approved') {
                throw createError(409, 'PO already approved');
            }

            const update = await client.db(process.env.MONGO_DB).collection('Vendor.PO').updateOne({ uid: po }, { $set: { status: 'approved', updated_at: moment().unix() } });

            if (update.modifiedCount === 0) {
                throw createError(500, 'Failed to update data');
            }

            return res.status(200).send({
                status: 'success',
                message: 'PO successfully approved',
                data: update
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });//approve po vendor

    app.post('/vendor/po/:id/reject', async (req, res, next) => {
        try {
            const { po } = req.params.id;

            if (!po) {
                throw createError(400, 'Please enter po number');
            }

            const cekPO = await client.db(process.env.MONGO_DB).collection('Vendor.PO').findOne({ uid: po, user: req.user });

            if (!cekPO) {
                throw createError(404, 'PO not found');
            }

            if (cekPO.status === 'approved') {
                throw createError(409, 'PO already approved');
            }

            if (cekPO.status === 'rejected') {
                throw createError(409, 'PO already rejected');
            }

            const update = await client.db(process.env.MONGO_DB).collection('Vendor.PO').updateOne({ uid: po }, { $set: { status: 'rejected', updated_at: moment().unix() } });

            if (update.modifiedCount === 0) {
                throw createError(500, 'Failed to update data');
            }

            return res.status(200).send({
                status: 'success',
                message: 'PO successfully rejected',
                data: update
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });//reject po vendor

    app.post('/vendor/po/:id/cancel', async (req, res, next) => {
        try {

            const { po } = req.params.id;

            if (!po) {
                throw createError(400, 'Please enter po number');
            }

            const cekPO = await client.db(process.env.MONGO_DB).collection('Vendor.PO').findOne({ uid: po, user: req.user });

            if (!cekPO) {
                throw createError(404, 'PO not found');
            }

            if (cekPO.status === 'approved') {
                throw createError(409, 'PO already approved');
            }

            if (cekPO.status === 'rejected') {
                throw createError(409, 'PO already rejected');
            }

            if (cekPO.status === 'canceled') {
                throw createError(409, 'PO already canceled');
            }

            const update = await client.db(process.env.MONGO_DB).collection('Vendor.PO').updateOne({ uid: po }, { $set: { status: 'canceled', updated_at: moment().unix() } });

            if (update.modifiedCount === 0) {
                throw createError(500, 'Failed to update data');
            }

            return res.status(200).send({
                status: 'success',
                message: 'PO successfully canceled',
                data: update
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });//cancel po vendor

    app.post('/vendor/invoice', async (req, res, next) => {
        try {
            const { po, date, due } = req.body;
            let nomor_vendor;

            if (!po) {
                throw createError(400, 'Please enter po number');
            }

            if (!date) {
                throw createError(400, 'Please enter invoice date');
            }

            if (!due) {
                throw createError(400, 'Please enter invoice due date');
            }

            const cekPO = await client.db(process.env.MONGO_DB).collection('Vendor.PO').findOne({ uid: po, user: req.user });

            if (!cekPO) {
                throw createError(404, 'PO not found');
            }

            if (cekPO.status === 'pending') {
                throw createError(409, 'PO not approved yet');
            }

            if (cekPO.status === 'rejected') {
                throw createError(409, 'PO already rejected');
            }

            if (cekPO.status === 'canceled') {
                throw createError(409, 'PO already canceled');
            }

            if (cekPO.status === 'invoiced') {
                throw createError(409, 'PO already invoiced');
            }

            if (!req.body.nomor_vendor) {
                nomor_vendor = null;
            } else {
                nomor_vendor = req.body.nomor_vendor;
            }

            const data = {
                user: req.user,
                uid: uuidv4(),
                data: date,
                due: due,
                nomor: 'INV.' + Math.floor(1000 + Math.random() * 9000) + '/BKT/' + moment().format('MM/YYYY'),
                nomor_vendor: nomor_vendor,
                po: po,
                total: cekPO.total,
                status: 'open', //open, partial, paid
                created_at: moment().unix(),
                updated_at: moment().unix()
            }

            const save = await client.db(process.env.MONGO_DB).collection('Vendor.Invoice').insertOne(data);

            if (!save) {
                throw createError(500, 'Failed to save data');
            }

            const update = await client.db(process.env.MONGO_DB).collection('Vendor.PO').updateOne({ uid: po }, { $set: { status: 'invoiced', updated_at: moment().unix() } });

            if (update.modifiedCount === 0) {
                throw createError(500, 'Failed to update data');
            }

            return res.status(201).send({
                status: 'success',
                message: 'Invoice successfully created',
                data: data
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });//create invoice po vendor

    app.post('/vendor/invoice/:id/payment', async (req, res, next) => {
        try {

            const { date, amount } = req.body;

            let balance;
            let status;

            

            if (!date) {
                throw createError(400, 'Please enter payment date');
            }

            if (!amount) {
                throw createError(400, 'Please enter payment amount');
            }

            const cekInvoice = await client.db(process.env.MONGO_DB).collection('Vendor.Invoice').findOne({ uid: req.params.id, user: req.user });

            if (!cekInvoice) {
                throw createError(404, 'Invoice not found');
            }

            if (cekInvoice.status === 'paid') {
                throw createError(409, 'Invoice already paid');
            }

            if (cekInvoice.status === 'canceled') {
                throw createError(409, 'Invoice already canceled');
            }

            const balenced = cekInvoice.total - amount;

            if (balenced == 0) {
                balance = 0;
                status = 'paid'
            } else {
                balance = balenced;
                status = 'partial'
            }


            const data = {
                user: req.user,
                uid: uuidv4(),
                nomor: 'PAY.' + Math.floor(1000 + Math.random() * 9000) + '/BKT/' + moment().format('MM/YYYY'),
                invoice: req.params.id,
                date: date,
                amount: amount,
                balance: balance,
                created_at: moment().unix(),
                updated_at: moment().unix()
            }

            const save = await client.db(process.env.MONGO_DB).collection('Vendor.Invoice.Payment').insertOne(data);

            if (!save) {
                throw createError(500, 'Failed to save data');
            }

            const update = await client.db(process.env.MONGO_DB).collection('Vendor.Invoice').updateOne({ uid: req.params.id }, { $set: { status: status, balance: balance, updated_at: moment().unix() } });

            if (update.modifiedCount === 0) {
                throw createError(500, 'Failed to update data');
            }

            return res.status(201).send({
                status: 'success',
                message: 'Payment successfully created',
                data: data
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });//payment invoice po vendor

    app.get('/vendor/invoice/:id', async (req, res, next) => {
        try {

            const invoice = await client.db(process.env.MONGO_DB).collection('Vendor.Invoice').aggregate([
                {
                    $match: { uid: req.params.id, user: req.user }
                },
                {
                    $lookup: {
                        from: 'Vendor.PO',
                        localField: 'po',
                        foreignField: 'uid',
                        as: 'po'
                    }
                },
                {
                    $lookup: {
                        from: 'Vendor.Invoice.Payment',
                        localField: 'uid',
                        foreignField: 'invoice',
                        as: 'payment'
                    }
                }
            ]).toArray();

            if (invoice.length === 0) {
                throw createError(404, 'Invoice not found');
            }

            return res.status(200).send({
                message: 'Invoice found',
                data: invoice
            });
            

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });//get invoice by id


    app.get('/vendor', async (req, res, next) => {
        try {

            const vendor = await client.db(process.env.MONGO_DB).collection('Vendor').aggregate([
                {
                    $match: { user: req.user }
                },
                {
                    $lookup: {
                        from: 'Vendor.Invoice',
                        localField: 'uid',
                        foreignField: 'vendor',
                        as: 'invoice'
                    }
                }
            ]).sort({ created_at: -1 }).toArray();

           
         

            return res.status(200).send({
                message: 'Vendor found',
                data: vendor
            });
           


        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });//get all vendor




};

// Path: API/Routes/Route.Vendor.js