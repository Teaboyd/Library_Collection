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

        const {name} = req.body
        if(!name){
            return res.status(400).json({
                message: "Please Input Collection Name !"
            });
        }

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
            message: "server cannot add collection because database issue"
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
        data: result.rows,
    })
});

// post เพิ่มหนังสือเข้าไปใน collection นั้น ๆ //
collectionRouter.post("/myCollection",[protect],async(req,res)=>{


    try{	
        const addBook = {
            ...req.body,
            user_id:req.user_id,
            created_at: new Date(),
            updated_at: new Date(),
        };

    // ตรวจสอบว่าใน table book และ collection มี id ที่ req เข้ามาไหม //
        const booksChecker = await connectionPool.query(
            `SELECT * FROM books 
             WHERE book_id = $1`,
             [addBook.book_id]);

            if(!booksChecker.rows[0]){
                return res.status(404).json({
                    message:"Book not found"
                });
            };

        const collectionsChecker = await connectionPool.query(
           `SELECT * 
            FROM collections 
            WHERE collection_id = $1`,
            [addBook.collection_id]);
    
            if(!collectionsChecker.rows[0]){
                return res.status(404).json({
                    message:"Collection not found"
                });
            };     

    // ตรวจสอบว่าภายใน table books_collections มีตัว id ที่ซ่้ำกันไหม ///////////////////////////////

            const ExistingChecker = await connectionPool.query(
                `SELECT * 
                 FROM books_collections
                 WHERE book_id = $1 AND collection_id = $2`,
                 [addBook.book_id,addBook.collection_id]);
    
            // ถ้าเจอหนังสือชื่อซ้ำ ก็บอก user  ว่ามีหนังสือนี้อยู่แล้ว //
            if(ExistingChecker.rowCount > 0){
                return res.status(400).json({message: "You have already added this book."});
            };

    //////////////////////////////////////////////////////////////////////////////////////////   

        await connectionPool.query(
            
            `INSERT INTO books_collections(book_id,collection_id)
             VALUES ($1,$2)
             RETURNING books_collections_id`,
            [
                addBook.book_id,
                addBook.collection_id,
            ]
        );
        
    }catch(err){
        console.log(err)
        return res.status(500).json({
            message: "server cannot add books into collection because database issue"
        });
    };

        return res.status(201).json({message:"book has added to collection"});

});

// get หนังสือที่อยู่ใน collection นั้น ๆ ฟิลแบบกดเข้าไปใน collection บลา ๆ  แล้วเจอหนังสือที่อยู่ใน collection นั้น ฟิลคล้าย playlist //
collectionRouter.get("/myCollection/list" , [protect] , async (req,res) => {

    let result;
    const collection = req.query.name || null

    ///////////////////// เช็คว่า query ที่ให้มามีค่าเป็น null ไหม //////////////////////////
    if(!collection){
        return res.status(400).json({
            message: "Collection not found , Please Input Collection Name."
        });
    };

        try{

    ////////////////////// เช็คว่ามีชื่อ collection ไหม ///////////////////////////////
        const CollectionChecker = await connectionPool.query(
            `SELECT * FROM collections
             WHERE name = $1`,
             [collection]);
        
            if(!CollectionChecker.rows.length){
                return res.status(404).json({
                    message:"Collection not found"
                });
            };

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
            data: result.rows
        });
    });


// แก้ไขชื่อของ collection // 
collectionRouter.put("/:collectionsId" , [protect] , async (req,res) => { 

    try{ 

    const {collectionsId} = req.params;
    const updateCollection = {...req.body , user_id: req.user_id,updated_at: new Date()};  

    //////// เช็คว่าใน database มี id ของ collection นั้น ๆ หรือไม่ /////////////
    const result = await connectionPool.query(
        `SELECT *
         FROM collections
         WHERE collection_id = $1`,
         [collectionsId]
    );

    if (result.rowCount === 0){
        return res.status(404).json({
            message: "Collection not found :)"
        });
    };

    if (!updateCollection.name){
        return res.status(400).json({
            message: "Please fill in the information completely."
        });
    };

    await connectionPool.query(
        `
        UPDATE collections
        SET name = $2,
            user_id = $3,
            updated_at = $4
        WHERE collection_id = $1
        `,
        [
            collectionsId,
            updateCollection.name,
            updateCollection.user_id,
            updateCollection.updated_at
        ]
    );

    }catch(err){
        console.log(err)
        return res.status(500).json({
            message: "server couldn't update collection because database issue"
        });
    };

    return res.status(201).json({
        message: "Collection has updated"
    });
});

// ลบหนังสือออกจาก collection //
collectionRouter.delete("/myCollection/:collectionId/:bookId" , [protect] , async (req,res) =>{

    try{

        const {collectionId,bookId} = req.params;
        const result = await connectionPool.query(
            `SELECT *
             FROM books_collections
             WHERE collection_id = $1 AND book_id = $2`,
             [collectionId,bookId]
        );
    
        if (result.rowCount === 0){
            return res.status(404).json({
                message: "Collection Or Book not found"
            });
        };

        await connectionPool.query(
            `DELETE FROM books_collections
             WHERE collection_id = $1 AND book_id = $2`,
            [collectionId,bookId]
        );

    }catch(err){
        console.log(err)
        return res.status(500).json({
            message: "server couldn't delete books because database issue"
        })
    }

    return res.status(200).json({
        message: "Delete Books from Collection Successfully"
    });
});
    

//ลบ collection // 
collectionRouter.delete("/:collectionsId" , [protect] , async (req,res) =>{

    try{

        const {collectionsId} = req.params;

        await connectionPool.query(`
            delete from collections
            where collection_id = $1
            `,[collectionsId])

    }catch(err){

        return res.status(500).json({
            message: "server couldn't delete collection because database issue"
        });

    };

    return res.status(200).json({
        message: "Delete Collection Successfully"
    });

});


export default collectionRouter;
