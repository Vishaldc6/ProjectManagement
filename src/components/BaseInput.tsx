import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'
import React, { memo } from 'react'

interface BaseInputPropsType{
    title:string,
    required?:boolean,
    errorMessage?:string,    
}

const BaseInput = (props: BaseInputPropsType & TextInputProps) => {
  return (
    <View style={styles.baseContainer}>
      <Text style={styles.inputTitle}>{props.title}{props.required && <Text style={styles.requireText}>*</Text>}</Text>
      <TextInput {...props} style={[styles.input, props.style]}/>
      {props.errorMessage && <Text style={styles.errorMessage}>{props.errorMessage}</Text>}
    </View>
  )
}

export default memo(BaseInput)

const styles = StyleSheet.create({
    baseContainer:{},
    inputTitle:{},
    input:{},
    requireText:{},
    errorMessage:{},
})