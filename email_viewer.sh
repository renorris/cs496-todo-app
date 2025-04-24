#!/bin/bash

content=""
counter=0

while true; do
    content=`psql -U postgres -d todoapp -c "SELECT email FROM public.user;"`
    counter=$((counter+1))
    clear
    echo "$content"
    sleep 0.2 
done
