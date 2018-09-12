assertJump = function assertJump(error) {
  assert.isAbove(error.message.search('revert'), -1, 'Revert error must be returned');
}
