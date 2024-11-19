import connectionPool from "../utils/db.mjs";
import { Router } from "express";
import { protect } from "../middlewares/protect.mjs";


const profileRouter = Router();

// เพิ่มรายละเอียด profile //
profileRouter.post("/" ,[protect] , async (req,res) =>{

    try{
    const newProfile = {
        ...req.body,
        user_id: req.user_id,
        created_at: new Date(),
        updated_at: new Date()  
    }
    

    await connectionPool.query(
        `INSERT INTO users_profiles (user_id,first_name,last_name,gender,birth_day,profile_pic,address,phone_numbers,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) 
         RETURNING user_profile_id`,
         [
            newProfile.user_id,
            newProfile.first_name,
            newProfile.last_name,
            newProfile.gender,
            newProfile.birth_day,
            newProfile.profile_pic,
            newProfile.address,
            newProfile.phone_numbers,
            newProfile.created_at,
            newProfile.updated_at,
         ]
    );

    }catch(err){
        console.log(err)
        return res.status(500).json({
            message: "server couldn't create profile because database issue"
        })
    };

    return res.status(201).json({
        message: "profile has added!"
    });
});

// เรียกดูข้อมูล profile //
profileRouter.get("/" , [protect] , async (req,res) => {
    
    let result;
    try{
        result = await connectionPool.query(
            `SELECT * FROM users_profiles 
             ORDER BY updated_at DESC
             LIMIT 1 `
        )
    }catch(err){
        console.log(err);
        return res.status(500).json({
            message: "Server cannot read user profile because database issue",
        })
    }

    return res.status(200).json({
        data: result.rows,
    });
});

// update ข้อมูล profile //
profileRouter.put("/:profileId" , [protect] , async (req,res) => {

    try{
        const {profileId} = req.params
        const updateProfile = {
            ...req.body,
            user_id: req.user_id,
            updated_at: new Date()
        };

        await connectionPool.query(
           `UPDATE users_profiles
            SET user_id = $2,
                first_name = $3,
                last_name = $4,
                gender = $5,
                birth_day = $6,
                profile_pic = $7,
                address = $8,
                phone_numbers = $9
            WHERE user_profile_id = $1`,
            [
                profileId,
                updateProfile.user_id,
                updateProfile.first_name,
                updateProfile.last_name,
                updateProfile.gender,
                updateProfile.birth_day,
                updateProfile.profile_pic,
                updateProfile.address,
                updateProfile.phone_numbers
            ]
        );
    }catch(err){
        console.log(err)
        return res.status(500).json({
            message: "server couldn't update profiles because database issue"
        });
    };

    return res.status(201).json({
        message: "profiles has updated !"
    });
});

export default profileRouter;