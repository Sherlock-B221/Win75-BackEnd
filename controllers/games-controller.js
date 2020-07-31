const {validationResult} = require('express-validator');
const mongoose = require('mongoose');
const constants = require('../constants');
const HttpError = require('../models/http-error');
const Game = require('../models/game');
const User = require('../models/user');

const getGameById = async (req, res, next) => {
    const gameId = req.params.gid;
    let game;
    try {
        game = await Game.findById(gameId);
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not find a game.',
            500
        );
        return next(error);
    }
    if (!game) {
        const error = new HttpError(
            'Could not find game for the provided id.',
            404
        );
        return next(error);
    }
    // let player_summary;
    // try {
    //     player_summary = await game.populate('PlayerSummary');
    // } catch (err) {
    //     const error = new HttpError(err.message, 500);
    //     return next(error);
    // }
    await res.json({
        game: game.toObject({getters: true}),
        // player_summary:player_summary
    });
};

const getGamesByUserId = async (req, res, next) => {
    const userId = req.userData.userId;

    let userWithGames;
    try {
        userWithGames = await User.findById(userId).populate('games');
    } catch (err) {
        const error = new HttpError(
            'Fetching games failed, please try again later.',
            500
        );
        return next(error);
    }

    if (!userWithGames) {
        return next(
            new HttpError('Could not find provided user id.', 404)
        );
    }
// let player_summary;
    // try {
    //     player_summary = await game.populate('PlayerSummary');
    // } catch (err) {
    //     const error = new HttpError(err.message, 500);
    //     return next(error);
    // }
    await res.json({
        games: userWithGames.games.map(game =>
            game.toObject({getters: true})
        )
    });
};
function calcResult(spadesTotalInvestment, clubTotalInvestment, diamondTotalInvestment, heartTotalInvestment, gameInvestment, playerCount) {
    let businessProfit, droppedOptions, totalProfit, distributableProfit, distributableProfitPercent;
    let maxInvestment = Math.max(heartTotalInvestment, spadesTotalInvestment, clubTotalInvestment, diamondTotalInvestment);
    let maxInvestmentArray = [];
    if (clubTotalInvestment === maxInvestment) {
        maxInvestmentArray.push({investment: clubTotalInvestment, name: constants.club});
    }
    if (diamondTotalInvestment === maxInvestment) {
        maxInvestmentArray.push({investment: diamondTotalInvestment, name: constants.diamond});
    }
    if (spadesTotalInvestment === maxInvestment) {
        maxInvestmentArray.push({investment: spadesTotalInvestment, name: constants.spade});
    }
    if (heartTotalInvestment === maxInvestment) {
        maxInvestmentArray.push({investment: heartTotalInvestment, name: constants.heart});
    }
    //////////Case all equal/////////////
    if (maxInvestmentArray.length === 4 || playerCount <= 2) {
        businessProfit = 0;
        droppedOptions = [constants.spade, constants.heart, constants.diamond, constants.club];
        totalProfit = 0;
        distributableProfit = 0;
        distributableProfitPercent = 0;
        return {businessProfit, droppedOptions, totalProfit, distributableProfit, distributableProfitPercent};
    }
    /////////////////Case 3 equal///////////////
    else if (maxInvestmentArray.length === 3) {
        maxInvestment = maxInvestment * 3;
        businessProfit = (maxInvestment ** 2) / gameInvestment;
        let acceptedOptions = [{
            name: constants.club, investment: clubTotalInvestment
        }, {
            name: constants.heart, investment: heartTotalInvestment
        }, {
            name: constants.spade, investment: spadesTotalInvestment
        }, {
            name: constants.diamond, investment: diamondTotalInvestment
        }];
        droppedOptions = [];
        totalProfit = 0;
        for (let i = 0; i < maxInvestmentArray.length; i++) {
            acceptedOptions.filter(item => item !== maxInvestmentArray[i]);
            droppedOptions.push(maxInvestmentArray[i].name);
            totalProfit += maxInvestmentArray[i].investment;
        }
        let specialCondition = false;
        acceptedOptions.forEach((element) => {
            specialCondition = element.investment === 0;
        });
        if (specialCondition) {
            Math.random() >= 0.5 ? droppedOptions.pop() : droppedOptions.shift();
            businessProfit = businessProfit / 3;
            distributableProfit = totalProfit - businessProfit;
            distributableProfitPercent = 33.0;
        } else {
            distributableProfit = totalProfit - businessProfit;
            distributableProfitPercent = (maxInvestment * 100) / gameInvestment;
        }
        return {businessProfit, droppedOptions, totalProfit, distributableProfit, distributableProfitPercent};
    }
    ////////////////Case 2 equal////////////////
    else if (maxInvestmentArray.length === 2) {
        maxInvestment = maxInvestment * 2;
        businessProfit = (maxInvestment ** 2) / gameInvestment;
        droppedOptions = [];
        let acceptedOptions = [{
            investment: clubTotalInvestment, name: constants.club
        }, {
            investment: heartTotalInvestment, name: constants.heart
        }, {
            investment: spadesTotalInvestment, name: constants.spade
        }, {
            investment: diamondTotalInvestment, name: constants.diamond
        }];
        totalProfit = 0;
        for (let i = 0; i < maxInvestmentArray.length; i++) {
            acceptedOptions = acceptedOptions.filter(item => item.name !== maxInvestmentArray[i].name);
            droppedOptions.push(maxInvestmentArray[i].name);
            totalProfit += maxInvestmentArray[i].investment;
        }
        // console.log(acceptedOptions);
        let specialCondition = false;
        acceptedOptions.forEach((element) => {
            specialCondition = element.investment === 0;
        });
        // console.log(specialCondition);
        if (specialCondition) {
            Math.random() >= 0.5 ? droppedOptions.pop() : droppedOptions.shift();
            businessProfit = businessProfit / 2;
            distributableProfit = totalProfit - businessProfit;
            distributableProfitPercent = 50.0;
        } else {
            distributableProfit = totalProfit - businessProfit;
            distributableProfitPercent = (maxInvestment * 100) / gameInvestment;
        }
        return {businessProfit, droppedOptions, totalProfit, distributableProfit, distributableProfitPercent};
    }
    ////////////////case 1 max//////////////////
    else if (maxInvestmentArray.length === 1) {
        businessProfit = maxInvestment ** 2 / gameInvestment;
        droppedOptions = [];
        totalProfit = 0;
        for (let i = 0; i < maxInvestmentArray.length; i++) {
            droppedOptions.push(maxInvestmentArray[i].name);
            totalProfit += maxInvestmentArray[i].investment;
        }
        distributableProfit = totalProfit - businessProfit;
        distributableProfitPercent = (maxInvestment * 100) / gameInvestment;
        return {businessProfit, droppedOptions, totalProfit, distributableProfit, distributableProfitPercent};
    }
}

