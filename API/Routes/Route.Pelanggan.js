import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
import { nextTick } from 'process';
import { create } from 'domain';
import XLSX from 'xlsx';
import multer from 'multer';
moment.locale('id');

export const PelangganRoute = (app, client) => {
    app.post('/pelanggan', async (req, res, next) => {
        try {

            const { nama, sex, pekerjaan, phone, alamat, nik } = req.body;

            if (!nama) {
                throw createError(400, 'Please enter nama');
            }

            if (!sex) {
                throw createError(400, 'Please enter jenis kelamin');
            }



            if (!pekerjaan) {
                throw createError(400, 'Please enter pekerjaan');
            }

            if (!phone) {
                throw createError(400, 'Please enter phone');
            }


            if (!alamat) {
                throw createError(400, 'Please enter alamat');
            }

            if (!nik) {
                throw createError(400, 'Please enter nik');
            }

            const pelanggan = await client.db(process.env.MONGO_DB).collection('Pelanggan').findOne({ user: req.user, phone: phone });

            if (pelanggan) {
                throw createError(400, 'Phone number already exist');
            }

            const CountData = await client.db(process.env.MONGO_DB).collection('Pelanggan').countDocuments({ user: req.user });


            const user = req.user;
            const uid = uuidv4();
            const nomor = CountData + 1;
            const id = `13${nomor.toString().padStart(4, '0000')}`;

            const data = {
                user: req.user,
                uid: uuidv4(),
                id,
                nama,
                sex,
                pekerjaan,
                phone,
                alamat,
                nik,
                status: 'pending',
                created_at: moment().unix(),
                updated_at: moment().unix()
            };

            const save = await client.db(process.env.MONGO_DB).collection('Pelanggan').insertOne(data);

            if (!save) {
                throw createError(400, 'Failed to save data');
            }

            res.status(200).send({
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

    app.post('/pelanggan/import', async (req, res, next) => { // Import data from excel
        try {

            const storage = multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, './Uploads')
                },
                filename: function (req, file, cb) {
                    cb(null, file.originalname)
                }
            });

            const upload = multer({ storage: storage }).single('file');

            upload(req, res, async function (err) {

                if (err instanceof multer.MulterError) {
                    return next(createError(400, err.message));
                } else if (err) {
                    return next(createError(400, err.message));
                }

                const file = req.file;





                const workbook = XLSX.readFile('./uploads/' + file.filename);
                const sheet_name_list = workbook.SheetNames;
                const xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
                const data = xlData.map((item) => {

                    return {
                        user: req.user,
                        uid: uuidv4(),
                        id: '13' + Math.floor(Math.random() * 1000) + 1,
                        other: item.OtherDetail,
                        label: item.group,
                        nama: item.DisplayName,
                        alamat: item.BillingAddress,
                        phone: item.Mobile,
                        pekerjaan: null,
                        sex: null,
                        status: 'active',
                        created_at: moment().unix(),
                        updated_at: moment().unix()
                    }


                });

                const pelanggan = await client.db(process.env.MONGO_DB).collection('Pelanggan').insertMany(data);

                if (!pelanggan) {
                    throw createError(400, 'Failed to save data');  // Error handling
                }

                res.status(200).send({
                    message: 'Data saved successfully',
                    data: pelanggan
                })


            }

            );

        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });

    app.get('/pelanggan', async (req, res, next) => {
        try {

            const pelanggan = await client.db(process.env.MONGO_DB).collection('Pelanggan').find({ user: req.user }).sort({ nama: 1 }).toArray();


            if (!pelanggan) {
                throw createError(400, 'Data not found');
            }

            const count = await client.db(process.env.MONGO_DB).collection('Pelanggan').countDocuments({ user: req.user });

            res.status(200).send({
                message: 'Data fetched successfully',
                total: pelanggan.length,
                totalAll: count,
                nextPage: `${process.env.DOMAIN}/pelanggan?page=2`,
                currentPage: 1,
                totalPage: Math.ceil(count / 25),
                data: pelanggan

            });

        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    }); // Get all data

    app.get('/pelanggan/:id', async (req, res, next) => {
        try {
            const pelanggan = await client.db(process.env.MONGO_DB).collection('Pelanggan').aggregate([
                {
                    $match: {
                        user: req.user,
                        uid: req.params.id
                    }
                }, {
                    $lookup: {
                        from: 'Layanan',
                        localField: 'uid',
                        foreignField: 'pelanggan',
                        as: 'layanan'
                    }
                }, {
                    $unwind: {
                        path: '$layanan',
                        preserveNullAndEmptyArrays: true
                    }
                },{
                    $lookup: {
                        from: 'Produk',
                        localField: 'layanan.produk',
                        foreignField: 'uid',
                        as: 'layanan.produk'
                    }
                },{
                    $lookup:{
                        from: 'ODP',
                        localField: 'layanan.odp',
                        foreignField: 'uid',
                        as: 'layanan.odp'
                    
                    }
                },{
                    $project: {
                        _id: 0,
                        user: 0,
                        'layanan.user': 0,
                        'layanan.pelanggan': 0,
                        'layanan._id': 0,
                        'layanan.produk.user': 0,
                        'layanan.produk._id': 0,
                        'layanan.odp.user': 0,
                        'layanan.odp._id': 0
                    }
                }
            ]).toArray();


            if (pelanggan.length === 0) {
                throw createError(400, 'Data not found');
            }

            res.status(200).send({
                message: 'Data fetched successfully',
                data: pelanggan
            });

        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    }); // Get data by ID

    app.get('/pelanggan/v1/all', async (req, res, next) => {
        try {

            const limit = 25;
            const page1 = req.query.page || 1;
            const offset = (page1 - 1) * limit;
            const pelanggan = await client.db(process.env.MONGO_DB).collection('Pelanggan').find({ user: req.user }).sort({ nama: 1 }).skip(offset).limit(limit).toArray();
            
            if (!pelanggan) {
                throw createError(400, 'Data not found');
            }

            const count = await client.db(process.env.MONGO_DB).collection('Pelanggan').countDocuments({ user: req.user });

            res.status(200).send({
                message: 'Data fetched successfully',
                total: pelanggan.length,
                totalAll: count,
                nextPage: `${process.env.DOMAIN}/pelanggan/v1?page=${parseInt(page1) + 1}`,
                currentPage: page1,
                totalPage: Math.ceil(count / 25),
                data: pelanggan

            });

            const { page } = req.query;

            const totalPage = Math.ceil(count / limit);

            if (page > totalPage) {
                throw createError(400, 'Page not found');
            }

            let nextPage = parseInt(page) + 1;
            let prevPage = parseInt(page) - 1;

            if (nextPage > totalPage) {
                nextPage = null;
            }

            if (prevPage < 1) {
                prevPage = null;
            }
        }
        catch (error) {
           console.log(error)
            return next(
                createError(error.status, error.message));
        }
    }); // Get all data with pagination

};

export default PelangganRoute;

// Path: API-Mongodb_client/Routes/Route.Pelanggan.js