'use strict';

import React, {
  Component
} from 'react';

import {
  View,
  PanResponder,
  StyleSheet,
  LayoutAnimation,
} from 'react-native';

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
        duration: 400,
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
    if (!this._touching) {
      this._onTouchBegin();
      this._touching = true;
    }
  }

  _touchEnd() {
    if (this._touching) {
      this._touching = false;
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
        return this._ptrEnabled;
      },
      onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return this._ptrEnabled && gestureState.dy>=0;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => this.state.offsetHeader > 0,

      onPanResponderTerminationRequest: (evt, gestureState) => this.offsetHeader <= 0 ,
      onPanResponderGrant: (evt, gestureState) => {
        this._touchBegin();
      },
      onPanResponderTerminate: (evt, gestureState) => {
        this._touchEnd();
        this.complete();
      },

      onPanResponderMove: (evt, gestureState) => {
        if (this._ptrEnabled) {
          if (gestureState.dy < 0) {
            this._touchEnd();
            return;
          }

          this._doMove(gestureState);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (this.state.loadingState === 'toRefresh') {
          this.setState({offsetHeader: this.refreshOffset, loadingState: 'refreshing'});
          this.props.onRefresh();
        } else {
          this.complete();
        }
        this._touchEnd();
      }
    });
  }

  _doMove(gestureState) {
    let dy = gestureState.dy;
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
        onMoveShouldSetResponderCapture={(evt)=>this.state.offsetHeader>0}
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
