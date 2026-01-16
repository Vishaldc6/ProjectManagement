import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import React, { memo, useState } from 'react';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {
  actions,
  RichEditor,
  RichEditorProps,
  RichToolbar,
} from 'react-native-pell-rich-editor';
import { pick } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import { decode } from 'base64-arraybuffer';

import appColors from '../styles/appColors';
import BaseIcon from './BaseIcon';

export interface UploadFileType {
  arrayBuffer: ArrayBuffer;
  path: string;
  type: string | null;
}

interface BaseRichTextInputPropType {
  ref: React.Ref<RichEditor> | undefined;
  title?: string;
  required?: boolean;
  errorMessage?: string;
  shouldAddFile?: boolean;
  onFileSelect?: (file: UploadFileType | undefined) => void;
}

const BaseRichTextInput = (
  props: BaseRichTextInputPropType & RichEditorProps,
) => {
  const [imageUri, setImageUri] = useState('');

  const getActions = () => {
    const _actions = [
      actions.setBold,
      actions.setItalic,
      actions.setUnderline,
      actions.setStrikethrough,
      actions.insertLink,
      actions.code,
      actions.blockquote,
      actions.insertOrderedList,
      actions.insertBulletsList,
    ];
    if (props.shouldAddFile) {
      _actions.push(actions.insertImage);
    }
    return _actions;
  };

  const handleAddImage = () => {
    pick({
      type: ['image/*'],
    })
      .then(async res => {
        console.log({ res });
        const file = res[0];

        if (file.error) throw new Error(file.error);

        const base64 = await RNFS.readFile(file.uri, 'base64');

        const arrayBuffer = decode(base64);

        const fileExt = file.name?.split('.').pop()?.toLowerCase();
        const path = `${Date.now()}.${fileExt}`;
        if (file.nativeType?.includes('image'))
          setImageUri(`data:${file.type};base64,${base64}`);

        // arrayBuffer
        // path
        // type
        props?.onFileSelect &&
          props?.onFileSelect({ arrayBuffer, path, type: file.type });
      })
      .catch(error => {
        console.log({ error });
      });
  };

  return (
    <View>
      <Text style={styles.inputHeader}>
        {props.title}
        {props.required && <Text style={styles.requireText}>*</Text>}
      </Text>
      <View style={{ height: hp(30), gap: hp(0.5) }}>
        <RichEditor
          {...props}
          ref={props.ref}
          useContainer={false}
          containerStyle={styles.richInputContainerStyle}
          editorStyle={{ placeholderColor: appColors.SECONDARY_TEXT }}
        />
        <RichToolbar
          editor={props.ref}
          actions={getActions()}
          selectedIconTint={appColors.PRIMARY}
          onPressAddImage={handleAddImage}
        />
        {imageUri && (
          <Pressable
            style={{
              alignSelf: 'baseline',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => {
              setImageUri('');
              props?.onFileSelect && props?.onFileSelect(undefined);
            }}
          >
            <Image
              source={{ uri: imageUri }}
              width={widthPercentageToDP(15)}
              height={widthPercentageToDP(15)}
            />
            <BaseIcon
              name="Trash2"
              color={appColors.DANGER_TEXT}
              style={{ position: 'absolute' }}
            />
          </Pressable>
        )}
      </View>
      {props.errorMessage && (
        <Text style={styles.errorMessage}>{props.errorMessage}</Text>
      )}
    </View>
  );
};

export default memo(BaseRichTextInput);

const styles = StyleSheet.create({
  richInputContainerStyle: {
    backgroundColor: appColors.INPUT_BACKGROUND,
    borderColor: appColors.BORDER,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: wp(2),
  },
  inputHeader: {
    fontWeight: '500',
  },
  requireText: {
    color: appColors.ERROR_TEXT,
  },
  errorMessage: {
    color: appColors.ERROR_TEXT,
  },
});
