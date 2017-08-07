
var https = require('https');
  
var AWS = require('aws-sdk');
var DDB = new AWS.DynamoDB.DocumentClient();
AWS.config.update({region: "us-west-2"});

var apiHost = 'api.lifx.com';

/**
 * this lambda function controls IOT bulb colors based on SNS message
 */
exports.handler = function(event, context){

    var message = event.Records[0].Sns.Message;

    //logging sns message 
    console.log('SNS Event received: '+ message);

    var color = 'green';
    var power = 'on';
    var brightness = 0.5;

  //retrieve config from dynamodb
    getConfigDataForMessageType("build_mainline", message, function(data){
    	
    	if (data.proceed == 'false'){
            callback(null, 'skip workflow..');
        }
    	
    	brightness = data.brightness;
    	color = data.color;
    	
    });
    
    //retrieve access token from dynamodb
    getAccessToken("build_mainline", function(data){
    	
    	console.log('token received:'+ data.token);
    	
    	setIOTState(data.token, 'all', '{"brightness": "'+brightness+'", "power": "'+power+'", "color" : "' + color + '"}', function(result){
            if (result){
                callback('success');
            }
            else{
                callback(null, 'failure');
            }
        });
    });
};

//Create headers required by api calls
function createHeaders(token, contentLength){
    var headers ={
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };
    
    return headers;
}

//Connects to dynamodb to retrieve specific config for given apiKey and message
function getConfigDataForMessageType(apiKey, message,  callback){
    console.log('Called getAccessToken(...');
    
    var params = {
    TableName: "iot-alert-config",
        Key: {
            "apiKey": apiKey ,
            "messageKey": message
        }
    };
    
    DDB.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("DynamoDB GetItem for config succeeded...");
            
            var callbackData = {};
            callbackData.brightness = data.Item.brightness;
            callbackData.color = data.Item.color;
            callbackData.proceed = data.Item.proceed;
            
            callback(callbackData);
        }
    });
}

//Connects to dynamodb to retrieve specific token for give apiKey
function getAccessToken(id, callback){
    console.log('Called getAccessToken(...');
    
    //useCount is not used
    var params = {
    TableName: "iot-alert-config",
        Key: {
            "apiKey": id ,
            "messageKey": "token"
        }
    };
    
    DDB.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("DynamoDB GetItem succeeded...");
            
            var callbackData = {};
            callbackData.token = data.Item.token;
            
            callback(callbackData);
        }
    });
}

//calls external iot hub to request changes
function setIOTState(token, selector, requestData, callback){
    console.log('Called setIOTState()');

    console.log('Request Data = ', requestData);

    var options = {
        host:       apiHost,
        path:       '/v1/lights/' + selector + '/state',
        method:     'PUT',
        headers:    createHeaders(token, Buffer.byteLength(requestData))
    };

    var req = https.request(options, function(res){
        console.log('setIOTState(): Status Code = ', res.statusCode);

        if (res.statusCode >= 200 && res.statusCode <= 299){
            console.log('setIOTState() was successful: '+ res.statusCode);
        } 
        else{
            console.log('setIOTState() was not successful: '+res.statusCode);
        }

        res.on('end', function (responseData){ 
            console.log(responseData);
        });
    }).on('error', function(e){
        console.log('setIOTState() failed: ', e);
        callback(false);
    });
    
    req.write(requestData);
    
    req.end();
}