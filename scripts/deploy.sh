#/bin/sh -e

source .env

# Download latest code
COMMAND="cd proof-relayer-service/ && sudo git pull origin master"
gcloud compute ssh $INSTANCE_NAME --command="$COMMAND" --zone=$INSTANCE_ZONE

# Rebuild image
COMMAND="cd proof-relayer-service/ && sudo ./scripts/build_image.sh"
gcloud compute ssh $INSTANCE_NAME --command="$COMMAND" --zone=$INSTANCE_ZONE

# Copy env
COMMAND="cd proof-relayer-service/ && sudo ./scripts/build_image.sh"
gcloud compute copy-files .env $INSTANCE_NAME:~/proof-relayer-service/.env --zone=$INSTANCE_ZONE

# Restart service
COMMAND="cd proof-relayer-service/ && sudo docker-compose down && sudo docker-compose up -d"
gcloud compute ssh $INSTANCE_NAME --command="$COMMAND" --zone=$INSTANCE_ZONE
