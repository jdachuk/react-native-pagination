import * as React from "react";
import { ListRenderItemInfo, StyleSheet, View } from "react-native";

import PagingList from "./src/PagingList";
import ExpandingDot from './src/ExpandingDot';
import LiquidLikeDot from './src/LiquidLikeDot';
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
  const keyExtractor = React.useCallback((_, index) => index.toString(), []);
  const renderItem = ({ item }: ListRenderItemInfo<string>) => (
    <View
      style={[{
        backgroundColor: item,
      }, StyleSheet.absoluteFill]}
    />
  );

  return (
    <View style={styles.container}>
      <PagingList
        data={COLORS}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        pagination={{ component: SlidingDot, horizontal: false, location: "right" }}
        style={{ maxHeight: 300, maxWidth: 300, width: 300 }}
        horizontal={false}
      />
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
});
