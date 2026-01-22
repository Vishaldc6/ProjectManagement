import {
  Modal,
  ModalBaseProps,
  ModalProps,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import React, { memo } from 'react';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

import appColors from '../styles/appColors';
import appFonts from '../styles/appFonts';
import BaseIcon from './BaseIcon';

interface BaseModalPropType {
  backDropContainerStyle?: ViewStyle;
  modalContainerStyle?: ViewStyle;
  modalTitle?: string;
}

const BaseModal = (props: BaseModalPropType & ModalProps) => {
  return (
    <Modal
      animationType="slide"
      statusBarTranslucent
      backdropColor={appColors.LOADER_BACKGROUND}
      {...props}
    >
      <View style={[styles.backdropContainer, props.backDropContainerStyle]}>
        <View style={[styles.modelContainer, props.modalContainerStyle]}>
          <View style={styles.titleRow}>
            <Text style={styles.modelTitle}>{props.modalTitle ?? ''}</Text>
            <BaseIcon
              name="X"
              onPress={props.onRequestClose}
              style={styles.closeIcon}
            />
          </View>
          {props.children}
        </View>
      </View>
    </Modal>
  );
};

export default memo(BaseModal);

const styles = StyleSheet.create({
  backdropContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modelContainer: {
    maxHeight: hp(50),
    backgroundColor: appColors.SECONDARY_BACKGROUND,
    padding: wp(4),
    margin: wp(4),
    borderRadius: wp(3),
    gap: hp(1),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelTitle: { fontSize: appFonts.FONT_16, fontWeight: '500' },
  closeIcon: { alignSelf: 'flex-end' },
});