const endGame = async (req, res, next) => {
    const gameId = req.params.gid;
    const userId = req.userData.userId;
    let user;
    user = await User.findById(userId);
    let game;
    try {
        game = await Game.findById(gameId);
    } catch (err) {
        const error = new HttpError(err.message, err.statusCode);
        return next(error);
    }

    const {businessProfit, droppedOptions, totalProfit, distributableProfit, distributableProfitPercent} = calcResult(game.spadesTotalInvestment, game.clubTotalInvestment, game.diamondTotalInvestment, game.heartTotalInvestment, game.gameInvestment, game.playerCount);
    /////////////////////////////
    game.businessProfit = businessProfit;
    game.distributableProfit = distributableProfit;
    game.distributableProfitPercent = distributableProfitPercent;
    game.totalProfit = totalProfit;
    game.droppedOptions = droppedOptions;
    game.isComplete = true;
    ///////////////////////////////////
    // game.optionSummary = optionSummary;

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await game.save();
        user.games.push(game);
        await user.save();
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError(
            err.message + "lol",
            500
        );
        return next(error);
    }

    await res.json(
        {game: game}
    )
};

exports.getGameById = getGameById;
exports.getGamesByUserId = getGamesByUserId;
// exports.startGame = startGame;
exports.endGame = endGame;