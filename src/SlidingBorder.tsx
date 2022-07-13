import * as React from "react";
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

export type SlidingBorderProps = {
  data: any[];
  scrollX: Animated.Value;
  pageWidth: number;
  dotSize?: number;
  visibleDots?: number;
  borderPadding?: number;
  borderWidth?: number;
  activeDotColor?: string;
  inactiveDotColor?: string;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
};

const DEFAULTS: Omit<SlidingBorderProps, "data" | "scrollX" | "pageWidth"> = {
  dotSize: 8,
  visibleDots: 5,
  borderPadding: 2,
  borderWidth: 1,
  activeDotColor: "#fff",
  inactiveDotColor: "#fff",
  borderColor: "#fff",
};

export default function SlidingBorder(props: SlidingBorderProps) {
  const {
    data,
    scrollX,
    pageWidth,
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
      {
        height: borderSize,
        maxHeight: borderSize,
        width: Math.min(visibleDots, data.length) * borderSize,
        maxWidth: Math.min(visibleDots, data.length) * borderSize,
      },
    ],
    [dotSize, visibleDots, borderPadding, style, data]
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
  const translateX = React.useRef(new Animated.Value(0)).current;
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
    [pageWidth, dotSize, activeDotColor, inactiveDotColor]
  );

  React.useEffect(() => {
    scrollX.addListener(({ value }) => {
      if (!listRef.current) return;

      const pageIdx = value / pageWidth;

      if (data.length <= visibleDots || pageIdx < scrollThreshhold) {
        translateX.setValue(pageIdx * borderSize);
      } else if (pageIdx - scrollThreshhold > data.length - visibleDots) {
        translateX.setValue((pageIdx - (visibleDots + 1)) * borderSize);
      }

      listRef.current.scrollToOffset({
        animated: false,
        offset: Math.max(0, (pageIdx - scrollThreshhold) * borderSize),
      });
    });
  }, [pageWidth, data, visibleDots, borderSize]);

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
          transform: [{ translateX }],
        }}
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
