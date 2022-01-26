# Lamden Proof Relayer Service

** WIP: DO NOT USE **

## Purpose

In order to protect the privacy of transactions on [Lamnado](https://lamnado.cash), we need to submit withdrawal requests to a relayer service. This is because a withdrawal requests require stamps, which means the address of the signer must have enough TAU to execute the transaction. This means that the withdrawing address must be funded by another address, which is likely linked to an identity. However, if the relayer service submits the withdrawal request on the user's behalf, the address of the relayer will sign and send the transaction, and so the withdrawal remains anonymous. 

This repository provides an API to do just that. In exchange for providing this service (and to reimburse for stamp costs), a portion of the withdrawal amount will be deposited to the relayer's address upon a successful withdrawal. The fees are configured by each relayer in [config.js](src/config.js).


## Usage

```bash
# Post a relay request
POST /relay
{
    "note": "e880dbfa6f10181ccac4728b9da4c138644a265004055699af8a5f381cd22c8ad8e031fc3c7ff574a477f462d031b26b773bc5f537a85893be4576c2f83a", 
    "denomination": 1000, 
    "token": "currency", 
    "recipient": "8b632e0598dafed9a5c09c22336bd0563dd9d0e25c72e443c3223faacc1a369d"
}
```

```bash
# Return {"status": "ok"} if this relayer is online and functioning
GET /status
```

```bash
# Return information about the fees of this relayer
GET /fees
```

See [config.js](src/config.js) for each valid denomination/token pair.


## Deploy on Ubuntu 18

### Initial Setup

```bash
# Install git
sudo apt update
sudo apt install -y git

# Clone relayer repo
git clone https://github.com/GammaPhi/proof-relayer-service.git
cd lamden-relayer-service/

# Setup environment
cp .env.example .env

# Update environment variables in .env file
nano .env
```

### Docker Compose (recommended)

```bash
# Install docker
sudo apt update
sudo apt install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
sudo apt update
apt-cache policy docker-ce
sudo apt install docker-ce

# Install docker-compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Build docker image
sudo docker build -t proof-relayer -f Dockerfile .

# Start service
sudo docker-compose up -d

# Local test
curl localhost:5000/status
# Should return {"status": "ok"}
```

### Install Directly

```bash
# Install git
sudo apt update
sudo apt install -y git

# Clone relayer repo
git clone https://github.com/GammaPhi/proof-relayer-service.git
cd lamden-relayer-service/

# Setup environment
cp .env.example .env

# Update environment variables in .env file
nano .env

# Install mongodb
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/5.0 multiverse" | sudo
tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install node
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -

sudo apt install -y nodejs
node --version # Should be Node 12

# Install node dependencies
sudo npm -i yarn -g
sudo yarn

# Start server in background
sudo npm i pm2 -g
pm2 start src/server.js

# Local test
curl localhost:5000/status
# Should return {"status": "ok"}
```

### Setup SSL

```bash
# Create an A record pointing to the VM's IP address
# Change this first line accordingly
RELAYER_DNS=relayer.gammaphi.io

# Install nginx
sudo apt update
sudo apt install -y nginx

# Setup nginx
sudo cp nginx/server.conf /etc/nginx/sites-available/default 
sudo service nginx restart

# Setup SSL
sudo add-apt-repository ppa:certbot/certbot
sudo apt install -y python3-certbot-nginx
sudo certbot --nginx -d $RELAYER_DNS

# Final test
curl https://$RELAYER_DNS/status
# Should return {"status": "ok"}
```

## Local Development

Use Node 12

```bash
nvm use 12
```

Install dependencies

```bash
yarn
```

Configure environment

```bash
# Update environment variables accordingly
cp .env.example .env  
```

Run server locally

```bash
yarn server
```