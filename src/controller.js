
const lamden = require('./lamden')
const config = require('./config');
const api = require('./sports')
const { loadFromDB, findOne } = require('./mongo')


async function events(req, res) {
    try {
        console.log(req.body)
        const query = req.body
        const results = await loadFromDB('games', query)
        return res.json({data: results})
    } catch(e) {
        return res.status(500).json({error: e.toString()})
    }
}


async function totals(req, res) {
    try {
        console.log(req.body)
        const query = req.body
        const results = await loadFromDB('totals', query)
        return res.json({data: results})
    } catch(e) {
        return res.status(500).json({error: e.toString()})
    }
}


async function moneylines(req, res) {
    try {
        console.log(req.body)
        const query = req.body
        const results = await loadFromDB('moneylines', query)
        return res.json({data: results})
    } catch(e) {
        return res.status(500).json({error: e.toString()})
    }
}


async function spreads(req, res) {
    try {
        console.log(req.body)
        const query = req.body
        const results = await loadFromDB('spreads', query)
        return res.json({data: results})
    } catch(e) {
        return res.status(500).json({error: e.toString()})
    }
}


async function addEvent(req, res) {
    try {
        console.log(req.body)
        const event = request.body.event;
        if (!event) {
            return res.status(400).json({error: 'Please provide an event.'})
        }
        const wager = req.body.wager;
        if (!wager) {
            return res.status(400).json({error: 'Please provide a wager.'})
        }
        const valid = api.validateWagerForEvent(wager, event)
        if (!valid) {
            return res.status(400).json({error: 'Invalid wager.'})
        }
        const storedEvent = await findOne("games", {
            away_team: event.away_team,
            home_team: event.home_team,
            date: event.date,
            timestamp: event.timestamp,
            sport: event.sport,
        });
        if (storedEvent === null) {
            return res.status(400).json({error: 'Event not found.'})
        }
        let returned = false;
        if (timestamp && wager) {
            lamden.sendTransaction(
                config.lamden.contract,
                'interact',
                {
                    action: 'sports_betting',
                    payload: {
                        function: 'add_event',
                        kwargs: {
                            metadata: {
                                away_team: event.away_team,
                                home_team: event.home_team,
                                date: event.date,
                                timestamp: event.timestamp,
                                sport: event.sport,
                            },
                            timestamp: event.timestamp,
                            wager: wager
                        }
                    }
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
    events: events,
    moneylines: moneylines,
    spreads: spreads,
    totals: totals,
    addEvent: addEvent
}