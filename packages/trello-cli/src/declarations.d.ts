// Ambient declarations for ESM-only ink packages.
// These packages use the `exports` field in package.json for type resolution,
// which requires moduleResolution "node16" or "bundler". Since this project
// uses the default "node" resolution, we provide ambient declarations here.

declare module "ink" {
  import type { FC, ReactNode } from "react";

  export interface RenderOptions {
    stdout?: NodeJS.WriteStream;
    stderr?: NodeJS.WriteStream;
    stdin?: NodeJS.ReadStream;
    debug?: boolean;
    exitOnCtrlC?: boolean;
    patchConsole?: boolean;
  }

  export interface Instance {
    rerender: (tree: ReactNode) => void;
    unmount: () => void;
    waitUntilExit: () => Promise<void>;
    cleanup: () => void;
    clear: () => void;
  }

  export function render(tree: ReactNode, options?: RenderOptions): Instance;

  export interface BoxProps {
    flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
    flexGrow?: number;
    flexShrink?: number;
    flexBasis?: number | string;
    flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
    alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
    alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch";
    justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    padding?: number;
    paddingX?: number;
    paddingY?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    margin?: number;
    marginX?: number;
    marginY?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    gap?: number;
    columnGap?: number;
    rowGap?: number;
    borderStyle?: "single" | "double" | "round" | "bold" | "singleDouble" | "doubleSingle" | "classic";
    borderColor?: string;
    borderTop?: boolean;
    borderBottom?: boolean;
    borderLeft?: boolean;
    borderRight?: boolean;
    borderDimColor?: boolean;
    display?: "flex" | "none";
    overflow?: "visible" | "hidden";
    overflowX?: "visible" | "hidden";
    overflowY?: "visible" | "hidden";
    children?: ReactNode;
  }

  export const Box: FC<BoxProps>;

  export interface TextProps {
    color?: string;
    backgroundColor?: string;
    dimColor?: boolean;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    inverse?: boolean;
    wrap?: "wrap" | "truncate" | "truncate-start" | "truncate-middle" | "truncate-end";
    children?: ReactNode;
  }

  export const Text: FC<TextProps>;

  export interface Key {
    upArrow: boolean;
    downArrow: boolean;
    leftArrow: boolean;
    rightArrow: boolean;
    pageDown: boolean;
    pageUp: boolean;
    return: boolean;
    escape: boolean;
    ctrl: boolean;
    shift: boolean;
    tab: boolean;
    backspace: boolean;
    delete: boolean;
    meta: boolean;
  }

  export function useInput(
    inputHandler: (input: string, key: Key) => void,
    options?: { isActive?: boolean }
  ): void;

  export function useApp(): { exit: (error?: Error) => void };

  export function useStdout(): { stdout: NodeJS.WriteStream | undefined; write: (data: string) => void };
  export function useStderr(): { stderr: NodeJS.WriteStream | undefined; write: (data: string) => void };
  export function useStdin(): {
    stdin: NodeJS.ReadStream | undefined;
    isRawModeSupported: boolean;
    setRawMode: (value: boolean) => void;
  };

  export function useFocus(options?: { autoFocus?: boolean; isActive?: boolean; id?: string }): { isFocused: boolean };
  export function useFocusManager(): { focusNext: () => void; focusPrevious: () => void; enableFocus: () => void; disableFocus: () => void; focus: (id: string) => void };

  export interface NewlineProps {
    count?: number;
  }
  export const Newline: FC<NewlineProps>;

  export const Spacer: FC;

  export interface StaticProps<T> {
    items: T[];
    children: (item: T, index: number) => ReactNode;
    style?: BoxProps;
  }
  export function Static<T>(props: StaticProps<T>): JSX.Element;

  export interface TransformProps {
    transform: (children: string) => string;
    children?: ReactNode;
  }
  export const Transform: FC<TransformProps>;
}

declare module "ink-text-input" {
  import type { FC } from "react";

  interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: (value: string) => void;
    placeholder?: string;
    focus?: boolean;
    mask?: string;
    highlightPastedText?: boolean;
    showCursor?: boolean;
  }

  const TextInput: FC<TextInputProps>;
  export default TextInput;
}

declare module "ink-spinner" {
  import type { FC } from "react";

  interface SpinnerProps {
    type?:
      | "dots"
      | "dots2"
      | "dots3"
      | "dots4"
      | "dots5"
      | "dots6"
      | "dots7"
      | "dots8"
      | "dots9"
      | "dots10"
      | "dots11"
      | "dots12"
      | "line"
      | "line2"
      | "pipe"
      | "simpleDots"
      | "simpleDotsScrolling"
      | "star"
      | "star2"
      | "flip"
      | "hamburger"
      | "growVertical"
      | "growHorizontal"
      | "balloon"
      | "balloon2"
      | "noise"
      | "bounce"
      | "boxBounce"
      | "boxBounce2"
      | "triangle"
      | "arc"
      | "circle"
      | "squareCorners"
      | "circleQuarters"
      | "circleHalves"
      | "squish"
      | "toggle"
      | "toggle2"
      | "toggle3"
      | "toggle4"
      | "toggle5"
      | "toggle6"
      | "toggle7"
      | "toggle8"
      | "toggle9"
      | "toggle10"
      | "toggle11"
      | "toggle12"
      | "toggle13"
      | "arrow"
      | "arrow2"
      | "arrow3"
      | "bouncingBar"
      | "bouncingBall"
      | "smiley"
      | "monkey"
      | "hearts"
      | "clock"
      | "earth"
      | "moon"
      | "runner"
      | "pong"
      | "shark"
      | "dqpb";
  }

  const Spinner: FC<SpinnerProps>;
  export default Spinner;
}

declare module "ink-select-input" {
  import type { FC } from "react";

  interface Item<V> {
    label: string;
    value: V;
    key?: string;
  }

  interface SelectInputProps<V = string> {
    items: Item<V>[];
    onSelect?: (item: Item<V>) => void;
    onHighlight?: (item: Item<V>) => void;
    indicatorComponent?: FC<{ isSelected: boolean }>;
    itemComponent?: FC<{ isSelected: boolean; label: string }>;
    initialIndex?: number;
    limit?: number;
    isFocused?: boolean;
  }

  function SelectInput<V = string>(props: SelectInputProps<V>): JSX.Element;
  export default SelectInput;
}
