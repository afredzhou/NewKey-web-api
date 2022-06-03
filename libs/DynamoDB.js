'use strict';
const _ = require('lodash');
const AWS = require('aws-sdk'); 
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports = {
    async get(ID, TableName) {
        const params = {
            TableName,
            Key: {
                id: ID
            },
        };
        const data = await dynamoDb.get(params).promise();

        if (!data || !data.Item) {
            throw Error(`There was an error fetching the data for ID of ${ID} from ${TableName}`);
        }
        console.log(data);

        return data.Item;
    },
    all: async (tableName) => {
        const params = {
            TableName: tableName
        };
        let result = await dynamoDb.scan(params).promise();
        let data = result.Items;
        data = data.map(convertIdToNumber);
        data = _.orderBy(data, ['id'], ['asc']);
        return data || [];
    }

}

function convertIdToNumber(quote) {
    quote.id = parseInt(quote.id, 10);
    return quote;
}