# Asterisk External Speech to Text application

This package contains an example Node.js program that uses the [Asterisk External Application Protocol](https://wiki.asterisk.org/wiki/pages/viewpage.action?pageId=47875006) (AEAP) to facilitate external speech to text translation in Asterisk 18.12.0+ and 19.4.0+.

## Description

#### Background
For a while now Asterisk has had to ability to translate speech to text via its [Speech Recognition API](https://wiki.asterisk.org/wiki/display/AST/Speech+Recognition+API). Historically though, creating a new speech recognition engine required writing a new Asterisk module, typically written in "C", that implemented the backend API. Now, with the advent of AEAP, the backend speech API is abstracted away and translation can be done externally in the programming language of one's choice.

#### Example Program
This program acts as a mediator between Asterisk and the Google speech provider. Creating a websocket server it listens for incoming client connections from Asterisk. Once a connection is established, and a successful negotiation takes place using AEAP for speech audio can then be sent from Asterisk to the application, which then forwards it to the Google speech provider. Upon a confidence speech to text result received from Google, the application sends the result to Asterisk via an AEAP message.

Speech recognition will continue until the client closes, or an error occurs.

## Dependencies

* Node.js
* [Google Speech API](https://cloud.google.com/speech-to-text/docs/) credentials set in environment variable [GOOGLE_APPLICATION_CREDENTIALS](https://cloud.google.com/docs/authentication/getting-started).

## Installation

Run `npm install` from the top of the source tree. This will install the required npm packages.

## Usage

To start the websocket server on the default port (9099):
```
$ index.js
```
Or to have it listen on a different port:
```
$ index.js --port=<port number>
```
To stop the server press `Ctrl-C`

## Example Asterisk Configuration:

Configure an AEAP client in [*aeap.conf*](https://github.com/asterisk/asterisk/blob/master/configs/samples/aeap.conf.sample):
```
[my-speech-to-text]
type=client
codecs=!all,ulaw
url=ws://127.0.0.1:9099
protocol=speech_to_text
```
This will configure a "speech engine" in Asterisk that connects to the external application. When the [Asterisk Speech Recognition API](https://wiki.asterisk.org/wiki/display/AST/Speech+Recognition+API) is employed in dialplan using the above "engine", this configuration is activated and a websocket client attempts to connect to the given URL. Next, create an extension that utilizes the speech API dialplan functions, and on *SpeechCreate* give the client id specified in *aeap.conf* as the "engine" name. Example *extensions.conf*:
```
exten => 550,1,NoOp()
	same => n,Answer()
	same => n,SpeechCreate(my-speech-to-text)
	same => n,SpeechStart()
	same => n,SpeechBackground(hello-world)
	same => n,Verbose(0,${SPEECH_TEXT(0)})
	same => n,SpeechDestroy()
	same => n,Hangup()
```
If things are configured correctly, and the sample program found here is listening at the configured address/port then when a caller dials extension `550` the following should occur:
1. Asterisk connects via websocket to the remote application.
2. The caller hears "Hello World" played back.
3. After hearing "Hello World" any spoken audio from the caller is forwarded to the remote application.
4. Once the caller is done speaking their spoken text is printed on the Asterisk CLI.
5. The Client disconnects from remote application
6. The call is hung up.

## Other References
* [Text-to-Speech and Speech-to-Text in Asterisk](https://www.asterisk.org/text-to-speech-and-speech-to-text-in-asterisk/)
* [Asterisk External Application Protocol: An Intro](https://www.asterisk.org/asterisk-external-application-protocol-an-intro/)
* [Asterisk External Application Protocol: Speech to Text Engine](https://www.asterisk.org/asterisk-external-application-protocol-speech-to-text-engine/)
* [Asterisk External Application Protocol: The Framework](https://www.asterisk.org/asterisk-external-application-protocol-the-framework/)
