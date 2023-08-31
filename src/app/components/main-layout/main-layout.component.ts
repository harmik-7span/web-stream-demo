import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DataService } from 'src/app/data.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, AfterViewInit {
  @ViewChild('local_video') localVideo!: ElementRef;
  @ViewChild('received_video') remoteVideo!: ElementRef;
  peerConn: any;
  localStream!: MediaStream
  inCall: boolean = false;
  offerOptions = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  };
  configuration = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }]
  };

  constructor(
    public dataService: DataService
  ) {
   
  }


  ngOnInit(): void {

    //this.peerConn = new RTCPeerConnection(this.configuration);
    // this.signalrService.dataTransfer.subscribe((result: any) => {
    //   console.log(result);
    //   if (result.type == 'ready') {
    //     this.createPeerConnection(this.isInitiator, configuration);
    //   } else if (result.type == 'created') {
    //     this.isInitiator = true;
    //   } else if (result.type == 'joined') {
    //     this.isInitiator = false;
    //   }
    //   else {

    //   }
    // });


    // window.addEventListener('unload', () => {
    //   if (this.hasRoomJoined) {
    //     this.signalrService.leaveRoom(this.myRoomId).catch((err: any) => {
    //       console.error(err.toString());
    //     });
    //     //console.log(`Unloading window. Notifying peers in ${myRoomId}.`);
    //     // connection.invoke("LeaveRoom", myRoomId).catch(function (err) {
    //     //   return console.error(err.toString());
    //     // });
    //   }
    // });

  }

  ngAfterViewInit(): void {
    this.startLocalVideo()
    this.dataService.connect();
    this.dataService.messages$.subscribe(
      (msg: any) => {
        console.log('Received message: ' + msg.type);
        switch (msg.type) {
          case 'offer':
            this.handleOfferMessage(msg.data);
            break;
          case 'answer':
            this.handleAnswerMessage(msg.data);
            break;
          case 'hangup':
            this.handleHangupMessage(msg);
            break;
          case 'ice-candidate':
            this.handleICECandidateMessage(msg.data);
            break;
          default:
            console.log('unknown message of type ' + msg.type);
        }
      },
      error => console.log(error)
    );
  }

  private handleOfferMessage(msg: RTCSessionDescriptionInit): void {
    console.log('handle incoming offer');
    if (!this.peerConn) {
      this.createPeerConnection();
    }

    if (!this.localStream) {
      this.startLocalVideo();
    }

    this.peerConn.setRemoteDescription(new RTCSessionDescription(msg))
      .then(() => {

        // add media stream to local video
        this.localVideo.nativeElement.srcObject = this.localStream;

        // add media tracks to remote connection
        this.localStream.getTracks().forEach(
          track => this.peerConn.addTrack(track, this.localStream)
        );

      }).then(() => {

        // Build SDP for answer message
        return this.peerConn.createAnswer();

      }).then((answer: any) => {

        // Set local SDP
        return this.peerConn.setLocalDescription(answer);

      }).then(() => {

        // Send local SDP to remote party
        this.dataService.sendMessage(JSON.stringify({ type: 'answer', data: this.peerConn.localDescription }));

        this.inCall = true;

      }).catch(this.handleGetUserMediaError);
  }

  private handleAnswerMessage(msg: RTCSessionDescriptionInit): void {
    console.log('handle incoming answer');
    this.peerConn.setRemoteDescription(msg);
  }

  private handleHangupMessage(msg: any): void {
    console.log(msg);
    this.closeVideoCall();
  }

  private handleICECandidateMessage(msg: RTCIceCandidate): void {
    const candidate = new RTCIceCandidate(msg);
    this.peerConn.addIceCandidate(candidate).catch(this.reportError);
  }

  private reportError = (e: Error) => {
    console.log('got Error: ' + e.name);
    console.log(e);
  }

  startLocalVideo() {
    console.log('starting local stream');
    this.grabWebCamVideo()
  }
  grabWebCamVideo() {
    console.log('Getting user media (video) ...');
    navigator.mediaDevices.getUserMedia({ video: true, audio: { echoCancellation: true } }).then(stream => {
      this.gotStream(stream);
    });
  }

  gotStream(stream: any) {
    console.log('getUserMedia video stream URL:', stream);
    this.localStream = stream;
    this.localStream.getAudioTracks().forEach(function (track) {
      track.enabled = false;
    });
    this.localVideo.nativeElement.srcObject = this.localStream;
  }

  async startPeer() {
    this.createPeerConnection();

    // Add the tracks from the local stream to the RTCPeerConnection
    this.localStream.getTracks().forEach(
      track => this.peerConn.addTrack(track, this.localStream)
    );

    try {
      const offer: RTCSessionDescriptionInit = await this.peerConn.createOffer(this.offerOptions);
      // Establish the offer as the local peer's current description.
      await this.peerConn.setLocalDescription(offer);
      this.inCall = true;
      console.log('offer', offer);
      this.dataService.sendMessage(JSON.stringify({ type: 'offer', data: offer }));
    } catch (err: any) {
      this.handleGetUserMediaError(err);
    }
  }

  private handleGetUserMediaError(e: Error): void {
    switch (e.name) {
      case 'NotFoundError':
        alert('Unable to open your call because no camera and/or microphone were found.');
        break;
      case 'SecurityError':
      case 'PermissionDeniedError':
        // Do nothing; this is the same as the user canceling the call.
        break;
      default:
        console.log(e);
        alert('Error opening your camera and/or microphone: ' + e.message);
        break;
    }

    this.closeVideoCall();
  }

  createPeerConnection() {
    console.log('creating PeerConnection...');
    this.peerConn = new RTCPeerConnection(this.configuration);

    this.peerConn.onicecandidate = this.handleICECandidateEvent;
    this.peerConn.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
    this.peerConn.onsignalingstatechange = this.handleSignalingStateChangeEvent;
    this.peerConn.ontrack = this.handleTrackEvent;

  }

  private handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    console.log(event);
    if (event.candidate) {
      this.dataService.sendMessage(JSON.stringify({
        type: 'ice-candidate',
        data: event.candidate
      }));
    }
  }

  private handleICEConnectionStateChangeEvent = (event: Event) => {
    console.log(event);
    switch (this.peerConn.iceConnectionState) {
      case 'closed':
      case 'failed':
      case 'disconnected':
        this.closeVideoCall();
        break;
    }
  }

  private handleSignalingStateChangeEvent = (event: Event) => {
    console.log(event);
    switch (this.peerConn.signalingState) {
      case 'closed':
        this.closeVideoCall();
        break;
    }
  }

  private handleTrackEvent = (event: RTCTrackEvent) => {
    console.log('remote', event);
    
    this.remoteVideo.nativeElement.srcObject = event.streams[0];
  }

  private closeVideoCall(): void {
    console.log('Closing call');

    if (this.peerConn) {
      console.log('--> Closing the peer connection');

      this.peerConn.ontrack = null;
      this.peerConn.onicecandidate = null;
      this.peerConn.oniceconnectionstatechange = null;
      this.peerConn.onsignalingstatechange = null;

      // Stop all transceivers on the connection
      this.peerConn.getTransceivers().forEach((transceiver: any) => {
        transceiver.stop();
      });

      // Close the peer connection
      this.peerConn.close();
      this.peerConn = null;
      this.inCall = false;
    }
  }

  hangUp(): void {
    this.dataService.sendMessage(JSON.stringify({ type: 'hangup', data: '' }));
    this.closeVideoCall();
  }
}

