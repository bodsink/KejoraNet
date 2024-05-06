import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
import { nextTick } from 'process';
moment.locale('id');


import Xendit from '../Class/Class.Xendit.js';

export const XenditRoute = (app, client) => {
    app.post('/virtual_accounts', async (req, res, next) => {
        try {

            const { external_id, bank_code, name, expected_amount} = req.body;

            if (!external_id) {
                throw createError(400, 'Please enter external_id');
            }

            if (!bank_code) {
                throw createError(400, 'Please enter bank_code');
            }

            if (!name) {
                throw createError(400, 'Please enter name');
            }

            if (!expected_amount) {
                throw createError(400, 'Please enter expected_amount');
            }


            const data ={
                external_id,
                bank_code,
                name,
                is_closed: true,
                is_single_use: false,
                expected_amount
            }


            const xendit = new Xendit();
            const save = await xendit.createVirtualAccount(data);

            const dataVirtualAccounts = {
                id: save.id,
                owner_id: save.owner_id,
                external_id: save.external_id,
                account_number: save.account_number,
                bank_code: save.bank_code,
                merchant_code: save.merchant_code,
                name: save.name,
                is_closed: save.is_closed,
                expected_amount: save.expected_amount,
                expiration_date: save.expiration_date,
                is_single_use: save.is_single_use,
                status: save.status,
                currency: save.currency,
                country: save.country,
                created_at: moment().unix(),
                updated_at: moment().unix()
              }

            const saveVirtualAccounts = await client.db(process.env.MONGO_DB).collection('VirtualAccounts').insertOne(dataVirtualAccounts);
            if (saveVirtualAccounts.insertedCount === 0) {
                throw createError(500, 'Failed to create Virtual Account');
            }
 
            res.status(201).send({
                success: true,
                message: 'Virtual Account created successfully',
                data: save
            })

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.response.status, error.response.data.message));
        }
    });

    app.get('/saldo', async (req, res, next) => {
        try {
            const xendit = new Xendit();
            const saldo = await xendit.cekSaldo();
            res.status(200).send({
                success: true,
                message: 'Saldo retrieved successfully',
                data: saldo
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.response.status, error.response.data.message));
        }
    });

    app.get('/transactions', async (req, res, next) => {
        try {
            const xendit = new Xendit();
            const transactions = await xendit.transactionList();
            res.status(200).send({
                success: true,
                message: 'Transactions retrieved successfully',
                data: transactions
            });

        }
        catch (error) {
            console.log(error)
            return next(
                createError(error.response.status, error.response.data.message));
        }
    });
};

export default XenditRoute;