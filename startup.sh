#!/bin/bash

# Step 1: Install all the required Python libraries
echo "--- Installing requirements.txt ---"
python3.11 -m pip install -r requirements.txt

# Step 2: Start the Gunicorn server
echo "--- Starting Gunicorn server ---"
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app