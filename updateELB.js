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
    var testelbname = JSON.parse(message).ResourceProperties.TestLoadBalancerName;
    var asggreen = JSON.parse(message).ResourceProperties.AutoScalingGroupName;

    console.log("Prod ELB: ", prodelbname);
    console.log("Test ELB: ", testelbname);
    console.log("ASG Green: ", asggreen);

    if (JSON.parse(message).RequestType != 'Create') {
 //       response.send(event, context, response.SUCCESS, {"message": "Nothing to do"});
    }

//var prodelbname = event.ResourceProperties.ProdLoadBalancerName;
//var testelbname = event.ResourceProperties.TestLoadBalancerName;
//var asggreen = event.ResourceProperties.AutoScalingGroupName;

asg.describeAutoScalingGroups(function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else    {
        asg.describeAutoScalingGroups(function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else    {
        for (var i = 0; i < data.AutoScalingGroups.length; i++){
                //console.log(data.AutoScalingGroups[i].Instances);
                for(var j = 0; j < data.AutoScalingGroups[i].LoadBalancerNames.length; j++){
                        if(data.AutoScalingGroups[i].LoadBalancerNames[j] == prodelbname){

                                var asgblue = data.AutoScalingGroups[i].AutoScalingGroupName
                                console.log("Asg Blue: ",asgblue);
                                var bluedetachparams = {
                                        AutoScalingGroupName: asgblue,
                                        LoadBalancerNames: [prodelbname]
                                }
                                var asgparams = {
                                        AutoScalingGroupName: asgblue,
                                        MinSize: 0,
                                        DesiredCapacity: 0,
                                        MaxSize: 0
                                }
                        }
                }
        }

        var greendetachparams = {
                                        AutoScalingGroupName: asggreen,
                                        LoadBalancerNames: [testelbname]
                                }
        console.log("Detaching Test ELB (",testelbname, ") from Green Autoscaling group (", asggreen, ")");
        asg.detachLoadBalancers(greendetachparams, function(err, data) {
             if (err) console.log(err, err.stack); // an error occurred
             else     console.log(data);           // successful response
        });

        var greenattachparams = {
                                        AutoScalingGroupName: asggreen,
                                        LoadBalancerNames: [prodelbname]
                                };
       console.log("Attaching ELB (",prodelbname, ") to Green Autoscaling group (", asggreen, ")");
       asg.attachLoadBalancers(greenattachparams, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
        });

	console.log("Detaching ELB (",prodelbname, ") from Blue Autoscaling group ("+asgblue+")");
        asg.detachLoadBalancers(bluedetachparams, function(err, data) {
             if (err) console.log(err, err.stack); // an error occurred
             else     console.log(data);           // successful response
        });

        console.log("Terminating Blue Environment");
        asg.updateAutoScalingGroup(asgparams, function(err, data) {
             if (err) console.log(err, err.stack); // an error occurred
             else    {
                console.log(data);
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
           }
            //    response.send(event, context, response.SUCCESS, {"message": "Blue Green Deployment Done."});
                        // successful response
        });
}
});
}
});
}

