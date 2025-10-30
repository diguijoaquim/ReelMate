import React from 'react';
import { Platform } from 'react-native';
import { ScrollView as RNScrollView } from 'react-native';

export const NativeScrollView = React.forwardRef((props, ref) => {
  const isAndroid = Platform.OS === 'android';
  const {
    contentContainerStyle,
    horizontal,
    // When true (default), content expands to fill the viewport. When false, allow scrolling even with small content.
    expandContent = true,
    ...rest
  } = props;

  return (
    <RNScrollView
      ref={ref}
      {...rest}
      bounces={!isAndroid}
      overScrollMode={isAndroid ? 'always' : 'auto'}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        contentContainerStyle,
        !horizontal && expandContent && { flexGrow: 1 },
      ]}
    />
  );
});

NativeScrollView.displayName = 'NativeScrollView';

export default NativeScrollView;