import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { STATUS_PLAY, STATUS_STOP, STATUS_PAUSE } from './constants';

const PI = Math.PI; // cache pi

class CircleCountdown extends Component {
  constructor(props) {
    super();
    this.resetInternalCounters();
    this.state = {
      sideLength: null,
      radius: null,
      fontSize: null
    };
  }
  resetInternalCounters = () => {
    this.textUpdatedAt = 0;
  };
  static getDerivedStateFromProps(nextProps, prevState) {
    const nextState = {};
    const nextSideLength = Math.min(nextProps.width, nextProps.height);

    if (nextSideLength !== prevState.sideLength) {
      nextState.sideLength = nextSideLength;
      nextState.radius = nextSideLength / 2 * 0.9;
    }

    nextState.fontSize = nextProps.getFontSize(nextSideLength);

    return nextState;
  }
  shouldComponentUpdate = (nextProps, nextState) => {
    return (
      nextProps.width !== this.props.width ||
      nextProps.height !== this.props.height ||
      nextProps.className !== this.props.className ||
      nextProps.status !== this.props.status ||
      nextProps.colorLineForeground !== this.props.colorLineForeground
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
    this.circleContext.lineCap = 'butt';
    this.circleContext.scale(window.devicePixelRatio, window.devicePixelRatio);

    this.textCanvasContext = this.textCanvas.getContext('2d');
    this.textCanvasContext.textBaseline = 'middle';
    this.textCanvasContext.textAlign = 'center';
    this.textCanvasContext.fillStyle = '#000000';
    this.textCanvasContext.scale(
      window.devicePixelRatio,
      window.devicePixelRatio
    );

    const colorsConf = this.getColors();
    for (let i = 0, il = colorsConf.length; i < il; i++) {
      let value = colorsConf[i];
      const startDegree = value[0],
        // Draw every slice one degree greater but let the nexst slide start
        // at the correct position so they overlap. This will fix some random
        // gaps that are caused by antialiasing.
        endDegree = value[1] + (i === il - 1 ? 0 : 1),
        startColor = value[2],
        endColor = value[3];

      drawConicGradient(
        this.circleContext,
        this.state.sideLength,
        startColor,
        endColor,
        startDegree,
        endDegree
      );
    }
    this.conicGradientData = this.circleContext.getImageData(
      0,
      0,
      this.circleCanvas.width,
      this.circleCanvas.width
    );
    this.circleContext.clearRect(
      0,
      0,
      this.state.sideLength,
      this.state.sideLength
    );
  }
  getColors() {
    const out = [];
    for (let i = 0; i < this.props.colorLineForeground.length; i++) {
      const row = this.props.colorLineForeground[i];
      out.push([row[0] * 360, row[1] * 360, row[2], row[3]]);
    }
    return out;
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

    this.drawFrame(text, status, timePassedAspercent);
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

    this.circleContext.clearRect(
      0,
      0,
      this.state.sideLength,
      this.state.sideLength
    );
    this.circleContext.putImageData(
      this.conicGradientData,
      0,
      0,
      0,
      0,
      this.circleCanvas.width,
      this.circleCanvas.height
    );

    this.circleContext.beginPath();
    const halfSide = this.state.sideLength / 2;
    const radiusExt = halfSide * 0.9; // external circle radiuse
    const radiusInt = radiusExt * 0.7; // inner circle radius
    this.circleContext.arc(
      halfSide,
      halfSide,
      radiusInt + (radiusExt - radiusInt) / 2,
      0,
      2 * PI
    );
    this.circleContext.strokeStyle = this.props.colorLineBackgroundInactive;
    this.circleContext.lineWidth = radiusExt - radiusInt;
    this.circleContext.stroke();
  }
  drawFrame(text, status, timePassedAspercent) {
    const circleContext = this.circleContext;
    const halfSide = this.state.sideLength / 2;
    const radius1 = this.state.radius;
    const endArc = 2 * PI * timePassedAspercent / 100;

    circleContext.globalCompositeOperation = 'source-over';
    circleContext.clearRect(0, 0, this.state.sideLength, this.state.sideLength);
    circleContext.putImageData(
      this.conicGradientData,
      0,
      0,
      0,
      0,
      this.circleCanvas.width,
      this.circleCanvas.width
    );
    circleContext.beginPath();

    const radius2 = radius1 * 0.7; // inner circle radius

    circleContext.arc(
      halfSide,
      halfSide,
      radius2 + (radius1 - radius2) / 2,
      endArc,
      2 * PI
    );

    circleContext.strokeStyle =
      status === STATUS_PLAY
        ? this.props.colorLineBackgroundActive
        : this.props.colorLineBackgroundInactive;

    circleContext.lineWidth = radius1 - radius2;
    circleContext.stroke();

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

function drawConicGradient(
  ctx,
  sideLength,
  startColor,
  endColor,
  startDegree,
  endDegree
) {
  const pieces = 120;
  const degrees = endDegree - startDegree; // XXX will not work with higher than 360 degrees
  const centerX = sideLength / 2; // x center of circle
  const centerY = sideLength / 2; // y center of circle
  const size = degrees / pieces; // size of pie slice in degrees
  const radius1 = sideLength / 2 * 0.9; // outer circle radius
  const radius2 = radius1 * 0.7; // inner circle radius

  // draw the clipping arc
  const startRadians = Math.round(startDegree * PI / 180 * 100) / 100;
  const endRadians = Math.round(endDegree * PI / 180 * 100) / 100;

  const color1 = cssColorToRGBA(startColor);
  const color2 = cssColorToRGBA(endColor);

  // draw the big circle
  ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius1, startRadians, endRadians, false);
  ctx.lineTo(centerX, centerY);
  ctx.fill();

  // knock out the little circle from the big circle
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  if (radius2 > radius1) {
    radius2 = radius1;
  }
  ctx.arc(centerX, centerY, radius2, 0, PI * 2, false);
  ctx.lineTo(centerX, centerY);
  ctx.fill();

  // Draw as many slices as needed with gradient colors
  ctx.globalCompositeOperation = 'source-atop';

  for (let i = 0; i < pieces; i++) {
    const deg = i * size + startDegree;
    const red = parseInt(
      (color2[0] - color1[0]) * i / (pieces - 1) + color1[0],
      10
    );
    const green = parseInt(
      (color2[1] - color1[1]) * i / (pieces - 1) + color1[1],
      10
    );
    const blue = parseInt(
      (color2[2] - color1[2]) * i / (pieces - 1) + color1[2],
      10
    );
    ctx.fillStyle = 'rgb(' + red + ', ' + green + ', ' + blue + ')';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    const x1 = centerX + radius1 * 10 * Math.cos(deg * PI / 180);
    const y1 = centerY + radius1 * 10 * Math.sin(deg * PI / 180);
    // Draw every slice one degree greater but let the nexst slide start
    // at the correct position so they overlap. This will fix some random
    // gaps that are caused by antialiasing.
    const extraDeg = i === pieces - 1 ? 0 : 1;
    const x2 =
      centerX + radius1 * 10 * Math.cos((deg + size + extraDeg) * PI / 180);
    const y2 =
      centerY + radius1 * 10 * Math.sin((deg + size + extraDeg) * PI / 180);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-over';
}

function cssColorToRGBA(cssColor) {
  const d = document.createElement('div');
  d.style.color = cssColor;
  document.body.appendChild(d);
  //Color in RGB
  const rgbString = window.getComputedStyle(d).color;
  d.remove();
  const parsed = rgbString.match(
    /rgb[a]?\((\d+),\s*(\d+),\s*(\d+)(,\s*(\d+(\.\d+)?))?\)/
  );
  return [
    parseInt(parsed[1], 10),
    parseInt(parsed[2], 10),
    parseInt(parsed[3], 10),
    parseFloat(Math.round(parsed[5] * 100) / 100 || 1)
  ];
}
