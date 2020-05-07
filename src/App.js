import React, { Component } from 'react';
import './App.css';
import { checkToken, getToken, login } from './auth';
import openSocket from 'socket.io-client';
import {
  faStepBackward,
  faStepForward,
  faPlay,
  faPause,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';

const SPOTIFY_CONNECT_SOCKET_URL =
  'https://spotify-connect-ws.herokuapp.com/connect';

class App extends Component {
  state = {
    authorised: checkToken(),
    eventLog: [],
  };
  componentDidMount() {
    if (checkToken()) {
      this.setupConnect();
    }
  }
  authorise = () => {
    login()
      .then(() => this.setState({ authorised: true }))
      .then(this.setupConnect);
  };
  setProgress = (progress, timestamp) => {
    const trackLength = this.state.activeTrack.duration_ms;
    this.setState({
      progress: progress,
      progressPercent: (progress / trackLength) * 100,
    });
  };
  setPlaybackState = (isPlaying) => {
    this.setState({
      isPlaying,
    });
  };
  setDevice = (device) => {
    this.setState({
      device,
    });
  };
  setVolume = (volume) => {
    this.setState({
      volume,
    });
  };
  setTrack = (activeTrack) => {
    this.setState({
      activeTrack,
    });
  };
  emit = (event, value) => {
    this.io.emit(event, value);

    // optimistic updates
    switch (event) {
      case 'play':
        this.setPlaybackState(true);
        break;
      case 'pause':
        this.setPlaybackState(false);
        break;
      default:
        break;
    }
  };
  onError = (error) => {
    this.setState({ error: error.message || error });
  };
  setupConnect = () => {
    const io = openSocket(SPOTIFY_CONNECT_SOCKET_URL);
    const wrappedHandler = (event, handler) => {
      io.on(event, (data) => {
        console.info(event, data);
        this.setState({
          eventLog: [...this.state.eventLog, { event, data }],
        });
        handler(data);
      });
    };
    io.emit('initiate', { accessToken: getToken() });
    wrappedHandler('initial_state', (state) => {
      this.setVolume(state.device.volume_percent);
      this.setDevice(state.device);
      this.setPlaybackState(state.is_playing);
      this.setTrack(state.item);
      this.setProgress(state.progress_ms);
      this.setState({ playerReady: true });
      this.progressTimer = window.setInterval(() => {
        if (this.state.isPlaying) {
          this.setProgress(this.state.progress + 1000);
        }
      }, 1000);
    });
    wrappedHandler('track_change', this.setTrack);
    wrappedHandler('seek', this.setProgress);
    wrappedHandler('playback_started', () => this.setPlaybackState(true));
    wrappedHandler('playback_paused', () => this.setPlaybackState(false));
    wrappedHandler('device_change', this.setDevice);
    wrappedHandler('volume_change', this.setVolume);
    wrappedHandler('track_end', () => {});
    wrappedHandler('connect_error', this.onError);

    this.io = io;
  };
  render() {
    const {
      eventLog,
      error,
      activeTrack,
      authorised,
      playerReady,
      isPlaying,
    } = this.state;
    return (
      <div className="App">
        <aside>
          {eventLog.length > 0 ? (
            <ul className="Log">
              {eventLog.map(({ event, data }, index) => (
                <li key={index}>{`${event}${
                  data && typeof data !== 'object' ? ': ' + data : ''
                }`}</li>
              ))}
            </ul>
          ) : (
            <p>[Events will be logged here]</p>
          )}
        </aside>
        <main>
          {authorised ? (
            playerReady ? (
              <div className="Container">
                <img
                  className="Artwork"
                  src={activeTrack.album.images[0].url}
                  alt={`${activeTrack.name} by ${activeTrack.artists[0].name}`}
                />
                <h4 className="Title">
                  {activeTrack.name} by {activeTrack.artists[0].name}
                </h4>
                <div className="Controls">
                  <Icon
                    onClick={() => this.emit('previous_track')}
                    icon={faStepBackward}
                  />
                  <Icon
                    onClick={() => this.emit(isPlaying ? 'pause' : 'play')}
                    size="lg"
                    icon={isPlaying ? faPause : faPlay}
                  />
                  <Icon
                    onClick={() => this.emit('next_track')}
                    icon={faStepForward}
                  />
                </div>
                <div className="ProgressBar">
                  <div
                    style={{ width: `${this.state.progressPercent}%` }}
                    className="Progress"
                  >
                    <span />
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="Container">{error}</div>
            ) : (
              <div className="Container">Loading...</div>
            )
          ) : (
            <div className="Container">
              <h2>Spotify Connect WebSockets demo</h2>
              <p>
                An example of how the{' '}
                <a href="https://github.com/lrholmes/spotify-connect-ws">
                  spotify-connect-ws
                </a>{' '}
                plugin can be used to create a working player with React.
              </p>
              <p>
                The sidebar on the left logs the socket event names as they come
                in. For a more detailed look at the data received open your
                browser's native JavaScript console.
              </p>
              <button onClick={this.authorise}>Login with Spotify</button>
            </div>
          )}
        </main>
      </div>
    );
  }
}

export default App;
