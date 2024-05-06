import argon2 from 'argon2';
import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import moment from 'moment-timezone';
import { nextTick } from 'process';
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

const verifyOptions = {
    issuer: 'KejoraNet',
    subject: 'Internet Masuk Nagari',
    audience: 'https://apps.bkt.net.id',
    expiresIn: "12h",
    algorithm: ["RS256"]
};

const collection = 'Users';


export const MainRoute = (app, client) => {

    // app.post('/users', async (req, res, next) => {
    //     try {
    //         const { email, password, phone, nama } = req.body;
    //         if (!email || !password, !phone, !nama) {
    //             throw createError(400, 'Invalid input');
    //         }

    //         if (password.length < 6) {
    //             throw createError(400, 'Password must be at least 6 characters');
    //         }

    //         const user = await client.db(process.env.MONGO_DB).collection(collection).findOne({ email });
    //         if (user) {
    //             throw createError(400, 'Email already exists');
    //         }
    //         const hash = await argon2.hash(password);
    //         const uid = uuidv4();
    //         const data = {
    //             nama,
    //             uid,
    //             phone,
    //             email,
    //             password: hash,
    //             privateKey: privateKey,
    //             publicKey: publicKey,
    //             created_at: moment().unix(),
    //             updated_at: moment().unix(),
    //         };
    //         const result = await client.db(process.env.MONGO_DB).collection(collection).insertOne(data);
    //         if (result.insertedCount === 0) {
    //             throw createError(500, 'Failed to create user');
    //         }
    //         res.status(201).send({
    //             success: true,
    //             message: 'User created successfully'
    //         });

    //     }
    //     catch (err) {
    //         return next(
    //             createError(err.status, err.message));
    //     }
    // });

    app.post('/login', async (req, res, next) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                throw createError(400, 'Please provide email and password');
            }
            const user = await client.db(process.env.MONGO_DB).collection(collection).findOne({ email });
            if (!user) {
                throw createError(401, 'Email not matched');
            }
            if (!await argon2.verify(user.password, password)) {
                throw createError(401, 'Password not matched');
            }
            const token = jwt.sign({ email: user.email, id: user.uid }, user.privateKey, signOptions);
            res.status(200).send({
                success: true,
                message: 'Login successful',
                token
            });
        }
        catch (err) {
            console.log(err.status)
            return next(
                createError(err.status, err.message));
        }
    });

    app.put('/settings', async (req, res, next) => {
        try {

            const updateSettings = await client.db(process.env.MONGO_DB).collection('Settings').updateOne({ user: req.user }, { $set: req.body });
            if (updateSettings.modifiedCount === 0) {
                throw createError(500, 'Failed to update settings');
            }

            res.status(200).send({
                success: true,
                message: 'Settings updated successfully',
                data: req.body
            });

        }
        catch (err) {
            console.log(err.status)
            return next(
                createError(err.status, err.message));
        }
    });// Update Settings

    app.post('/apikey', async (req, res, next) => {
        try {



            const { user, nama, expire } = req.body;
            if (!user || !nama || !expire) {
                throw createError(400, 'Invalid input');
            }

            const tokenOptions = {
                issuer: 'KejoraNet',
                subject: 'Internet Masuk Nagari',
                audience: 'https://apps.bkt.net.id',
                expiresIn: expire,
                algorithm: "RS256"
            };

            const cekUser = await client.db(process.env.MONGO_DB).collection(collection).findOne({ uid: user });


            const token = jwt.sign({ uid: user }, cekUser.privateKey, tokenOptions);
            const data = {
                user,
                uid: uuidv4(),
                key: token,
                nama,
                expire,
                created_at: moment().unix(),
                updated_at: moment().unix()

            };

            const result = await client.db(process.env.MONGO_DB).collection('ApiKeys').insertOne(data);
            if (result.insertedCount === 0) {
                throw createError(500, 'Failed to create api key');
            }

            res.status(201).send({
                success: true,
                message: 'Api key created successfully',
                data
            });



        }
        catch (err) {
            console.log(err)
            return next(
                createError(err.status, err.message));
        }
    });// Create Secret key for api key

};

export default MainRoute;



