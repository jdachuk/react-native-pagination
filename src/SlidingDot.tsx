import * as React from "react";
import { Animated, FlatList, StyleProp, View, ViewStyle } from "react-native";

export type SlidingDotProps = {
  data: any[];
  scrollX: Animated.Value;
  pageWidth: number;
  dotSize?: number;
  dotMargin?: number;
  visibleDots?: number;
  slidingDotColor?: string;
  inactiveDotColor?: string;
  inactiveDotOpacity?: number;
  style?: StyleProp<ViewStyle>;
};

const DEFAULTS: Omit<SlidingDotProps, "data" | "scrollX" | "pageWidth"> = {
  dotSize: 10,
  dotMargin: 2,
  visibleDots: 5,
  slidingDotColor: "#fff",
  inactiveDotColor: "#fff",
  inactiveDotOpacity: 0.6,
};

export default function SlidingDot(props: SlidingDotProps) {
  const {
    data,
    scrollX,
    pageWidth,
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
    () => Math.round((visibleDots - 1) / 2),
    [visibleDots]
  );

  const containerStyle = React.useMemo<StyleProp<ViewStyle>>(
    () => [
      style,
      {
        height: dotSize,
        maxHeight: dotSize,
        width: Math.min(visibleDots, data.length) * fullDotSize,
        maxWidth: Math.min(visibleDots, data.length) * fullDotSize,
      },
    ],
    [dotSize, visibleDots, style, data, fullDotSize]
  );
  const dotContainerStyle = React.useMemo<StyleProp<ViewStyle>>(
    () => ({
      height: dotSize,
      width: dotSize,
      borderRadius: dotSize / 2,
      marginHorizontal: dotMargin,
    }),
    [dotSize, dotMargin]
  );

  const listRef = React.useRef<FlatList>(null);
  const translateX = React.useRef(new Animated.Value(0)).current;
  const keyExtractor = React.useCallback((_, index) => index.toString(), []);

  const renderItem = React.useCallback(
    () => (
      <Animated.View
        style={[
          dotContainerStyle,
          {
            opacity: inactiveDotOpacity,
            backgroundColor: inactiveDotColor,
          },
        ]}
      />
    ),
    [dotContainerStyle, inactiveDotColor, inactiveDotOpacity]
  );

  React.useEffect(() => {
    scrollX.addListener(({ value }) => {
      if (!listRef.current) return;

      const pageIdx = value / pageWidth;

      if (data.length <= visibleDots || pageIdx < scrollThreshhold) {
        translateX.setValue(pageIdx * fullDotSize);
      } else if (pageIdx - scrollThreshhold > data.length - visibleDots) {
        translateX.setValue((pageIdx - (visibleDots + 1)) * fullDotSize);
      }

      listRef.current.scrollToOffset({
        animated: false,
        offset: Math.max(0, (pageIdx - scrollThreshhold) * fullDotSize),
      });
    });
  }, [pageWidth, data, visibleDots, fullDotSize]);

  return (
    <View style={containerStyle}>
      <Animated.View
        style={[
          {
            position: "absolute",
            transform: [{ translateX }],
            backgroundColor: slidingDotColor,
          },
          dotContainerStyle,
        ]}
      />
      <FlatList
        ref={listRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal={true}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      />
    </View>
  );
}
