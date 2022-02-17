require('dotenv').config()

const mainnet = {
  apiLink: "https://blocks.gammaphi.io",
  network: {
      "name": "Lamden Mainnet", 
      "hosts": ["https://masternode-01.lamden.io"],
      "type": "mainnet", 
      "lamden": true, 
      "currencySymbol": "TAU",
      "blockExplorer": "https://mainnet.lamden.io"
  },
  stamps: {
      validate_event: 5000,
      add_event: 3000,
  },
  contract: 'con_gamma_phi_dao_v1',
}

const testnet = {
  apiLink: "https://testnet.lamden.io/api",
  network: {
      "name": "Lamden Testnet", 
      "hosts": ["https://testnet-master-1.lamden.io"], 
      "type": "testnet", 
      "lamden": true, 
      "currencySymbol": "dTAU",
      "blockExplorer": "https://testnet.lamden.io"
  },
  stamps: {
      validate_event: 5000,
      add_event: 3000,
  },
  contract: 'con_gamma_phi_dao_v1',
} 

const lamden = process.env.NETWORK === 'mainnet' ? mainnet : testnet

module.exports = {
  port: process.env.PORT || 5555,
  privateKey: process.env.PRIVATE_KEY,
  apiLink: lamden.apiLink,
  lamden: lamden,
  sportsDBApiKey: process.env.SPORTSDB_API_KEY,
  mongoUri: process.env.MONGO_URI
}
