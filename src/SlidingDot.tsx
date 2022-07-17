import * as React from "react";
import { Animated, FlatList, StyleProp, View, ViewStyle } from "react-native";

import { PaginationProps } from "./types";

export interface SlidingDotProps extends PaginationProps {
  dotSize?: number;
  dotMargin?: number;
  visibleDots?: number;
  slidingDotColor?: string;
  inactiveDotColor?: string;
  inactiveDotOpacity?: number;
}

const DEFAULTS: Omit<
  SlidingDotProps,
  keyof Omit<PaginationProps, "horizontal">
> = {
  dotSize: 10,
  dotMargin: 2,
  visibleDots: 5,
  slidingDotColor: "#fff",
  inactiveDotColor: "#fff",
  inactiveDotOpacity: 0.6,
  horizontal: true,
};

export default function SlidingDot(props: SlidingDotProps) {
  const {
    data,
    offset,
    pageWidth,
    pageHeight,
    horizontal,
    listHorizontal,
    dotSize,
    dotMargin,
    visibleDots,
    slidingDotColor,
    inactiveDotColor,
    inactiveDotOpacity,
    style,
  } = {
    ...DEFAULTS,
    ...props,
  } as Required<SlidingDotProps>;

  const fullDotSize = React.useMemo(
    () => dotSize + 2 * dotMargin,
    [dotSize, dotMargin]
  );
  const scrollThreshhold = React.useMemo(
    () => (visibleDots - 1) / 2,
    [visibleDots]
  );

  const { width, height } = React.useMemo(() => {
    const length = Math.min(visibleDots, data.length) * fullDotSize;

    return {
      width: horizontal ? length : dotSize,
      height: horizontal ? dotSize : length,
    };
  }, [dotSize, dotMargin, visibleDots, data, horizontal]);
  const containerStyle = React.useMemo<StyleProp<ViewStyle>>(
    () => [
      style,
      {
        height: height,
        maxHeight: height,
        width: width,
        maxWidth: width,
      },
    ],
    [width, height, style]
  );

  const listRef = React.useRef<FlatList>(null);
  const translate = React.useRef(new Animated.Value(0)).current;
  const keyExtractor = React.useCallback((_, index) => index.toString(), []);

  const renderItem = React.useCallback(
    () => (
      <View
        style={{
          height: dotSize,
          width: dotSize,
          borderRadius: dotSize / 2,
          marginHorizontal: horizontal ? dotMargin : undefined,
          marginVertical: horizontal ? undefined : dotMargin,
          opacity: inactiveDotOpacity,
          backgroundColor: inactiveDotColor,
        }}
      />
    ),
    [horizontal, dotSize, dotMargin, inactiveDotColor, inactiveDotOpacity]
  );

  React.useEffect(() => {
    const listenerId = offset.addListener(({ value }) => {
      if (!listRef.current) return;

      const pageIdx = value / (listHorizontal ? pageWidth : pageHeight);

      if (data.length <= visibleDots || pageIdx < scrollThreshhold) {
        translate.setValue(pageIdx * fullDotSize);
      } else if (pageIdx > data.length - 1 - scrollThreshhold) {
        translate.setValue(
          (pageIdx - (data.length - visibleDots)) * fullDotSize
        );
      }

      listRef.current.scrollToOffset({
        animated: false,
        offset: Math.max(0, (pageIdx - scrollThreshhold) * fullDotSize),
      });
    });

    return () => offset.removeListener(listenerId);
  }, [pageWidth, pageHeight, listHorizontal, data, visibleDots, fullDotSize]);

  return (
    <View style={containerStyle}>
      <Animated.View
        style={{
          position: "absolute",
          height: dotSize,
          width: dotSize,
          borderRadius: dotSize / 2,
          marginHorizontal: horizontal ? dotMargin : undefined,
          marginVertical: horizontal ? undefined : dotMargin,
          backgroundColor: slidingDotColor,
          transform: [
            horizontal ? { translateX: translate } : { translateY: translate },
          ],
        }}
      />
      <FlatList
        ref={listRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal={horizontal}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      />
    </View>
  );
}
