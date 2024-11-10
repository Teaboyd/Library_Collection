import express from "express";

const app = express();
const port = 4544;

app.get("/test" , (req,res) => {
    return res.json("Server is working eiei")
});

app.listen(port,() => {
    console.log(`server is running at ${port}`);
});