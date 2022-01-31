#/bin/sh -e

source .env

# show logs
COMMAND="cd sports-betting-provider/ && sudo docker-compose logs"
gcloud compute ssh $INSTANCE_NAME --command="$COMMAND" --zone=$INSTANCE_ZONE
