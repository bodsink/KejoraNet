import crom from 'node-cron';


export const cron = (client) => {

    async function getOnu() {
        try {
          

              crom.schedule('*/1 * * * *',  () => {

                // const onu = await client.db(process.env.MONGO_DB).collection('OLT').find({}).toArray();
                // console.log(onu)

                console.log('running a task every minute');
            }); // every 1 minute
        } catch (error) {
            console.error(error);
        }
    }

    return getOnu();



}

export default cron;