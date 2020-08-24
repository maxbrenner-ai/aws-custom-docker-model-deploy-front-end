# This is the file that implements a flask server to do inferences. It's the file that you will modify to
# implement the scoring for your own algorithm.

from __future__ import print_function

import os
import json
import pickle
from io import StringIO
import sys
import signal
import traceback

import flask

import pandas as pd
from sklearn.cluster import DBSCAN
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from statsmodels.tsa.seasonal import STL
from GESD import anom_detect

prefix = '/opt/ml/'
model_path = os.path.join(prefix, 'model')

# If seasonality is true then STL otherwise DBSCAN
def predict(data, hyperparams):
    if hyperparams['seasonality']:
        stl_data = pd.Series(data=list(data.iloc[:, 1]), index=list(data.iloc[:, 0]))
        stl = STL(stl_data, period=hyperparams['period'])
        resids = stl.fit().resid.values
        residual_df = pd.DataFrame(data={'residuals': resids})
        anomalies = anom_detect().evaluate(residual_df, col_name='residuals')
        anomalies_indices = list(anomalies.index)
    else:
        db = DBSCAN(eps=hyperparams['eps'], min_samples=hyperparams['min_pts']).fit(data)
        anomalies_indices = np.argwhere(db.labels_==-1).flatten().tolist()
    return anomalies_indices

# Squash X and Y of data between 0 and 1 (MinMaxScale)
def preprocess(df):
    # Convert first column (X) to range 0...len-1
    df.iloc[:, 0] = list(range(len(df)))
    # Squash each column between 0 and 1 
    data = MinMaxScaler().fit_transform(df)
    # Convert back to dataframe
    data = pd.DataFrame(data=data, columns=df.columns.tolist())
    return data

# The flask app for serving predictions
app = flask.Flask(__name__)

@app.route('/ping', methods=['GET'])
def ping():
    return flask.Response(response='\n', status=200, mimetype='application/json')

@app.route('/invocations', methods=['POST'])
def transformation():
    """Do an inference on a single batch of data. In this sample server, we take data as CSV, convert
    it to a pandas data frame for internal use and then convert the predictions back to CSV (which really
    just means one prediction per line, since there's a single column.
    """
    data = None
    # Convert from CSV to pandas
    if flask.request.content_type == 'application/json':
        request = flask.request.get_json()
        # Unpack data and hyperparams for testing
        data = request['data']
        hyperparams = {'min_pts': request['min_pts'], 'eps': request['eps'], 'seasonality': request['seasonality'], 'period': request['period']}
        s = StringIO(data)
        # Skip the first 2 rows as they are unnecessary
        data = pd.read_csv(s, skiprows=2)
    else:
        return flask.Response(response='This predictor only supports json data', status=415, mimetype='text/plain')
    
    # Preprocess
    data = preprocess(data)
    
    # Do the prediction
    predictions = predict(data, hyperparams)

    # Convert from numpy back to CSV
    out = StringIO()
    pd.DataFrame({'results':predictions}).to_csv(out, header=False, index=False)
    result = out.getvalue()

    return flask.Response(response=result, status=200, mimetype='text/csv')
