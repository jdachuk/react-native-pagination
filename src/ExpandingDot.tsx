import * as React from "react";
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

export type ExpandingDotProps = {
  data: any[];
  scrollX: Animated.Value;
  pageWidth: number;
  dotSize?: number;
  expandingDotWidth?: number;
  dotMargin?: number;
  visibleDots?: number;
  activeDotColor?: string;
  inactiveDotColor?: string;
  inactiveDotOpacity?: number;
  dotOpacityExtrapolate?: "clamp" | "extend";
  style?: StyleProp<ViewStyle>;
};

const DEFAULTS: Omit<ExpandingDotProps, "data" | "scrollX" | "pageWidth"> = {
  dotSize: 10,
  expandingDotWidth: 30,
  dotMargin: 2,
  visibleDots: 5,
  activeDotColor: "#fff",
  inactiveDotColor: "#fff",
  inactiveDotOpacity: 0.75,
  dotOpacityExtrapolate: "extend",
};

export default function ExpandingDot(props: ExpandingDotProps) {
  const {
    data,
    scrollX,
    pageWidth,
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
      {
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
      },
    ],
    [dotSize, expandingDotWidth, dotMargin, visibleDots, style, data]
  );

  const listRef = React.useRef<FlatList>(null);
  const keyExtractor = React.useCallback((_, index) => index.toString(), []);

  const renderItem = React.useCallback(
    ({ index }: ListRenderItemInfo<any>) => {
      const inputRange = [
        (index - 1) * pageWidth,
        index * pageWidth,
        (index + 1) * pageWidth,
      ];

      const color = scrollX.interpolate({
        inputRange,
        outputRange: [inactiveDotColor, activeDotColor, inactiveDotColor],
        extrapolate: "clamp",
      });
      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [inactiveDotOpacity, 1, inactiveDotOpacity],
        extrapolate: dotOpacityExtrapolate,
      });
      const expand = scrollX.interpolate({
        inputRange,
        outputRange: [dotSize, expandingDotWidth, dotSize],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          style={[
            { opacity },
            {
              width: expand,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: color,
              marginHorizontal: dotMargin,
              alignSelf: "center",
            },
          ]}
        />
      );
    },
    [
      pageWidth,
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
    scrollX.addListener(({ value }) => {
      if (!listRef.current) return;

      listRef.current.scrollToOffset({
        animated: false,
        offset: Math.max(
          0,
          (value / pageWidth - scrollThreshhold) * fullDotSize
        ),
      });
    });
  }, [pageWidth, scrollThreshhold, fullDotSize]);

  return (
    <View style={containerStyle}>
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
