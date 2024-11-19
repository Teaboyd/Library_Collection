import connectionPool from "../utils/db.mjs";
import { Router } from "express";
import { protect } from "../middlewares/protect.mjs";

const bookRouter = Router();

// เพิ่มหนังสือเข้าไปใน user //
bookRouter.post("/" ,[protect], async (req,res) =>{

    try{

        const newBook = {
            ...req.body,
            user_id: req.user_id,
            created_at: new Date(),
            updated_at:new Date(),
        };

        // เช็คว่า database มีหนังสือชื่อซ้ำไหม //
        const ExistingBook = await connectionPool.query(
            `SELECT * 
             FROM books 
             WHERE title = $1 AND user_id = $2`,
             [newBook.title,newBook.user_id]);

        // ถ้าเจอหนังสือชื่อซ้ำ ก็บอก user  ว่ามีหนังสือนี้อยู่แล้ว //
        if(ExistingBook.rows.length > 0){
            return res.status(400).json({message: "You have already added this book."});
        };

        
        await connectionPool.query(

            `INSERT INTO books(user_id,title,synopsis,author,publisher,published_year,created_at,updated_at)
             values($1,$2,$3,$4,$5,$6,$7,$8) 
             RETURNING book_id`,
            [
                newBook.user_id,
                newBook.title,
                newBook.synopsis,
                newBook.author,
                newBook.publisher,
                newBook.published_year,
                newBook.created_at,
                newBook.updated_at,
            ]
        );

    }catch(err){
        console.log(err);
        return res.status(500).json({message:"server couldn't create user because database issue"});
    }

    return res.status(201).json({message:"Book has added !"});
});

// เรียกดูหนังสือทั้งหมด //
bookRouter.get("/",[protect], async( req,res) => {

    let result;
    try{
     result = await connectionPool.query(
        `SELECT *
        FROM books
        ORDER BY books.created_at ASC`
    );
    }catch(err){
        console.log(err);
        return res.status(500).json({
            message: "Server cannot read book because database issue"
        })
    }

    return res.status(200).json({
        data: result.rows,
    })
});

// เรียกดูหนังสือเฉพาะเล่มจาก Id //
bookRouter.get("/:bookId", [protect] , async(req,res)=>{

    let result;
    try{

        const {bookId} = req.params;
        result = await connectionPool.query(
            `select * from books where book_id = $1`,[bookId]
        );

        if(!result.rows[0]){
            return res.status(404).json({
                message: `Server cannot find a book :)`,
            });
        }
    }catch{
        return res.status(500).json({
            message:"server couldn't read books because database issue"
        })
    }

    return res.status(200).json({
        data: result.rows[0]
    })
});

// แก้ไขรายระเอียดหนังสือ //
bookRouter.put("/:bookId",[protect],async (req,res) =>{

    try{
    const {bookId} = req.params;
    const updatedBook = {...req.body , user_id: req.user_id, updated_at: new Date()};

    const result = await connectionPool.query(
        `SELECT *
         FROM books
         WHERE book_id = $1`,
         [bookId]
    );

    if (result.rowCount === 0){
        return res.status(404).json({
            message: "book not found"
        });
    };

    await connectionPool.query(
        `
        UPDATE books
        SET title = $2,
            synopsis =$3,
            author = $4,
            publisher = $5,
            published_year = $6,
            updated_at = $7
        WHERE book_id = $1
        `,
        [
            bookId,
            updatedBook.title,
            updatedBook.synopsis,
            updatedBook.author,
            updatedBook.publisher,
            updatedBook.published_year,
            updatedBook.updated_at,
        ]
    );


    }catch(err){
        console.log(err)
        return res.status(500).json({
            message: "server couldn't create user because database issue"
        })
    };

    return res.status(201).json({
        message: "Book updated succesfully"
    });
});

// ลบหนังสือออกจาก user //
bookRouter.delete("/:bookId",[protect], async (req,res) =>{


    try{
        const {bookId} = req.params;

        const result = await connectionPool.query(
            `SELECT *
             FROM books
             WHERE book_id = $1`,
             [bookId]
        );
    
        if (result.rowCount === 0){
            return res.status(404).json({
                message: "book not found"
            });
        };

        await connectionPool.query(
            `delete from books
            where book_id = $1`,
            [bookId]
        );

    }catch(err){
        return res.status(500).json({
            message: "server couldn't delete books because database issue"
        })
    }

    return res.status(200).json({
        message: "Delete Books Successfully"
    });
});

// เรียกดูหนังสือทั้งหมดจากชื่อคนแต่ง
bookRouter.get("/myBook/list",[protect],async(req,res) => { 

    let results;
    const {author,publisher} = req.query

    try{
        results = await connectionPool.query(
            `SELECT title,synopsis,publisher,published_year,author
            FROM books
            WHERE (author = $1 OR $1 is null OR $1 = ''
                   AND
                   publisher = $2 OR $2 is null OR $2 = '')`,
            [author,publisher]
        );

    }catch(err){
        console.log(err)
        return res.status(500).json({
            message:"server couldn't create user because database issue"
       });
    };

    return res.status(200).json({
        data: results.rows,
    });
});

// เรียกดูหนังสือทั้งหมดจากชื่อสำนักพิมพ์
/*bookRouter.get("/info/publisher",[protect],async(req,res) => { 

    let results;
    const {publisher} = req.query
    try{
        results = await connectionPool.query(
            `SELECT title,synopsis,author,published_year
            FROM books
            WHERE (publisher = $1 or $1 is null or $1 = '')`,
            [publisher]
        );

    }catch(err){
        console.log(err)
        return res.status(500).json({
            message:"server couldn't create user because database issue"
       });
    };

    return res.status(200).json({
        data: results.rows,
    });
});*/

export default bookRouter;

