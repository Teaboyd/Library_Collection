import jwt from 'jsonwebtoken';


export const protect = async (req,res,next) => {
        const token = req.headers.authorization

    if(!token || !token.startsWith('Bearer')){
        res.status(401).json({
            message:"Token has invalid format"
        });
    }

    const tokenWithoutBearer = token.split(" ")[1];

    jwt.verify(tokenWithoutBearer,process.env.SECRET_KEY,(err,payload) => {
        if (err){
            return res.status(401).json({
                message: "Token is invalid"
            });
        }
        
        req.user_id = payload.id;
        req.user_id = payload.username;
        next();
    });
}   

//สร้าง Middleware Protect ไว้ตรวจสอบ Request โดยการเช็คเงื่อนไขสองอย่าง
//เงื่อนไขแรก คือมีการแนบ Token ไว้ใน Header
//เงื่อนไขที่สอง คือ Token ที่แนบมานั้นต้อง Valid (ถูกต้อง)
//เอาข้อมูลที่ได้จาก payload(jwt.sign)มาเก็บไว้ใน req.user_id แล้วเอาไปใช้ใน bookAdd จะได้รู้ว่าใครสร้าง