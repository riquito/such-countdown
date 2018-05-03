/**
 * @class SuchCountdown
 */

import React, { Component } from 'react'
import PropTypes from 'prop-types'

export const STATUS_PLAY = 'play'
export const STATUS_STOP = 'stop'
export const STATUS_PAUSE = 'pause'

class SuchCountdown extends Component {
    constructor(props) {
        super()

        this.state = {
            status: props.status,
            width: 100,
            height: 100,
        }

        this.resetInternalCounters()
    }
    resetInternalCounters = () => {
      this.startedAt = 0
      this.updatedAt = 0
      this.animationTimestamp = null
      this.timeAlreadyPassedWhenPaused = 0
      this.timePassedInTheLatestIntervalBeforePausing = 0
    }
    shouldComponentUpdate = (nextProps, nextState) => {
        console.log('sCU?',(nextState.width !== this.state.width)
        || (nextState.height !== this.state.height)
        || (nextProps.className !== this.props.className)
        || (nextState.status !== this.state.status))

        return (nextState.width !== this.state.width)
          || (nextState.height !== this.state.height)
          || (nextProps.className !== this.props.className)
          || (nextState.status !== this.state.status)
    }
    static getDerivedStateFromProps(nextProps, prevState) {
      console.log("get derived state from props (old follows)",nextProps, prevState)
        const stateDiff = {
        }
        if (nextProps.status !== prevState.status) {
            stateDiff.status = nextProps.status
        }

        console.log('derived new state', stateDiff)
        return stateDiff
    }
    componentWillUnmount = (ev) => {
        window.removeEventListener('resize', this.onResize)
    }
    stop = ({reset} = {reset:true}) => {
        if (!this.animationTimestamp) {
          // i.e. we stopped while playing (we wouldn't enter here from pause)
          cancelAnimationFrame(this.animationTimestamp)
        }
        console.log('stop', this.animationTimestamp)

        this.resetInternalCounters()
        this.setState({
          status: STATUS_STOP,
        }, () => {
          if (reset) {
            this.drawReset()
          }

          setTimeout(this.props.onCountdownEnd, 0)
        })
    }
    pause = () => {
        if (this.animationTimestamp) {
            cancelAnimationFrame(this.animationTimestamp)
        }
        this.animationTimestamp = null
        //this.updatedAt = performance.now()
        this.timeAlreadyPassedWhenPaused = this.updatedAt - this.startedAt
        this.timePassedInTheLatestIntervalBeforePausing = performance.now() - this.updatedAt
    }
    start = () => {
      console.log('start')
        const now = performance.now()
        const timeAlreadySpentPlaying = this.updatedAt - this.startedAt
        this.startedAt = now - timeAlreadySpentPlaying - this.timePassedInTheLatestIntervalBeforePausing
        this.updatedAt = now - this.timePassedInTheLatestIntervalBeforePausing
        console.log('started at', this.startedAt, 'paused at', this.updatedAt, 'time in tick', this.timePassedInTheLatestIntervalBeforePausing)
        this.tick(now, this.timePassedInTheLatestIntervalBeforePausing === 0)
    }
    componentDidMount() {
        // XXX should use a throttled version, see
        // https://developer.mozilla.org/en-US/docs/Web/Events/resize
        window.addEventListener("resize", this.onResize);

        this.drawReset()
        if (this.props.status === STATUS_PLAY) {
          this.start()
        }
    }
    getDimensions = () => ({
        width: this.elem.clientWidth,
        height: this.elem.clientHeight,
    })
    drawReset() {
      const timeSinceLastUpdate = this.updatedAt - this.startedAt
      const remainingMillis = this.props.duration - timeSinceLastUpdate

      this.elem.drawReset({
        duration: this.props.duration,
        remainingMillis: this.props.duration - timeSinceLastUpdate,
        tickInterval: this.props.tickInterval,
        status: this.state.status,
      })
    }
    onResize = () => {
        this.setState(this.getDimensions())
    }
    tick = (timestamp, force) => {
        const now = performance.now()
        const {
          duration,
          tickInterval,
        } = this.props

        const timeAlreadySpentPlaying = now - this.startedAt
        const remainingMillis = duration - timeAlreadySpentPlaying

        if (now - this.updatedAt < tickInterval && remainingMillis > 0 && !force) {
           this.animationTimestamp = requestAnimationFrame(this.tick)
           return
        }

        const prevUpdatedAt = this.updatedAt
        this.updatedAt = now

        this.elem.draw({
          remainingMillis,
          duration,
          updatedAt: this.updatedAt,
          tickInterval,
          animationTimestamp: this.animationTimestamp,
          startedAt: this.startedAt,
          prevUpdatedAt,
          timeAlreadySpentPlaying,
          status: this.state.status,
        })

        if (this.updatedAt - this.startedAt < duration) {
            this.animationTimestamp = requestAnimationFrame(this.tick)
        } else {
            this.stop({reset: true})
        }
    }
    setElement = (elem) => {
        this.elem = elem
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevState.status !== STATUS_STOP && this.state.status === STATUS_STOP) {
            this.stop()
        } else if (this.animationTimestamp && this.state.status === STATUS_PAUSE) {
            this.pause()
        } else if (!this.animationTimestamp && this.state.status === STATUS_PLAY) {
            this.start()
        }

    }
    render() {
      const { className } = this.props

      return (
        <CircleCountdown
          className={className}
          ref={this.setElement}
          width={this.state.width}
          height={this.state.height}
          status={this.state.status}
        />
      )
    }
}

SuchCountdown.propTypes = {
  className: PropTypes.string,
  tickInterval: PropTypes.number,
  duration: PropTypes.number,
  onCountdownEnd: PropTypes.func,
  status: PropTypes.oneOf([STATUS_PAUSE, STATUS_PLAY, STATUS_STOP]),
}

SuchCountdown.defaultProps = {
    tickInterval: 1000,
    className: '',
    duration: 10000,
    onCountdownEnd: () => null,
    status: STATUS_PLAY,
}

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
      nextState.radius = nextSideLength / 2 * 0.9
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
      this.circleContext.scale(window.devicePixelRatio, window.devicePixelRatio)

      this.textCanvasContext = this.textCanvas.getContext('2d')
      this.textCanvasContext.textBaseline  = 'middle'
      this.textCanvasContext.textAlign = 'center'
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
    console.log('render CircleCountdown')
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
    c.fillStyle = '#000000'
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
    return `${Math.ceil(remainingMillis / 60000)} M`
  } else if (remainingMillis > 10000) {
    return `${Math.ceil(remainingMillis / 1000)} S`
  } else {
    return `${(remainingMillis / 1000).toFixed(tickInterval >= 1000 ? 0 : 2)} S`
  }
}

function drawCircleBackground(c, sideLength, radius, strokeColor) {
    const halfSide = sideLength / 2
    const PI = 245850922/78256779

    c.lineCap = 'round';

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
    c.lineCap = 'round';

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


export default SuchCountdown

