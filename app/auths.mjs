import { Router } from "express";
import jwt from "jsonwebtoken";
import connectionPool from "../utils/db.mjs";
import {ValidationCreateUser} from "../middlewares/user_validation.mjs"
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { checkBlacklist } from "../middlewares/ิblacklist.mjs";
import { protect } from "../middlewares/protect.mjs";

dotenv.config();
const authRouter = Router();
export const blacklist = new Set(); //เก็บ token ไว้ใน blacklist

// ผู้ใช้สามารถสมัครสมาชิกได้ //
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

// ผู้ใช้สามารถเข้าสู่ระบบได้ //
authRouter.post("/login" , async (req,res) =>{

   try{
    const {username} = req.body; //รับ input เฉพาะ username จากฝั่ง client destruction ให้รับแค่ username// 
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

// ผู้ใช้สามารถเปลี่ยนรหัสผ่านได้ //
authRouter.put("/:passId" , [protect] , async (req,res) => {

    try{
    // เลือกดึงข้อมูลเฉพาะ รหัสผ่านเก่า กับ รหัสผ่านใหม่จาก user //
    const {currentPassword , newPassword}  = req.body 
    const {passId} = req.params

    // เช็คว่าได้กรอก รหัสผ่านเก่าและรหัสผ่านใหม่เข้ามาไหม // 
    if(!currentPassword || !newPassword){
        return res.status(400).json({
            message: "Please Input currentPassword and newPassword"
        });
    };

    // ดึงข้อมูลรหัส ผ่าน user_id ที่ตรงกับ passId จาก database  //
    const result = await connectionPool.query(
        `SELECT password
         FROM users 
         WHERE user_id = $1`,
         [passId]
    );


    // check ว่ามี user ที่ user req มาไหม ถ้าไม่มีส่ง err กลับว่า ไม่เจอ //
    if (result.rowsCount === 0){
        return res.status(404).json({
            message: "user not found"
        });
    };

    // เก็บผลลัพท์ไว้ใน user //
    const user = result.rows[0];

    // เช็คว่า password เก่ากับ password ที่เคยกรอกไว้ครั้งก่อนตรงกันไหม ถ้าไม่ก็ไม่ให้เปลี่ยนและส่ง err ว่า password ไม่ตรงกัน //
    // ** ใช้ bcrypt compare เพื่อแปลงเปรียบเทียบ ** /
    const isValidPassword = await bcrypt.compare(currentPassword,user.password);
    console.log(isValidPassword)
    if (!isValidPassword){
        return res.status(400).json({
            message: "Password doesn't match"
        });
    };

    //gen password ใหม่ //
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(newPassword,salt);

    await connectionPool.query(
        `
        UPDATE users
        SET password = $2,
            updated_at = $3
        WHERE user_id = $1
        `,
        [
            passId,
            hashedPassword,
            new Date(),
        ]
    );
    }catch(err){
        console.log(err)
        return res.status(500).json({
            message: "Server cannot update password because database issue"
        });
    };

    return res.status(200).json({
        message: "Password is updated"
    });

});

// ผู้ใช้สามารถออกจากระบบได้ //
authRouter.post("/logout", [checkBlacklist],async (req,res) => {
    try{
    const token = req.header.authorizations?.split(" ")[1];
    if (token){
        blacklist.add(token); //เอา token ที่ได้มาจากการ login เข้าไปไว้ใน blacklist
    }
    res.status(200).json({message:"Logged out successfully"});
    }catch(err){
        console.log(err)
        res.status(500).json({message:"Logout failed. Please try again later."});
    }
});

// ผู้ใช้สามารถลบบัญชีของตนได้ //
authRouter.delete("/:userId" , [protect] , async (req,res) => {
    
    try{
    const {userId} = req.params;

    const isCheckUser = await connectionPool.query(

        `SELECT * 
         FROM users 
         WHERE user_id = $1 `,
         [userId]);

         const userChecker = isCheckUser.rows[0];

         if(!userChecker){
            return res.status(404).json({
                message: "User not found"
            })
        };

    await connectionPool.query(
        `DELETE FROM users
         WHERE user_id = $1`,
         [userId]
    );
    }catch(err){
        console.log(err)
        return res.status(500).json({
            message: "server couldn't delete user because database issue"
        });
    };

    return res.status(200).json({
        message: "delete user successfully"
    });
});

export default authRouter;