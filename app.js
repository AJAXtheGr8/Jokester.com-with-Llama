//Importing Libraries

import express from 'express';
import {connectToDb,getDb} from './db.js';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import url from 'url'
import session from 'express-session';
import nocache from 'nocache';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import {LlamaModel, LlamaContext, LlamaChatSession} from "node-llama-cpp";


//Middleware
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const model = new LlamaModel({
    modelPath: path.join(__dirname, "models", "westlake-7b-v2.Q5_0.gguf")
});

const context = new LlamaContext({model});
const llamaChatSession = new LlamaChatSession({context});

var app = express();
app.use(express.json());
app.use(nocache());
app.set('view engine','ejs');
app.use("/",express.static(__dirname+"/"));
app.use(express.urlencoded({extended:false}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
    secret: 'my-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next(); // User is authenticated, continue to next middleware
    } else {
        res.redirect('/'); // User is not authenticated, redirect to login page
    }
}



//Connecting to DB
let db;
connectToDb((err)=>{
    if(!err){
        console.log("Database connected!");
        db = getDb();
    }
});

//variables
let currentUser = {
    name: '',
    email: '',
    id: '',
}
let userSavedJokeIDs = null;
let userSubmittedJokeIDs = null;
let savedJokeCounter = -1;
let submittedJokeCounter = -1;


//Listening the app on PORT 
app.listen(3000,()=>{console.log('Listening on port 3000')});


//POST Requests

//login user
app.post('/', async (req,res)=>{
    try{

        const loginEmail = req.body.loginEmail;
        const loginPass = req.body.loginPass;

        console.log("I am here 1: ",loginEmail);

        db.collection('users').findOne({"email": loginEmail})
        .then((doc)=>{
            if(!doc){
                //If there is no doc it means email is not in the database
                res.render('index',{code:1,message:"No user found"})
            }else{
                bcrypt.compare(loginPass, doc.password, (err, data) => {
                    //if error than throw error
                    if (err) throw err
    
                    //if both match than you can do anything
                    if (data) {
                        console.log("I am here 2: Login successful");
                        req.session.userId = doc._id.toString();
                        currentUser.id = doc._id.toString();
                        currentUser.name = doc.name;
                        currentUser.email = doc.email;
                        console.log('I am here 3',req.session.userId);
                        res.redirect('/dashboard');
                    } else {
                        res.render('index',{code:2,message:"Password is not valid"})
                    }
    
                })

                console.log("I am here 4: ",doc.email,doc.name,);
            }
        });
    }catch(e){
        console.log(e);
        res.redirect('/');
    }
});




//register user
app.post('/register', async (req,res)=>{
    try{
        const hashPassword =  await bcrypt.hash(req.body.registerPass,10);
        const userEmail = req.body.registerEmail;
        const userName = req.body.fullName;
        
        db.collection('users').findOne({"email": userEmail})
        .then((doc)=>{
            if(!doc){
                db.collection('users').insertOne({
                    "email": userEmail,
                    "password": hashPassword,
                    "name": userName,
                    "savedJokeIDs": [],
                    "submittedJokeIDs":[]
                })
                .then((doc)=> {
                    res.redirect(url.format({
                        pathname: '/register',
                        query: {message: 'Registeration Successful!'}
                    }));
                }).catch((err)=>{
                    res.redirect(url.format({
                        pathname: '/register',
                        query: {message: 'Registeration Unsuccessful!'}
                    }));
                });
            }else{
                res.redirect(url.format({
                    pathname: '/register',
                    query: {message: 'Email already in use! Try again.'}
                }));
            }
            
        });


        
        
    }catch(e){
        console.log(e);
        res.redirect('/');
    }
});


//save a joke
app.put('/saveJoke',requireAuth,(req,res)=>{
    let savedJoke = req.body.id;
    
    db.collection('users').findOne({'email': currentUser.email,'savedJokeIDs': savedJoke})
    .then((doc)=>{
        if(!doc){
            console.log("I am saving a joke: ",savedJoke);

            db.collection('users').updateOne({'email':currentUser.email},{$push: {savedJokeIDs: savedJoke}})
            .then((doc)=> {res.status(200).json({success:true});})
            .catch(err=>{res.status(500).json({err:'Could not find document'});});
        }else{
          console.log("Joke already saved");
          return res.status(409).json({success: false});
        }
    })

});


