import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
import { nextTick } from 'process';
moment.locale('id');

export const OdpRoute = (app, client) => {
    app.post('/odp', async (req, res, next) => {
        try {

            const { odc, capacity, splitter, tikor,alamat } = req.body;
            if (!odc) {
                throw createError(400, 'Please select ODC');
            }

            if (!capacity) {
                throw createError(400, 'Please enter capacity');
            }

            if (!tikor) {
                throw createError(400, 'Please enter tikor');
            }

            if (capacity != 8 && capacity != 16 && capacity != 32 && capacity != 64 && capacity != 128) {
                throw createError(400, 'Invalid capacity');
            }

            const odcData = await client.db(process.env.MONGO_DB).collection('ODC').findOne({ user: req.user, uid: odc });

            if (!odcData) {
                throw createError(400, 'ODC not found');
            }

            const oltData = await client.db(process.env.MONGO_DB).collection('OLT').findOne({ user: req.user, uid: odcData.olt });

            const node = await client.db(process.env.MONGO_DB).collection('Node').findOne({ user: req.user, uid: oltData.node });

            if (!node) {
                throw createError(400, 'Node not found');
            }

            const CountData = await client.db(process.env.MONGO_DB).collection('ODP').countDocuments({ user: req.user });

            if (CountData >= odcData.odp) {
                throw createError(400, 'ODP is full');
            }

            const user = req.user;
            const uid = uuidv4();
            const nomor = CountData + 1;
            const cid = `${odcData.cid}${nomor.toString().padStart(3, '00')}`;
            const label = `ODP${nomor.toString().padStart(3, '000')}.${node.cid}`;


            const data = {
                user,
                uid,
                odc,
                capacity,
                splitter,
                tikor,
                cid,
                label,
                alamat,
                created_at: moment().unix(),
                updated_at: moment().unix(),
            }

            await client.db(process.env.MONGO_DB).collection('ODP').insertOne(data);

            res.status(200).send({
                message: 'ODP created',
                data
            });

        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });

    app.get('/odp', async (req, res, next) => {
        try {
            const odp = await client.db(process.env.MONGO_DB).collection('ODP').aggregate([
                {
                    $match: {
                        user: req.user
                    }
                },
                {
                    $lookup: {
                        from: 'ODC',
                        localField: 'odc',
                        foreignField: 'uid',
                        as: 'odc'
                    }
                }, {
                    $unwind: '$odc'
                }, {
                    $lookup: {
                        from: 'OLT',
                        localField: 'odc.olt',
                        foreignField: 'uid',
                        as: 'odc.olt'
                    }
                }, {
                    $unwind: '$odc.olt'
                }, {
                    $lookup: {
                        from: 'Node',
                        localField: 'odc.olt.node',
                        foreignField: 'uid',
                        as: 'odc.olt.node'
                    }
                }, {
                    $unwind: '$odc.olt.node'
                }, {
                    $project: {
                        user: 1,
                        uid: 1,
                        odc: {
                            uid: '$odc.uid',
                            label: '$odc.label',
                            capacity: '$odc.capacity',
                            splitter: '$odc.splitter',
                            tikor: '$odc.tikor',
                            cid: '$odc.cid',
                            created_at: '$odc.created_at',
                            updated_at: '$odc.updated_at',
                            olt: {
                                uid: '$odc.olt.uid',
                                label: '$odc.olt.label',
                                capacity: '$odc.olt.capacity',
                                cid: '$odc.olt.cid',
                                created_at: '$odc.olt.created_at',
                                updated_at: '$odc.olt.updated_at',
                                node: {
                                    uid: '$odc.olt.node.uid',
                                    label: '$odc.olt.node.label',
                                    cid: '$odc.olt.node.cid',
                                    created_at: '$odc.olt.node.created_at',
                                    updated_at: '$odc.olt.node.updated_at'
                                }
                            }
                        },
                        capacity: 1,
                        splitter: 1,
                        tikor: 1,
                        cid: 1,
                        label: 1,
                        created_at: 1,
                        updated_at: 1
                    }
                }, {
                    $lookup: {
                        from: 'Layanan',
                        localField: 'uid',
                        foreignField: 'odp',
                        as: 'layanan'

                    }
                }
            ]).toArray();



            if (!odp) {
                throw createError(404, 'ODP not found');
            }

            const countOdpSplitter = await client.db(process.env.MONGO_DB).collection('ODP').aggregate([
                {
                    $match: {
                        user: req.user
                    }
                },
                {
                    $group: {
                        _id: '$splitter',
                        count: { $sum: 1 },
                        homepass: { $sum: '$splitter' }

                    }
                }
            ]).toArray();

            const countLayananPerOdp = await client.db(process.env.MONGO_DB).collection('Layanan').aggregate([
                {
                    $match: {
                        user: req.user
                    }
                },
                {
                    $group: {
                        _id: '$odp',
                        count: { $sum: 1 }
                    }
                }
            ]).toArray();


            res.status(200).send({
                message: 'Fetch data success',
                layanan: countLayananPerOdp.length > 0 ? countLayananPerOdp : [],
                homepass: countOdpSplitter.length > 0 ? countOdpSplitter : [],
                data: odp.length > 0 ? odp : []

            });

        }
        catch (error) {
            return next(
                createError(error.status, error.message));
        }
    });

    app.get('/odp/:id', async (req, res, next) => {
        try {

            const odp = await client.db(process.env.MONGO_DB).collection('ODP').aggregate([
                {
                    $match: {
                        user: req.user,
                        uid: req.params.id
                    }
                },
                {
                    $lookup: {
                        from: 'ODC',
                        localField: 'odc',
                        foreignField: 'uid',
                        as: 'odc'
                    }
                }
            ]).toArray();

           if(odp.length == 0){
                throw createError(404, 'ODP not found');
           }

            const layanan  = await client.db(process.env.MONGO_DB).collection('Layanan').aggregate([
                {
                    $match: {
                        user: req.user,
                        odp: req.params.id
                    }
                },{
                    $lookup:{
                        from: 'Pelanggan',
                        localField: 'pelanggan',
                        foreignField: 'uid',
                        as: 'pelanggan'
                    }
                },{
                    $lookup:{
                        from: 'Produk',
                        localField: 'produk',
                        foreignField: 'uid',
                        as: 'produk'
                    
                    }
                }
            ]).toArray();
            
            console.log(layanan)
            return res.status(200).send({
                success: true,
                message: 'ODP found',
                data: {
                    odp,
                    layanan: layanan
                }
            });

        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    }); // Get ODC by ID

    app.delete('/odp/:id', async (req, res, next) => {
        try {
            const odp = await client.db(process.env.MONGO_DB).collection('ODP').findOne({ user: req.user, uid: req.params.id });

            if (!odp) {
                throw createError(404, 'ODP not found');
            }

            const layanan = await client.db(process.env.MONGO_DB).collection('Layanan').find({ user: req.user, odp: req.params.id }).toArray();

            if(layanan.length > 0 ){
                throw createError(400, `ODP already used ${layanan.length} layanan, cannot be deleted`);
            }

            await client.db(process.env.MONGO_DB).collection('ODP').deleteOne({ user: req.user, uid: req.params.id });

            res.status(200).send({
                message: `ODP ${odp.label} successfully deleted`,
                data: odp
            });

        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });// Delete ODC by ID

    app.put('/odp/:id', async (req, res, next) => {
        try {
            const odp = await client.db(process.env.MONGO_DB).collection('ODP').findOne({ user: req.user, uid: req.params.id });

            if(!odp) {
                throw createError(404, 'ODP not found');
            }

            const odcData = await client.db(process.env.MONGO_DB).collection('ODC').findOne({ user: req.user, uid: odp.odc});


            if (!odcData) {
                throw createError(400, 'ODC not found');
            }

           
            const {capacity, splitter, tikor, alamat } = req.body;

          
            const data = {
                capacity,
                splitter,
                tikor,
                alamat,
                updated_at: moment().unix()
            };
            
            const result = await client.db(process.env.MONGO_DB).collection('ODP').updateOne({ user: req.user, uid: req.params.id }, { $set : data });
          
            if (result.modifiedCount === 0) {
                throw createError(500, 'Failed to update ODC');
            }

            return res.status(200).send({
                success: true,
                message: `${odp.label} updated successfully`,
                data: data
            });
            

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });// Update ODP by UID

};

export default OdpRoute;

