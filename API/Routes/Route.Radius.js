import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
moment.locale('id');

import Mikrotik from '../Class/Class.Mikrotik.js';
const mikrotik = new Mikrotik();



export const RadiusRoute = (app, client) => {
    app.post('/radius', async (req, res, next) => {
        try {

            const { nama, api, token } = req.body;
            if (!nama) {
                throw createError(400, 'Please enter nama');
            }

            if (!api) {
                throw createError(400, 'Please enter api url');
            }

            if (!token) {
                throw createError(400, 'Please enter token');
            }

            const radiusData = await client.db(process.env.MONGO_DB).collection('Radius').findOne({ user: req.user, api });

            if (radiusData) {
                throw createError(400, 'Radius already exist');
            }

            const data = {
                user: req.user,
                uid: uuidv4(),
                nama,
                api,
                token,
                created_at: moment().unix(),
                updated_at: moment().unix()
            }

            const result = await client.db(process.env.MONGO_DB).collection('Radius').insertOne(data);

            if (!result) {
                throw createError(500, 'Failed to create Radius');
            }

            return res.status(201).send({
                status: 'success',
                message: 'Radius created',
                data: data
            })

        }
        catch (err) {
            return next(createError(500, err.message));
        }
    });//create Radius

    app.get('/radius', async (req, res, next) => {
        try {
            const radiusData = await client.db(process.env.MONGO_DB).collection('Radius').find({ user: req.user }).toArray();

            if (!radiusData) {
                throw createError(404, 'Radius not found');
            }

            return res.status(200).send({
                message: 'Radius List',
                data: radiusData
            })

        }
        catch (err) {
            return next(createError(500, err.message));
        }
    });//get All Radius

    app.get('/bras', async (req, res, next) => {
        try {

            const radiusData = await client.db(process.env.MONGO_DB).collection('Radius').findOne({ user: req.user });

            if (!radiusData) {
                throw createError(404, 'Bras Server not found');
            }

          

            const data = {
                api: radiusData.api,
                token: radiusData.token,
                once: true
            }

            const brasList = await mikrotik.getBras(data);

        
            const countBras = brasList.length;
           // const totalOnline = getActive.length;

            let arr = [];

            brasList.forEach(async (item) => {
                let obj = {
                    user: req.user,
                    radius: req.params.id,
                    id: item['.id'],
                    uid: uuidv4(),
                    name: item.name,
                    password: item.password,
                    comment: item.comment,
                    disabled: item.disabled,
                    group: item.group,
                    "caller-id": item['caller-id'],
                    created_at: moment().unix(),
                    updated_at: moment().unix()
                   
                }
                arr.push(obj);
            }

            );

            arr.forEach(async (item) => {
                const brasData = await client.db(process.env.MONGO_DB).collection('Bras').findOne({ user: req.user, name: item.name });
              

                if (!brasData) {
                    return await client.db(process.env.MONGO_DB).collection('Bras').insertOne(item);
                }
            });

            const totalDisable = brasList.filter(item => item.disabled == 'true').length;
          

            return res.status(200).send({
                message: 'Bras List',
                count: countBras,
                disable: totalDisable,
                data: brasList
            })

        }
        catch (err) {
            console.log(err)
            return next(createError(500, err.message));
        }
    });//get All User bras List from Radius

    app.post('/bras/active', async (req, res, next) => {
        try {
            const radiusData = await client.db(process.env.MONGO_DB).collection('Radius').findOne({ user: req.user });

            if (!radiusData) {
                throw createError(404, 'Radius not found');
            }

            const data = {
                api: radiusData.api,
                token: radiusData.token
            }

            const brasList = await mikrotik.ActiveSession(data);

            return res.status(200).send({
                message: 'Fetch Active Session',
                data: brasList[0]
            })

        }
        catch (err) {
            return next(createError(500, err.message));
        }
    });//Active User bras from Radius

    app.get('/radius/bras/:name', async (req, res, next) => {
        try {
            const radiusData = await client.db(process.env.MONGO_DB).collection('Radius').findOne({ user:req.user });

            if (!radiusData) {
                throw createError(404, 'Radius not found');
            }

            const data = {
                api: radiusData.api,
                token: radiusData.token,
                name: req.params.name
            
            }

            const radiusUser = await mikrotik.getSessionUserBrasActive(data);
            if(radiusUser.length == 0){
                throw createError(404, `Session ${req.params.name} not found`);
            }

            return res.status(200).send({
                message: `Fetch Session ${req.params.name}`,
                data: radiusUser
            })
            
        }
        catch (err) {
            console.log(err)
            return next(createError(err.status, err.message));
        }
    });//get Status User bras from Radius

    app.get('/radius/router', async (req, res, next) => {
        try {
            const radiusData = await client.db(process.env.MONGO_DB).collection('Radius').findOne({ user: req.user });

            if (!radiusData) {
                throw createError(404, 'Radius not found');
            }

            const data = {
                api: radiusData.api,
                token: radiusData.token
            }

            const routerList = await mikrotik.getRouter(data);

            let arr = [];

            routerList.forEach(async (item) => {
                let obj = {
                    user: req.user,
                    id: item['.id'],
                    uid: uuidv4(),
                    name: item.name,
                    address: item.address,
                    disabled: item.disabled,
                    'shared-secret': item['shared-secret'],
                    created_at: moment().unix(),
                    updated_at: moment().unix()
                }
                arr.push(obj);
            });

            arr.forEach(async (item) => {
                const routerData = await client.db(process.env.MONGO_DB).collection('Bras.Router').findOne({ user: req.user, name: item.name });
                if (!routerData) {
                    return await client.db(process.env.MONGO_DB).collection('Bras.Router').insertOne(item);
                }
            });

            return res.status(200).send({
                message: 'Router List',
                data: routerList
            })

        }
        catch (err) {
            return next(createError(500, err.message));
        }
    });//Get All Router Nas

    app.get('/radius/group', async (req, res, next) => {
        try {
            const radiusData = await client.db(process.env.MONGO_DB).collection('Radius').findOne({ user: req.user });

            if (!radiusData) {
                throw createError(404, 'Radius not found');
            }

            const data = {
                api: radiusData.api,
                token: radiusData.token
            }

            const routerList = await mikrotik.getGroup(data);
            let arr = [];
           
            routerList.forEach(async (item) => {
                let obj = {
                    user: req.user,
                    id: item['.id'],
                    uid: uuidv4(),
                    name: item.name,
                    attributes: item.attributes,
                    'outer-auths': item['outer-auths'],
                    'inner-auths': item['inner-auths'],
                    created_at: moment().unix(),
                    updated_at: moment().unix()
                }
                arr.push(obj);
            });

            arr.forEach(async (item) => {
                const groupData = await client.db(process.env.MONGO_DB).collection('Bras.Group').findOne({ user: req.user, name: item.name });
                if (!groupData) {
                    return await client.db(process.env.MONGO_DB).collection('Bras.Group').insertOne(item);
                }
            });

            return res.status(200).send({
                message: 'Group List',
                data: routerList
            })

        }
        catch (err) {
            return next(createError(500, err.message));
        }
    });//Get All User Group


};

//