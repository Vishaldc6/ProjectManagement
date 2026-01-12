import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import React, { memo } from 'react';
import appColors from '../styles/appColors';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

interface BaseInputPropsType {
  title?: string;
  required?: boolean;
  errorMessage?: string;
  containerStyle?: ViewStyle;
}

const BaseInput = (props: BaseInputPropsType & TextInputProps) => {
  return (
    <View style={[styles.baseContainer, props.containerStyle]}>
      {props.title && (
        <Text style={styles.inputTitle}>
          {props.title}
          {props.required && <Text style={styles.requireText}>*</Text>}
        </Text>
      )}
      <TextInput
        placeholderTextColor={appColors.SECONDARY_TEXT}
        {...props}
        style={[styles.input, props.style]}
      />
      {props.errorMessage && (
        <Text style={styles.errorMessage}>{props.errorMessage}</Text>
      )}
    </View>
  );
};

export default memo(BaseInput);

const styles = StyleSheet.create({
  baseContainer: {},
  inputTitle: {
    fontWeight: '500',
    marginBottom: hp(0.5),
  },
  input: {
    backgroundColor: appColors.INPUT_BACKGROUND,
    borderColor: appColors.BORDER,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: wp(2),
  },
  requireText: {
    color: appColors.ERROR_TEXT,
  },
  errorMessage: {
    color: appColors.ERROR_TEXT,
  },
});
