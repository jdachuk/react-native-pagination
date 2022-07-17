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

export interface ExpandingDotProps extends PaginationProps {
  dotSize?: number;
  expandingDotWidth?: number;
  dotMargin?: number;
  visibleDots?: number;
  activeDotColor?: string;
  inactiveDotColor?: string;
  inactiveDotOpacity?: number;
  dotOpacityExtrapolate?: "clamp" | "extend";
}

const DEFAULTS: Omit<
  ExpandingDotProps,
  keyof Omit<PaginationProps, "horizontal">
> = {
  dotSize: 10,
  expandingDotWidth: 30,
  dotMargin: 2,
  visibleDots: 5,
  activeDotColor: "#fff",
  inactiveDotColor: "#fff",
  inactiveDotOpacity: 0.75,
  dotOpacityExtrapolate: "extend",
  horizontal: true,
};

export default function ExpandingDot(props: ExpandingDotProps) {
  const {
    data,
    offset,
    pageWidth,
    pageHeight,
    horizontal,
    listHorizontal,
    dotSize,
    expandingDotWidth,
    dotMargin,
    visibleDots,
    activeDotColor,
    inactiveDotColor,
    inactiveDotOpacity,
    dotOpacityExtrapolate,
    style,
  } = React.useMemo(
    () => ({
      ...DEFAULTS,
      ...props,
    }),
    [props]
  ) as Required<ExpandingDotProps>;

  const fullDotSize = React.useMemo(
    () => dotSize + 2 * dotMargin,
    [dotSize, dotMargin]
  );
  const scrollThreshhold = React.useMemo(
    () => (visibleDots - 1) / 2,
    [visibleDots]
  );

  const { width, height } = React.useMemo(() => {
    const length =
      (Math.min(visibleDots, data.length) - 1) * fullDotSize +
      (2 * dotMargin + expandingDotWidth);

    return {
      width: horizontal ? length : dotSize,
      height: horizontal ? dotSize : length,
    };
  }, [dotSize, expandingDotWidth, dotMargin, visibleDots, data, horizontal]);

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
      const color = offset.interpolate({
        inputRange: inputRange(index),
        outputRange: [inactiveDotColor, activeDotColor, inactiveDotColor],
        extrapolate: "clamp",
      });
      const opacity = offset.interpolate({
        inputRange: inputRange(index),
        outputRange: [inactiveDotOpacity, 1, inactiveDotOpacity],
        extrapolate: dotOpacityExtrapolate,
      });
      const expand = offset.interpolate({
        inputRange: inputRange(index),
        outputRange: [dotSize, expandingDotWidth, dotSize],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          style={[
            { opacity },
            {
              borderRadius: dotSize / 2,
              backgroundColor: color,
              alignSelf: "center",
              width: horizontal ? expand : dotSize,
              height: horizontal ? dotSize : expand,
              marginHorizontal: horizontal ? dotMargin : undefined,
              marginVertical: horizontal ? undefined : dotMargin,
            },
          ]}
        />
      );
    },
    [
      horizontal,
      dotSize,
      expandingDotWidth,
      dotMargin,
      activeDotColor,
      inactiveDotColor,
      inactiveDotOpacity,
      dotOpacityExtrapolate,
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
