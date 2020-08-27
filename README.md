## Deploy a custom model with AWS SageMaker and build a Front-end with S3
This repo contains code for the tutorial article I made on Medium found [here](https://towardsdatascience.com/deploying-a-custom-docker-model-with-sagemaker-to-a-serverless-front-end-with-s3-8ee07edc24e6?source=---------2------------------). The article shows how to deploy a custom model with Docker and SageMaker and create a serverless S3 front-end.


### Repo contents:
- docker-image-code/: contains the code for the custom docker model image. Based on a template that works with the AWS SageMaker estimator wrapper
- front-end/: contains the code for the S3 website that allows users to interact with my google trends anomaly detection model
- deploy-custom-model.ipynb: The SageMaker notebook for deploying the model
- lambda-code.py: AWS Lambda function code for invoking the model endpoint

Go to my S3 website [here](http://www.google-trends-anomaly-detection.com.s3-website.us-east-2.amazonaws.com/) to upload google trends CSV data and identity anomalies. (Note: it may not be up all the time)
