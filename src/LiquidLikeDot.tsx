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

  const containerStyle = React.useMemo<StyleProp<ViewStyle>>(
    () => [
      style,
      horizontal
        ? {
            height: dotSize,
            maxHeight: dotSize,
            width: Math.min(visibleDots, data.length) * fullDotSize,
            maxWidth: Math.min(visibleDots, data.length) * fullDotSize,
          }
        : {
            height: Math.min(visibleDots, data.length) * fullDotSize,
            maxHeight: Math.min(visibleDots, data.length) * fullDotSize,
            width: dotSize,
            maxWidth: dotSize,
          },
    ],
    [horizontal, dotSize, visibleDots, style, data, fullDotSize]
  );
  const dotContainerStyle = React.useMemo<StyleProp<ViewStyle>>(
    () => [
      {
        height: dotSize,
        width: dotSize,
        borderRadius: dotSize / 2,
      },
      horizontal
        ? { marginHorizontal: dotMargin }
        : { marginVertical: dotMargin },
    ],
    [dotSize, dotMargin, horizontal]
  );

  const listRef = React.useRef<FlatList>(null);
  const translate = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0)).current;
  const keyExtractor = React.useCallback((_, index) => index.toString(), []);

  const renderItem = React.useCallback(
    () => (
      <View
        style={[
          dotContainerStyle,
          {
            opacity: inactiveDotOpacity,
            backgroundColor: inactiveDotColor,
          },
        ]}
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
        style={[
          dotContainerStyle,
          {
            position: "absolute",
            transform: horizontal
              ? [
                  { translateX: translate },
                  {
                    scaleY: scale.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, slidingDotMinHeight / dotSize, 1],
                    }),
                  },
                  {
                    scaleX: scale.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, (dotSize + 2 * dotMargin) / dotSize, 1],
                      extrapolate: "clamp",
                    }),
                  },
                ]
              : [
                  { translateY: translate },
                  {
                    scaleX: scale.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, slidingDotMinHeight / dotSize, 1],
                    }),
                  },
                  {
                    scaleY: scale.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, (dotSize + 2 * dotMargin) / dotSize, 1],
                      extrapolate: "clamp",
                    }),
                  },
                ],
            backgroundColor: slidingDotColor,
          },
        ]}
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
