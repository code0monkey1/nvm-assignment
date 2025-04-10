import app from "./app";

import { Config } from "./config";

const startServer=()=>{
     
    const PORT = Config.PORT

    try{
        
        app.listen(PORT,()=>{
            console.log(`✅ Server Running on PORT:${PORT}`)
        })

    }catch(e){
       console.error(e)
       process.exit(1)
    }
}

startServer()