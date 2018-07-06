import React, { Component } from 'react';
import SimpleWebRTC from 'simplewebrtc';
import ReactDOM from 'react-dom';
import Chat from '../Chat/Chat'
import {Row, Col, CardPanel, Input, Button, Icon} from 'react-materialize'
class LocalCamera extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      roomId: '',
      messages: [],
      mute: false,
      showChat: false
    }
    //Video
    this.addVideo = this.addVideo.bind(this);
    this.removeVideo = this.removeVideo.bind(this);
    this.readyToCall = this.readyToCall.bind(this);
    //Chat room
    this.updateUserName = this.updateUserName.bind(this);
    this.updateRoomId = this.updateRoomId.bind(this);
    this.createRoom = this.createRoom.bind(this);
    this.joinRoom = this.joinRoom.bind(this);
    this.leaveRoom = this.leaveRoom.bind(this);
    //Volumn
    this.volumeChange = this.volumeChange.bind(this);
    this.remoteVolumeChange = this.remoteVolumeChange.bind(this);
    this.showVolume = this.showVolume.bind(this);
    this.muteToggle = this.muteToggle.bind(this);
    this.mute = this.mute.bind(this);
    this.unmute = this.unmute.bind(this);
    //Messages
    this.channelMessage = this.channelMessage.bind(this);
    this.postMessage = this.postMessage.bind(this);
    this.message = this.message.bind(this);
  }

  componentDidMount() {
    this.webrtc = new SimpleWebRTC({
      localVideoEl: ReactDOM.findDOMNode(this.refs.local),
      remoteVideosEl: "",
      autoRequestMedia: true,
      nick: this.state.username,
      autoRequestMedia: true,
      debug: false,
      detectSpeakingEvents: true,
      autoAdjustMic: false,
      url: "https://signalmaster-118.herokuapp.com/"
    });

    console.log("webrtc component mounted");
    this.webrtc.on('videoAdded', this.addVideo);
    this.webrtc.on('videoRemoved', this.removeVideo);
    this.webrtc.on('readyToCall', this.readyToCall);
    this.webrtc.on('volumeChange', this.volumeChange);
    this.webrtc.on('remoteVolumeChange', this.remoteVolumeChange);
    this.webrtc.on('mute', this.mute);
    this.webrtc.on('unmute', this.unmute);
    this.webrtc.on('channelMessage', this.channelMessage);
    this.webrtc.connection.on('message', this.message);
  }

  volumeChange(volume, treshold){
    //console.log('local volumn change');
    this.showVolume(document.getElementById('localVolume'), volume);
  }

  remoteVolumeChange(peer, volume){
    //console.log('remote volumn change');
    this.showVolume(document.getElementById('volume_' + peer.id), volume);
  }

  addVideo(video, peer) {
    console.log('video added', peer);
    const remotes = ReactDOM.findDOMNode(this.refs.remotes);
    if (remotes) {
      //construct remote camera video element
      const container = document.createElement('div');
      container.className = 'videoContainer';
      container.style.cssText = "width:30%; display: inline-block;margin-right: 12px;text-align: center";
      container.id = 'container_' + this.webrtc.getDomId(peer);
      const textnode = document.createElement("h6");
      //will replace by real username
      textnode.textContent = peer.nick;
      container.appendChild(textnode);
      container.appendChild(video);
      // add muted and paused elements
      const mutedIcon = document.createElement('i');
      mutedIcon.className = 'Small material-icons title green-text';
      mutedIcon.innerHTML = 'mic';
      container.appendChild(mutedIcon);
      // show the remote volume
      const vol = document.createElement('meter');
      vol.id = 'volume_' + peer.id;
      vol.className = 'volume';
      vol.min = -45;
      vol.max = -20;
      vol.low = -40;
      vol.high = -25;
      container.appendChild(vol);
      // suppress contextmenu
      video.oncontextmenu = function() {
        return false;
      };
      remotes.appendChild(container);
      setTimeout(() =>{
        this.webrtc.sendDirectlyToAll(this.state.roomId, "setDisplayName", this.state.username);
      }, 1000);
    }
  }

  removeVideo(video, peer) {
    console.log('video removed ', peer);
    const remotes = ReactDOM.findDOMNode(this.refs.remotes);
    const el = document.getElementById(peer ? 'container_' +       this.webrtc.getDomId(peer) : 'localScreenContainer');
    if (remotes && el) {
      remotes.removeChild(el);
    }
  }

  readyToCall() {
    //return this.webrtc.joinRoom('change-this-roomname');
  }

  updateUserName(event){
    this.setState({
      username: event.target.value
    });
  }

  updateRoomId(event){
    this.setState({
      roomId: event.target.value
    });
  }

  createRoom(){
    console.log('Creating new room: ' + this.state.roomId);
    this.webrtc.createRoom(this.state.roomId, (err, name) => {
      this.setState({
        showChat: true
      });
      this.postMessage(this.state.username + " created chatroom");
    });
  }

  joinRoom(){
    console.log('Joining room: ' + this.state.roomId);
    this.webrtc.joinRoom(this.state.roomId, (err, roomDescription) =>{
      if(!err && Object.keys(roomDescription.clients).length){
        this.setState({
          showChat: true
        });
        this.postMessage(this.state.username + " joined chatroom");
      }
    });
  }

  leaveRoom(){
    this.webrtc.leaveRoom();
    this.postMessage(this.state.username + " left chatroom");
    this.setState({
      username: '',
      roomId: '',
      messages: [],
      mute: false,
      showChat: false
    });
    console.log(this.state);
  }

  muteToggle(){
    console.log("mute: " + this.state.mute)
    if(!this.state.mute){
      this.webrtc.mute();
    } else {
      this.webrtc.unmute();
    }
    this.setState({
      mute: !this.state.mute
    });
  }

  // helper function to show the volume
  showVolume(el, volume) {
    if (!el) return;
    if (volume < -45) volume = -45;
    if (volume > -20) volume = -20;
    el.value = volume;
  }

  mute(data){
    this.webrtc.getPeers(data.id).forEach( (peer) => {
      if (data.name == 'audio') {
        $('#container_' + this.webrtc.getDomId(peer) + ' > i').html('mic_off');
        $('#container_' + this.webrtc.getDomId(peer) + ' > i').removeClass('green-text').addClass('red-text');
      }
    });
  }

  unmute(data){
    this.webrtc.getPeers(data.id).forEach( (peer) => {
      if (data.name == 'audio') {
        $('#container_' + this.webrtc.getDomId(peer) + ' > i').html('mic');
        $('#container_' + this.webrtc.getDomId(peer) + ' > i').removeClass('red-text').addClass('green-text');
      }
    });
  }

  channelMessage(peer, label, data){
    if (data.type == 'setDisplayName') {
      let name = data.payload;
      $('#container_' + this.webrtc.getDomId(peer) + ' > h6').html(name);
    }
  }

  postMessage(message){
    const username = this.state.username;
    const chatMessage = {
      username,
      message,
      postedOn: new Date().toLocaleString('en-GB'),
    }
    this.webrtc.sendToAll('chat', chatMessage);
    this.setState({
      messages: [...this.state.messages, chatMessage]
    });
  }

  message(data){
    if (data.type === 'chat') {
      const recievedMsg = data.payload;
      this.setState({
        messages: [...this.state.messages, recievedMsg]
      });
    }
  }

  render() {
    const isEnabled =
    this.state.username.length > 0 &&
    this.state.roomId.length > 0;
    return (
      <Row id="top">
        <Col s={12} m={9} >
          <CardPanel className="">
            {this.state.showChat ?
              <h5> <i class="material-icons title">group</i> Room : {this.state.roomId}  <i className="small material-icons title right red-text" onClick={this.leaveRoom}>call_end</i></h5>
              :
              <h5>Remote</h5>
            }
            < div className = "remotes" id = "remoteVideos" ref = "remotes" > < /div>
          </CardPanel>
        </Col>
        <Col s={12} m={3}>
          {this.state.showChat ?
            <Chat messages={this.state.messages} postMessage={this.postMessage}/>
            : <CardPanel className="">
              <Row>
                <Input s={6} label="User Name" onChange={this.updateUserName}/>
                <Input s={6} label="Room Id" onChange={this.updateRoomId}/>
              </Row>
              <Row>
                <Button waves='light' disabled={!isEnabled} onClick={this.createRoom}>Create Room</Button>
                <Button waves='light' disabled={!isEnabled} onClick={this.joinRoom}>Join Room</Button>
              </Row>
            </CardPanel>}
            <CardPanel className="videoContainer">
              <h5>You{this.state.username.length > 0 ? " : " + this.state.username : null}</h5>
              < video className = "local"
              id = "localVideo"
              ref = "local" > < /video>
              <i className={`Small material-icons title ${this.state.mute ? "red-text" : "green-text"}`} onClick={this.muteToggle}>{this.state.mute ? "mic_off" : "mic"}</i>
              <meter id="localVolume" className="volume" min="-45" max="-20" low="-40" high="-25"></meter>
            </CardPanel>
          </Col>
        </Row>
      );
    }
  }
  export default LocalCamera;
