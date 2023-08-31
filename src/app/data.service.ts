import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

export interface Message {
    type: string;
    data: any;
}

@Injectable({
    providedIn: 'root'
})

export class DataService {
    socket$!: WebSocketSubject<any>;
    private messagesSubject = new Subject<any>();
    public messages$ = this.messagesSubject.asObservable();
    
    public connect(): void {

        if (!this.socket$ || this.socket$.closed) {
            this.socket$ = this.getNewWebSocket();

            this.socket$.subscribe(
                // Called whenever there is a message from the server
                (msg: any) => {
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
                    //this.socket$ = null;
                    this.connect();
                }
            }
        });
    }
    sendMessage(msg: any): void {
        console.log('sending message: ' + msg);
        this.socket$.next(msg);
    }
}