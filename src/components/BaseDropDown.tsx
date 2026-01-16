import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import React, { memo } from 'react';
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { Dropdown } from 'react-native-element-dropdown';
import { DropdownProps } from 'react-native-element-dropdown/lib/typescript/components/Dropdown/model';

import appColors from '../styles/appColors';
import { MemberType } from '../types/appTypes';

interface BaseDropDownPropType {
  title?: string;
  required?: boolean;
  errorMessage?: string;
  containerStyle?: ViewStyle;
}

const BaseDropDown = (
  props: BaseDropDownPropType & DropdownProps<MemberType>,
) => {
  return (
    <View style={[styles.baseContainer, props.containerStyle]}>
      {props.title && (
        <Text style={styles.inputTitle}>
          {props.title}
          {props.required && <Text style={styles.requireText}>*</Text>}
        </Text>
      )}
      <Dropdown
        placeholderStyle={{ color: appColors.SECONDARY_TEXT }}
        {...props}
        style={[styles.dropdown, props.style]}
      />
      {props.errorMessage && (
        <Text style={styles.errorMessage}>{props.errorMessage}</Text>
      )}
    </View>
  );
};

export default memo(BaseDropDown);

const styles = StyleSheet.create({
  baseContainer: {},
  inputTitle: {
    fontWeight: '500',
    marginBottom: hp(0.5),
  },
  dropdown: {
    backgroundColor: appColors.INPUT_BACKGROUND,
    borderColor: appColors.BORDER,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: wp(2),
    padding: wp(1),
    paddingVertical: wp(2),
  },
  requireText: {
    color: appColors.ERROR_TEXT,
  },
  errorMessage: {
    color: appColors.ERROR_TEXT,
  },
});
