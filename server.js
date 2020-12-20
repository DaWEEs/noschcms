const express = require("express");
const path = require("path");
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const User = require("./model/user.js")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken"); //sifrovani pomoci secret tokenu
const { ok } = require("assert");
const JWT_SECRET = "oekpog42o5i934-]fdl;'sv213vfsbnl[dpnbgaglrsjoi#_(%(@(poklg2()*&Y#(*P*@(_!"; //hashsecret, neleakovat !

//pripojeni k mongodb
mongoose.connect("mongodb://localhost:27017/nosch",{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true
})

const app = express();
app.use("/", express.static(path.join(__dirname, "static")))
app.use(bodyParser.json())


//zmena hesla
app.post("/api/change", async (req,res) => {
    const {token, newpassword: plainTextPassword} = req.body;

    if(!plainTextPassword || typeof plainTextPassword !== "string"){
        return res.json({ status: "error", error: "Neplatné heslo"})
    }

    if(plainTextPassword.length<7){
        return res.json({ status: "error", error: "Slabé heslo. Heslo musí obsahovat alespoň 7 písmen."})
    }

    try{
        const user = jwt.verify(token, JWT_SECRET)
        const _id = user.id
        const password = await bcrypt.hash(plainTextPasswor, 15)
        await User.updateOne({_id}, {
            $set: {password}
        })
        res.json({status:"ok"})
    }
    catch(error){
        res.json({status:"error", error:":)"})
    }

    console.log(user)
    res.json({status:"ok"})
})


//registrace uzivatele
app.post("/api/register", async (req,res) => {
    const {username, password: plainTextPassword} = req.body;    //ziskani jmena a hesla
    //Ověření jména a hesla
    if(!username || typeof username !== "string"){
        return res.json({ status: "error", error: "Neplatné jméno"})
    }
    if(!plainTextPassword || typeof plainTextPassword !== "string"){
        return res.json({ status: "error", error: "Neplatné heslo"})
    }
    if(plainTextPassword.length<7){
        return res.json({ status: "error", error: "Slabé heslo. Heslo musí obsahovat alespoň 7 písmen."})
    }
    const password = await bcrypt.hash(plainTextPassword, 15);   //Zasifrovani hesla
    try{
        const response = await User.create({
            username,
            password
        })
        console.log("Uzivatel vytvoren uspesne:", response)
    }catch(error){
        if(error.code === 11000){
            //duplicitni klic
            return res.json({ status: "error", error: "Jméno již někdo používá!"})
        }
        throw error
    }
    res.json({ status: "ok"})
})


//zmena hesla
app.post("/api/login", async(req,res) =>{
    const {username, password} = req.body
    
    const user = User.findOne({username}).lean();
    if(!user){
        return res.json({status:"error", error:"Neplatné jméno a heslo"})
    }
    
    if(await bcrypt.compare(password, user.password)){
        const token= jwt.sign({ //
            id: user._id, 
            username: user.username
        }, 
        JWT_SECRET
        )
        return res.json({status:"ok", data:""})
    }

    return res.json({status:"error", error:"Neplatné jméno a heslo"})
})

//dev server
const port = process.env.PORT || 8080;  //pokud neni nastaveny port na serveru, tak pouzit 8080
app.listen(port, () => console.log(`Server bezi na http://localhost:${port}/`))