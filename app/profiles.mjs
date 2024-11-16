import connectionPool from "../utils/db.mjs";
import { Router } from "express";
import { protect } from "../middlewares/protect.mjs";

const profileRouter = Router();

profileRouter.post("/" ,[protect] , async (req,res) =>{

    try{
    const newProfile = {
        ...req.body,
        user_id: req.user_id,
        created_at: new Date(),
        updated_at: new Date()  
    }
    

    await connectionPool.query(
        `INSERT INTO users_profiles (user_id,first_name,last_name,gender,birth_day,profile_pic,address,phone_numbers)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) 
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















export default profileRouter;