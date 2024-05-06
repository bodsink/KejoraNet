import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
import { nextTick } from 'process';
moment.locale('id');




export const OdcRoute = (app, client) => {

    app.post('/odc', async (req, res, next) => {
        try {
            const { olt, pon, capacity, splitter, tikor, alamat } = req.body;
            if (!olt) {
                throw createError(400, 'Please select OLT');
            }

            if (!pon) {
                throw createError(400, 'Please enter PON');
            }

            if (!capacity) {
                throw createError(400, 'Please enter capacity');
            }

            if (!splitter) {
                throw createError(400, 'Please enter splitter');
            }

            if (!tikor) {
                throw createError(400, 'Please enter tikor');
            }

            if (capacity != 8 && capacity != 16 && capacity != 32 && capacity != 64 && capacity != 128) {
                throw createError(400, 'Invalid capacity');
            }

            if (splitter != 4 && splitter != 8 && splitter != 16) {
                throw createError(400, 'Invalid splitter');
            }

            const oltData = await client.db(process.env.MONGO_DB).collection('OLT').findOne({ user: req.user, uid: olt });


            if (!oltData) {
                throw createError(400, 'OLT not found');
            }

            if (oltData.pon < pon) {
                throw createError(400, `OLT only have ${oltData.pon} PON`);
            }

            const node = await client.db(process.env.MONGO_DB).collection('Node').findOne({ user: req.user, uid: oltData.node });

            if (!node) {
                throw createError(400, 'Node not found');
            }

            const CountData = await client.db(process.env.MONGO_DB).collection('ODC').countDocuments({ user: req.user, olt });

            if (CountData >= oltData.pon) {
                throw createError(400, 'OLT PON already full');
            }

            const Duplicate = await client.db(process.env.MONGO_DB).collection('ODC').findOne({ user: req.user, olt, pon });

            if (Duplicate) {
                throw createError(400, 'ODC already exists');
            }



            const user = req.user;
            const uid = uuidv4();
            const nomor = CountData + 1;
            const cid = `${oltData.cid}${nomor.toString().padStart(2, '0')}`;
            const label = `ODC${pon.toString().padStart(2, '0')}.${oltData.cid}`;


            const data = {
                user,
                uid,
                olt,
                pon,
                cid,
                label,
                capacity,
                splitter,
                tikor,
                alamat,
                created_at: moment().unix(),
                updated_at: moment().unix()
            };

            const result = await client.db(process.env.MONGO_DB).collection('ODC').insertOne(data);

            if (result.insertedCount === 0) {
                throw createError(500, 'Failed to create ODC');
            }

            return res.status(201).send({
                success: true,
                message: 'ODC created successfully',
                data: data
            });



        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });

    app.get('/odc', async (req, res, next) => {
        try {
            const data = await client.db(process.env.MONGO_DB).collection('ODC').aggregate([
                {
                    $match: { user: req.user }
                },{
                    $lookup: {
                        from: 'OLT',
                        localField: 'olt',
                        foreignField: 'uid',
                        as: 'olt'
                    }
                },{
                    $unwind: '$olt'
                },{
                    $lookup: {
                        from: 'Node',
                        localField: 'olt.node',
                        foreignField: 'uid',
                        as: 'olt.node'
                    }
                },{
                    $lookup:{
                        from: 'ODP',
                        localField: 'uid',
                        foreignField: 'odc',
                        as: 'odp'
                    
                    }
                }
            ]).toArray();

            if (!data) {
                throw createError(404, 'ODC not found');
            }

            return res.status(200).send({
                success: true,
                message: 'ODC found',
                data: data
            });
        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    }); // Get all ODC

    app.get('/odc/:id', async (req, res, next) => {
        try {

            const data = await client.db(process.env.MONGO_DB).collection('ODC').aggregate([
                {
                    $match: { user: req.user, uid: req.params.id }
                },{
                    $lookup: {
                        from: 'OLT',
                        localField: 'olt',
                        foreignField: 'uid',
                        as: 'olt'
                    }
                },{
                    $unwind: '$olt'
                },{
                    $lookup: {
                        from: 'Node',
                        localField: 'olt.node',
                        foreignField: 'uid',
                        as: 'olt.node'
                    }
                },{
                    $lookup:{
                        from: 'ODP',
                        localField: 'uid',
                        foreignField: 'odc',
                        as: 'odp'
                    
                    }
                }
            ]).toArray();

            if (!data) {
                throw createError(404, 'ODC not found');
            }

            return res.status(200).send({
                success: true,
                message: 'ODC found',
                data: data
            });

        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    }); // Get ODC by ID

    app.delete('/odc/:id', async (req, res, next) => {
        try {

            const cekOdc = await client.db(process.env.MONGO_DB).collection('ODC').aggregate([
                {
                    $match: { user: req.user, uid: req.params.id }
                },{
                    $lookup:{
                        from: 'ODP',
                        localField: 'uid',
                        foreignField: 'odc',
                        as: 'odp'
                    
                    }
                }
            ]).toArray();

            if(cekOdc.length === 0) {
                throw createError(404, 'ODC not found');
            }

            if(cekOdc[0].odp.length > 0) {
                throw createError(400, 'ODC has ODP, please delete ODP first');
            }

            const result = await client.db(process.env.MONGO_DB).collection('ODC').deleteOne({ user: req.user, uid: req.params.id });

           

            return res.status(200).send({
                success: true,
                message: `ODC ${cekOdc[0].label} deleted successfully`
            });

        }
        catch (error) {
            console.log(error.message)
            return next(
                createError(error.status, error.message));
        }
    });// Delete ODC by UID

    app.put('/odc/:id', async (req, res, next) => {
        try {
            const odc = await client.db(process.env.MONGO_DB).collection('ODC').findOne({ user: req.user, uid: req.params.id });

            if(!odc) {
                throw createError(404, 'ODC not found');
            }

            const oltData = await client.db(process.env.MONGO_DB).collection('OLT').findOne({ user: req.user, uid: odc.olt });


            if (!oltData) {
                throw createError(400, 'OLT not found');
            }

           
            const {capacity, splitter, tikor, alamat } = req.body;

          
            const data = {
                capacity,
                splitter,
                tikor,
                alamat,
                updated_at: moment().unix()
            };
            
            const result = await client.db(process.env.MONGO_DB).collection('ODC').updateOne({ user: req.user, uid: req.params.id }, { $set : data });
          
            if (result.modifiedCount === 0) {
                throw createError(500, 'Failed to update ODC');
            }

            return res.status(200).send({
                success: true,
                message: `${odc.label} updated successfully`,
                data: data
            });
            

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.status, error.message));
        }
    });// Update ODC by UID

}


export default OdcRoute;
