// require('dotenv').config();

/* leaderboard.json has all the user data, and words.json 
  has all the hard-coded words, with definitions. */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
//probable schema for the leaderboard, might change when db is added.
const Leaderboard = require('./models/leaderboard');
const uri = process.env.URI;
const app = express();
const port = 8080;

// an array just to manipulate the json data from the file,
// will be removed when db is added.
var LEADERS = [];

// connecting to the db.
// mongoose.connect(uri, {
//     useNewUrlParser: true
//   }).then((conn) => {
//     console.log("CONNECTED!");
//   }).catch((err) => {
//     console.log(err);
//   })


app.use(cors());
app.use(express.json());
app.use(bodyParser.json())

app.get('/', async (req, res) => {

  /* testing a bunch of APIs */
    // const word = await axios.get('https://random-word-api.vercel.app/api?words=1');
    // // const word = await axios.get('https://random-word-api.herokuapp.com/word?lang=en');
    // // const word = await axios.get('https://api.api-ninjas.com/v1/randomword', {headers: {'X-Api-Key': '4JqgIFX5xClNvPBzo1L3rA==ecfLQ7z5M2SEkxsV'}})
    // console.log(word.data[0]);
    // try {
    //     const test = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.data[0]}`);
    //     res.json({word: test.data[0].word, definition: test.data[0].meanings[0].definitions[0].definition});
    //     // res.send(test.data[0]);
    // } catch (error) {
    //     console.log({message: error.message});
    // }
    
  res.send('Hello World!');
  
});

// getting the leadership data from leaderboard.json
app.get('/leaderboard', (req, res) => {
  const data = fs.readFileSync('./leaderboard.json', 'utf-8');
  const leadership = JSON.parse(data);
  res.json(leadership);
});

// store an array of objects in leaderboard.json
// created this just to have an idea of how everything would work in terms of db. 
// I dont think we need this.
app.post('/leaderboard', (req, res) => {
  const data_file = fs.readFileSync('./leaderboard.json', 'utf-8');
  const leadership = JSON.parse(data_file);
  const data = req.body;
  LEADERS = leadership;
  LEADERS.push(data);
  
  fs.writeFileSync('./leaderboard.json', JSON.stringify(LEADERS));
  res.status(200).send([]);
});


// adds a new player to the leaderboard
// taking the username from the body and adding the newly created object to the json file.
app.post('/newplayer', async (req, res) => {
  const username = req.body.newplayer;
  const data_file = fs.readFileSync('./leaderboard.json', 'utf-8');
  const leadership = JSON.parse(data_file);
  LEADERS = leadership;
  const data = {
    "user_id": LEADERS.length + 1,  // will be "_id" when db is added.
    "username": username,
    "score": 0,
    "words_guessed": [],  // words "correctly" guessed in one session.
    "current_word": "",   // the "current" word that the user is guessing.
    "guessing_word": "",  // the word that the user is guessing, but would be exatly opposite of the user's guess. (explained below)
    "words_left": ["hello", "miserable", "ecstatic","bliss","color","heaven","mountain","sky","riddle","library"],
    "submitted_date": Date.now,
    "guesses_left": 8,
    "hints_left": 3
  };
  LEADERS.push(data);
  fs.writeFileSync('./leaderboard.json', JSON.stringify(LEADERS));
  res.status(200).send([]);
});




// returns the word to be guessed: "hello" -> "_ _ _ _ _" (*without spaces*)
app.get('/word/:user_id', async (req, res) => {
  userID = req.params.user_id;
  const data_file = fs.readFileSync('./leaderboard.json', 'utf-8');
  const leadership = JSON.parse(data_file);
  LEADERS = leadership;
  var user = LEADERS.find(user => user.user_id == userID);
  const index = LEADERS.indexOf(user);

  // get a random word from the words_left array
  const randomIndex = Math.floor(Math.random() * user.words_left.length);
  const word = user.words_left[randomIndex];
  user.current_word = word;
  LEADERS[index] = user;
  fs.writeFileSync('./leaderboard.json', JSON.stringify(LEADERS));

  console.log(word.length);
  var send_word = "";

  for (var i = 0; i < word.length; i++) {
    send_word += "_";
  }

  res.status(200).json({word: send_word});

});


/* for the guessing_word, if the word is "color", and the user sent "o", 
  the guessing word would change to "c_l_r" -- I did this to make sure 
  user gets their "guesses_left" reduced if in case they send a letter 
  they already used. 

  Feel free to change it if you have something better in mind. */


app.get('/make-guess/:user_id/:guess', async (req, res) => {
  userID = req.params.user_id;
  guess = req.params.guess;
  const data_file = fs.readFileSync('./leaderboard.json', 'utf-8');
  const leadership = JSON.parse(data_file);
  LEADERS = leadership;
  var user = LEADERS.find(user => user.user_id == userID);
  const index = LEADERS.indexOf(user);
  var word = user.current_word;
  var send_word = "";
  var new_word = "";
  var found = false;


  // was working on this right before kartik's text.
  // need to add a temp variable to store the word, and then change the word to guessing_word.
  // you could skip this if you don't understand what's going on here. (I am soo sorry!)
  for (var i = 0; i < word.length; i++) {
    if (word[i] == guess) {
      send_word += guess;
      new_word += "_";
      found = true;
    } else {
      send_word += "_";
      new_word += word[i];
    }
  }

  if (!found) {
    user.guesses_left -= 1;
  }

  console.log(new_word);
  user.current_word = new_word;
  // user.current_word = send_word;
  LEADERS[index] = user;
  fs.writeFileSync('./leaderboard.json', JSON.stringify(LEADERS));

  res.status(200).json({word: send_word});

});






app.listen(port, () => {
    console.log("Server listening on port " + port);
});