//submit a joke
app.post('/submitJoke', requireAuth, (req,res)=>{
    const newJoke = {
        'id': currentUser.email+Date.now(),
        'body': req.body.jokeBody,
        'title': req.body.jokeTitle
    }

    db.collection('redditJokes').insertOne(newJoke)
    .then((doc)=> {
        db.collection('users').updateOne({'email':currentUser.email},{$push: {submittedJokeIDs: newJoke.id}})
        .then((doc)=>{console.log(doc)})
        .catch((err)=>{console.log(err)});

        res.render('submitJoke',{'userName':currentUser.name,'message':'Joke was submitted'});
    }).catch(err=>{
        res.render('submitJoke',{'userName':currentUser.name,'message':'Joke could not be submitted, Try again!'});
    });
});

//delete Account

app.post('/deleteAccount',requireAuth,(req,res)=>{
    try{
        const deleteAccPass = req.body.deleteAccountPassword;

        db.collection('users').findOne({"email": currentUser.email})
        .then((doc)=>{
            if(!doc){
                //If there is no doc it means email is not in the database
                console.log('')
                res.redirect('/');
            }else{
                bcrypt.compare(deleteAccPass, doc.password, (err, data) => {
                    //if error than throw error
                    if (err) throw err
    
                    //if both match than you can do anything
                    if (data) {
                        db.collection('users').deleteOne({"email": currentUser.email})
                        .then((doc)=>{
                            res.redirect('/logout');
                        });
                    } else {
                        res.render('deleteAccount',{'userName':currentUser.name,'message':'Incorrect Password! Kindly enter your password to permanently delete your account'});
                    }
    
                })

                console.log("I am here 4: ",doc.email,doc.name,);
            }
        });

    }catch(e){
        console.log(e);
        res.redirect('/');
    }
});



//Routes
app.get('/',(req,res)=>{
    if(req.session.userId!=null){
        res.redirect('/dashboard');
    }else{
        res.render('index',{code:0,message: "Error"});
    }
});

app.get('/home',(req,res)=>{
    res.redirect('/');
});

app.get('/logout',requireAuth,(req,res)=>{
    req.session.userId=null;
    res.redirect('/');
});

app.get('/dashboard',requireAuth,(req,res)=>{

    res.render('loggedIn',{'userName':currentUser.name});
});

app.get('/submitJoke',requireAuth,(req,res)=>{

    res.render('submitJoke',{'userName':currentUser.name,'message':'Press the button to submit your entry'});
});

app.get('/viewProfile',requireAuth,(req,res)=>{

    savedJokeCounter = -1;
    submittedJokeCounter = -1;

    db.collection('users').findOne({'email':currentUser.email},{savedJokeIDs:1,_id:0,submittedJokeIDs:1})
    .then((doc)=> {
        userSavedJokeIDs = doc.savedJokeIDs;
        userSubmittedJokeIDs= doc.submittedJokeIDs;
        // console.log(userSavedJokeIDs,userSavedJokeIDs.length,userSubmittedJokeIDs,userSubmittedJokeIDs.length);

        let savedJokeMessage='click next to start'
        let submittedJokeMessage='click next to start'

        res.render('viewProfile',{'userName':currentUser.name, 'email':currentUser.email, 'saveMessage':savedJokeMessage,'subMessage':submittedJokeMessage});
    })
    .catch(err=>{res.status(500).json({err:'Could not find document'});});

    
});

app.get('/deleteAccount',requireAuth,(req,res)=>{
    res.render('deleteAccount',{'userName':currentUser.name,'message':'Kindly enter your password to permanently delete your account'});
});

app.get('/register',(req,res)=>{
    
    let registerationMessage = {message: "Enter the details below: "};

    if(req.query.message){
        registerationMessage.message = req.query.message;
    }
    
    res.render('register',registerationMessage);

});


