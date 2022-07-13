import * as React from "react";
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  View,
} from "react-native";
import ExpandingDot from "./src/ExpandingDot";
import ScalingDot from "./src/ScalingDot";
import SlidingBorder from "./src/SlidingBorder";
import SlidingDot from "./src/SlidingDot";

const COLORS: string[] = [
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
  "#ffffff",
  "#2b4162",
  "#0b6e4f",
  "#721817",
  "#fa9f42",
];

export default function App() {
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const keyExtractor = React.useCallback((_, index) => index.toString(), []);

  const renderItem = ({ item }: ListRenderItemInfo<string>) => (
    <View
      style={{
        width: 300,
        height: 300,
        backgroundColor: item,
      }}
    />
  );

  const paginationProps = {
    data: COLORS,
    scrollX,
    pageWidth: 300,
    style: styles.pagination,
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={COLORS}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        pagingEnabled
        horizontal
        renderItem={renderItem}
        scrollEventThrottle={16}
        style={{
          maxHeight: 300,
          width: 300,
        }}
      />
      <ScalingDot {...paginationProps} />
      <SlidingBorder {...paginationProps} />
      <ExpandingDot {...paginationProps} />
      <SlidingDot {...paginationProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#525252",
    alignItems: "center",
    paddingTop: 40,
  },
  pagination: {
    margin: 5,
  },
});
