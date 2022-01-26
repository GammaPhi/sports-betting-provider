
const lamden = require('./lamden')
const config = require('./config');
const api = require('./sports')
const { loadFromDB } = require('./mongo')


async function events(req, res) {
    try {
        console.log(req.body)
        const query = req.body
        const results = await loadFromDB('events', query)
        return res.json({data: results})
    } catch(e) {
        return res.status(500).json({error: e.toString()})
    }
}


async function sports(req, res) {
    try {
        console.log(req.body)
        const query = req.body
        const results = await loadFromDB('sports', query)
        return res.json({data: results})
    } catch(e) {
        return res.status(500).json({error: e.toString()})
    }
}


async function leagues(req, res) {
    try {
        console.log(req.body)
        const query = req.body
        const results = await loadFromDB('leagues', query)
        return res.json({data: results})
    } catch(e) {
        return res.status(500).json({error: e.toString()})
    }
}


async function countries(req, res) {
    try {
        console.log(req.body)
        const query = req.body
        const results = await loadFromDB('countries', query)
        return res.json({data: results})
    } catch(e) {
        return res.status(500).json({error: e.toString()})
    }
}


async function addEvent(req, res) {
    try {
        console.log(req.body)
        const eventId = req.body.eventId
        if (!eventId) {
            return res.status(400).json({error: 'Please provide an event id.'})
        }
        const wager = req.body.wager;
        if (!wager) {
            return res.status(400).json({error: 'Please provide a wager.'})
        }
        const event = await api.getEvent(eventId)
        const timestamp = api.getTimestampForEvent(event)
        const valid = api.validateWagerForEvent(wager, event)
        if (!valid) {
            return res.status(400).json({error: 'Invalid wager.'})
        }
        let returned = false;
        if (timestamp && wager) {
            lamden.sendTransaction(
                config.lamden.contract,
                'add_event',
                {
                    metadata: {
                        idEvent: event.idEvent,
                        strEvent: event.strEvent,
                        strHomeTeam: event.strHomeTeam,
                        strAwayTeam: event.strAwayTeam,
                        strSport: event.strSport,
                        strLeague: event.strLeague,
                        strSeason: event.strSeason,
                        strVenue: event.strVenue,
                        strCity: event.strCity,
                        strCountry: event.strCounty,
                        strEventAlternate: event.strEventAlternate,
                        strTimestamp: event.strTimestamp,
                    },
                    timestamp: timestamp,
                    wager: wager
                },
                config.lamden.stamps.add_event,
                (results) => {
                    if (returned) {
                        return
                    }
                    returned = true
                    console.log(results)
                    if (results.errors) {
                        console.log("HAD ERRORS!")
                        console.log(results.errors)
                        return res.status(501).json({error: result.errors})
                    }
                    return res.json({data: results})
                }
            )
        } else {
            return res.status(412).json({error: e.toString()})
        }

    } catch(e) {
        return res.status(500).json({error: e.toString()})
    }
}


module.exports = {
    sports: sports,
    events: events,
    leagues: leagues,
    countries: countries,
    addEvent: addEvent
}