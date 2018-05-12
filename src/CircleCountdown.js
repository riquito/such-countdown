import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { STATUS_PLAY, STATUS_STOP, STATUS_PAUSE } from './constants';

class CircleCountdown extends Component {
  constructor(props) {
    super();
    this.resetInternalCounters();
    this.state = {};
  }
  resetInternalCounters = () => {
    this.textUpdatedAt = 0;
  };
  static getDerivedStateFromProps(nextProps, prevState) {
    const nextState = {};
    const nextSideLength = Math.min(nextProps.width, nextProps.height);

    if (nextSideLength !== prevState.sideLength) {
      nextState.sideLength = nextSideLength;
      nextState.radius = nextSideLength / 2 * 0.9; // XXX is 0.9 necessary?
    }

    nextState.fontSize = nextProps.getFontSize(nextSideLength);

    if (nextProps.colorLineForeground !== prevState.colorLineForeground) {
      nextState.colorLineForeground = nextProps.colorLineForeground;
    }

    return nextState;
  }
  shouldComponentUpdate = (nextProps, nextState) => {
    return (
      nextProps.width !== this.props.width ||
      nextProps.height !== this.props.height ||
      nextProps.className !== this.props.className ||
      nextProps.status !== this.props.status
    );
  };
  setCircleCanvas = elem => {
    this.circleCanvas = elem;
  };
  setTextCanvas = elem => {
    this.textCanvas = elem;
  };
  componentDidMount() {
    this.circleContext = this.circleCanvas.getContext('2d');
    this.circleContext.lineCap = 'round';
    this.circleContext.scale(window.devicePixelRatio, window.devicePixelRatio);

    this.textCanvasContext = this.textCanvas.getContext('2d');
    this.textCanvasContext.textBaseline = 'middle';
    this.textCanvasContext.textAlign = 'center';
    this.textCanvasContext.fillStyle = '#000000';
    this.textCanvasContext.scale(
      window.devicePixelRatio,
      window.devicePixelRatio
    );

    this.colors = [...this.state.colorLineForeground];
  }
  componentDidUpdate(prevProps, prevState) {
    this.colors = [...this.state.colorLineForeground];
  }
  getColors(timePassedAspercent) {
    timePassedAspercent = timePassedAspercent / 100;

    while (
      timePassedAspercent > this.colors[0][1] &&
      timePassedAspercent <= 1
    ) {
      this.colors = this.colors.slice(1);
    }

    const colors = this.colors;
    const nextColorAlpha =
      (timePassedAspercent - colors[0][0]) / (colors[0][1] - colors[0][0]);
    return colors[0][2] === colors[0][3]
      ? [[colors[0][2], 1]]
      : [[colors[0][2], 1 - nextColorAlpha], [colors[0][3], nextColorAlpha]];
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
    status
  }) {
    const timePassedAspercent = 100 - remainingMillis * 100 / duration;
    const startDegree = this.props.startDegree + 270;
    const endDegree = startDegree + timePassedAspercent * 360 / 100;
    let text = null;

    if (
      shouldUpdateText(
        remainingMillis,
        duration,
        tickInterval,
        this.updatedAt - this.textUpdatedAt
      )
    ) {
      text = getTimeText(Math.max(0, remainingMillis), duration, tickInterval);
    }

    this.drawFrame(startDegree, endDegree, text, status, timePassedAspercent);
  }
  drawReset({ remainingMillis, duration, tickInterval, status }) {
    const timePassedAspercent = 100 - remainingMillis * 100 / duration;
    const startDegree = this.props.startDegree + 270;
    const endDegree = startDegree + timePassedAspercent * 360 / 100;
    const text = getTimeText(
      Math.max(0, remainingMillis),
      duration,
      tickInterval
    );

    this.drawFrame(startDegree, endDegree, text, status, timePassedAspercent);
  }
  drawFrame(startDegree, endDegree, text, status, timePassedAspercent) {
    gradientLineForeground;

    const circleContext = this.circleContext;
    const halfSide = this.state.sideLength / 2;
    const radius = this.state.radius;
    const PI = 245850922 / 78256779;

    circleContext.beginPath();
    circleContext.arc(halfSide, halfSide, radius, 0, 2 * PI);
    circleContext.strokeStyle =
      status === STATUS_PLAY
        ? this.props.colorLineBackgroundActive
        : this.props.colorLineBackgroundInactive;
    circleContext.lineWidth = radius / 10;
    circleContext.stroke();

    if (timePassedAspercent > 1) {
      for (let value of this.getColors(timePassedAspercent)) {
        const color = value[0],
          alpha = value[1];
        const startRadians = startDegree * PI / 180;
        const endRadians = endDegree * PI / 180;

        circleContext.beginPath();
        circleContext.lineWidth = radius / 10;
        circleContext.globalAlpha = alpha;
        circleContext.strokeStyle = color;
        circleContext.arc(halfSide, halfSide, radius, startRadians, endRadians);
        circleContext.stroke();
        circleContext.globalAlpha = 1;
      }
    }

    text !== null &&
      drawTextInCircle(
        this.textCanvasContext,
        this.state.sideLength,
        text,
        `${this.state.fontSize} ${this.props.fontName}`
      );
  }
  render() {
    return (
      <div
        ref={this.props.innerRef}
        className={this.props.className}
        style={{
          width: `${this.state.sideLength}px`,
          height: `${this.state.sideLength}px`,
          position: 'relative'
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
            zIndex: 0
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
            zIndex: 1
          }}
          ref={this.setTextCanvas}
        />
      </div>
    );
  }
}

