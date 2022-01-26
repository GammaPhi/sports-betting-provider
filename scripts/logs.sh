#/bin/sh -e

source .env

# show logs
COMMAND="cd proof-relayer-service/ && sudo docker-compose logs"
gcloud compute ssh $INSTANCE_NAME --command="$COMMAND" --zone=$INSTANCE_ZONE
