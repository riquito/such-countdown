import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
  STATUS_PLAY,
} from './constants'

class CircleCountdown extends Component {
  constructor(props) {
      super()
      this.resetInternalCounters()
      this.state = {}
  }
  resetInternalCounters = () => {
    this.textUpdatedAt = 0
  }
  static getDerivedStateFromProps(nextProps, prevState) {
    const nextState = {}
    const nextSideLength = Math.min(nextProps.width, nextProps.height)

    if (nextSideLength !== prevState.sideLength) {
      nextState.sideLength = nextSideLength
      nextState.radius = nextSideLength / 2 * 0.9 // XXX is 0.9 necessary?
    }

    nextState.fontSize = nextProps.getFontSize(nextSideLength)

    return nextState
  }
  shouldComponentUpdate = (nextProps, nextState) => {
      return (nextProps.width !== this.props.width)
        || (nextProps.height !== this.props.height)
        || (nextProps.className !== this.props.className)
  }
  setCircleCanvas = (elem) => {
    this.circleCanvas = elem
  }
  setTextCanvas = (elem) => {
    this.textCanvas = elem
  }
  componentDidMount() {
    this.circleContext = this.circleCanvas.getContext('2d')
    this.circleContext.lineCap = 'round';
    this.circleContext.scale(window.devicePixelRatio, window.devicePixelRatio)

    this.textCanvasContext = this.textCanvas.getContext('2d')
    this.textCanvasContext.textBaseline  = 'middle'
    this.textCanvasContext.textAlign = 'center'
    this.textCanvasContext.fillStyle = '#000000'
    this.textCanvasContext.scale(window.devicePixelRatio, window.devicePixelRatio)
  }
  draw({
    remainingMillis,
    duration,
    updatedAt,
    tickInterval,
    animationTimestamp,
    startedAt,
    prevUpdatedAt,
    timeAlreadySpentPlaying,
    status,
  }) {
    const timePassedAspercent = 100 - (remainingMillis * 100 / duration)
    const startDegree = this.props.startDegree + 270
    const endDegree = startDegree + timePassedAspercent * 360 / 100
    let text = null

    if (shouldUpdateText(
      remainingMillis,
      duration,
      tickInterval,
      this.updatedAt - this.textUpdatedAt
    )) {
      text = getTimeText(Math.max(0, remainingMillis), duration, tickInterval)
    }

    this.drawFrame(startDegree, endDegree, text, status)
  }
  drawReset({
    remainingMillis,
    duration,
    tickInterval,
    status,
  }) {
    const timePassedAspercent = 100 - (remainingMillis * 100 / duration)
    const startDegree = this.props.startDegree + 270
    const endDegree = startDegree + timePassedAspercent * 360 / 100
    const text = getTimeText(Math.max(0, remainingMillis), duration, tickInterval)

    this.drawFrame(startDegree, endDegree, text, status)
  }
  drawFrame(
    startDegree,
    endDegree,
    text,
    status,
  ) {
    drawCircleBackground(
      this.circleContext,
      this.state.sideLength,
      this.state.radius,
      status === STATUS_PLAY
      ? 'purple'
      : '#b1b1b1'
    )

    Math.abs(startDegree - endDegree) > 1 && drawProgressiveCircle(
      this.circleContext,
      this.state.sideLength,
      this.state.radius,
      startDegree,
      endDegree,
    )

    text !== null && drawTextInCircle(
      this.textCanvasContext,
      this.state.sideLength,
      text,
      `${this.state.fontSize} ${this.props.fontName}`
    )
  }
  render() {
    return (
      <div
        className={this.props.className}
        style={{
          width: `${this.state.sideLength}px`,
          height: `${this.state.sideLength}px`,
          position: 'relative',
        }}
      >
        <canvas
          width={this.state.sideLength * window.devicePixelRatio}
          height={this.state.sideLength * window.devicePixelRatio}
          style={{
            width: `${this.state.sideLength}px`,
            height: `${this.state.sideLength}px`,
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 0,
          }}
          ref={this.setCircleCanvas}
        />
        <canvas
          width={this.state.sideLength * window.devicePixelRatio}
          height={this.state.sideLength * window.devicePixelRatio}
          style={{
            width: `${this.state.sideLength}px`,
            height: `${this.state.sideLength}px`,
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
          }}
          ref={this.setTextCanvas}
        />
      </div>
    )
  }
}

