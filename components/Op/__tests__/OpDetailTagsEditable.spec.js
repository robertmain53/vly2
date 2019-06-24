import React from 'react'
import test from 'ava'
import { mountWithIntl } from '../../../lib/react-intl-test-helper'
import OpDetailTagsEditable from '../OpDetailTagsEditable'
import sinon from 'sinon'

const originalWarn = console.warn

test.before('before test silence async-validator', () => {
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].startsWith('async-validator:')) return
    originalWarn(...args)
  }
})

test.after.always(() => {
  console.warn = originalWarn
})

test('render the op with a few pre-existing tags', t => {
  const firstTag = 'java'
  const secondTag = 'network'

  const wrapper = mountWithIntl(
    <OpDetailTagsEditable value={[firstTag, secondTag]} existingTags={[]} />
  )

  t.is(wrapper.find('.ant-tag').length, 2)
  t.is(wrapper.find('.ant-tag').at(0).text(), firstTag)
  t.is(wrapper.find('.ant-tag').at(1).text(), secondTag)
})

test('render the op with a few pre-existing tags, and add a tag into the input field', t => {
  const firstTag = 'java'
  const secondTag = 'network'

  const inputTag = 'new tag!'

  const wrapper = mountWithIntl(
    <OpDetailTagsEditable value={[firstTag, secondTag]} existingTags={[]} />
  )

  t.is(wrapper.find('.ant-tag').length, 2)

  wrapper.find('input').simulate('change', { target: { value: inputTag } })

  t.true(wrapper.html().includes('new tag!'))
})

test('render the op with a few pre-existing tags, and add a tag fully, to re-render', t => {
  const firstTag = 'java'
  const secondTag = 'network'
  const inputTag = 'new tag!'

  const mockOnChange = sinon.spy()
  const value = [firstTag, secondTag]
  const expectedNewValue = [firstTag, secondTag, inputTag]

  const wrapper = mountWithIntl(
    <OpDetailTagsEditable onChange={mockOnChange} value={value} existingTags={[]} />
  )

  const wrapperInstance = wrapper.instance()

  t.is(wrapper.find('.ant-tag').length, 2)

  wrapperInstance.handleSearch(inputTag)
  t.is(wrapperInstance.state.inputvalue, inputTag)

  wrapperInstance.optionSelected(inputTag)
  t.is(wrapperInstance.state.inputvalue, '')

  t.true(mockOnChange.calledOnce)
  t.true(mockOnChange.calledWith(expectedNewValue))
})

test('render the op with a few pre-existing tags, and remove a tag from them', t => {
  const firstTag = 'java'
  const secondTag = 'network'
  const mockOnChange = sinon.spy()

  const wrapper = mountWithIntl(
    <OpDetailTagsEditable onChange={mockOnChange} value={[firstTag, secondTag]} existingTags={[]} />
  )

  const wrapperInstance = wrapper.instance()

  wrapperInstance.removeTag('network')

  t.true(mockOnChange.calledOnce)
  t.true(mockOnChange.calledWith([ firstTag ]))
})

test('render when input value doesnt match any existing tags', t => {
  const existingTags = ['JAVA', 'networks'] // case shouldn't matter
  const input = 'ja'
  const mockOnChange = sinon.spy()

  const wrapper = mountWithIntl(
    <OpDetailTagsEditable onChange={mockOnChange} value={[]} existingTags={existingTags} />
  )

  const wrapperInstance = wrapper.instance()

  t.is(wrapper.find('Option').length, 0)
  t.is(wrapperInstance.state.matchingTags.length, 0)

  wrapperInstance.handleSearch(input)

  t.is(wrapperInstance.state.matchingTags.length, 1)
  t.is(wrapperInstance.state.matchingTags[0], 'JAVA')

  // options should be what the user typed, plus any matching tags
  // t.is(wrapper.find('Option').length, 2)
})
