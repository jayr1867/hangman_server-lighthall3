require('dotenv').config();

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
const alphabetLower = "abcdefghijklmnopqrstuvwxyz";

// an array just to manipulate the json data from the file,
// will be removed when db is added.
var LEADERS = [];

// connecting to the db.
mongoose.connect(uri, {
    useNewUrlParser: true
  }).then((conn) => {
    console.log("CONNECTED!");
  }).catch((err) => {
    console.log(err);
  })


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

  const data = new Leaderboard({
    "username": username,
  });

  try {
    const savedData = await data.save();
    res.status(200).send([]);
  } catch (error) {
    res.status(500).send({message: error.message});
  }

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
  

  console.log(word.length);
  var send_word = "";

  for (var i = 0; i < word.length; i++) {
    send_word += "_";
  }

  user.letters_guessed = "";
  user.guesses_left = 8;
  user.hints_left.total = 3;
  user.hints_left.pop_up = 2;
  user.hints_left.definition = 1;
  user.guessing_word = send_word;
  LEADERS[index] = user;
  fs.writeFileSync('./leaderboard.json', JSON.stringify(LEADERS));

  res.status(200).json({word: send_word});

});


/* for the guessing_word, if the word is "color", and the user sent "o", 
  the guessing word would change to "c_l_r" -- I did this to make sure 
  user gets their "guesses_left" reduced if in case they send a letter 
  they already used. 

  Feel free to change it if you have something better in mind. */


app.get('/make-guess/:user_id/:guess', async (req, res) => {
  userID = req.params.user_id;
  guess = req.params.guess.toLowerCase();

  if (guess.length != 1) {
    res.status(400).json({message: "Please send only one letter at a time."});
    return;
  }

  if (!alphabetLower.includes(guess)) {
    res.status(400).json({message: "Please send only letters."});
    return;
  }

  const data_file = fs.readFileSync('./leaderboard.json', 'utf-8');
  const leadership = JSON.parse(data_file);
  LEADERS = leadership;

  var user = LEADERS.find(user => user.user_id == userID);
  const index = LEADERS.indexOf(user);

  var word = user.current_word;
  var letter = user.letters_guessed;
  var send_word = "";

  var found = false;
  var won = false;

  if (letter.includes(guess)) {
    user.guesses_left -= 1;
    LEADERS[index] = user;
    fs.writeFileSync('./leaderboard.json', JSON.stringify(LEADERS));
    res.status(200).json({message: "You already guessed this letter."});
    return;
  } else {
    for (var i = 0; i < word.length; i++) {
      if (word[i] == guess) {
        send_word += guess;
        found = true;
      } else {
        send_word += user.guessing_word[i];
      }
    }
    if (user.current_word === send_word) {
      won = true;
      user.score += 10;
      user.words_guessed.push(user.current_word);
      user.words_left.splice(user.words_left.indexOf(user.current_word), 1);
    } else {
      if (!found) {
        user.guesses_left -= 1;
      }
      user.letters_guessed += guess;
    }
  }

  user.guessing_word = send_word;
  // user.current_word = send_word;
  LEADERS[index] = user;
  fs.writeFileSync('./leaderboard.json', JSON.stringify(LEADERS));

  res.status(200).json(
    {
      word: send_word,
      guesses_left: user.guesses_left,
      hints_left: user.hints_left,
      won: won
    });

});





