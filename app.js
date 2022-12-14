require("dotenv").config()
const express= require("express")
const bodyParser= require("body-parser")
const mongoose=require("mongoose") 
const ejs=require("ejs")
const bcrypt= require("bcrypt")
const saltRounds= 10;
const nodeMailer= require("nodemailer")
const flash = require("connect-flash")

mongoose.connect(process.env.CONNECT_KEY,{useNewUrlParser : true},(err)=>{
    if(!err){
        console.log("connected to db")
    }
    else{
        console.log(err)
    }
})

const app = express();
app.set("view engine","ejs")
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:true}))

// Connect flash
// app.use(flash());
// Global vars
// app.use((req,res,next)=>{
//     res.locals.success_msg=req.flash("success_msg")
//     res.locals.error_msg=req.flash("error_msg")
//     res.locals.error=req.flash("error")
//     next();
// })

//  User Model
const User = require("./userModel");

//  Email Sender Details
const transporter = nodeMailer.createTransport({
    service : 'gmail',
    auth: {
        user: process.env.user,
        pass: process.env.password
    },
    tls:{
        rejectUnauthorized : false
    }
    
})

//          User Routes
//  Handling get request
let confirmation;
app.get("/",(req,res)=>{
 res.render("index")
})

app.get("/login",(req,res)=>{
    res.render("login",{confirmation})
})

app.get("/verify",(req,res)=>{
  res.render("verify",{confirmation})    
})
app.get("/signUp",(req,res)=>{
  res.render("signUp",{confirmation})
})





//  Handling post request to Signup
app.post("/signUp",(req,res)=>{

    //  Creating Random Token
const possibleValues = [0,1,2,3,4,5,6,7,8,9];




let randomToken="";
for(let i = 0;i<6;i++){
    const randomNumber = getRandomNumber();
    randomToken += possibleValues[randomNumber]
}

function getRandomNumber(){
  return Math.floor(Math.random()*possibleValues.length)

}

console.log(randomToken)

    
    const {firstName,lastName,email,password} = req.body;
  User.findOne({email},(err,foundMail)=>{
    if(foundMail){
        // res.send("Email is already registered");
        
        res.render("signUp",{confirmation : "Email is already registered"})
    }
    else{
   
        bcrypt.hash(password,saltRounds,(err,hash)=>{

            const newUser= new User({
                firstName,
                lastName,
                email,
                password:hash,
                emailToken:randomToken,
                isVerified: false
            })
    
            newUser.save((err)=>{
                if(err){
                    console.log(err)
                    // res.redirect("/login")
                }
                else{
                    console.log("New User Saved")
                    const mailOptions = {
                        from : ` "Verify your email" <olalerebabatunde2000@gmail.com>` ,
                        to : newUser.email,
                        subject : 'TOOBAD Technologies - Verify your email' ,
                         text:` Dear ${newUser.lastName}, Kindly use ${newUser.emailToken} for your verification`
                        }
            
            //  Sending Mail
            transporter.sendMail(mailOptions,(error,info)=>{
                if(error){
             console.log(error)
                }
                else{
                    console.log("Verification email is sent to your mail")
                }
            })
        }
            res.redirect("/verify")
            })
    
        })
    }

  })

})

//Handling Post request to login route

app.post("/login",(req,res)=>{
    const {email,password} = req.body;

    User.findOne({email},(err,foundMail)=>{
        if(err){console.log(err)}
        else{
            if(foundMail){
                if(!foundMail.isVerified){
                    res.render("login",{confirmation:"Email not verified"})
                }
                else{
                    bcrypt.compare(password,foundMail.password,(error,result)=>{
                        if(error){
                            console.log(err)
                        }
                        
                        if(result){
                            res.render("profile")
                        }
                        else{
                            res.render("login",{confirmation:"Incorrect Password"})

                        }
                    })
                }

                
            }
            else{
                res.render("login",{confirmation:"Email not registered"})

            }
            
        }
    })
})

// Contact Model
const Contact = require("./contactModel")

// Handling post request root route>> contact us 
app.post("/contactUs",(req,res)=>{
 const {fullName,email,message} =   req.body

 const newMessage = new Contact({
    fullName,
    email,
    message
 })
  newMessage.save((err)=>{
    if(!err){
        console.log("New Message Saved")
        res.redirect("/")
    }
  })
})

//  Handling post request to verification route

app.post("/verify",(req,res)=>{
    const {first,second,third,fourth,fifth,sixth} = req.body;
    const token = `${first}${second}${third}${fourth}${fifth}${sixth}`
    console.log(token)
    User.findOne({emailToken:token},(err,foundUser)=>{
        if(err){
            console.log(err)
        }
        else{
            if(foundUser){
                foundUser.emailToken = null;
                foundUser.isVerified = true;

                foundUser.save((err)=>{
                    if(!err){
                        console.log("New changes made")
                        res.render("verificationSuccess")
                    }
                })
            }
            else{
                res.render("verify",{confirmation: "Kindly fill in the correct code"})
            }
        }
    })
})



app.listen(process.env.PORT || 4000,()=>{
    console.log("server started on port 4000")
})








