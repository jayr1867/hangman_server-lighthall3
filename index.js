require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const mongoose = require('mongoose');
const Leaderboard = require('./models/leaderboard');
const uri = process.env.URI;
const app = express();
const port = 8080;


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
    const word = await axios.get('https://random-word-api.vercel.app/api?words=1');
    // const word = await axios.get('https://random-word-api.herokuapp.com/word?lang=en');
    // const word = await axios.get('https://api.api-ninjas.com/v1/randomword', {headers: {'X-Api-Key': '4JqgIFX5xClNvPBzo1L3rA==ecfLQ7z5M2SEkxsV'}})
    console.log(word.data[0]);
    try {
        const test = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.data[0]}`);
        res.json({word: test.data[0].word, definition: test.data[0].meanings[0].definitions[0].definition});
        // res.send(test.data[0]);
    } catch (error) {
        console.log({message: error.message});
    }
    
//   res.send('Hello World!');
  
});




app.listen(port, () => {
    console.log("Server listening on port " + port);
});
