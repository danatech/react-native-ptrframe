'use strict';

import React, {
  Component
} from 'react';

import {
  View,
  PanResponder,
  StyleSheet,
  LayoutAnimation,
  UIManager,
} from 'react-native';

// Enable Android LayoutAnimation
UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);

const styles = StyleSheet.create({
  root: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  headerContainer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  }
});

export default class PtrLayout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      offsetHeader: 0,
      loadingState: 'default',
    };
    this.maxOffset = this.props.maxOffset || 150;
    this.refreshOffset = this.props.refreshOffset || 100;
    this._initProps();
    this._initPanResponder();
  }

  complete() {
    if (this.state.loadingState === 'default') {
    } else {
      LayoutAnimation.configureNext({
        duration: this._completeTime,
        create: {
          type: LayoutAnimation.Types.linear,
          property: LayoutAnimation.Properties.scaleXY,
        },
        update: {
          type: LayoutAnimation.Types.linear,
        }
      });
      this.setState({offsetHeader: 0, loadingState: 'default'});
    }
  }

  _touchBegin() {
    if (!this._block) {
      this._block = true;
      this._onTouchBegin();
    }
  }

  _touchMove() {
    if (!this._touching) {
      this._touching = true;
    }
  }

  _touchUnmove() {
    if (this._touching) {
      this._touching = false;
    }
  }

  _touchEnd() {
    if (this._block) {
      this._block = false;
      this._onTouchEnd();
    }
  }

  enablePtr(enabled) {
    this._ptrEnabled = enabled;
  }

  _initProps() {
    this._renderPtrHeader = this.props.renderPtrHeader;
    if (typeof this._renderPtrHeader === 'undefined' || this._renderPtrHeader === null) {
      this._renderPtrHeader = ()=>{
        return (
          <View style={{height: this.maxOffset, backgroundColor: '#00FF00'}}></View>
        )
      };
    }
    this._completeTime = this.props.completeTime || 200;
    this._ptrEnabled = true;
    this._onTouchBegin = this.props.onTouchBegin;
    if (this._onTouchBegin === null) {
      this._onTouchBegin = ()=>{};
    }
    this._onTouchEnd = this.props.onTouchEnd;
    if (this._onTouchEnd === null) {
      this._onTouchEnd = ()=>{};
    }
  }

  _initPanResponder() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        if (this._ptrEnabled) {
          this._touchBegin();
        }
        return false;
      },
      onStartShouldSetPanResponderCapture: (evt, gestureState) => {
        if (this._ptrEnabled) {
          this._touchBegin();
        }
        return false
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (!this._ptrEnabled) {
          return false;
        }
        let apply = gestureState.dy > 2;
        if (apply) {
          this._touchBegin();
        }
        return apply;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        if (this._ptrEnabled && gestureState.dy > 2) {
          this._touchBegin();
          return true;
        } else {
          this._touchEnd();
        }
        return this._touching},

      onPanResponderTerminationRequest: (evt, gestureState) => !this._touching,
      onPanResponderGrant: (evt, gestureState) => {
        this._touching = true;
        this._touchBegin();
        this._touchMove();
      },
      onPanResponderTerminate: (evt, gestureState) => {
        this._touchUnmove();
        this._touchEnd();
        this.complete();
      },

      onPanResponderMove: (evt, gestureState) => {
        if (this._ptrEnabled) {
          if (gestureState.dy < 0) {
            this._touchUnmove();
            this._touchEnd();
            return;
          }

          this._doMove(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        this._touchUnmove();
        this._touchEnd();
        if (this.state.loadingState === 'toRefresh') {
          this.setState({offsetHeader: this.refreshOffset, loadingState: 'refreshing'});
          this.props.onRefresh();
        } else {
          this.complete();
        }
      }
    });
  }

  _doMove(dy) {
    let max = this.maxOffset;
    let n = 20000;
    if (dy > 0) {
      dy = max - max * n / (dy * max + n);
      let ls = dy > this.refreshOffset ? 'toRefresh' : 'toCancel';
      this.setState({ offsetHeader: dy, loadingState: ls });
    }
  }

  render() {
    return (
      <View style={[styles.root, this.props.style]}
        {...this._panResponder.panHandlers}
        >
        <View style={[styles.header, {height: this.state.offsetHeader, overflow: 'hidden'}]}>
          <View style={[styles.headerContainer, {height: this.refreshOffset, width: this.props.width}]}>
            {this._renderPtrHeader(this.state.offsetHeader, this.refreshOffset, this.state.loadingState)}
          </View>
        </View>
        <View style={styles.body, {height: this.props.height - this.state.offsetHeader}}>
          {this.props.children}
        </View>
      </View>
    );
  }

}
