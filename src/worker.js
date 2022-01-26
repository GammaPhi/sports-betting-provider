const mongo = require('./mongo');
const schedule = require('node-schedule');
const api = require('./sports');
const lamden = require('./lamden');
const config = require('./config')

const HOURS_AHEAD = 12
const COUNTRIES_TABLE = 'countries'
const SPORTS_TABLE = 'sports'
const LEAGUES_TABLE = 'leagues'
const EVENTS_TABLE = 'events'
const EVENT_METADATA_TABLE = 'event_metadata'
const METADATA_TABLE = 'metadata'
const METADATA_FILTER = { type: 'metadata'}

const REFRESH_EVENTS_CRON_SCHEDULE = '*/5 * * * *' // Every 5 minutes
const REFRESH_OTHER_CRON_SCHEDULE = '*/59 * * * *' // Every 59 minutes
const CHECK_FOR_COMPLETED_EVENTS_CRON = '*/1 * * * *' // Every 1 minutes
const CHECK_FOR_CONTRACT_EVENTS_CRON = '*/11 * * * *' // Every Every 11 minutes


Date.prototype.addDays = function(days) {
    const date = new Date(this);
    date.setDate(date.getDate() + days);
    return date;
}


const getSecondsSinceEpoch = (date) => {
    return Math.round(date.getTime() / 1000)
}


async function initialize() {
    try {
        const sports = await api.listSports()
        await mongo.upsertBatch(sports.sports, 'idSport', SPORTS_TABLE)
        const countries = await api.listCountries()
        await mongo.upsertBatch(countries.countries, 'name_en', COUNTRIES_TABLE)
        const leagues = await api.listLeagues()
        await mongo.upsertBatch(leagues.leagues, 'idLeague', LEAGUES_TABLE)    
    } catch (e) {
        console.log('Error occured: '+e.toString())
    }
}


const initializeJob = schedule.scheduleJob(REFRESH_OTHER_CRON_SCHEDULE, function() {
    console.log('running initialize')
    initialize().then(()=>{
        console.log('done')
    }).catch((e) => {
        console.log('Error occured: '+e.toString())
    })
})


async function refreshEvents(sport, country) {
    try {
        const currentDate = new Date()
        for(let i = -1; i < 7; i ++) {
            const date = currentDate.addDays(i)
            const dateStr = date.toISOString().substring(0, 10)
            console.log(dateStr)
            const events = await api.listEventsOnDay(dateStr, sport, country)
            await mongo.upsertBatch(events.events, 'idEvent', EVENTS_TABLE)    
        }    
    } catch (e) {
        console.log('Error occured: '+e.toString())
    }
}


const refreshEventsJob = schedule.scheduleJob(REFRESH_EVENTS_CRON_SCHEDULE, function() {
    console.log('running refresh events')
    refreshEvents().then(()=>{
        console.log('done')
    }).catch((e) => {
        console.log('Error occured: '+e.toString())
    })
})


async function checkSmartContractEvents() {
    try {
        // get unseed events from smart contract
        const metadata = await mongo.findOne(METADATA_TABLE, METADATA_FILTER, {}, {})
        const lastCheckedEventId = (metadata || {}).lastCheckedEventId || 0;
        const latestEventId = await lamden.getTotalNumEvents() - 1
        if (latestEventId >= 0) {
            for (let eventId = lastCheckedEventId; eventId <= latestEventId; eventId++) {
                console.log('checking contract event id '+eventId.toString())
                const eventMetadata = await lamden.getEventMetadata(eventId)               
                const event = {
                    event_id: eventId,
                    metadata: eventMetadata,
                    live: await lamden.getEventIsLive(eventId),
                    timestamp: await lamden.getEventTimestamp(eventId),
                    validator: await lamden.getEventValidator(eventId),
                    wager: await lamden.getEventWager(eventId),
                }
                // store this event metadata
                await mongo.upsertOne(
                    EVENT_METADATA_TABLE,
                    {
                        $set: event,
                    },
                    {
                        event_id: eventId
                    }
                )
            }
            // update metadata
            metadata.lastCheckedEventId = latestEventId
            await mongo.upsertOne(METADATA_TABLE, { $set: metadata }, METADATA_FILTER)
        } else {
            console.log('no contract events found')
        }
    } catch (e) {
        console.log('Error occured: '+e.toString())
    }
}


const checkSmartContractEventsJob = schedule.scheduleJob(CHECK_FOR_CONTRACT_EVENTS_CRON, function() {
    console.log('running check for smart contract events')
    checkSmartContractEvents().then(()=>{
        console.log('done')
    }).catch((e) => {
        console.log('Error occured: '+e.toString())
    })
})


async function checkForCompletedEvents() {
    try {
        // get unvalidated events from smart contract
        const eventsToCheck = await mongo.loadFromDB(EVENT_METADATA_TABLE, {
            validator: null, // not previously validated
            live: true, // still live
            timestamp: { // in the past at least N hours
                $lte: getSecondsSinceEpoch(new Date()) + (HOURS_AHEAD * 60 * 60)
            }
        })
        // check if any of these events have completed
        for (let i = 0; i < eventsToCheck.length; i++) {
            const event = eventsToCheck[i];
            const apiEventId = event.metadata.idEvent;
            const winningOption = await api.getWinningOption(event.wager, apiEventId);
            if (winningOption !== null) {
                // interact with smart contract to validate event
                let returned = false
                lamden.sendTransaction(
                    config.lamden.contract,
                    'validate_event',
                    {
                        event_id: event.event_id,
                        winning_options: winningOptions
                    },
                    config.lamden.stamps.validate_event,
                    (results) => {
                        if (returned) {
                            return
                        }
                        returned = true
                        console.log(results)
                        if (results.errors) {
                            console.log("HAD ERRORS!")
                            console.log(results.errors)
                        }
                    }
                )
            } else {
                // no updates
            }
        }
        
    } catch (e) {
        console.log('Error occured: '+e.toString())
    }
}


const checkForCompletedEventsJob = schedule.scheduleJob(CHECK_FOR_COMPLETED_EVENTS_CRON, function() {
    console.log('running check for completed events')
    checkForCompletedEvents().then(()=>{
        console.log('done')
    }).catch((e) => {
        console.log('Error occured: '+e.toString())
    })
})



module.exports = {
    checkForCompletedEventsJob: checkForCompletedEventsJob,
    refreshEventsJob: refreshEventsJob,
    initializeJob: initializeJob,
    checkSmartContractEventsJob: checkSmartContractEventsJob,
}


initialize().then(()=>{
    console.log('finished initializing')
    setTimeout(()=>{
        refreshEvents().then(()=>{
            console.log('finished refreshing events')
        })
    }, 2000)
})