import React, { Component } from 'react'
import styled from 'styled-components'

import SuchCountdown, {
  STATUS_PAUSE,
  STATUS_PLAY,
  STATUS_STOP,
} from 'such-countdown'

const Square = styled.div`
    width: ${props => props.sideLength};
    height: ${props => props.sideLength};
`

const IntervalFieldBox = styled.div`
  .interval-value {
    font-weight: bold;
    vertical-align: middle;
  }
  .interval-label {
    vertical-align: middle;
    margin-right: 0.5em;
  }
  .interval-input {
    vertical-align: middle;
    margin-right: 0.5em;
  }
`
const ButtonsBox = styled.div`
  button {
    margin-right: 0.5em;
  }
`

const MainContainer = styled.div`
  padding: 0.5em;
`

const DurationBox = styled.div`
  .duration-label {
    vertical-align: middle;
    margin-right: 0.5em;
  }
  .duration-input {
    vertical-align: middle;
    width: 5em;
    text-align: right;
  }
`


class Example extends Component {
  constructor(props) {
      super()
      this.state = {
          status: STATUS_STOP,
          tickInterval: 100,
          duration: 15000,
      }
  }
  onPauseClick = (ev) => {
      ev.preventDefault()
      this.setState({
          status: STATUS_PAUSE,
      })
  }
  onStartClick = (ev) => {
      ev.preventDefault()
      this.setState({
          status: STATUS_PLAY,
      })
  }
  onStopClick = (ev) => {
      ev.preventDefault()
      this.setState({
          status: STATUS_STOP,
      })
  }
  onCountdownEnd = () => {
    this.setState({
        status: STATUS_STOP,
    })
  }
  onTickIntervalChange = (ev) => {
      this.setState({
          tickInterval: parseInt(ev.currentTarget.value || "1", 10),
      })
  }
  onDurationChange = (ev) => {
    let duration = parseInt(ev.currentTarget.value, 10)
    if (isNaN(duration)) {
      return
    }
    this.setState({
        duration: duration * 1000,
    })
  }
  render() {
      return (
          <div>
              <ButtonsBox>
                <button
                  className="btn-stop"
                  onClick={this.onStopClick}
                  disabled={this.state.status === STATUS_STOP}
                >
                  stop ◼
                </button>
                <button
                  className="btn-pause"
                  onClick={this.onPauseClick}
                  disabled={this.state.status === STATUS_PAUSE || this.state.status === STATUS_STOP}
                >
                  pause ▮▮
                </button>
                <button
                  className="btn-play"
                  onClick={this.onStartClick}
                  disabled={this.state.status === STATUS_PLAY}
                >
                  play ▶
                </button>
              </ButtonsBox>
              <IntervalFieldBox>
                <label className="interval-label">Update interval</label>
                <input
                  className="interval-input"
                  type="range"
                  min="0"
                  max="1000"
                  step="100"
                  defaultValue={this.state.tickInterval}
                  onChange={this.onTickIntervalChange}
                />
                <span className="interval-value">{this.state.tickInterval || 1} ms</span>
              </IntervalFieldBox>
              <DurationBox>
              <label className="duration-label">Timer duration</label>
              <input className="duration-input" type="number" onChange={this.onDurationChange} value={this.state.duration / 1000} />
              </DurationBox>
              <Square sideLength="50px">
                  <SuchCountdown
                    tickInterval={this.state.tickInterval}
                    startDegree={0}
                    duration={this.state.duration}
                    status={this.state.status}
                    onCountdownEnd={this.onCountdownEnd}
                  />
              </Square>
          </div>
      )
  }
}

export default class App extends Component {
  render () {
    return (
      <MainContainer>
        <Example />
      </MainContainer>
    )
  }
}