CircleCountdown.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    className: PropTypes.string,
    startDegree: PropTypes.number,
    getTimeText: PropTypes.func,
    getFontSize: PropTypes.func,
}

CircleCountdown.defaultProps = {
    className: '',
    width: 200,
    height: 200,
    startDegree: 0,
    getTimeText: getTimeText,
    getFontSize: sideLength => `${(sideLength / 5).toFixed(2)}px`,
    fontName: 'sans-serif',
}

function shouldUpdateText(remainingMillis, duration, tickInterval, timeSinceLastUpdate) {
const oneMinute = 60000
const timePassed = duration - remainingMillis
const nMinutesPassed = Math.floor(timePassed / oneMinute)
const nMinutesPassedAtLastUpdate = Math.floor((timePassed - timeSinceLastUpdate) / oneMinute)

// Update once every minute, or once every tickInterval in the last minute
return nMinutesPassed !== nMinutesPassedAtLastUpdate
    || (remainingMillis < oneMinute && timeSinceLastUpdate >= tickInterval)
}

function drawTextInCircle(c, sideLength, text, font) {
    const halfSide = sideLength / 2
    const unit = sideLength / 12

    //c.clearRect( unit * 2, unit * 2, unit*2, unit*2);
    c.clearRect( unit * 2, unit * 3, unit*8, unit*6);
    c.font = font;
    c.fillText(text, halfSide, halfSide);
}

/**
 * Return the remaining time, in minutes if more than 1 minute is remaining,
 * otherwise in seconds.
 * During the last ten seconds display decimals too
 * @param {number} remainingMillis
 * @param {number} duration
 * @param {number} tickInterval
 */
function getTimeText(remainingMillis, duration, tickInterval) {
if (remainingMillis / 60000 > 1) {
    return `${Math.round(remainingMillis / 60000)} M`
} else if (remainingMillis > 10000) {
    return `${Math.round(remainingMillis / 1000)} S`
} else {
    return `${(remainingMillis / 1000).toFixed(tickInterval >= 1000 ? 0 : 2)} S`
}
}

function drawCircleBackground(c, sideLength, radius, strokeColor) {
    const halfSide = sideLength / 2
    const PI = 245850922/78256779

    c.beginPath();
    c.arc(halfSide, halfSide, radius, 0, 2 * PI);
    c.strokeStyle = strokeColor;
    c.lineWidth = radius / 10;
    c.stroke();
}

function drawProgressiveCircle(c, sideLength, radius, startDegree, endDegree) {
    const halfSide = sideLength / 2
    const PI = 245850922/78256779
    const startRadians = startDegree * PI / 180
    const endRadians = endDegree * PI / 180

    c.beginPath();
    c.lineWidth = radius / 10;

    let color, nextColor, opacity
    const percent = Math.abs(endDegree - startDegree) / 360
    if (percent < 0.3) {
    color = '#38C172'
    nextColor = '#38C172'
    opacity = percent / 0.3
    } else if (percent < 0.7) {
    color = '#38C172'
    nextColor = '#FFED4A'
    opacity = (percent - 0.3) / (0.7 - 0.3)
    } else   {
    color = '#FFED4A'
    nextColor = '#E3342F'
    opacity = (percent - 0.7) / (1 - 0.7)
    }

    c.globalAlpha = 1 - opacity;
    c.strokeStyle = color;
    c.arc(halfSide, halfSide, radius, startRadians, endRadians);
    c.stroke();

    c.beginPath();
    c.globalAlpha = opacity;
    c.strokeStyle = nextColor;
    c.arc(halfSide, halfSide, radius, startRadians, endRadians);
    c.stroke();
    c.globalAlpha = 1
}

export default CircleCountdown