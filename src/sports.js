
function validateWagerForEvent(wager, event) {
    let valid = false;
    const wagerType = wager.name;
    const wagerOptions = wager.options;
    if (wagerType && wagerOptions) {
        if (['moneyline', 'spread', 'total'].includes(wagerType)) {
            const awayTeam = event.away_team
            const homeTeam = event.home_team
            if (awayTeam === wagerOptions[0] && homeTeam === wagerOptions[1]) {
                if (wagerType === 'moneyline') {
                    valid = true
                } else if (wagerType === 'spread') {
                    try {
                        parseInt(wager.spread.toString(), 10)
                        valid = true
                    } catch (e) {
                        // invalid
                    }
                } else if (wagerType === 'total') {
                    try {
                        parseInt(wager.total.toString(), 10)
                        valid = true
                    } catch (e) {
                        // invalid
                    }
                }
            }
        }
    }
    return valid
}


async function getWinningOption(wager, event) {
    let winningOption = null;
    let results = event.metadata.results;
    if (event !== null && results !== null) {
        const winner_index = event.winner_index
        if (winner_index !== null) {
            const wagerType = wager.name;
            if (['moneyline', 'spread', 'total'].includes(wagerType)) {
                let home_score;
                let away_score;
                if (event.sport === 'tennis') {
                    home_score = results.home_sets_won;
                    away_score = results.away_sets_won;
                } else {
                    home_score = results.home_score;
                    away_score = results.away_score;
                }
                if (home_score !== null && away_score !== null) {
                    if (wagerType === 'moneyline') {
                        if (away_score > home_score && winner_index === 0) {
                            winningOption = 0;
                        } else if (home_score > away_score && winner_index === 1) {
                            winningOption = 1;
                        } else if (home_score === away_score && winner_index === 2) {
                            // tie            
                            if (wager.options.length > 2) {
                                winningOption = 2; // ties
                            } else {
                                winningOption = -1 // no bet
                            }
                        }
                    } else if (wagerType === 'total') {
                        const actual_total = home_score + away_score;
                        const total = wager.total;
                        if (actual_total > total) {
                            // over
                            winningOption = 0;
                        } else if (actual_total < total) {
                            // under
                            winningOption = 1;
                        } else {
                            winningOption = -1;
                        }
                    } else if (wagerType === 'spread') {
                        let actual_spread;
                        if (sport === 'tennis') {
                            let away_games = results.away_sets.reduce((partialSum, a) => partialSum + a, 0);
                            let home_games = results.home_sets.reduce((partialSum, a) => partialSum + a, 0);
                            actual_spread = away_games + home_games;
                        } else {
                            actual_spread = away_score - home_score;
                        }
                        const spread = wager.spread;
                        if (spread < 0) {
                            // away_team is favorite
                            if (actual_spread > -spread) {
                                // away_team bet spread
                                winningOption = 0;
                            } else if (actual_spread == -spread) {
                                // tied spread
                                winningOption = -1;
                            } else {
                                // away_team did not beat spread
                                winningOption = 1;
                            }
                        } else {
                            // away_team is underdog
                            if (actual_spread > -spread) {
                                // away_team bet spread
                                winningOption = 0;
                            } else if (actual_spread == -spread) {
                                // tied spread
                                winningOption = -1;
                            } else {
                                // away_team did not beat spread
                                winningOption = 1;
                            }
                        }
                    }  
                }
            }
        }
    }
    return winningOption
}


module.exports = {
    validateWagerForEvent: validateWagerForEvent,
    getWinningOption: getWinningOption
}
