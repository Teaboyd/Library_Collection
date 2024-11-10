import jwt from 'jsonwebtoken';


export const protect = async (req,res) => {
        const token = req.headers.authorization

    if(!token || !token.startWith('Bearer')){
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
        next();
    });
}