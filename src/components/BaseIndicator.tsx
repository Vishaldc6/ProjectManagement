import { ActivityIndicator } from 'react-native';
import React, { memo } from 'react';

import appColors from '../styles/appColors';

const BaseIndicator = () => {
  return <ActivityIndicator size={'large'} color={appColors.PRIMARY} />;
};

export default memo(BaseIndicator);
