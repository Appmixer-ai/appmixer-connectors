#!/bin/bash

# publish all services
for serviceArchive in ./dist/*.zip; do
    appmixer publish $serviceArchive
done
