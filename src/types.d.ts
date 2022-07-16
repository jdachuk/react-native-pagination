import { Animated, StyleProp, ViewStyle } from "react-native";

export interface PaginationVariables<ItemT> {
  data: Array<ItemT>;
  offset: Animated.Value;
  pageWidth: number;
  pageHeight: number;
  listHorizontal: boolean;
  horizontal?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface PaginationProps<ItemT = any>
  extends PaginationVariables<ItemT> {}
