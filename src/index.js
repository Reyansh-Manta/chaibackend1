import connectDB from "./db/index.js"


connectDB()
.then(()=>{
    app.on("error",(err)=>{console.log("App connection error ", err)
        throw err;
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server running on port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("Error",err);
})