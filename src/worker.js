const mongo = require('./mongo');
const schedule = require('node-schedule');
const api = require('./sports');
const lamden = require('./lamden');
const config = require('./config')

const HOURS_AHEAD = 12
const EVENTS_TABLE = 'events'
const EVENT_METADATA_TABLE = 'event_metadata'
const METADATA_TABLE = 'metadata'
const METADATA_FILTER = { type: 'metadata'}

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


async function checkSmartContractEvents() {
    try {
        // get unseed events from smart contract
        const metadata = await mongo.findOne(METADATA_TABLE, METADATA_FILTER, {}, {})
        const lastCheckedEventId = (metadata || {}).lastCheckedEventId || 0;
        const contract = await mongo.getSportsBettingContract();
        const latestEventId = await lamden.getTotalNumEvents(contract) - 1
        if (latestEventId >= 0) {
            for (let eventId = lastCheckedEventId; eventId <= latestEventId; eventId++) {
                console.log('checking contract event id '+eventId.toString())
                const eventMetadata = await lamden.getEventMetadata(contract, eventId)               
                const event = {
                    event_id: eventId,
                    metadata: eventMetadata,
                    live: await lamden.getEventIsLive(contract, eventId),
                    timestamp: await lamden.getEventTimestamp(contract, eventId),
                    validator: await lamden.getEventValidator(contract, eventId),
                    wager: await lamden.getEventWager(contract, eventId),
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
            const { away_team, home_team, date, sport } = event.metadata;
            const actual = mongo.findOne(EVENTS_TABLE, {
                away_team: away_team,
                home_team: home_team,
                date: date,
                sport: sport
            })
            const winningOption = await api.getWinningOption(event.wager, actual);
            if (winningOption !== null) {
                // interact with smart contract to validate event
                let returned = false
                lamden.sendTransaction(
                    config.lamden.contract,
                    'interact',
                    {
                        action: 'sports_betting',
                        payload: {
                            function: 'validate_event',
                            kwargs: {
                                event_id: event.event_id,
                                winning_option_id: winningOption
                            }
                        }
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
    checkSmartContractEventsJob: checkSmartContractEventsJob,
}