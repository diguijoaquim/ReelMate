import React from 'react';
import { Platform } from 'react-native';
import { ScrollView as RNScrollView } from 'react-native';

export const NativeScrollView = React.forwardRef((props, ref) => {
  const isAndroid = Platform.OS === 'android';

  return (
    <RNScrollView
      ref={ref}
      {...props}
      bounces={isAndroid}
      overScrollMode={isAndroid ? 'always' : 'auto'}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        props.contentContainerStyle,
        !props.horizontal && { flexGrow: 1 }
      ]}
    />
  );
});

NativeScrollView.displayName = 'NativeScrollView';

export default NativeScrollView;