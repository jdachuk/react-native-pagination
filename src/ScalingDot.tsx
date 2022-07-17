import * as React from "react";
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

import { PaginationProps } from "./types";

export interface ScalingDotProps extends PaginationProps {
  dotSize?: number;
  dotMargin?: number;
  visibleDots?: number;
  activeDotColor?: string;
  inactiveDotColor?: string;
  activeDotScale?: number;
  inactiveDotOpacity?: number;
  dotOpacityExtrapolate?: "clamp" | "extend";
  dotScaleExtrapolate?: "clamp" | "extend";
}

const DEFAULTS: Omit<
  ScalingDotProps,
  keyof Omit<PaginationProps, "horizontal">
> = {
  dotSize: 10,
  dotMargin: 2,
  visibleDots: 5,
  activeDotColor: "#fff",
  inactiveDotColor: "#fff",
  activeDotScale: 1.2,
  inactiveDotOpacity: 0.75,
  dotOpacityExtrapolate: "extend",
  dotScaleExtrapolate: "extend",
  horizontal: true,
};

export default function ScalingDot(props: ScalingDotProps) {
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
    activeDotColor,
    inactiveDotColor,
    activeDotScale,
    inactiveDotOpacity,
    dotOpacityExtrapolate,
    dotScaleExtrapolate,
    style,
  } = {
    ...DEFAULTS,
    ...props,
  } as Required<ScalingDotProps>;

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
      width: horizontal ? length : dotSize * activeDotScale,
      height: horizontal ? dotSize * activeDotScale : length,
    };
  }, [dotSize, dotMargin, visibleDots, data, horizontal, activeDotScale]);

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
  const keyExtractor = React.useCallback((_, index) => index.toString(), []);
  const inputRange = React.useCallback(
    (idx: number) => [
      (idx - 1) * (listHorizontal ? pageWidth : pageHeight),
      idx * (listHorizontal ? pageWidth : pageHeight),
      (idx + 1) * (listHorizontal ? pageWidth : pageHeight),
    ],
    [listHorizontal, pageWidth, pageHeight]
  );

  const renderItem = React.useCallback(
    ({ index }: ListRenderItemInfo<any>) => {
      const opacity = offset.interpolate({
        inputRange: inputRange(index),
        outputRange: [inactiveDotOpacity, 1, inactiveDotOpacity],
        extrapolate: dotOpacityExtrapolate,
      });
      const scale = offset.interpolate({
        inputRange: inputRange(index),
        outputRange: [1, activeDotScale, 1],
        extrapolate: dotScaleExtrapolate,
      });
      const color = offset.interpolate({
        inputRange: inputRange(index),
        outputRange: [inactiveDotColor, activeDotColor, inactiveDotColor],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          style={{
            opacity,
            transform: [{ scale }],
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
            alignSelf: "center",
            marginHorizontal: horizontal ? dotMargin : undefined,
            marginVertical: horizontal ? undefined : dotMargin,
          }}
        />
      );
    },
    [
      horizontal,
      dotSize,
      dotMargin,
      activeDotColor,
      inactiveDotColor,
      activeDotScale,
      inactiveDotOpacity,
      dotOpacityExtrapolate,
      dotScaleExtrapolate,
    ]
  );

  React.useEffect(() => {
    const listenerId = offset.addListener(({ value }) => {
      if (!listRef.current) return;

      const pageIdx = value / (listHorizontal ? pageWidth : pageHeight);

      listRef.current.scrollToOffset({
        animated: false,
        offset: Math.max(0, (pageIdx - scrollThreshhold) * fullDotSize),
      });
    });

    return () => offset.removeListener(listenerId);
  }, [pageWidth, pageHeight, listHorizontal, scrollThreshhold, fullDotSize]);

  return (
    <View style={containerStyle}>
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