const ColorRowShape = function(
  propValue,
  key,
  componentName,
  location,
  propFullName
) {
  const colorRow = propValue[key];
  if (
    colorRow.length !== 4 ||
    typeof colorRow[0] !== 'number' ||
    typeof colorRow[1] !== 'number' ||
    typeof colorRow[2] !== 'string' ||
    typeof colorRow[3] !== 'string' ||
    isNaN(colorRow[0]) ||
    isNaN(colorRow[1])
  ) {
    const wrongFormat =
      colorRow.length !== 4
        ? `array of lenth ${colorRow.length}`
        : `[${[
            isNaN(colorRow[0]) ? 'NaN' : typeof colorRow[0],
            isNaN(colorRow[1]) ? 'NaN' : typeof colorRow[1],
            typeof colorRow[2],
            typeof colorRow[3]
          ].join(', ')}]`;
    throw Error(
      `A color row should be of shape [number, number, string, string] (got ${wrongFormat} instead)`
    );
  }
};

CircleCountdown.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  className: PropTypes.string,
  startDegree: PropTypes.number,
  getTimeText: PropTypes.func,
  getFontSize: PropTypes.func,
  innerRef: PropTypes.func,
  colorLineBackgroundInactive: PropTypes.string,
  colorLineBackgroundActive: PropTypes.string,
  colorLineForeground: PropTypes.arrayOf(ColorRowShape),
  status: PropTypes.oneOf([STATUS_PAUSE, STATUS_PLAY, STATUS_STOP]).isRequired
};

CircleCountdown.defaultProps = {
  className: '',
  width: 200,
  height: 200,
  startDegree: 0,
  getTimeText: getTimeText,
  getFontSize: sideLength => `${(sideLength / 5).toFixed(2)}px`,
  fontName: 'sans-serif',
  colorLineBackgroundInactive: 'black',
  colorLineBackgroundActive: 'gray',
  colorLineForeground: [
    [0, 0.25, 'blue', 'blue'],
    [0.25, 0.5, 'blue', 'green'],
    [0.5, 0.75, 'green', 'yellow'],
    [0.75, 1, 'yellow', 'red']
  ]
};

function shouldUpdateText(
  remainingMillis,
  duration,
  tickInterval,
  timeSinceLastUpdate
) {
  const oneMinute = 60000;
  const timePassed = duration - remainingMillis;
  const nMinutesPassed = Math.floor(timePassed / oneMinute);
  const nMinutesPassedAtLastUpdate = Math.floor(
    (timePassed - timeSinceLastUpdate) / oneMinute
  );

  // Update once every minute, or once every tickInterval in the last minute
  return (
    nMinutesPassed !== nMinutesPassedAtLastUpdate ||
    (remainingMillis < oneMinute && timeSinceLastUpdate >= tickInterval)
  );
}

function drawTextInCircle(c, sideLength, text, font) {
  const halfSide = sideLength / 2;
  const unit = sideLength / 12;

  //c.clearRect( unit * 2, unit * 2, unit*2, unit*2);
  c.clearRect(unit * 2, unit * 3, unit * 8, unit * 6);
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
    return `${Math.round(remainingMillis / 60000)} M`;
  } else if (remainingMillis > 10000) {
    return `${Math.round(remainingMillis / 1000)} S`;
  } else {
    return `${(remainingMillis / 1000).toFixed(
      tickInterval >= 1000 ? 0 : 2
    )} S`;
  }
}

export default CircleCountdown;
