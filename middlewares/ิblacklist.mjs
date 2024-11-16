import { blacklist } from "../app/auths.mjs";

//validation ถ้าตรวจพบว่า token อยู่ใน blacklist ให้ส่งข้อความ"
export const checkBlacklist = (req,res,next) => {

    const token = req.headers.authorization?.split(" ")[1];

    if (blacklist.has(token)){
        return res.status(401).json({message: "Token has been logged out"});
    }
    next();
};