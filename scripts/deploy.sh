#/bin/sh -e

source .env

# Download latest code
COMMAND="cd sports-betting-provider/ && sudo git pull origin master"
gcloud compute ssh $INSTANCE_NAME --command="$COMMAND" --zone=$INSTANCE_ZONE

# Rebuild image
COMMAND="cd sports-betting-provider/ && sudo ./scripts/build_image.sh"
gcloud compute ssh $INSTANCE_NAME --command="$COMMAND" --zone=$INSTANCE_ZONE

# Copy env
gcloud compute copy-files .env $INSTANCE_NAME:~/sports-betting-provider/.env --zone=$INSTANCE_ZONE

# Restart service
COMMAND="cd sports-betting-provider/ && sudo docker-compose down && sudo docker-compose up -d"
gcloud compute ssh $INSTANCE_NAME --command="$COMMAND" --zone=$INSTANCE_ZONE
