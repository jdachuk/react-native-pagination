import * as React from "react";
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

export type ScalingDotProps = {
  data: any[];
  scrollX: Animated.Value;
  pageWidth: number;
  dotSize?: number;
  dotMargin?: number;
  visibleDots?: number;
  activeDotColor?: string;
  inactiveDotColor?: string;
  activeDotScale?: number;
  inactiveDotOpacity?: number;
  dotOpacityExtrapolate?: "clamp" | "extend";
  dotScaleExtrapolate?: "clamp" | "extend";
  style?: StyleProp<ViewStyle>;
};

const DEFAULTS: Omit<ScalingDotProps, "data" | "scrollX" | "pageWidth"> = {
  dotSize: 10,
  dotMargin: 2,
  visibleDots: 5,
  activeDotColor: "#fff",
  inactiveDotColor: "#fff",
  activeDotScale: 1.2,
  inactiveDotOpacity: 0.75,
  dotOpacityExtrapolate: "extend",
  dotScaleExtrapolate: "extend",
};

export default function ScalingDot(props: ScalingDotProps) {
  const {
    data,
    scrollX,
    pageWidth,
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
    () => Math.round((visibleDots - 1) / 2),
    [visibleDots]
  );

  const containerStyle = React.useMemo<StyleProp<ViewStyle>>(
    () => [
      style,
      {
        height: dotSize * activeDotScale,
        maxHeight: dotSize * activeDotScale,
        width: Math.min(visibleDots, data.length) * fullDotSize,
        maxWidth: Math.min(visibleDots, data.length) * fullDotSize,
      },
    ],
    [dotSize, dotMargin, visibleDots, style, activeDotScale, data]
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

      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [inactiveDotOpacity, 1, inactiveDotOpacity],
        extrapolate: dotOpacityExtrapolate,
      });
      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [1, activeDotScale, 1],
        extrapolate: dotScaleExtrapolate,
      });
      const color = scrollX.interpolate({
        inputRange,
        outputRange: [inactiveDotColor, activeDotColor, inactiveDotColor],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          style={[
            { opacity },
            { transform: [{ scale }] },
            {
              width: dotSize,
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
