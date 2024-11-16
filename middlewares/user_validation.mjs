export const ValidationCreateUser = (req,res,next) => {

	if(!req.body.username){
		return res.status(400).json({message: "Please enter your username !" });
	}

	if(!req.body.password){
		return res.status(400).json({message: "Please enter your password !" });
	}

	if(!req.body.email){
		return res.status(400).json({message: "Please enter your Email !" });
	}

	if(req.body.username.length < 8 || req.body.username.length > 25){
		return res.status(400).json({message: "Please insert username between 8-25 letters!"})
	}

	if(req.body.password.length < 8 || req.body.password.length > 25){
		return res.status(400).json({message: "Please insert password between 8-25 letters!"})
	}

	function isValidEmail(email){
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        return regex.test(email);}

	if (!isValidEmail(req.body.email)){
        return res.status(400).json({
            message: "กรุณากรอก Email ให้ถูกต้อง"
        	})
    	}

	next();
};
