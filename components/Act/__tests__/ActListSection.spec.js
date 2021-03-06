import React from 'react'
import test from 'ava'
import { ActListSection } from '../ActListSection'
import { mountWithIntl } from '../../../lib/react-intl-test-helper'
import acts from '../../../server/api/activity/__tests__/activity.fixture'
import objectid from 'objectid'
// import withMockRoute from '../../../server/util/mockRouter'
import sinon from 'sinon'
import * as nextRouter from 'next/router'
import configureStore from 'redux-mock-store'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'

test.before('Setup fixtures', (t) => {
  // not using mongo or server here so faking ids
  acts.map(p => { p._id = objectid().toString() })
  t.context.props = {
    activities: {
      sync: true,
      syncing: false,
      loading: false,
      data: acts,
      request: null
    }
  }
  const me = {
    nickname: 'Testy'
  }
  t.context.defaultstore = {
    session: {
      isAuthenticated: true,
      user: { nickname: me.nickname },
      me
    },
    activities: {
      sync: true,
      syncing: false,
      loading: false,
      data: [acts[0]],
      request: null
    }
  }
  t.context.mockStore = configureStore([thunk])(t.context.defaultstore)
})

test.before('Setup Route', (t) => {
  t.context.router = {
    pathname: '/acts',
    route: '/acts',
    query: { search: 'sun' },
    asPath: '/acts?search=sun',
    initialProps: {},
    pageLoader: sinon.fake(),
    App: sinon.fake(),
    Component: sinon.fake(),
    replace: sinon.fake(),
    push: sinon.fake(),
    back: sinon.fake()
  }
  const router = () => { return (t.context.router) }
  sinon.replace(nextRouter, 'useRouter', router)
})

test('render ActListSection', async t => {
  // const props = await ActListSection.getInitialProps({ store: t.context.store })
  const router = nextRouter.useRouter()
  const wrapper = mountWithIntl(
    <Provider store={t.context.mockStore}>
      <ActListSection />
    </Provider>
  )

  // handle search
  const search = wrapper.find('Search').first()
  search.props().onSearch('moon')
  t.deepEqual(router.replace.args[0][1], { query: { search: 'moon' } })
})
