//homepage DOM elements
const loginPopup = document.querySelector('.loginForm');
const disabledBackground = document.getElementById('disabledBackground');
const generateButton = document.querySelector('.generateJoke');
const jokePara = document.getElementById('jokePara');
const jokeTitle = document.getElementById('jokeTitle');
const loginLink = document.getElementById('loginLink');
const loginErrorMessage = document.getElementById('loginErrorMessage');
const menuBurger = document.querySelector('.menu');
//register page DOM elements
const registerButton = document.getElementById('registerButton');
const registerationForm = document.getElementById('registerationForm');
const registerForm = document.querySelector('.registerForm');
const testButton = document.getElementById('test');
//loggegIn page DOM elements
const logoutLink = document.getElementById('logoutLink');
const menuBurger2 = document.querySelector('.menu2');
const userMenuPopup = document.querySelector('.userMenuContainer');
const saveJokeButton = document.getElementById('saveJokeButton');
//submitJoke page DOM elements
const submitJokeAlert = document.getElementById('jokeMessage');
//viewProfile page DOM elements
const savedJokeTitle = document.getElementById('savedJokeTitle');
const savedJokeBody = document.getElementById('savedJokeBody');
const submittedJokeTitle = document.getElementById('submittedJokeTitle');
const submittedJokeBody = document.getElementById('submittedJokeBody');
const nextSavedJokeButton = document.getElementById('nextSavedJoke');
const prevSavedJokeButton = document.getElementById('prevSavedJoke');
const nextSubmittedJokeButton = document.getElementById('nextSubmittedJoke');
const prevSubmittedJokeButton = document.getElementById('prevSubmittedJoke');
// jokeAI page DOM elements
const llamaJokeBody = document.getElementById('llamaJokeBody');
const getAIJokeForm = document.getElementById('getAIJoke');
//variables
let saveJokeId=null;

//Homepage event functions
function showLoginPopup(){
    loginPopup.classList.add('loginForm-openPopup');
    disabledBackground.style.display = 'block';
}


function removeLoginPopup(){
    loginPopup.classList.remove('loginForm-openPopup');
    disabledBackground.style.display = 'none';
    loginErrorMessage.style.display = 'none';
}

function fetchJokes(){

    fetch('http://localhost:3000/randomJoke')
    .then((response) => response.json())
    .then((json) => {
        let joke = JSON.parse(JSON.stringify(json));
        jokeTitle.innerText = joke.title;
        jokePara.innerText = joke.body;
        saveJokeId = joke._id.toString();
    });

    saveJokeButton.style.visibility = 'visible';

}

function loginFirst(){
    alert('Kindly login to use the user menu.');
}

//Register page event functions

function test(){
    alert('Hello');
}

//LoggedIn page event functions

function logoutUser(){

}

function displayMenu(){
    userMenuPopup.classList.toggle('userMenuContainer-openPopup');
}

function saveJoke(){

    if(saveJokeId){
        
        let joke = {id: saveJokeId}

        let options = {
            method: 'PUT',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(joke)
        }

        fetch('http://localhost:3000/saveJoke',options)
        .then((response) => response.json())
        .then((json)=> {
            let result = JSON.parse(JSON.stringify(json));
            if(result.success){
                alert('Joke was saved');
            }else{
                alert('Joke was already saved');
            }
        
        })
        .catch(error => {
            console.error('Error updating data:', error);
          });


    }
    saveJokeButton.style.visibility = 'hidden';
    
}

function submitJoke(){
    // submitJokeAlert.classList.toggle('jokeMessage-visibile');
}

// viewProfile page event functions
function nextSavedJoke(){
    fetch('http://localhost:3000/nextSavedJoke')
    .then((response)=>{
        return response.json()
    })
    .then((json)=> {
        let result = JSON.parse(JSON.stringify(json));
        

        if(result.body==undefined){
            result.title = "";
            result.body = "No jokes saved";
            nextSavedJokeButton.style.visibility = 'hidden';
        }

        savedJokeTitle.innerText = result.title;
        savedJokeBody.innerText = result.body;

        if(result.saveCounter>0){
            prevSavedJokeButton.style.visibility = 'visible';
        }
        
        if(result.saveCounter == result.totalSavedJokes-1){
            nextSavedJokeButton.style.visibility = 'hidden';
        }
    })
    .catch(error => {
        console.error('Error updating data:', error);
      });

}

function prevSavedJoke(){
    fetch('http://localhost:3000/prevSavedJoke')
    .then((response)=>{
        return response.json()
    })
    .then((json)=> {
        let result = JSON.parse(JSON.stringify(json));
        
        if(result.saveCounter==0){
            prevSavedJokeButton.style.visibility = 'hidden';
        }
        
        if(result.saveCounter < result.totalSavedJokes-1){
            nextSavedJokeButton.style.visibility = 'visible';
        }

        savedJokeTitle.innerText = result.title;
        savedJokeBody.innerText = result.body;

        
    })
    .catch(error => {
        console.error('Error updating data:', error);
      });

}

function nextSubmittedJoke(){
    fetch('http://localhost:3000/nextSubmittedJoke')
    .then((response)=>{
        return response.json()
    })
    .then((json)=> {
        let result = JSON.parse(JSON.stringify(json));
        

        if(result.body==undefined){
            result.title = "";
            result.body = "No jokes submitted";
            nextSubmittedJokeButton.style.visibility = 'hidden';
        }

        submittedJokeTitle.innerText = result.title;
        submittedJokeBody.innerText = result.body;

        if(result.subCounter>0){
            prevSubmittedJokeButton.style.visibility = 'visible';
        }
        
        if(result.subCounter == result.totalSubmittedJokes-1){
            nextSubmittedJokeButton.style.visibility = 'hidden';
        }
    })
    .catch(error => {
        console.error('Error updating data:', error);
      });

}

function prevSubmittedJoke(){
    fetch('http://localhost:3000/prevSubmittedJoke')
    .then((response)=>{
        return response.json()
    })
    .then((json)=> {
        let result = JSON.parse(JSON.stringify(json));
        
        if(result.subCounter==0){
            prevSubmittedJokeButton.style.visibility = 'hidden';
        }
        
        if(result.subCounter < result.totalSubmittedJokes-1){
            nextSubmittedJokeButton.style.visibility = 'visible';
        }

        submittedJokeTitle.innerText = result.title;
        submittedJokeBody.innerText = result.body;

        
    })
    .catch(error => {
        console.error('Error updating data:', error);
    });

}

// jokeAI page event functions

function getAIJoke(){

    let message = 'AI is generating a joke'

    setInterval(()=>{
        message = message+"."
        llamaJokeBody.innerText = message;
    },800);
    setInterval(()=>{message = 'AI is generating a joke'},2400);
    
}