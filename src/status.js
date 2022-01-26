
async function status(req, res) {
    return res.json({status: 'ok'})
}

module.exports = {
    status: status,
}