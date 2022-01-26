const config = require('./config')
const Lamden = require('lamden-js')


function getVkFromSk(sk) {
    return Lamden.wallet.get_vk(sk);
}

function sendTransaction(
                    contractName,
                    methodName,
                    kwargs,
                    stampLimit,
                    callback) {
    let wallet = {
        sk: config.privateKey,
        vk: getVkFromSk(config.privateKey)
    }
    let network = config.lamden.network;
    let senderVk = wallet.vk;    
    let txInfo = {
        senderVk,
        contractName: contractName,
        methodName, methodName,
        kwargs,
        stampLimit: stampLimit,
    }
    console.log("TxInfo: ");
    console.log(txInfo);
    let tx = new Lamden.TransactionBuilder(network, txInfo);
    const listener = (response) => {
        if (response.errors || response.result) {
            if (callback) {
                tx.events.removeListener('response', listener)
                callback(response, tx);                
            }
        }
    }
    tx.events.on('response', listener)
    tx.send(wallet.sk).then(() => tx.checkForTransactionResult())
}


async function getEventIsLive(eventId) {
    return await readStateFromContract(
        config.lamden.contract, 'events', [eventId, 'live'], null
    )
}


async function getEventTimestamp(eventId) {
    return await readStateFromContract(
        config.lamden.contract, 'events', [eventId, 'timestamp'], null
    )
}


async function getEventWager(eventId) {
    return await readStateFromContract(
        config.lamden.contract, 'events', [eventId, 'wager'], null
    )
}


async function getEventValidator(eventId) {
    return await readStateFromContract(
        config.lamden.contract, 'events', [eventId, 'validator'], null
    )
}


async function getEventMetadata(eventId) {
    return await readStateFromContract(
        config.lamden.contract, 'events', [eventId, 'metadata'], null
    )
}


async function getTotalNumEvents(eventId) {
    return await readStateFromContract(
        config.lamden.contract, 'total_num_events', [], 0
    )
}


async function readStateFromContract(contract, variableName, keys, default_value) {
    try {
        let url = `${config.masterNodeLink}/contracts/${contract}/${variableName}`
        if (keys.length > 0) {
            `${url}?key=${keys.join(':')}`
        }
        const res = await fetch({
                url: url,
                method: 'GET',
            },
        )
        if (res.status === 200) {
            let json = await res.json()
            let value = json.value
            if (value) {
                if (value.__fixed__) return bigInt(value.__fixed__)
                else return value
            } else {
                return default_value
            }
        } else {
            return default_value
        }
    } catch (error) {
        return default_value;
    }
}

module.exports = {
    sendTransaction: sendTransaction,
    getEventIsLive: getEventIsLive,
    getEventTimestamp: getEventTimestamp,
    getEventWager: getEventWager,
    getEventValidator: getEventValidator,
    getTotalNumEvents: getTotalNumEvents,
    getEventMetadata: getEventMetadata
}