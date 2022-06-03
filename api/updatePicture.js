'use strict';

var response = require('../libs/API_Responses');
const AWS = require('aws-sdk');
var fileType = require('file-type');
const S3 = new AWS.S3();
const REGION  = process.env.region;
AWS.config.region = REGION; // Region
const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];

exports.upload = async event => {
  try{
    const jsonData = JSON.parse(event.body);
    if (!jsonData || !jsonData.image || !jsonData.mime) {
        return response._400({ message: 'incorrect body on request' });
    }
    if (!jsonData.accessToken) {
      return response._400({ message:
          'updateUserAttributes was called without access token'});
    }
    if (!allowedMimes.includes(jsonData.mime)) {
      return response._400({ message: 'mime is not allowed ' });
    }
    let imageData = jsonData.image;
    if (jsonData.image.substr(0, 7) === 'base64,') {
        imageData = jsonData.image.substr(7, jsonData.image.length);
    }
    /**
    * Initialise credentials.
    */
    await AWS.config.credentials.getPromise();

    const cognitoProvider = new AWS.CognitoIdentityServiceProvider({
         REGION,
         apiVersion: '2016-04-18',
     });
    let uploadURL;
    if (imageData) {
      const buffer = Buffer.from(imageData, 'base64');
      const fileInfo = await fileType.fromBuffer(buffer);
      const detectedExt = fileInfo.ext;
      const detectedMime = fileInfo.mime;
      const key = `avatars/${Date.now()}.${detectedExt}`;
      await S3.putObject({
          Body: buffer,
          Key: key,
          ContentType: jsonData.mime,
          Bucket: process.env.bucketName,
          ACL: 'public-read',
        }).promise();
        uploadURL = `https://${process.env.bucketName}.s3.amazonaws.com/${key}`;
    }
    await cognitoProvider
                .updateUserAttributes({
                    AccessToken: jsonData.accessToken,
                    UserAttributes: [
                        { Name: 'picture', Value: uploadURL },
                    ].filter((attr) => undefined !== attr.Value),
                })
                .promise();
    return response._200({
        imageURL: uploadURL,
    });
  }catch(error){
    console.log('error', error);
    return response._400({ message: error.message });
  }  
};
