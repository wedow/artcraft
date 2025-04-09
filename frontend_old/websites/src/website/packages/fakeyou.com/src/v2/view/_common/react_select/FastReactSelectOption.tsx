import React from "react";
import { components } from "react-select";

// This is an override to library "react-select"'s default option.
// There are numerous issues with performance that this improves.
// See the detailed thread about it: https://github.com/JedWatson/react-select/issues/3128
export class FastReactSelectOption extends React.Component {
  render() {
    const {innerProps, isFocused, ...otherProps} = this.props as any;
    const {onMouseMove, onMouseOver, ...otherInnerProps} = innerProps;
    const newProps = {innerProps: {...otherInnerProps}, ...otherProps};
    return (
      <components.Option {...newProps} className="">{this.props.children}
      </components.Option>
    );
  }
}
