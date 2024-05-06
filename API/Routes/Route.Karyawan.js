import argon2 from 'argon2';
import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import moment from 'moment-timezone';
moment.locale('id');


const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});



const signOptions = {
    issuer: 'KejoraNet',
    subject: 'Internet Masuk Nagari',
    audience: 'https://apps.bkt.net.id',
    expiresIn: "12h",
    algorithm: "RS256"
};



export const KaryawanRoute = (app, client) => {
    app.post('/karyawan', async (req, res, next) => {
        try {

            const { nama, phone, email, jabatan, password } = req.body;
            if (!nama) {
                throw createError(400, 'Please enter nama');
            }

            if (!phone) {
                throw createError(400, 'Please enter phone number');
            }

            if (!email) {
                throw createError(400, 'Please enter email');
            }

            if (!jabatan) {
                throw createError(400, 'Please enter jabatan');
            }

            if(!password){
                throw createError(400, 'Please enter password');
            }

            if(password.length < 6){
                throw createError(400, 'Password must be at least 6 characters');
            }


            const karyawan = await client.db(process.env.MONGO_DB).collection('Karyawan').findOne({ user: req.user, phone });
            if(karyawan){
                throw createError(400, 'Karyawan already exist');
            }

            const CountData = await client.db(process.env.MONGO_DB).collection('Karyawan').countDocuments({ user: req.user });

            const user = req.user;
            const uid = uuidv4();
            const hash = await argon2.hash(password);
            const nomor = CountData + 1;
            const date = moment().format('YYMMDD');

            const badge = `${date}${nomor.toString().padStart(2, '0')}`

            const data = {
                user: req.user,
                uid: uuidv4(),
                nama,
                badge,
                password: hash,
                phone,
                email,
                jabatan,
                privateKey: privateKey,
                publicKey: publicKey,
                created_at: moment().unix(),
                updated_at: moment().unix()
            };

          const save = await client.db(process.env.MONGO_DB).collection('Karyawan').insertOne(data);
           
          res.status(201).send({
                message: 'Karyawan added successfully',
                data: data
          })

           

        } catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });

    app.post('/karyawan/login', async (req, res, next) => {
        try {

            const { email, password } = req.body;
            if(!email){
                throw createError(400, 'Please enter email');
            }
            if (!password) {
                throw createError(400, 'Please enter password');
            }

            const karyawan = await client.db(process.env.MONGO_DB).collection('Karyawan').findOne({ user: req.user, email });
            if (!karyawan) {
                throw createError(400, 'Email not matched');
            }

            const verify = await argon2.verify(karyawan.password, password);
            if (!verify) {
                throw createError(400, 'Invalid password');
            }

            const token = jwt.sign({ email: karyawan.email, id: karyawan.uid }, karyawan.privateKey, signOptions);

            res.status(200).send({
                message: 'Login successful',
                token: token
            });

        }
        catch (error) {
            return next(
                createError(error.status, error.message));
        }
    });

    app.get('/karyawan/:id/publickey', async (req, res, next) => {
        try {
            const karyawan = await client.db(process.env.MONGO_DB).collection('Karyawan').findOne({ user: req.user, uid: req.params.id });
            if (!karyawan) {
                throw createError(404, 'Karyawan not found');
            }

            res.status(200).send({
                message: 'Public Key',
                data: karyawan.publicKey
            });

        }
        catch (error) {
            return next(
                createError(error.status, error.message));
        }
    });

    app.get('/karyawan/:id', async (req, res, next) => {
        try {
            const karyawan = await client.db(process.env.MONGO_DB).collection('Karyawan').findOne({ user: req.user, uid: req.params.id }, { projection: { privateKey: 0, publicKey:0, password:0 } });
            if (!karyawan) {
                throw createError(404, 'Karyawan not found');
            }

            res.status(200).send({
                message: 'Karyawan',
                data: karyawan
            });

        }
        catch (error) {
            return next(
                createError(error.status, error.message));
        }
    });
};


export default KaryawanRoute;

// Path: API/Routes/Route.Karyawan.js