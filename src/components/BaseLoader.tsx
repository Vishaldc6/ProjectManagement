import { ActivityIndicator, StyleSheet, View } from 'react-native';
import React, { memo } from 'react';
import appColors from '../styles/appColors';

const BaseLoader = () => {
  return (
    <View style={styles.indicatorContainer}>
      <ActivityIndicator size={'large'} color={appColors.PRIMARY} />
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
