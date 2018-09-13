'use strict'; // set application to strict mode

// external libraries
const EXPRESS = require( 'express' );
const BODYPARSER = require( 'body-parser' );
const AXIOS = require( 'axios' );

// global variables
let webApp = new EXPRESS( );
let subscriptions = [ ]; // holds list of subscriptions
let token = 'TOKEN'; // bot token
let botId = 'BOTID'; // bot personId
let port = 8080; // application port
let endpoint = '/myendpoint'; // application endpoint
let message = ''; // contains the message to be sent back
let sending = false; // global flag to send or not

function checkSubscription ( spaceId )
{ // checks if spaceId is currently subscribed
  if ( subscriptions.includes( spaceId ) )
  { return true; }
  else
  { return false; }
}

function addSubscription ( spaceId )
{ // adds a subscription
  if ( checkSubscription( spaceId ) )
  { return true; }
  else
  { subscriptions.push( spaceId ); return true; }
}

function removeSubscription ( spaceId )
{ // removes a subscription
  if ( checkSubscription( spaceId ) )
  { subscriptions.splice( subscriptions.indexOf( spaceId ), 1 ); return true; }
  else
  { return false; }
}

function handleMessage ( data )
{ return new Promise( ( resolve, reject ) => {
  // checks to confirm bot is not receiving its own message
  if ( data.personId === botId )
  { resolve( 'bot message caught' ); return; }

  // send request to get message details
  AXIOS.get( `https://api.ciscospark.com/v1/messages/${data.id}`, { "headers": {
    "Content-type": "application/json; charset=utf-8",
    "Authorization": `Bearer ${token}`
  } } ).then( ( r ) => {

    if ( r.data.text.includes( 'unsubscribe' ) )
    { // if the user said "unsubscribe"
      removeSubscription( r.data.roomId );
      message = `you have unsubscribed on roomId ${r.data.roomId}`;
      sending = true;
    }
    else if ( r.data.text.includes( 'subscribe' ) )
    { // if the user said "subscribe"
      addSubscription( r.data.roomId );
      message = `you have subscribed on roomId ${r.data.roomId}`;
      sending = true;
    }
    else
    { // if the user said anything else
      message = `example response message for subscribed space`;
      sending = checkSubscription( r.data.roomId ); // validates if the space is currently subscribed before marking as "sending"
    }

    if ( sending )
    { // if the sending flag is true
      AXIOS.post( `https://api.ciscospark.com/v1/messages`, {
        "roomId": r.data.roomId,
        "text": message
      }, {
        "headers": {
          "Content-type": "application/json; charset=utf-8",
          "Authorization": `Bearer ${token}`
        }
      } ).then( ( r ) => {
        resolve( `sent message "${r.data.text}" to "${r.data.roomId}"`)
      } ).catch( ( e ) => {
        reject( e );
      } );
    }
    else
    {
      reject( `space "${r.data.roomId}" is not subscribed` );
    }

  } ).catch( ( e ) => {
    reject( `error getting message "${data.id}"` ) ;
  } );
} ); }

function main ( )
{
  webApp.use( BODYPARSER.json( ) ); // set web application to use JSON

  webApp.post( endpoint, ( req, res ) => { // set up the web endpoint
    handleMessage( req.body.data ).then( ( r ) => {
      console.log( r );
      res.sendStatus( 200 );
    } ).catch( ( e ) => {
      console.log( e );
      res.sendStatus( 200 );
    } );
  } );

  webApp.listen( port ); // listen on mentioned port
}

main( );