app.get('/hint/:user_id/:type', async (req, res) => {

  var type = req.params.type.toLowerCase();
  if (type != "def" && type != "pop") {
    res.status(400).json({message: "Please send proper hint request."});
    return;
  }
  var user_id = req.params.user_id;

  const data_file = fs.readFileSync('./leaderboard.json', 'utf-8');
  const leadership = JSON.parse(data_file);
  LEADERS = leadership;

  var user = LEADERS.find(user => user.user_id == user_id);

  if (user.current_word === "") {
    res.status(400).json({message: "Please start a game first."});
    return;
  }

  const index = LEADERS.indexOf(user);

  if (user.hints_left.total <= 0) {
    res.status(400).json({message: "You don't have any hints left."});
    return;
  }

  if (type == "def") {
    if (user.hints_left.definition <= 0) {
      res.status(400).json({message: "You don't have any definition hints left."});
      return;
    }


    const word_file = fs.readFileSync('./words.json', 'utf-8');
    const words = JSON.parse(word_file);
    var definition = words.find(word => word.word == user.current_word).definition;

    user.hints_left.definition -= 1;
    user.hints_left.total -= 1;

    LEADERS[index] = user;
    fs.writeFileSync('./leaderboard.json', JSON.stringify(LEADERS));
    res.status(200).json({Definition: definition});

    return;
  }

  if (type == "pop") {

    if (user.hints_left.pop_up <= 0) {
      res.status(400).json({message: "You don't have any pop-up hints left."});
      return;
    }
    
    var answer = user.current_word;
    var guessed = user.guessing_word;

    var indices = [];

    for (var i = 0; i < guessed.length; i++) {
      if (guessed[i] == "_") {
        indices.push(i);
      }
    }

    var rand_index = indices[Math.floor(Math.random() * indices.length)];

    // guessed[rand_index] = answer[rand_index];
    guessed = guessed.substring(0, rand_index) + answer[rand_index] + guessed.substring(rand_index + 1);

    user.letters_guessed += answer[rand_index];

    user.guessing_word = guessed;
    user.hints_left.total -= 1;
    user.hints_left.pop_up -= 1;

    LEADERS[index] = user;
    fs.writeFileSync('./leaderboard.json', JSON.stringify(LEADERS));
    res.status(200).json({word: guessed});
    return;
  }



});















app.get('/make-guess/v2/:user_id/:guess', async (req, res) => {
  userID = req.params.user_id;
  guess = req.params.guess.toLowerCase(); // lowercase letters only
  if (guess.length !== 1) {
    // should be a single letter
    res.status(400).send([]) // 400 bad request
    return
  }
  if (!alphabetLower.includes(guess)) {
    // guess not a letter
    res.status(400).send([]) // 400 bad request
    return
  }
  const data_file = fs.readFileSync('./leaderboard.json', 'utf-8');
  const data_json = JSON.parse(data_file);
  
  var entry = data_json.find(entry => entry.user_id == userID);
  var index = data_json.indexOf(entry)
  console.log(index)
  if (entry.guesses_left <= 0) {
    // no more guesses left
    res.status(200).json({"winner": false});
    return
  }

  var word = entry.current_word

  var guessedLetters = entry.guessing_word
  console.log(guessedLetters)
  if (guessedLetters.includes(guess)) {
    console.log("already guessed")
    res.status(400).send([]) // 400 bad request
    return
  }

  // guessing_word is the correct guesses
  if (word.includes(guess)) {
    // Word contains the guess, do not dock guess and renew 'guessing_word'
    var guessingWord = data_json[index].guessing_word

    // TODO: need guessed_letters in the database
    // This will make it easy also to keep track of already guessed letters e.g. both correct/incorrect guesses to be disabled on the frontend
    var guessedLetters = guessingWord.split("").filter((e) => { return alphabetLower.includes(e)}) // only letters from guessing_word
    console.log("Guessed letters:", guessedLetters)

    guessedLetters.push(guess)
    var newGuessingWord = ""
    for (let i = 0; i < word.length; i++) {
      if (guessedLetters.includes(word[i])) {
        newGuessingWord += word[i];
      } else {
        newGuessingWord += "_";
      }
    }

    console.log("newGuessingWord is", newGuessingWord)
    data_json[index].guessing_word = newGuessingWord

    if (!newGuessingWord.includes("_")) {
      // new word: add word to guessed word, remove from words left, set new word
      data_json[index].words_guessed.push(word)
  
      data_json[index].words_left = data_json[index].words_left.filter((e) => {
        return e !== word
      })
  
      const randomIndex = Math.floor(Math.random() * data_json[index].words_left.length);
  
      if (data_json[index].words_left.length > 0) {
        data_json[index].current_word = data_json[index].words_left[randomIndex];
        res.status(200).json({"next_word": data_json[index].current_word});
      }
      else {
        data_json[index].current_word = ""
        res.status(200).json({"winner": true});
      }
    }

  } else {
    // Word does not contain the guess, dock point from 'guesses_left'
    data_json[index].guesses_left -= 1
  }

  fs.writeFileSync('./leaderboard.json', JSON.stringify(data_json));
  if (data_json[index].guesses_left === 0) {
    res.status(200).json({"winner": false});
  }else {
    res.status(200).json({"word_so_far": data_json[index].guessing_word, "guesses_left": data_json[index].guesses_left});
  }
});





app.listen(port, () => {
    console.log("Server listening on port " + port);
});
