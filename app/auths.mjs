import { Router } from "express";
import jwt from "jsonwebtoken";
import connectionPool from "../utils/db.mjs";
import {ValidationCreateUser} from "../middlewares/user_validation.mjs"
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { checkBlacklist } from "../middlewares/ิblacklist.mjs";

dotenv.config();
const authRouter = Router();
export const blacklist = new Set(); //เก็บ token ไว้ใน blacklist


authRouter.post("/register" ,[ValidationCreateUser], async (req,res) =>{

try{	
	// รับข้อมูลที่กรอกมาจากฝั่ง client// 
	const newUser = { ...req.body,
		       create_at:new Date(),
		       updated_at:new Date(),
               last_logged_in:new Date(),
		     };

    //Check ว่าข้อมูลมาไหม//
    console.log("Attempting to insert user:", newUser);


	// เก็บรหัสแบบ hashed ***bcrypt.hash หลังจากการ hash แล้ว varchar จะเกิน 60 ให้ตั้งประมาณ 100 ในตัว database เพื่อให้รองรับ//
	const salt = await bcrypt.genSalt(10);
	newUser.password = await bcrypt.hash(newUser.password,salt);

	//  query เพื่อ insert ข้อมูล ผ่าน connectionPool// //RETURNING user_id ช่วยให้ดึง user_id ของผู้ใช้ที่เพิ่งถูกเพิ่มลงในฐานข้อมูลได้//
	await connectionPool.query(
        `INSERT INTO users (username,password,email,create_at,updated_at,last_logged_in)
		values ($1,$2,$3,$4,$5,$6) RETURNING user_id`,
		[
			newUser.username,
			newUser.password,
			newUser.email,
			newUser.create_at,
			newUser.updated_at,
            newUser.last_logged_in,
		]
	);
	// return ผลลัพท์ว่าสร้าง user สำเร็จ // 
	return res.status(201).json({message: "user has been created successfully",});
}catch(err){
    //Check ว่า error ตรงไหน//
    console.error(err);
	return res.status(500).json({message:"server couldn't create user because database issue"});
    };
});

authRouter.post("/login" , async (req,res) =>{

   try{
    const {username} = req.body; //รับ input username จากฝั่ง client destruction ให้รับแค่ username//
    const isValidUser = await connectionPool.query(
        `SELECT * 
         FROM users 
         WHERE username = $1`,[username]); //ดึงข้อมูล username จาก database//

    const user = isValidUser.rows[0]; //เอาผลลัพท์จากการดึงจากใน database มาเก็บไว้ในตัวแปร user

    // ตรวจ user ใส่ข้อมูลตรงหรือมีใน database ไหมถ้าไม่มีก็ response กลับไปว่าผิด//
    if(!user){
        return res.status(404).json({
            message: "user not found or username is wrong!"
        })
    };

    //ตรวจ password ที่ส่งมาของ client//
    const isValidPassword = await bcrypt.compare( //เปรียบเทียบ password ฝั่ง client และ database hashed//
        req.body.password,
        user.password
    );

    if(!isValidPassword){
        return res.status(400).json({
            message: "Password incorrect",
        });
    }

    const token = jwt.sign(
        { id: user.user_id},process.env.SECRET_KEY,{expiresIn:"15m",}
      );
      
      return res.json({
          message: "login successfully >_<",token,
      });
   }catch(err){
    return res.status(500).json({
        message:"Server could not login because database connection"
    })
   }
});

authRouter.post("/logout", [checkBlacklist],async (req,res) => {
    try{
    const token = req.header.authorizations?.split(" ")[1];
    if (token){
        blacklist.add(token); //เอา token ที่ได้มาจากการ login เข้าไปไว้ใน blacklist
    }
    res.status(200).json({message:"Logged out successfully"});
    }catch(err){
        console.log(err)
        res.status(500).json({message:"Logged out fail"});
    }
});

// อยากทำตัว retype-password เช็คว่าตรงกันไหม //

export default authRouter;