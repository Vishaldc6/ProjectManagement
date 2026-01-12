import {
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import React, { memo } from 'react';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import * as icons from 'lucide-react-native/icons';

import BaseIcon from './BaseIcon';
import appColors from '../styles/appColors';

interface BaseFloatingButtonPropsType {
  name: keyof typeof icons;
}

const BaseFloatingButton = ({
  name,
  ...props
}: BaseFloatingButtonPropsType & TouchableOpacityProps) => {
  return (
    <TouchableOpacity
      {...props}
      style={[styles.floatingBtn, props.style]}
      activeOpacity={0.8}
    >
      <BaseIcon name={name} color={appColors.BUTON_TEXT} />
    </TouchableOpacity>
  );
};

export default memo(BaseFloatingButton);

const styles = StyleSheet.create({
  floatingBtn: {
    backgroundColor: appColors.PRIMARY,
    padding: wp(5),
    borderRadius: wp(50),
    elevation: 3,
    position: 'absolute',
    bottom: hp(5),
    right: wp(5),
  },
});
