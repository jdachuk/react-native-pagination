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

export interface SlidingBorderProps extends PaginationProps {
  dotSize?: number;
  visibleDots?: number;
  borderPadding?: number;
  borderWidth?: number;
  activeDotColor?: string;
  inactiveDotColor?: string;
  borderColor?: string;
}

const DEFAULTS: Omit<
  SlidingBorderProps,
  keyof Omit<PaginationProps, "horizontal">
> = {
  dotSize: 8,
  visibleDots: 5,
  borderPadding: 2,
  borderWidth: 1,
  activeDotColor: "#fff",
  inactiveDotColor: "#fff",
  borderColor: "#fff",
  horizontal: true,
};

export default function SlidingBorder(props: SlidingBorderProps) {
  const {
    data,
    offset,
    pageWidth,
    pageHeight,
    horizontal,
    listHorizontal,
    dotSize,
    visibleDots,
    borderPadding,
    borderWidth,
    activeDotColor,
    inactiveDotColor,
    borderColor,
    style,
  } = {
    ...DEFAULTS,
    ...props,
  } as Required<SlidingBorderProps>;

  const borderSize = React.useMemo(
    () => dotSize + (borderPadding + borderWidth) * 2,
    [dotSize, borderPadding]
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
            height: borderSize,
            maxHeight: borderSize,
            width: Math.min(visibleDots, data.length) * borderSize,
            maxWidth: Math.min(visibleDots, data.length) * borderSize,
          }
        : {
            height: Math.min(visibleDots, data.length) * borderSize,
            maxHeight: Math.min(visibleDots, data.length) * borderSize,
            width: borderSize,
            maxWidth: borderSize,
          },
    ],
    [horizontal, dotSize, visibleDots, borderPadding, style, data]
  );
  const dotContainerStyle = React.useMemo<StyleProp<ViewStyle>>(
    () => ({
      height: borderSize,
      width: borderSize,
      alignItems: "center",
      justifyContent: "center",
    }),
    [borderSize]
  );

  const listRef = React.useRef<FlatList>(null);
  const translate = React.useRef(new Animated.Value(0)).current;
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

      return (
        <View style={dotContainerStyle}>
          <Animated.View
            style={[
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: color,
              },
            ]}
          />
        </View>
      );
    },
    [
      pageWidth,
      pageHeight,
      listHorizontal,
      dotSize,
      activeDotColor,
      inactiveDotColor,
    ]
  );

  React.useEffect(() => {
    const listenerId = offset.addListener(({ value }) => {
      if (!listRef.current) return;

      const pageIdx = value / (listHorizontal ? pageWidth : pageHeight);

      if (data.length <= visibleDots || pageIdx < scrollThreshhold) {
        translate.setValue(pageIdx * borderSize);
      } else if (pageIdx > data.length - 1 - scrollThreshhold) {
        translate.setValue(
          (pageIdx - (data.length - visibleDots)) * borderSize
        );
      }

      listRef.current.scrollToOffset({
        animated: false,
        offset: Math.max(0, (pageIdx - scrollThreshhold) * borderSize),
      });
    });

    return () => offset.removeListener(listenerId);
  }, [pageWidth, pageHeight, listHorizontal, data, visibleDots, borderSize]);

  return (
    <View style={containerStyle}>
      <Animated.View
        style={{
          position: "absolute",
          width: borderSize,
          height: borderSize,
          borderRadius: borderSize / 2,
          borderWidth: borderWidth,
          borderColor: borderColor,
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
