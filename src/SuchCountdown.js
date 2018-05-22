/**
 * @class SuchCountdown
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import CircleCountdown from './CircleCountdown';
import { STATUS_PLAY, STATUS_STOP, STATUS_PAUSE } from './constants';

class SuchCountdown extends Component {
  constructor(props) {
    super();

    this.state = {
      status: props.status,
      width: 100,
      height: 100
    };

    this.resetInternalCounters();
  }
  resetInternalCounters = () => {
    this.startedAt = 0;
    this.updatedAt = 0;
    this.animationTimestamp = null;
    this.timeAlreadyPassedWhenPaused = 0;
    this.timePassedInTheLatestIntervalBeforePausing = 0;
  };
  shouldComponentUpdate = (nextProps, nextState) => {
    return (
      nextState.width !== this.state.width ||
      nextState.height !== this.state.height ||
      nextProps.className !== this.props.className ||
      nextState.status !== this.state.status
    );
  };
  static getDerivedStateFromProps(nextProps, prevState) {
    const stateDiff = {};
    if (nextProps.status !== prevState.status) {
      stateDiff.status = nextProps.status;
    }

    return stateDiff;
  }
  componentWillUnmount = ev => {
    window.removeEventListener('resize', this.onResize);
  };
  stop = () => {
    if (this.animationTimestamp) {
      // i.e. we stopped while playing (we wouldn't enter here from pause)
      cancelAnimationFrame(this.animationTimestamp);
    }

    this.resetInternalCounters();
    this.drawReset();
    setTimeout(this.props.onCountdownEnd, 0);
  };
  pause = () => {
    if (this.animationTimestamp) {
      cancelAnimationFrame(this.animationTimestamp);
    }
    this.animationTimestamp = null;
    //this.updatedAt = performance.now()
    this.timeAlreadyPassedWhenPaused = this.updatedAt - this.startedAt;
    this.timePassedInTheLatestIntervalBeforePausing =
      performance.now() - this.updatedAt;
  };
  start = () => {
    const now = performance.now();
    const timeAlreadySpentPlaying = this.updatedAt - this.startedAt;
    this.startedAt =
      now -
      timeAlreadySpentPlaying -
      this.timePassedInTheLatestIntervalBeforePausing;
    this.updatedAt = now - this.timePassedInTheLatestIntervalBeforePausing;
    this.tick(now, this.timePassedInTheLatestIntervalBeforePausing === 0);
  };
  componentDidMount() {
    // XXX should use a throttled version, see
    // https://developer.mozilla.org/en-US/docs/Web/Events/resize
    window.addEventListener('resize', this.onResize.bind(this));

    this.drawReset();
    if (this.props.status === STATUS_PLAY) {
      this.start();
    }
  }
  getDimensions = () => ({
    width: this.innerRef.clientWidth,
    height: this.innerRef.clientHeight
  });
  drawReset() {
    const timeSinceLastUpdate = this.updatedAt - this.startedAt;
    const remainingMillis = this.props.duration - timeSinceLastUpdate;

    this.elem.drawReset({
      duration: this.props.duration,
      remainingMillis: this.props.duration - timeSinceLastUpdate,
      tickInterval: this.props.tickInterval,
      status: this.state.status
    });
  }
  onResize = () => {
    this.setState(this.getDimensions());
  };
  tick = (timestamp, force) => {
    const now = performance.now();
    const { duration, tickInterval } = this.props;

    const timeAlreadySpentPlaying = now - this.startedAt;
    const remainingMillis = duration - timeAlreadySpentPlaying;

    if (now - this.updatedAt < tickInterval && remainingMillis > 0 && !force) {
      this.animationTimestamp = requestAnimationFrame(this.tick);
      return;
    }

    const prevUpdatedAt = this.updatedAt;
    this.updatedAt = now;

    this.elem.draw({
      remainingMillis,
      duration,
      updatedAt: this.updatedAt,
      tickInterval,
      animationTimestamp: this.animationTimestamp,
      startedAt: this.startedAt,
      prevUpdatedAt,
      timeAlreadySpentPlaying,
      status: this.state.status
    });

    if (this.updatedAt - this.startedAt < duration) {
      this.animationTimestamp = requestAnimationFrame(this.tick);
    } else {
      this.setState({ status: STATUS_STOP });
    }
  };
  setElement = elem => {
    this.elem = elem;
  };
  setInnerRef = elem => {
    this.innerRef = elem;
  };
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.status !== STATUS_STOP && this.state.status === STATUS_STOP) {
      this.stop();
    } else if (this.animationTimestamp && this.state.status === STATUS_PAUSE) {
      this.pause();
    } else if (!this.animationTimestamp && this.state.status === STATUS_PLAY) {
      this.start();
    }
  }
  render() {
    const { className } = this.props;

    return React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        className,
        ref: this.setElement,
        innerRef: this.setInnerRef,
        width: this.state.width,
        height: this.state.height,
        status: this.state.status
      });
    });
  }
}

SuchCountdown.propTypes = {
  className: PropTypes.string,
  tickInterval: PropTypes.number,
  duration: PropTypes.number,
  onCountdownEnd: PropTypes.func,
  status: PropTypes.oneOf([STATUS_PAUSE, STATUS_PLAY, STATUS_STOP])
};

SuchCountdown.defaultProps = {
  tickInterval: 1000,
  className: '',
  duration: 10000,
  onCountdownEnd: () => null,
  status: STATUS_PLAY
};

export default SuchCountdown;
