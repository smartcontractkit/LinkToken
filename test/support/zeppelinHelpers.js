assertJump = function assertJump(error, q = 'invalid opcode') {
  assert.isAbove(error.message.search(q), -1, `'${q}' error must be returned: ${error.message}`)
}
