import * as React from "react";
import {
  Animated,
  FlatList,
  FlatListProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
  Dimensions,
  ListRenderItemInfo,
  StyleProp,
  ViewStyle,
} from "react-native";

import { PaginationProps } from "./types";

export type PaginationLocation = "top" | "left" | "right" | "bottom";
export type PaginationAlignment = "start" | "center" | "end";

type PagingListPaginationVariables<PagT extends PaginationProps> = {
  component: React.FunctionComponent<PagT>;
  horizontal?: boolean;
  componentProps?: Omit<PagT, keyof Omit<PaginationProps, "style">>;
  location?: PaginationLocation;
  align?: PaginationAlignment;
};

export type PagingListPagination<PagT extends PaginationProps> = Partial<
  Omit<PagT, keyof PaginationProps>
> extends Omit<PagT, keyof PaginationProps>
  ? PagingListPaginationVariables<PagT>
  : Required<PagingListPaginationVariables<PagT>>;

export interface PagingListProps<ItemT, PagT extends PaginationProps<ItemT>>
  extends FlatListProps<ItemT> {
  pagination?: PagingListPagination<PagT>;
}

function locationToFlexDirection(
  location: PaginationLocation
): "row" | "column" | "row-reverse" | "column-reverse" {
  switch (location) {
    case "bottom":
      return "column";
    case "top":
      return "column-reverse";
    case "left":
      return "row-reverse";
    case "right":
      return "row";
  }
}

function paginationAlign(
  align: PaginationAlignment
): "flex-end" | "center" | "flex-start" {
  switch (align) {
    case "end":
      return "flex-end";
    case "center":
      return "center";
    case "start":
      return "flex-start";
  }
}

function getPageSizes(style: StyleProp<ViewStyle>): {
  pageWidth: number;
  pageHeight: number;
} {
  const window = Dimensions.get("window");

  const { width, maxWidth, height, maxHeight } = style as Record<
    "width" | "height" | "maxWidth" | "maxHeight",
    string | number | undefined
  >;

  const value = (prop: string | number | undefined, name: "width" | "height") =>
    typeof prop === "string"
      ? (window[name] * Number(prop.slice(0, -1))) / 100
      : prop;

  return {
    pageWidth:
      value(width, "width") || value(maxWidth, "width") || window.width,
    pageHeight:
      value(height, "height") || value(maxHeight, "height") || window.height,
  };
}

export default function PagingList<ItemT, PagT extends PaginationProps<ItemT>>(
  props: PagingListProps<ItemT, PagT>
) {
  const {
    data,
    pagination,
    onScroll,
    renderItem,
    horizontal,
    style,
    ...listProps
  } = {
    ...{ horizontal: false },
    ...props,
  };
  const {
    horizontal: paginationHorizonal,
    location,
    align,
  } = {
    ...{ horizontal: true, location: "bottom", align: "center" },
    ...pagination,
  } as Required<PagingListPaginationVariables<PagT>>;

  const { pageWidth, pageHeight } = getPageSizes(style);
  const contentOffset = React.useRef(new Animated.Value(0)).current;

  const onListScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      horizontal
        ? Animated.event(
            [{ nativeEvent: { contentOffset: { x: contentOffset } } }],
            {
              useNativeDriver: false,
            }
          )(event)
        : Animated.event(
            [{ nativeEvent: { contentOffset: { y: contentOffset } } }],
            {
              useNativeDriver: false,
            }
          )(event);

      if (undefined !== onScroll) {
        onScroll(event);
      }
    },
    [horizontal, onScroll]
  );
  const listRenderItem = React.useCallback(
    (info: ListRenderItemInfo<ItemT>) => (
      <View
        style={[
          {
            alignItems: "center",
            justifyContent: "center",
          },
          horizontal ? { width: pageWidth } : { height: pageHeight },
        ]}
      >
        {renderItem !== null && renderItem !== undefined
          ? renderItem(info)
          : null}
      </View>
    ),
    [horizontal, pageWidth, pageHeight, renderItem]
  );

  const PaginationComponent =
    undefined === pagination?.component ? null : pagination.component;

  const { style: paginationStyle, ...paginationProps } = {
    ...pagination?.componentProps,
  };

  return (
    <View style={[{ flexDirection: locationToFlexDirection(location) }]}>
      <FlatList
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        {...listProps}
        pagingEnabled={true}
        data={data}
        renderItem={listRenderItem}
        onScroll={onListScroll}
        horizontal={horizontal}
        style={[
          style,
          horizontal ? { width: pageWidth } : { height: pageHeight },
        ]}
      />
      {PaginationComponent !== null ? (
        <PaginationComponent
          {...(paginationProps as PagT)}
          style={[paginationStyle, { alignSelf: paginationAlign(align) }]}
          data={data}
          offset={contentOffset}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
          horizontal={paginationHorizonal}
          listHorizontal={horizontal}
        />
      ) : null}
    </View>
  );
}
