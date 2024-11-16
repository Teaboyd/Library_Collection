import { Router } from "express";
import connectionPool from "../utils/db.mjs";
import { protect } from "../middlewares/protect.mjs";

const collectionRouter = Router();

collectionRouter.get("/test",(req,res)=>{
    return res.json("Hello World,")
});


// สร้าง collection เป็นของตัวเอง //
collectionRouter.post("/",[protect] , async (req,res)=>{

    try{
        const newCollection = {
            ...req.body,
            user_id: req.user_id,
            created_at: new Date(),
            updated_at: new Date(),
        }

        await connectionPool.query (
            `INSERT INTO collections(user_id,name,created_at,updated_at)
             Values ($1,$2,$3,$4)
             RETURNING collection_id`,
             [
                newCollection.user_id,
                newCollection.name,
                newCollection.created_at,
                newCollection.updated_at,
             ]
        );
    }catch(err){
        console.log(err)
        return res.status(500).json({
            message: "server cannot create user profile because database issue"
        });
    };

    return res.status(201).json({
        message: "Collection has added !"
    });
});

// get Collection ทั้งหมดไม่รวมหนังสือข้างใน //
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
        return res.status(500).json({
            message: "server couldn't read collection because database issue"
        });
    };

    return res.status(200).json({
        message: result.rows,
    })
});

// post เพิ่มหนังสือเข้าไปใน collection นั้น ๆ //
collectionRouter.post("/books",[protect],async(req,res)=>{


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
         RETURNING books_collections_id`,
        [
            addBook.book_id,
            addBook.collection_id,
            addBook.quantity,
        ]
        );
    }catch(err){
        console.log(err)
        return res.status(500).json({
            message: "server cannot create user profile because database issue"
        });
    };
        return res.status(201).json({message:"book has added to collection"});
});

// get หนังสือที่อยู่ใน collection นั้น ๆ ฟิลแบบกดเข้าไปใน collection บลา ๆ  แล้วเจอหนังสือที่อยู่ใน collection นั้น ฟิลคล้าย playlist //
collectionRouter.get("/collections" , [protect] , async (req,res) => {

    let result;
    const collection = req.query.name
    
        try{
    
        result = await connectionPool.query(
            `SELECT collections.name,books.title,books.synopsis,books.author,books.publisher,books.created_at
            FROM books_collections
            INNER JOIN books ON books.book_id = books_collections.book_id
            INNER JOIN collections ON collections.collection_id = books_collections.collection_id
            WHERE (name = $1 or $1 is null or $1 = '')
            ORDER BY books.created_at ASC`,[collection]
            );
        }catch(err){
            console.log(err)
            return res.status(500).json({
                 message: "server couldn't read collection because database issue"	
            });
        };
        
        return res.status(200).json({
            message: result.rows
        });
    });

// แก้ไขชื่อของ collection // 
collectionRouter.put("/collections" , [protect] , async (req,res) => {

});



















export default collectionRouter;
