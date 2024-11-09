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

export default authBook;

