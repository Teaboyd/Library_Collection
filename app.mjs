import express from "express";
import authRouter from "./app/auths.mjs";
import bookRouter from "./app/books.mjs";
import connectionPool from "./utils/db.mjs";
import collectionRouter from "./app/collection.mjs";

async function init(){
    const app = express();
    const port = 4544;
    
    await connectionPool.connect();

    app.use(express.json());
    app.use("/auth",authRouter);
    app.use("/book",bookRouter);
    app.use("/collection",collectionRouter);

    app.get("/test" , (req,res) => {
    return res.json("Server is working eiei")
    });

    app.listen(port,() => {
    console.log(`server is running at ${port}`);
    });
}

init();