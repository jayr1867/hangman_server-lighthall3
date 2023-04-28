const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true,
        default: 0
    },
    words_guessed: [{word: {
            type: String
        }, 
        definition: {
            type: String
        }}
    ],
    words_left: [{word: {
            type: String
        }, 
        definition: {
            type: String
        }}
    ],
    current_word: {
        type: String,
        default: ""
    },
    guessing_word: {
        type: String,
        default: ""
    },
    letters_guessed: {
        type: String,
        default: ""
    },
    submitted_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    guesses_left: {
        type: Number,
        required: true,
        default: 8,
        max: 8,
        min: 0
    },
    hints_left: {
        total: {type: Number, default: 3},
        pop_up: {type: Number, default: 2},
        definition: {type: Number, default: 1},
        used_definition: {type: String, default: ""}
    },
    shared: {
        type: Boolean,
        required: true,
        default: false
    }
});

module.exports = mongoose.model('Leaderboard', leaderboardSchema);