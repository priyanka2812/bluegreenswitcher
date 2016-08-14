var aws = require('aws-sdk');
aws.config.region = 'ap-south-1';
var asg = new aws.AutoScaling();
var elb = new aws.ELB();
var response = require('cfn-response');

exports.handler = function (event, context) {
    console.log("Received Event: ",JSON.stringify(event,null,2));
    var message = event.Records[0].Sns.Message;
    console.log(JSON.parse(message).ResourceProperties);
    var prodelbname =  JSON.parse(message).ResourceProperties.ProdLoadBalancerName;
//var testelbname = event.ResourceProperties.TestLoadBalancerName;
var asggreen =  JSON.parse(message).ResourceProperties.AutoScalingGroupName;

    console.log("SNS Message ProdElb: ",prodelbname);
    console.log("SNS Message Green Asg: ",asggreen);
    if (JSON.parse(message).RequestType != 'Create') {
     //   response.send(event, context, response.SUCCESS, {"message": "Nothing to do"});
    }
   
//var prodelbname = event.ResourceProperties.ProdLoadBalancerName;
//var testelbname = event.ResourceProperties.TestLoadBalancerName;
//var asggreen = event.ResourceProperties.AutoScalingGroupName;

asg.describeAutoScalingGroups(function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else    {
        for (var i = 0; i < data.AutoScalingGroups.length; i++){
                //console.log(data.AutoScalingGroups[i].Instances);
                for(var j = 0; j < data.AutoScalingGroups[i].LoadBalancerNames.length; j++){
                        if(data.AutoScalingGroups[i].LoadBalancerNames[j] == prodelbname){

                                var asgblue = data.AutoScalingGroups[i].AutoScalingGroupName
                                console.log("Blue AutoScaling Group Name: ",asgblue);
                                greenMinSize = data.AutoScalingGroups[i].MinSize
                                greenDesiredCapacity = data.AutoScalingGroups[i].DesiredCapacity
                                greenMaxSize = data.AutoScalingGroups[i].MaxSize
                                var greenasgparams = {
                                        AutoScalingGroupName: asggreen,
                                        MinSize: greenMinSize,
                                        DesiredCapacity: greenDesiredCapacity,
                                        MaxSize: greenMaxSize
                                }
                            }
                 }
           }
           console.log("Updating Green Asg to have equal no. of instances as Blue Asg");
           asg.updateAutoScalingGroup(greenasgparams, function(err, data) {
                 if (err) console.log(err, err.stack); // an error occurred
                 else     console.log(data); 
           });
           setTimeout(function(){
		var responseBody = JSON.stringify({
        		Status: "SUCCESS",
        		Reason: "Updated Instance Count",
        		PhysicalResourceId: 'updateinstance_custom_resource',
        		StackId: JSON.parse(message).StackId,
                        RequestId: JSON.parse(message).RequestId,
                        LogicalResourceId: JSON.parse(message).LogicalResourceId
                });

    //console.log("Response body:\n", responseBody);
    var responseurl = JSON.parse(message).ResponseURL;
    var https = require("https");
    var url = require("url");

    var parsedUrl = url.parse(responseurl);
    var options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: "PUT",
        headers: {
            "content-type": "",
            "content-length": responseBody.length
        }
    };

    var request = https.request(options, function(response) {
        console.log("Status code: " + response.statusCode);
       // console.log("Status message: " + response.statusMessage);
    });

    request.on("error", function(error) {
        console.log("send(..) failed executing https.request(..): " + error);
    });
    request.write(responseBody);
    request.end();
	   },120000);
   }
});
}
