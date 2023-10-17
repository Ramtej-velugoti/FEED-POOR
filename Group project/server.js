const express = require('express');
const app = express();
const path = require('path');
const passport = require("passport");
const cookieSession = require("cookie-session");
const passportSetup=require("./passport");
const cookieParser = require('cookie-parser');
const request = require('request');
const axios = require('axios');
const cors = require('cors');
const ejs = require('ejs'); 
const passwordHash=require("password-hash")
const authRoute=require("./Authentication/index")
app.set('view engine', 'ejs');
require('dotenv').config();
app.set('views', 'Authentication');
app.use(express.urlencoded({ extended: true }));
app.use('/static',express.static(path.join(__dirname,'Authentication')))
//firebase
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore} = require('firebase-admin/firestore');

var serviceAccount = require("./Authentication/key.json");

initializeApp({
  credential: cert(serviceAccount)
});
app.use(
	cookieSession({
		name: "session",
		keys: ["cyberwolve"],
		maxAge: 24 * 60 * 60 * 100,
	})
);
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use("/index",authRoute);
app.use(
	cors({
		origin: "http://localhost:5418",
		methods: "GET,POST,PUT,DELETE",
		credentials: true,
	})
);
app.get('/set-cookie', (req, res) => {
  res.cookie('G_ENABLED_IDPS', 'value', {
    sameSite: 'None',
    secure: true,
  });
  res.send('Cookie set successfully');
});
const db = getFirestore();
app.get('/home', (req, res) => {
 // Send the file with the root option
 res.render('index1');
});
app.get('/page',(req,res)=>{
  res.render('page.ejs');
})
app.get('/signup', (req, res) => {
    res.render("signup");
  })
  app.get("/login",(req,res)=>{
    res.render('login');
  })
  app.get('/dash',(req,res)=>{
    res.render('dash');
  })
  app.get('/donation',(req,res)=>{
    res.render('donate');
  })
  app.post('/donatesuc',async (req,res)=>{
    const citizen=req.body.citizenship;
    const name=req.body.full_name;
    const no=req.body.mobile_number;
    const mail=req.body.email;
    const card=req.body.pan_card_no;
    const address=req.body.address;
    const pin=req.body.pincode;
    const state = req.body.state;
    const city=req.body.city;
    db.collection('Donation')
    .add({
      citizen:citizen,
      name:name,
      phonenumber:no,
      email:mail,
      pancard:card,
      address:address,
      pincode:pin,
      state:state,
      city:city
    })
    .then(() => {
      res.render('payment');
    })
.catch((error) => {
console.error("Error checking user:", error);
res.status(500).send("Error checking user.");
});
  })
  app.post('/loginsuc', (req, res) => {
    const email = req.body.email;
    const password = req.body.pswd;
  
    // Assuming you have a variable `passwordHash` containing the hashed passwords
  
    db.collection('logindetails')
      .where('Email', '==', email)
      .get()
      .then((docs) => {
        let verified = false;
  
        docs.forEach((doc) => {
          verified = passwordHash.verify(password, doc.data().password);
        });
  
        if (verified) {
          res.render("index", { userEmail: email });
        } else {
          res.send("Incorrect Email or Password.Please, Try Again");
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
      });
  });
  
  app.post('/google',async(req,res)=>{
    function onSignIn(googleUser) {
      const user = googleUser.getBasicProfile();
      const userEmail = user.getEmail();
      console.log(userEmail);
      // Initialize Firebase and Firestore
      firebase.initializeApp(config);
      const db = firebase.firestore();
  
      // Save the email to Firestore
      db.collection("logindetails").add({
          email: userEmail,
          // Other user data can be added here
      }).then(() => {
        res.render('index');
      })
    }
  })
  app.post('/contact',async(req,res)=>{
    const name=req.body.name;
    const email=req.body.email;
    const report=req.body.message;
    db.collection('contact')
    .add({
      name:name,
      email:email,
      message:report
    })
    .then(() => {
      res.render('contact');
    })
      .catch((error) => {
        console.error("Error checking user:", error);
        res.status(500).send("Error checking user.");
      });
  })
  app.post('/signupsuc', async (req, res) => {
    const firstname = req.body.first_name;
    const lastname = req.body.last_name;
    const email = req.body.email;
    const pass = req.body.pswd;
    db.collection('logindetails')
      .where("Email", "==", email)
      .get()
      .then((docs) => {
        if (docs.size >= 1) {
          // User already exists
          res.send("You already have an account.");
        } else {
          // User does not exist, add them to the database
          db.collection('logindetails')
            .add({
              FirstName: firstname,
              LastName: lastname,
              Email: email,
              password: passwordHash.generate(pass)
            })
            .then(() => {
              res.render('login');
            })
        }
      })
      .catch((error) => {
        console.error("Error checking user:", error);
        res.status(500).send("Error checking user.");
      });

  });
    

const port = process.env.PORT || 5418;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
