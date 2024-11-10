import connectionPool from "../utils/db.mjs";
import { Router } from "express";
import { protect } from "../middlewares/protect.mjs";

const authBook = Router();

authBook.post("/addBook" ,[protect], async (req,res) =>{

    try{

        const newBook = {
            ...req.body,
            user_id: req.user_id,
            created_at: new Date(),
            updated_at:new Date(),
        };

        console.log(newBook);

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

            `INSERT INTO books(user_id,title,synosis,created_at,updated_at,published_year)
             values($1,$2,$3,$4,$5,$6) 
             RETURNING book_id`,
            [
                newBook.user_id,
                newBook.title,
                newBook.synosis,
                newBook.created_at,
                newBook.updated_at,
                newBook.published_year,
            ]
        );

        return res.status(201).json({message:"Book has added !"});

    }catch(err){
        console.log(err);
        return res.status(500).json({message:"server couldn't create user because database issue"});
    }
});

authBook.post("/addAuthor" , [protect], async (req,res) =>{

    try{
        const newAuthor = {
            ...req.body,
        };

        await connectionPool.query(
            `INSERT INTO authors(name) 
             VALUES ($1) `,
             [
                newAuthor.name,
             ]
        );

        return res.status(201).json({
            message: "Author has insert <3"
        });
    }catch(err){
        console.log(err);
        return res.status(401).json({
            message: "Author add failed"
        })
    }
});

authBook.post("/addPublisher" , [protect], async (req,res) =>{

    try{
        const newPubisher = {
            ...req.body,
        };

        await connectionPool.query(
            `INSERT INTO publishers(name) 
             VALUES ($1) `,
             [
                newPubisher.name,
             ]
        );

        return res.status(201).json({
            message: "Pubisher has insert <3"
        });
    }catch(err){
        console.log(err);
        return res.status(401).json({
            message: "Pubisher add failed"
        })
    }
});

export default authBook;

