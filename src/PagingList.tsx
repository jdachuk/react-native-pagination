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
  FlexStyle,
} from "react-native";

import { PaginationProps } from "./types";

export type PaginationPosition = "top" | "left" | "right" | "bottom";
export type PaginationAlignment = "start" | "center" | "end";

type PagingListPaginationVariables<PagT extends PaginationProps> = {
  component: React.FunctionComponent<PagT>;
  horizontal?: boolean;
  componentProps?: Omit<PagT, keyof Omit<PaginationProps, "style">>;
  position?: PaginationPosition;
  align?: PaginationAlignment;
  insideList?: boolean;
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

function absoluteAlign(
  pos: PaginationPosition,
  align: PaginationAlignment
): {
  position: "absolute";
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
} {
  return {
    position: "absolute",
    top: pos === "top" || (pos !== "bottom" && align !== "end") ? 0 : undefined,
    left:
      pos === "left" || (pos !== "right" && align !== "end") ? 0 : undefined,
    right:
      pos === "right" || (pos !== "left" && align !== "start") ? 0 : undefined,
    bottom:
      pos === "bottom" || (pos !== "top" && align !== "start") ? 0 : undefined,
  };
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

const flexDirection: {
  [K in PaginationPosition]: FlexStyle["flexDirection"];
} = {
  bottom: "column",
  top: "column-reverse",
  left: "row-reverse",
  right: "row",
};

const flexAlignment: {
  [K in PaginationAlignment]: FlexStyle["alignSelf"];
} = {
  end: "flex-end",
  center: "center",
  start: "flex-start",
};

const PAGINATION_DEFAULTS = {
  horizontal: true,
  position: "bottom",
  align: "center",
  insideList: false,
};

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
  } = React.useMemo(
    () => ({
      ...{ horizontal: false },
      ...props,
    }),
    [props]
  );
  const {
    component,
    componentProps,
    horizontal: paginationHorizonal,
    position,
    align,
    insideList,
  } = React.useMemo(
    () =>
      ({
        ...PAGINATION_DEFAULTS,
        ...pagination,
      } as Required<PagingListPaginationVariables<PagT>>),
    [pagination]
  );

  const contentOffset = React.useRef(new Animated.Value(0)).current;
  const { pageWidth, pageHeight } = React.useMemo(
    () => getPageSizes(style),
    [style]
  );

  const onListScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      Animated.event(
        [
          horizontal
            ? { nativeEvent: { contentOffset: { x: contentOffset } } }
            : { nativeEvent: { contentOffset: { y: contentOffset } } },
        ],
        { useNativeDriver: false }
      )(event);

      if (undefined !== onScroll) {
        onScroll(event);
      }
    },
    [horizontal, onScroll]
  );
  const listRenderItem = React.useCallback(
    (params: ListRenderItemInfo<ItemT>) => (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          width: pageWidth,
          height: pageHeight,
        }}
      >
        {renderItem ? renderItem(params) : null}
      </View>
    ),
    [pageWidth, pageHeight, renderItem]
  );

  const PaginationComponent = undefined === component ? null : component;

  const { style: paginationStyle, ...paginationProps } = {
    ...componentProps,
  };

  return (
    <View
      style={[insideList ? {} : { flexDirection: flexDirection[position] }]}
    >
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
        style={[style, { maxWidth: pageWidth, maxHeight: pageHeight }]}
      />
      {PaginationComponent !== null ? (
        <View
          style={[
            insideList
              ? absoluteAlign(position, align)
              : { alignSelf: flexAlignment[align] },
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          <PaginationComponent
            {...(paginationProps as PagT)}
            data={data}
            offset={contentOffset}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
            horizontal={paginationHorizonal}
            listHorizontal={horizontal}
            style={paginationStyle}
          />
        </View>
      ) : null}
    </View>
  );
}
