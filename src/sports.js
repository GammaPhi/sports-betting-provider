const { sportsDBApiKey } = require('./config')
const fetch = require('node-fetch');

const URL = `https://www.thesportsdb.com/api/v1/json/${sportsDBApiKey}`
const LIST_SPORTS_PATH = '/all_sports.php'
const LIST_LEAGUES_PATH = '/all_leagues.php'
const LIST_COUNTRIES_PATH = '/all_countries.php'
const NEXT_15_EVENTS_BY_LEAGUE_ID_PATH = '/eventsnextleague.php'
const GET_EVENT_PATH = '/lookupevent.php'
const EVENTS_ON_SPECIFIC_DAY_PATH = '/eventsday.php'


const VALID_LEAGUES = ['NFL', 'NBA', 'NHL', 'MLB', 'American Major League Soccer']


const get = async (url) => {
    const res = await fetch(
        url, {
            method: 'GET',
        },
    )
    return await res.json()
}


async function listSports() {
    return await get(`${URL}${LIST_SPORTS_PATH}`)
}


async function listLeagues() {
    return await get(`${URL}${LIST_LEAGUES_PATH}`)
}


async function listCountries() {
    return await get(`${URL}${LIST_COUNTRIES_PATH}`)
}


async function listEventsOnDay(date, sport, country) {
    let params = `d=${date}`
    if (sport) {
        params = `${params}&s=${sport}`
    }
    if (country) {
        params = `${params}&a=${country}`
    }
    return await get(`${URL}${EVENTS_ON_SPECIFIC_DAY_PATH}?${params}`)
}


async function getEvent(eventId) {
    return await get(`${URL}${GET_EVENT_PATH}?id=${eventId}`)
}


function getTimestampForEvent(event) {
    const timestampStr = event.strTimestamp
    if (!timestampStr) {
        return null;
    }
    return Math.round(Date.parse(`${timestampStr}Z`).getTime() / 1000)
}


function validateWagerForEvent(wager, event) {
    let valid = false;
    const eventLeague = event.strLeague;
    const wagerType = wager.name;
    const wagerOptions = wager.options;
    if (wagerType && wagerOptions) {
        if (['Moneyline', 'Spread', 'Over/Under'].includes(wagerType)) {
            if (VALID_LEAGUES.includes(eventLeague)) {
                const awayTeam = event.strAwayTeam
                const homeTeam = event.strHomeTeam
                if (awayTeam === wagerOptions[0] && homeTeam === wagerOptions[1]) {
                    if (wagerType === 'Moneyline') {
                        valid = true
                    } else if (wagerType === 'Spread') {
                        try {
                            parseInt(wager.spread.toString(), 10)
                            valid = true
                        } catch (e) {
                            // invalid
                        }
                    } else if (wagerType === 'Over/Under') {
                        try {
                            parseInt(wager.over_under.toString(), 10)
                            valid = true
                        } catch (e) {
                            // invalid
                        }
                    }
                }
            }
        }

    }
    return valid
}


async function getWinningOption(wager, eventId) {
    let winningOption = null;
    const event = await getEvent(eventId)
    const awayScoreStr = event.intAwayScore
    const homeScoreStr = event.intHomeScore
    const postponed = event.strPostponed
    const timestamp = getTimestampForEvent(event)        
    if (postponed === 'no' && timestamp) {
        if (awayScoreStr && homeScoreStr && awayScoreStr.length > 0 && homeScoreStr.length > 0) {
            const awayScore = parseInt(awayScoreStr, 10)
            const homeScore = parseInt(homeScoreStr, 10)
            if (awayScore > homeScore) {
                winningOption = 0
            } else if (homeScore > awayScore) {
                winningOption = 1
            } else {
                // tie
                winningOption = -1
            }
        }
    }
    return winningOption
}

module.exports = {
    listSports: listSports,
    listLeagues: listLeagues,
    listCountries: listCountries,
    listEventsOnDay: listEventsOnDay,
    getEvent: getEvent,
    getTimestampForEvent: getTimestampForEvent,
    validateWagerForEvent: validateWagerForEvent,
    getWinningOption: getWinningOption
}
