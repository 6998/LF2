const AWS = require('aws-sdk');
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const async = require('async');
const fs = require('fs');
const path = require('path');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const randomstring = require("randomstring");
const dynamoose = require('dynamoose');
const elasticbeanstalk = new AWS.ElasticBeanstalk();


exports.handler = (event, context, callback) => {


  var queueURL = "https://sqs.us-east-1.amazonaws.com/906385631751/ml-runner";

  var params = {
    AttributeNames: [
      "SentTimestamp"
    ],
    MaxNumberOfMessages: 10,
    MessageAttributeNames: [
      "All"
    ],
    QueueUrl: queueURL,
    VisibilityTimeout: 0,
    WaitTimeSeconds: 0
  };

  sqs.receiveMessage(params, function(err, data) {
    async.eachSeries(data.Messages, (item, cb)=>{
      console.log(tem.MessageAttributes)

      const projectName = item.MessageAttributes.ProjectName.StringValue;
      const ProjectId = item.MessageAttributes.ProjectId.StringValue;
      const S3key = item.MessageAttributes.S3key.StringValue;
      const name = `runner_${projectName}_${ProjectId}`;

      if(item.Body === "New Version") {
        const EBparams = {
          ApplicationName: name,
          AutoCreateApplication: true,
          Description: `runner_${projectName}`,
          Process: true,
          SourceBundle: {
            S3Bucket: "docker-6998",
            S3Key: S3key
          },
          VersionLabel: S3key
        };

        var deleteParams = {
          QueueUrl: queueURL,
          ReceiptHandle: item.ReceiptHandle
        };

        sqs.deleteMessage(deleteParams, function(err, data) {
            console.log("Delete Error", err);
        });

        elasticbeanstalk.createApplicationVersion(EBparams, function(err, data) {
          console.log("elasticbeanstalk ", err);
          cb();
        });
      } else if(item.Body === "Run") {

        con

        const rand = randomstring.generate(3);
        let env = S3key.split["."];
        env = env[0];

        var params = {
          ApplicationName: name,
          CNAMEPrefix: projectName+rand,
          EnvironmentName: env,
          SolutionStackName: "64bit Amazon Linux 2017.09 v2.9.2 running Docker 17.12.0-ce",
          VersionLabel: S3key
        };
        elasticbeanstalk.createEnvironment(params, function(err, data) {
          console.log("createEnvironment: ", err);
          cb();
        });
      } else {
        cb();
      }

    }, ()=>{
      return callback(null, true);
    })
  });

};

