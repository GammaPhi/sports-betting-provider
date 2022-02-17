
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


module.exports = {
    events: events,
    moneylines: moneylines,
    spreads: spreads,
    totals: totals,
}