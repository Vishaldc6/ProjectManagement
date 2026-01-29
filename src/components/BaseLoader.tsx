import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import React, { memo } from 'react';

import appColors from '../styles/appColors';
import BaseIndicator from './BaseIndicator';

const BaseLoader = (props: ViewProps) => {
  return (
    <View {...props} style={[styles.indicatorContainer, props.style]}>
      <BaseIndicator />
    </View>
  );
};

export default memo(BaseLoader);

const styles = StyleSheet.create({
  indicatorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColors.LOADER_BACKGROUND,
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 999999999,
  },
});
