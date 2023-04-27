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
        type: Number,
        required: true,
        default: 3,
        max: 3,
        min: 0
    }
});

module.exports = mongoose.model('Leaderboard', leaderboardSchema);