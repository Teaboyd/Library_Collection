import connectionPool from "../utils/db.mjs";
import { Router } from "express";
import { protect } from "../middlewares/protect.mjs";

const bookRouter = Router();

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
            return res.status(401).json({message: "You have already added this book."});
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
        return res.status(401).json({
            message: "Server cannot read book because database issue"
        })
    }

    return res.status(201).json({
        data: result.rows,
    })
});

bookRouter.get("/:bookId", [protect] , async(req,res)=>{

    try{

        const {bookId} = req.params;
        const result = await connectionPool.query(
            `select * from books where book_id = $1`,[bookId]
        );

        if(!result.rows[0]){
            return res.status(404).json({
                message: `Server cannot find a books(post id: ${bookId})`,
            });
        }

        return res.status(200).json({
            data: result.rows[0]
        })

    }catch{
        return res.status(500).json({
            message:"server couldn't read books because database issue"
        })
    }
});

bookRouter.put("/:bookId",[protect],async (req,res) =>{

    try{
    const {bookId} = req.params;
    const updatedBook = {...req.body , updated_at: new Date()};

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

bookRouter.delete("/:bookId",[protect], async (req,res) =>{


    try{
        const {bookId} = req.params;
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

    return res.status(201).json({
        message: "Delete Books Successfully"
    });
});

/*bookRouter.post("/BookFromInfo",[protect],async(req,res) => { 

    // ดึงข้อมูลหนังสือทั้งหมดของนักเขียน //
    const { Info } = req.body; //รับ input จากฝั่ง client//

    if(!Info){    
        return res.status(401).json({
            message: "Please Input Some Infomation !"
        })
    }

    try{
      const BookByInfo = await connectionPool.query(
        `SELECT title,synopsis,author,publisher,published_year 
          FROM books 
          WHERE title = $1 AND synopsis = $2 AND author = $3 AND publisher = $4 AND published_year = $5 AND user_id = $6`,[title,synopsis,author,publisher,published_year,req.user_id]
     );

      if(BookByInfo.rows.length > 0){
            return res.status(201).json({
                data: BookByInfo.rows,
            });
        }else{
            return res.status(404).json({
                message: " no infomation "
            });
        };
    }catch(err){
        console.log(err)
        return res.status(501).json({
            message:"server couldn't create user because database issue"
       });
    }
});*/ //กรณีศึกษา

/*bookRouter.post("/BookFromPublisher",[protect],async(req,res) => {

    // ดึงข้อมูลหนังสือทั้งหมดของสำนักพิมพ์ //
    const { publisher } = req.body; //รับ input publisher จากฝั่ง client//

    if(!publisher){    
        return res.status(401).json({
            message: "Please Input Publisher Name !"
        })
    }

    try{
      const BookByPublisher = await connectionPool.query(
        `SELECT title,synopsis,author,published_year 
          FROM books 
          WHERE publisher = $1 AND user_id = $2`,[publisher,req.user_id]
     );

      if(BookByPublisher.rows.length > 0){
            return res.status(201).json({
                data: BookByPublisher.rows,
            });
        }else{
            return res.status(404).json({
                message: " no infomation for this Publisher"
            });
        };
    }catch(err){
        return res.status(501).json({
            message:"server couldn't create user because database issue"
       });
    }
});*/ //กรณีศึกษา



export default bookRouter;

