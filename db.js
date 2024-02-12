//Importing mongodb client
import { MongoClient} from 'mongodb';
import dotenv from 'dotenv'
dotenv.config();

let dbConnection;
let uri= process.env.MONGO_ATLAS_KEY;

//Exporting the database connection
export const  connectToDb = (cb) => {
    MongoClient.connect(uri)
       .then((client)=>{
        dbConnection = client.db();            
        return cb();
    }).catch((err)=>{
        console.log(err);
        return cb(err);
    })
}

export const  getDb = ()=> { return dbConnection}
