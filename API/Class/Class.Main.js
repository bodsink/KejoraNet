import createError from 'http-errors';
import { MongoClient } from 'mongodb';



export default class MainClass  {
    constructor() {
        this.data = [];

    }

    async getSettings(user) {
        try {
            const settings = await client.db(process.env.MONGO_DB).collection('Settings').findOne({ user });
            if (!settings) {
                throw createError(404, 'Settings not found');
            }
            return settings;
        }
        catch (err) {
            throw createError(err.status, err.message);
        }
    }

    async getRadius(user) {
        try {
            const radius = await client.db(process.env.MONGO_DB).collection('Radius').findOne({ uid: user });
            if (!radius) {
                throw createError(404, 'Radius not found');
            }
            return radius;
        }
        catch (err) {
            throw createError(err);
        }
    }
}