app.get('/jokeAI',requireAuth,async (req,res)=>{

    if(req.query.jokeSubject){
        const jokeTopic = req.query.jokeSubject;
        console.log(jokeTopic);

        const chatPrompt = `Tell a new ${jokeTopic} joke` || 'anything';
        const output = await llamaChatSession.prompt(chatPrompt);
        res.render('jokeAI',{'userName':currentUser.name,'message': output});
    }else{
        res.render('jokeAI',{'userName':currentUser.name,'message':'Joke will be generated here'});
    }
    
});

//Requests to fetch and delete Jokes
app.get('/randomJoke',(req,res)=>{
    db.collection('redditJokes').aggregate([{ $sample: { size: 1 } }]).toArray()
    .then((doc)=> {res.status(200).json(doc[0]);})
    .catch(err=>{res.status(500).json({err:'Could not find document'});});
});


app.get('/nextSavedJoke',(req,res)=>{
    db.collection('redditJokes').findOne({"_id": new ObjectId(userSavedJokeIDs[++savedJokeCounter])})
    .then((doc)=>{

        let joke = {
            body: doc.body,
            title: doc.title,
            saveCounter: savedJokeCounter,
            totalSavedJokes: userSavedJokeIDs.length
        }

        // console.log(joke);

        res.status(200).json(joke);
    })
    .catch(err=>{res.status(500).json({err:'Could not find document'});});
});


app.get('/prevSavedJoke',(req,res)=>{
    db.collection('redditJokes').findOne({"_id": new ObjectId(userSavedJokeIDs[--savedJokeCounter])})
    .then((doc)=>{

        let joke = {
            body: doc.body,
            title: doc.title,
            saveCounter: savedJokeCounter,
            totalSavedJokes: userSavedJokeIDs.length
        }

        // console.log(joke);

        res.status(200).json(joke);
    })
    .catch(err=>{res.status(500).json({err:'Could not find document'});});
});


app.get('/nextSubmittedJoke',(req,res)=>{
    db.collection('redditJokes').findOne({"id": userSubmittedJokeIDs[++submittedJokeCounter]})
    .then((doc)=>{

        let joke = {
            body: doc.body,
            title: doc.title,
            subCounter: submittedJokeCounter,
            totalSubmittedJokes: userSubmittedJokeIDs.length
        }

        // console.log(joke);

        res.status(200).json(joke);
    })
    .catch(err=>{res.status(500).json({err:'Could not find document'});});
});

app.get('/prevSubmittedJoke',(req,res)=>{
    db.collection('redditJokes').findOne({"id": userSubmittedJokeIDs[--submittedJokeCounter]})
    .then((doc)=>{

        let joke = {
            body: doc.body,
            title: doc.title,
            subCounter: submittedJokeCounter,
            totalSubmittedJokes: userSubmittedJokeIDs.length
        }

        // console.log(joke);

        res.status(200).json(joke);
    })
    .catch(err=>{res.status(500).json({err:'Could not find document'});});
})

app.get('/deleteSavedJoke',(req,res)=>{
    
        db.collection('users').updateOne({'email':currentUser.email},{$pull: {savedJokeIDs: userSavedJokeIDs[savedJokeCounter]}})
        .then((doc)=>{
            console.log("Joke deleted:",userSavedJokeIDs[savedJokeCounter]);
            res.redirect('/viewProfile');
        }).catch(err=>{res.status(500).json({err:'Could not find document'});});
});


app.get('/deleteSubmittedJoke',(req,res)=>{
    
    db.collection('users').updateOne({'email':currentUser.email},{$pull: {submittedJokeIDs: userSubmittedJokeIDs[submittedJokeCounter]}})
    .then((doc)=>{
        db.collection('redditJokes').deleteOne({'id': userSubmittedJokeIDs[submittedJokeCounter]})
        .then((result)=>{
            console.log("Joke deleted:",userSubmittedJokeIDs[submittedJokeCounter]);
            res.redirect('/viewProfile');
        })
    }).catch(err=>{res.status(500).json({err:'Could not find document'});});
});


