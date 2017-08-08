# lifx multi color bulb and AWS Integration 

	Create AWS resources using YAML templates and integrate to lynx IOT multi-color bulb


## Integrate LIFX multi color IoT bulb to wifi network
	Download lyfx mobile app
	Plug and switch on bulb, then connect to lyfx wifi on your mobile device
	go to lyfx app and connect to your network wifi
	At this point, bulb is integrated and connected to wifi of your choice 
	Claim the bulb for api calls - https://support.lifx.com/hc/en-us/articles/	203711234-Connecting-your-LIFX-to-the-Cloud


## Create AWS stack using YAML template 
  
	Use yaml template from this project to create AWS resources

## DynamoDB table to store configuration information

	DynamoDB table is created by above step - “iot-alert-config" 

	Schema columns - apiKey, messageKey, token, brightness, color, proceed
	
	Add item with previously copied OAuth token for LIFX bulb and other config information

	Refer to cloudformation template for indexes and other information

## Test

	Publish "success" message to BuildOrDeployStatus SNS topic. For this 	implementation, a message is published by Jenkins build server.
	As Lambda function is subscribing to this topic. it receives a message and takes 	appropriate action to call required REST api which results in bulb color change. 

