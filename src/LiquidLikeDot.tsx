import * as React from "react";
import { Animated, FlatList, StyleProp, View, ViewStyle } from "react-native";

import { PaginationProps } from "./types";

export interface LiquidLikeDotProps extends PaginationProps {
  dotSize?: number;
  dotMargin?: number;
  visibleDots?: number;
  slidingDotMinHeight?: number;
  slidingDotColor?: string;
  inactiveDotColor?: string;
  inactiveDotOpacity?: number;
}

const DEFAULTS: Omit<
  LiquidLikeDotProps,
  keyof Omit<PaginationProps, "horizontal">
> = {
  dotSize: 10,
  dotMargin: 4,
  visibleDots: 5,
  slidingDotMinHeight: 4,
  slidingDotColor: "#fff",
  inactiveDotColor: "#fff",
  inactiveDotOpacity: 0.3,
  horizontal: true,
};

const scaleInputRange = [0, 0.5, 1];
const keyExtractor = (_: any, index: any) => index.toString();

export default function LiquidLikeDot(props: LiquidLikeDotProps) {
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
    slidingDotMinHeight,
    slidingDotColor,
    inactiveDotColor,
    inactiveDotOpacity,
    style,
  } = {
    ...DEFAULTS,
    ...props,
  } as Required<LiquidLikeDotProps>;

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
  const scale = React.useRef(new Animated.Value(0)).current;
  const scaleValue = React.useCallback(
    (isForX: boolean) =>
      horizontal && isForX
        ? (dotSize + 2 * dotMargin) / dotSize
        : slidingDotMinHeight / dotSize,
    [horizontal, dotSize, dotMargin, slidingDotMinHeight]
  );
  const scaleXOutputRange = React.useMemo(() => [1, scaleValue(true), 1], []);
  const scaleYOutputRange = React.useMemo(() => [1, scaleValue(false), 1], []);

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
    [dotSize, dotMargin, horizontal, inactiveDotColor, inactiveDotOpacity]
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

      scale.setValue(pageIdx - Math.floor(pageIdx));

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
            {
              scaleX: scale.interpolate({
                inputRange: scaleInputRange,
                outputRange: scaleXOutputRange,
                extrapolate: "clamp",
              }),
            },
            {
              scaleY: scale.interpolate({
                inputRange: scaleInputRange,
                outputRange: scaleYOutputRange,
              }),
            },
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
