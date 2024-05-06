import createError from 'http-errors';
import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import methodOverride from 'method-override'
import moment from 'moment-timezone';
import debug from 'debug';
import { rateLimit } from 'express-rate-limit'
import jwt from 'jsonwebtoken';
moment.locale('id');
import 'dotenv/config'

const uri = process.env.MONGODB;


const client = new MongoClient(uri, {});

client.connect().then(() => {
    console.log('MongoDB connected!!');
}
).catch(err => {
    console.log('Failed to connect to MongoDB', err);

});



const limiter = rateLimit({
	windowMs: 60 * 1000, // 1 minutes
	limit: 1000, // Limit each IP to 100 requests per `window` (here, per 1 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: "You have exceeded requests rate limit.",
	// store: ... , // Redis, Memcached, etc. See below.
})




const app = express();
const server = http.createServer(app);

app.use(limiter);

app.use(methodOverride());

//app.use(logger('dev'));


app.use(bodyParser.urlencoded({
    extended: true,
    limit: '100mb'
}));

//app.use(fileUpload());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

app.use((req, res, next) => {
    res.locals.moment = moment;
    next();
});



//routes
app.get('/', (req, res) => {
    res.status(200).send({
        message: 'Welcome to KejoraNet API'
    });

});


//Midelware
app.use(async (req, res, next) => {
    try {
        const verifyOptions = {
            issuer: 'KejoraNet',
            subject: 'Internet Masuk Nagari',
            audience: 'https://apps.bkt.net.id',
            algorithm: ["RS256"]
        };

        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            throw createError(401, 'Authorization is required');
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw createError(401, 'Token is required');
        }

        let decoded = jwt.decode(token, { complete: true });

        if (!decoded) {
            throw createError(401, 'Invalid token');
        }
        const user = await client.db(process.env.MONGO_DB).collection('Users').findOne({ uid: decoded.payload.uid });

        if (!user) {
            throw createError(401, 'User not found');
        }

        const verified = jwt.verify(token, user.publicKey, verifyOptions);
        if (!verified) {
            throw createError(401, 'Invalid token');
        }
            req.user = user.uid;
            return next();
    
    }
    catch (err) {
     //  console.log(err.message)
        return next(
            createError(401, err.message));
    }
});

//default settings
app.use(async (req, res, next) => {
    try {
        if (req.user) {
            const defaultSettings = await client.db(process.env.MONGO_DB).collection('Settings').findOne({ user: req.user });
            if (!defaultSettings) {
                const data = {
                    user: req.user,
                    uid: uuidv4(),
                    xendit: {
                        api_key: null,
                        callback_token: null,
                        version: "v2",
                        redirectUrl: null
                    },

                    Meta: {
                        app_id: null,
                        app_token: null,
                        version: null,
                        phone_number_id: null,
                        refresh_token: null
                    },

                    Perusahaan: {
                        nama: null,
                        alamat: null,
                        phone: null,
                        email: null
                    },
                    Bank: {
                        nama: null,
                        cabang: null,
                        rekening: null,
                        pemilik: null
                    },

                    created_at: moment().unix(),
                    updated_at: moment().unix()
                }

                const result = await client.db(process.env.MONGO_DB).collection('Settings').insertOne(data);

                return next();

            } else {
                return next();
            }

        } else {
            return next();
        }

    }
    catch (err) {
        console.log(err)
        return next(
            createError(err.status, err.message));
    }

});


import MainRoute from './Routes/Route.Main.js';
MainRoute(app, client);

import NodeRoute from './Routes/Route.Node.js';
NodeRoute(app, client);

import RouterRoute from './Routes/Route.Router.js';
RouterRoute(app, client);

import SwitchRoute from './Routes/Route.Switch.js';
SwitchRoute(app, client);

import OltRoute from './Routes/Route.Olt.js';
OltRoute(app, client);

import OdcRoute from './Routes/Route.Odc.js';
OdcRoute(app, client);

import OdpRoute from './Routes/Route.Odp.js';
OdpRoute(app, client);

import PelangganRoute from './Routes/Route.Pelanggan.js';
PelangganRoute(app, client);

import LayananRoute from './Routes/Route.Layanan.js';
LayananRoute(app, client);

import TagihanRoute from './Routes/Route.Tagihan.js';
TagihanRoute(app, client);

import PembayaranRoute from './Routes/Route.Pembayaran.js';
PembayaranRoute(app, client);

import XenditRoute from './Routes/Route.Xendit.js';
XenditRoute(app, client);

import JurnalRoute from './Routes/Route.Jurnal.js';
JurnalRoute(app, client);

import KaryawanRoute from './Routes/Route.Karyawan.js';
KaryawanRoute(app, client);

import { RadiusRoute } from './Routes/Route.Radius.js';
RadiusRoute(app, client);

import { TelnetRoute } from './Routes/Route.Telnet.js';
TelnetRoute(app, client);

import OnuRoute from './Routes/Route.Onu.js';
OnuRoute(app, client);


import snmpRoute from './Routes/Route.Snmp.js';
snmpRoute(app, client);

import DevicesRoute from './Routes/Route.Devices.js';
DevicesRoute(app, client);

import { VendorRoute } from './Routes/Route.Vendor.js';
VendorRoute(app, client);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    //console.log(err.status)
    //console.log(err.message)
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    return res.status(err.status).send({
        message: err.message
    })
});

// Normalize a port into a number, string, or false.
function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

// Get port from environment and store in Express.
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

// Listen on provided port, on all network interfaces.
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// Event listener for HTTP server "error" event.
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

// Event listener for HTTP server "listening" event.
function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}

