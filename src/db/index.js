import mongoose from "mongoose"
import {DB_NAME} from "../constants.js"

const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MONGODB connected!!! | DB_HOST: ${connectionInstance.connection.host}`); m
    } catch (error) {
        console.log("Error while connecting to DB", error); 
        process.exit(1)
    }
}

export default connectDB