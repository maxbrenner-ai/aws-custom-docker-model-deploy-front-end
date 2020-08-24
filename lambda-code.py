import os
import io
import boto3
import json
import csv


# grab environment variables
ENDPOINT_NAME = os.environ['ENDPOINT_NAME']
runtime = boto3.client('runtime.sagemaker')

def lambda_handler(event, context):
    data = json.loads(json.dumps(event))
    
    payload = data['body']
    
    response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                   ContentType='application/json',
                                   Body=payload)

    result = response['Body'].read().decode()

    return {
        'statusCode': 200,
        'body': result
    }
