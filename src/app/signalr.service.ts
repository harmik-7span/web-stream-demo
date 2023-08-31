import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';

export interface Message {
    type: string;
    data: any;
  }

@Injectable({
    providedIn: 'root'
})


  
export class SignalrService {
    hubUrl: string;
    connection: any;
    dataTransfer: BehaviorSubject<any>;
    socket$!: WebSocketSubject<any>;

  private messagesSubject = new Subject<any>();
  public messages$ = this.messagesSubject.asObservable();
    constructor() {
        this.hubUrl = 'https://webrtc.panchal.one/WebRTCHub';
        this.dataTransfer = new BehaviorSubject<any>({});
       
    }

    public async initiateSignalrConnection(): Promise<void> {
        try {
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(this.hubUrl)
                .withAutomaticReconnect()
                .build();

            await this.connection.start({ withCredentials: false });
            this.setSignalrClientMethods();
            console.log(`SignalR connection success! connectionId: ${this.connection.connectionId}`);
        }
        catch (error) {
            console.log(`SignalR connection error: ${error}`);
        }
    }
    private setSignalrClientMethods(): void {

        this.connection.on('updateRoom', (data: any) => {
            // var obj = JSON.parse(data);
            // $(roomTable).DataTable().clear().rows.add(obj).draw();
            this.dataTransfer.next({
                type: "updateRoom",
                data: data
            });
        });

        this.connection.on('created', (roomId: string) => {
            console.log('Created room', roomId);
            // roomNameTxt.disabled = true;
            // createRoomBtn.disabled = true;
            // hasRoomJoined = true;
            // connectionStatusMessage.innerText = 'You created Room ' + roomId + '. Waiting for participants...';
            // myRoomId = roomId;
            // isInitiator = true;
            this.dataTransfer.next({
                type: "created",
                data: roomId
            });
        });

        this.connection.on('joined', (roomId: string) => {
            console.log('This peer has joined room', roomId);
            this.dataTransfer.next({
                type: "joined",
                data: roomId
            });
            // myRoomId = roomId;
            // isInitiator = false;
        });

        this.connection.on('error', (message: string) => {
            //alert(message);
            this.dataTransfer.next({
                type: "error",
                data: message
            });
        });

        this.connection.on('ready', () => {
            this.dataTransfer.next({
                type: "ready",
                data: {}
            });
            // console.log('Socket is ready');
            // roomNameTxt.disabled = true;
            // createRoomBtn.disabled = true;
            // hasRoomJoined = true;
            // connectionStatusMessage.innerText = 'Connecting...';
            // createPeerConnection(isInitiator, configuration);
        });

        this.connection.on('message', (message: string) => {
            console.log('Client received message:', message);
            this.dataTransfer.next({
                type: "message",
                data: message
            });
            //signalingMessageCallback(message);
        });

        this.connection.on('bye', () => {
            console.log(`Peer leaving room.`);
            this.dataTransfer.next({
                type: "bye",
                data: {}
            });
            // If peer did not create the room, re-enter to be creator.
            //connectionStatusMessage.innerText = `Other peer left room ${myRoomId}.`;
        });

        // window.addEventListener('unload', () => {
        //     // if (hasRoomJoined) {
        //     //     console.log(`Unloading window. Notifying peers in ${myRoomId}.`);
        //     //     this.connection.invoke("LeaveRoom", myRoomId).catch(function (err) {
        //     //         return console.error(err.toString());
        //     //     });
        //     // }
        // });


    }
    public connect(): void {

        if (!this.socket$ || this.socket$.closed) {
          this.socket$ = this.getNewWebSocket();
    
          this.socket$.subscribe(
            // Called whenever there is a message from the server
            (msg:any) => {
              console.log('Received message of type: ' + msg);
              this.messagesSubject.next(msg);
            }
          );
        }
      }
      private getNewWebSocket(): WebSocketSubject<any> {
        return webSocket({
          url: 'ws://localhost:8081',
          openObserver: {
            next: () => {
              console.log('[DataService]: connection ok');
            }
          },
          closeObserver: {
            next: () => {
              console.log('[DataService]: connection closed');
              //this.socket$ = undefined;
              this.connect();
            }
          }
        });
      }
    sendMessage(msg: any): void {
        console.log('sending message: ' + msg);
        this.socket$.next(msg);
      }
    public leaveRoom(myRoomId: string): Promise<any> {
        return this.connection.invoke("LeaveRoom", myRoomId);
        // .catch(function (err) {
        //     return console.error(err.toString());
        // });
    }

    public createRoom(name: string): Promise<any> {
        return this.connection.invoke("CreateRoom", name);
    }

    public joinRoom(name: string): Promise<any> {
        return this.connection.invoke("Join", name);
    }

    public roomInfo(name: string): Promise<any> {
        return this.connection.invoke("GetRoomInfo", name);
    }
}