let myChart;

// Read in CSV as text
let csv_text;
let file_name;
function readFile(input) {
    let file = input.files[0];

    let reader = new FileReader();

    reader.readAsText(file);

    reader.onload = function() {
        csv_text = reader.result;
        file_name = file.name;
        $('#file-name-label').html(file_name);
        $('#submitCSV').prop('disabled', false);
    };

    reader.onerror = function() {
        console.log(reader.error);
    };
}

// Seasonality change
function seasonalityChange(input) {
    if (input.checked) {
        $('.DBSCAN-parameter').hide();
        $('.STL-parameter').show();
    } else {
        $('.DBSCAN-parameter').show();
        $('.STL-parameter').hide();
    }
}

// Submit AJAX request to model
$( "#submitCSV" ).click(function() {
    // Get inputs
    let period = ($('#period').val() ? Number.parseFloat($('#period').val()) : 12);
    let min_pts = ($('#min_pts').val() ? Number.parseFloat($('#min_pts').val()) : 4);
    let eps = ($('#eps').val() ? Number.parseFloat($('#eps').val()) : 0.1);
    let seasonality = $('#seasonality-checkbox').is(':checked');
    $.ajax({
        type: "POST",
        url: "https://gdczk4njh3.execute-api.us-east-2.amazonaws.com/test/detectAnomaly",
        data: JSON.stringify({'data': csv_text, 'seasonality': seasonality, 'eps': eps, 'min_pts': min_pts, 'period': period}),
        contentType: 'text/plain',
        success: function(anomaly_indices){
            plot(anomaly_indices);
        },
        error: function(error){
            console.log(error)
        }
    });
});

// Process data before plotting
function formatData(anomaly_indices) {
    let csv_rows = csv_text.split('\n');
    // Remove last line and the first 3
    csv_rows.pop(); csv_rows.shift(), csv_rows.shift(); csv_rows.shift();
    // Need to get x-vals and y-vals
    let all_xVals = []; let all_yVals = [];
    csv_rows.forEach(function(element) {
        let split_elm = element.split(',');
        all_xVals.push(split_elm[0]);
        all_yVals.push(split_elm[1]);
    });
    
    // Convert string into list
    anomaly_indices = anomaly_indices.split('\n');
    anomaly_indices.pop()
    // Get the actual points
    let anom_pts = [];
    anomaly_indices.forEach(function(index){
        xVal = all_xVals[index];
        yVal = all_yVals[index];
        anom_pts.push({x: xVal, y: yVal});
    });

    return [all_xVals, all_yVals, anom_pts]
}

function plot(anomaly_indices) {
    // Need to destory past plots otherwise its glitchy
    try {
        myChart.destroy();
    } catch(err) {}
    // Format data
    let vals = formatData(anomaly_indices);
    let all_xVals = vals[0]; 
    let all_yVals = vals[1];
    let anom_pts = vals[2];
    // Create Chart
    myChart = createChart(all_xVals, all_yVals, anom_pts);
}

// Plot
function createChart(all_xVals, all_yVals, anom_pts) {
    var ctx = document.getElementById('myChart').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: all_xVals,
            datasets: [{
                label: 'Popularity',
                data: all_yVals,
                borderColor: '#3e95cd',
                pointBorderColor: "blue",
                fill: false,
                order: 1
            },
            {
                type: 'scatter',
                data: anom_pts,
                order: 0,
                label: 'Anomaly',
                backgroundColor: "red",
                pointRadius: 5,
            }]
        },
        options: {
            legend: {display: true},
            title: {display: true, text: `${file_name.replace('.csv', '')} Anomalies`},
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }],
                xAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });

    return myChart;
}