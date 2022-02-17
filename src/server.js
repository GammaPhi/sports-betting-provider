const express = require('express')
const status = require('./status')
const controller = require('./controller')
const { port } = require('./config')
const { version } = require('../package.json')
const { isAddress } = require('web3-utils')
const { checkForCompletedEventsJob, checkSmartContractEventsJob } = require('./worker')


const app = express()
app.use(express.json())

// Add CORS headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next()
})

// Log error to console but don't send it to the client to avoid leaking data
app.use((err, req, res, next) => {
  if (err) {
    console.error(err)
    return res.sendStatus(500)
  }
  next()
})

app.get('/', status.status)
app.get('/status', status.status)
app.post('/events', controller.events)
app.post('/moneylines', controller.moneylines)
app.post('/spreads', controller.spreads)
app.post('/totals', controller.totals)

app.listen(port)
console.log(`Provider ${version} started on port ${port}`)  
