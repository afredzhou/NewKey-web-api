var response = require('../libs/API_Responses');
var Dynamo = require('../libs/DynamoDB');
const tableName = process.env.quotes;

exports.getQuote = async event => {
    const quotes = await Dynamo.all(tableName).catch(err => {
        console.log('error in Dynamo get', err);
        return null;
    });
    console.log('Length:'+quotes.length);
    let id = getRandomInt(0, quotes.length);

    const quote = await Dynamo.get(id, tableName).catch(err => {
        console.log('error in Dynamo get', err);
        return null;
    });

    if (!quote) {
        return response._204({ message: 'Failed to get quote by ID' });
    }
    return response._200(quote);
}


function getRandomInt(min, max) {
    //Will return a number inside the given range, inclusive of both minimum and maximum
    //i.e. if min=0, max=20, returns a number from 0-20
    return Math.floor(Math.random() * (max - min + 1)) + min;
}