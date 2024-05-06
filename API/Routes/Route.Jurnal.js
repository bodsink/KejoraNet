import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
import { nextTick } from 'process';
import { create } from 'domain';
moment.locale('id');

import Jurnal from '../Class/Class.Jurnal.js';
import Meta from '../Class/Class.Meta.js';

export const JurnalRoute = (app, client) => {
    app.get('/jurnal/cron/overdue', async (req, res, next) => {
        try {

            const date = new Date();
            const startDateThisMonth = moment(date).startOf('month').format('DD/MM/YYYY');
            const endDateThisMonth = moment(date).endOf('month').format('DD/MM/YYYY');
            const thisDate = moment(date).format('DD/MM/YYYY');


            const jurnal = new Jurnal();
            const invoices = await jurnal.getInvoice('?start_date=' + startDateThisMonth + '&end_date=' + thisDate + '&status_id=1'); //1=open, 2=closed, 3=paid, 5=overdue, all=All


            if (invoices.sales_lists.transactions.length == 0) {
                return next(
                    createError(404, 'No Overdue Invoice'));
            }


            let arr = [];


            const data = invoices.sales_lists.transactions;
            console.log(data[0])
            data.forEach(async (item) => {
                const bulan = moment(item.transaction_date).format('MMMM YYYY');
                const due_date = moment(item.due_date).format('DD MMMM YYYY');
                const transaction_date = moment(item.transaction_date).format('DD MMMM YYYY');
                const suspended_date = moment(due_date).add(4, 'd').format('DD MMMM YYYY');

                let obj = {
                    transaction_id: item.id,
                    transaction_date: transaction_date,
                    due_date: due_date,
                    periode: bulan,
                    suspended_date: suspended_date,
                    transaction_no: item.transaction_no,
                    total: item.balance_due,
                    paid: item.payment,
                    balance: item.balance_due,
                    items: item.items,
                    customer: {
                        id: item.person.id,
                        name: item.person.name,
                        phone: item.person_mobile,
                        address: item.billing_address,
                    },

                }
                arr.push(obj);

            });



         //   console.log(arr)



        }
        catch (error) {
            console.log(error)
            return next(
                createError(500, error.message));
        }
    });// Cron job to check overdue invoice
};

export default JurnalRoute;

// Path: API/Routes/Route.Jurnal.js