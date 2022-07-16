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
    () => Math.round((visibleDots - 1) / 2),
    [visibleDots]
  );

  const containerStyle = React.useMemo<StyleProp<ViewStyle>>(
    () => [
      style,
      horizontal
        ? {
            height: dotSize,
            maxHeight: dotSize,
            width:
              (Math.min(visibleDots, data.length) - 1) * fullDotSize +
              expandingDotWidth +
              2 * dotMargin,
            maxWidth:
              (Math.min(visibleDots, data.length) - 1) * fullDotSize +
              expandingDotWidth +
              2 * dotMargin,
          }
        : {
            height:
              (Math.min(visibleDots, data.length) - 1) * fullDotSize +
              expandingDotWidth +
              2 * dotMargin,
            maxHeight:
              (Math.min(visibleDots, data.length) - 1) * fullDotSize +
              expandingDotWidth +
              2 * dotMargin,
            width: dotSize,
            maxWidth: dotSize,
          },
    ],
    [
      dotSize,
      expandingDotWidth,
      dotMargin,
      visibleDots,
      style,
      data,
      horizontal,
    ]
  );

  const listRef = React.useRef<FlatList>(null);
  const keyExtractor = React.useCallback((_, index) => index.toString(), []);

  const renderItem = React.useCallback(
    ({ index }: ListRenderItemInfo<any>) => {
      const inputRange = [
        (index - 1) * (listHorizontal ? pageWidth : pageHeight),
        index * (listHorizontal ? pageWidth : pageHeight),
        (index + 1) * (listHorizontal ? pageWidth : pageHeight),
      ];

      const color = offset.interpolate({
        inputRange,
        outputRange: [inactiveDotColor, activeDotColor, inactiveDotColor],
        extrapolate: "clamp",
      });
      const opacity = offset.interpolate({
        inputRange,
        outputRange: [inactiveDotOpacity, 1, inactiveDotOpacity],
        extrapolate: dotOpacityExtrapolate,
      });
      const expand = offset.interpolate({
        inputRange,
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
            },
            horizontal
              ? {
                  width: expand,
                  height: dotSize,
                  marginHorizontal: dotMargin,
                }
              : {
                  width: dotSize,
                  height: expand,
                  marginVertical: dotMargin,
                },
          ]}
        />
      );
    },
    [
      pageWidth,
      pageHeight,
      horizontal,
      listHorizontal,
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
