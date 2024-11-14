import { Router } from "express";
import connectionPool from "../utils/db.mjs";
import { protect } from "../middlewares/protect.mjs";

const collectionRouter = Router();

collectionRouter.get("/test",(req,res)=>{
    return res.json("Hello World,")
});

collectionRouter.post("/",[protect] , async (req,res)=>{

    try{
        const newCollection = {
            ...req.body,
            user_id: req.user_id,
            created_at: new Date(),
            updated_at: new Date(),
        }

        await connectionPool.query (
            `INSERT INTO collections(user_id,name,created_at,updated_at,quantity)
             Values ($1,$2,$3,$4,$5)
             RETURNING collection_id`,
             [
                newCollection.user_id,
                newCollection.name,
                newCollection.created_at,
                newCollection.updated_at,
                newCollection.quantity,
             ]
        );
    }catch(err){
        console.log(err)
        return res.status(501).json({
            message: "server cannot create user profile because database issue"
        });
    };

    return res.status(201).json({
        message: "Collection has added !"
    });
});

collectionRouter.get("/", [protect] , async (req,res) => {


    let result;
    try{
        result = await connectionPool.query(
            `SELECT *
             FROM collections
             ORDER BY created_at ASC `
        )
    }catch(err){
        console.log(err);
        return res.status(501).json({
            message: "server couldn't read collection because database issue"
        });
    };

    return res.status(201).json({
        message: result.rows,
    })
});


collectionRouter.post("/bookAddToCollection",[protect],async(req,res)=>{


    try{	
        const addBook = {
            ...req.body,
            user_id:req.user_id,
            created_at: new Date(),
            updated_at: new Date(),
        };
    
        await connectionPool.query(
            
        `INSERT INTO books_collections(book_id,collection_id,quantity)
         VALUES ($1,$2,$3)
         RETURNING books_collection_id`,
        [
            addBook.book_id,
            addBook.collection_id,
            addBook.quantity,
        ]
        );
    }catch(err){
        return res.status(501).json({
            message: "server cannot create user profile because database issue"
        });
    };
        return res.status(201).json({message:"book has added to collection"});
});
    





















export default collectionRouter;
