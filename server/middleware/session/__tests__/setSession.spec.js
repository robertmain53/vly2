import test from 'ava'
import setSession from '../setSession'
import MemoryMongo from '../../../util/test-memory-mongo'
import Person from '../../../api/person/person'
import people from '../../../api/person/__tests__/person.fixture'
import { jwtData, jwtDataBob, jwtDataCharles, jwtDataExpired, DEFAULT_SESSION } from './setSession.fixture'
import sinon from 'sinon'
import jwt from 'jsonwebtoken'
import MockResponse from 'mock-express-response'

test.before('before connect to database', async (t) => {
  try {
    t.context.memMongo = new MemoryMongo()
    await t.context.memMongo.start()
    await Person.create(people).catch((err) => `Unable to create people: ${err}`)
    // await appReady
  } catch (e) { console.error('setSession.spec.js test.before error:', e) }
})

test.after.always(async (t) => {
  await t.context.memMongo.stop()
})

test('check fixture token', t => {
  const decoded = jwt.verify(jwtData.idToken, 'secret')
  t.is(decoded.email, 'andrew@groat.nz') // bar
})
test('Check session set to default when user not logged in', async t => {
  const next = sinon.spy()
  const req = { url: '/api/foo', cookies: {}, headers: { cookie: null } }
  await setSession(req, null, next)
  t.deepEqual(req.session, DEFAULT_SESSION)
  t.truthy(next.calledOnce)
})

test('Check session set to default when idToken is bad', async t => {
  const next = sinon.spy()

  const req = { url: '/api/foo', cookies: { idToken: 'foo' } }
  await setSession(req, null, next)
  t.deepEqual(req.session, DEFAULT_SESSION)
  t.truthy(next.calledOnce)
})

test('Check session set to default when url is blacklisted', async t => {
  const next = sinon.spy()
  const req = { url: '/static/someimage.jpg', cookies: { idToken: jwtData.idToken } }
  await setSession(req, null, next)
  t.deepEqual(req.session, DEFAULT_SESSION)
  t.truthy(next.calledOnce)
})

test('Check session set when user logged in', async t => {
  const next = sinon.spy()
  const req = { url: '/api/foo', cookies: { idToken: jwtData.idToken } }
  await setSession(req, null, next)
  t.true(req.session.isAuthenticated)
  t.is(req.session.user.email, jwtData.idTokenPayload.email)
  t.is(req.session.me.nickname, jwtData.idTokenPayload.nickname)
  t.truthy(next.calledOnce)
})

test('Check session set for API call with Bearer header', async t => {
  const next = sinon.spy()
  const req = { url: '/api/foo', headers: { authorization: `Bearer ${jwtData.idToken}` } }
  await setSession(req, null, next)
  t.true(req.session.isAuthenticated)
  t.is(req.session.user.email, jwtData.idTokenPayload.email)
  t.is(req.session.me.nickname, jwtData.idTokenPayload.nickname)
  t.truthy(next.calledOnce)
})

test('Check session not Auth if email not verified', async t => {
  const next = sinon.spy()
  const req = { url: '/api/foo', headers: { authorization: `Bearer ${jwtDataBob.idToken}` } }
  await setSession(req, null, next)
  t.false(req.session.isAuthenticated)
  t.truthy(next.calledOnce)
})

test('Check idToken cookie cleared for expired sessions', async t => {
  const next = sinon.spy()
  const req = { url: '/api/foo', headers: { authorization: `Bearer ${jwtDataExpired.idToken}` } }
  const res = new MockResponse()

  await setSession(req, res, next)
  const headers = res.getHeaders()
  t.is(
    headers['set-cookie'],
    'idToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'idToken cookie should be cleared if expired JWT is found'
  )
  t.false(req.session.isAuthenticated)
  t.truthy(next.calledOnce)
})

test('a person is created if new user signs in', async t => {
  const next = sinon.spy()
  const req = { url: '/api/foo', headers: { authorization: `Bearer ${jwtDataCharles.idToken}` } }
  await setSession(req, null, next)
  t.true(req.session.isAuthenticated)
  t.is(req.session.user.email, jwtDataCharles.idTokenPayload.email)
  t.is(req.session.me.nickname, jwtDataCharles.idTokenPayload.nickname)
  t.truthy(next.calledOnce)
})
