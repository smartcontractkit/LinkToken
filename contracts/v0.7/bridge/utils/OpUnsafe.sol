// SPDX-License-Identifier: MIT
pragma solidity >0.6.0 <0.8.0;

/**
 * @dev Contract module that helps declare and check safe/unsafe calls to a function.
 *
 * Inheriting from `OpUnsafe` will make the {unsafe} and {safe} modifiers
 * available, which can be applied to functions to indicate safe or unsafe operations.
 * Private {_isUnsafe} function can be used to check if an unsafe operation is in progress,
 * which can be useful to disable some checks that are enabled by default.
 */
abstract contract OpUnsafe {
  /// @dev Indicates that we are doing an unsafe operation.
  bool private s_unsafe;

  /// @dev Modifier to declare an function as unsafe.
  modifier unsafe() {
    // Top level function call indicator
    bool alreadyUnsafe = s_unsafe;

    // Mark as unsafe only if top level function call
    if (!alreadyUnsafe) {
      s_unsafe = true;
    }

    _;

    // Mark as safe only if top level function call
    if (!alreadyUnsafe) {
      s_unsafe = false;
    }
  }

  /// @dev Modifier to require safe execution.
  modifier safe() {
    require(!s_unsafe, "OpUnsafe: unsafe call");

    _;
  }

  /// @dev Returns true if and only if the function is running in unsafe mode
  function _isUnsafe()
    internal
    view
    returns (bool)
  {
    return s_unsafe;
  }
}
