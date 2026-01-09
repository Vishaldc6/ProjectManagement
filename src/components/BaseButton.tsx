import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import React, { memo } from 'react';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import appColors from '../styles/appColors';
import appFonts from '../styles/appFonts';

interface BaseButtonPropType {
  title: string;
}

const BaseButton = (props: BaseButtonPropType & TouchableOpacityProps) => {
  return (
    <TouchableOpacity {...props} style={[styles.btnContainer, props.style]}>
      <Text style={styles.title}>{props.title}</Text>
    </TouchableOpacity>
  );
};

export default memo(BaseButton);

const styles = StyleSheet.create({
  btnContainer: {
    backgroundColor: appColors.PRIMARY,
    padding: wp(3),
    borderRadius: wp(3),
    width: wp(90),
    alignItems: 'center',
    elevation: 5,
  },
  title: {
    fontSize: appFonts.FONT_14,
    color: appColors.BUTON_TEXT,
    fontWeight: '500',
  },
});
