import test from 'ava'
import request from 'supertest'
import { server, appReady } from '../../../server'
import Activity from '../activity'
import Person from '../../person/person'
import MemoryMongo from '../../../util/test-memory-mongo'
import people from '../../person/__tests__/person.fixture'
import acts from './activity.fixture.js'

test.before('before connect to database', async (t) => {
  await appReady
  t.context.memMongo = new MemoryMongo()
  await t.context.memMongo.start()
})

test.after.always(async (t) => {
  await t.context.memMongo.stop()
})

test.beforeEach('connect and add two oppo entries', async (t) => {
  // connect each oppo to a requestor.
  t.context.people = await Person.create(people).catch((err) => `Unable to create people: ${err}`)
  acts.map((act, index) => { act.owner = t.context.people[index]._id })
  t.context.activities = await Activity.create(acts).catch((err) => console.log('Unable to create activities', err))
})

test.afterEach.always(async () => {
  await Activity.deleteMany()
  await Person.deleteMany()
})

test.serial('verify fixture database has acts', async t => {
  const count = await Activity.countDocuments()
  t.is(count, t.context.activities.length)
  // can find all
  const p = await Activity.find()
  t.is(t.context.activities.length, p.length)

  // can find by things
  const q = await Activity.findOne({ title: '4 The first 100 metres' })
  t.is(q && q.duration, '2 hours')
})

test.serial('Should correctly give count of all acts sorted by title', async t => {
  const res = await request(server)
    .get('/api/activities')
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
  const got = res.body
  // console.log(got)
  t.is(4, got.length)

  t.is(got[0].title, acts[0].title)
})

test.serial('Should correctly give subset of acts matching status', async t => {
  const res = await request(server)
    .get('/api/activities?q={"status":"draft"}')
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
  const got = res.body
  // console.log('got', got)
  t.is(got.length, 2)
})

test.serial('Should correctly select just the titles and ids', async t => {
  const res = await request(server)
    .get('/api/activities?p={"title": 1}')
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
  const got = res.body
  // console.log('got', got)
  t.is(got.length, 4)
  t.is(got[0].status, undefined)
  t.is(got[0].title, acts[0].title)
})

test.serial('Should correctly give number of active activities', async t => {
  const res = await request(server)
    .get('/api/activities?q={"status": "active"}')
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
    // .expect('Content-Length', '2')
  const got = res.body

  t.deepEqual(2, got.length)
})

test.serial('Should send correct data when queried against an _id', async t => {
  t.plan(2)

  const act1 = t.context.activities[1]
  const person1 = t.context.people[1]
  const res = await request(server)
    .get(`/api/activities/${act1._id}`)
    .set('Accept', 'application/json')
    .expect(200)
  t.is(res.body.title, act1.title)
  // verify owner was populated out
  t.is(res.body.owner.name, person1.name)
})

test.serial('Should correctly add an activity', async t => {
  t.plan(2)

  const res = await request(server)
    .post('/api/activities')
    .send({
      title: 'The first 400 metres',
      subtitle: 'Launching into space step 3',
      imgUrl: 'https://image.flaticon.com/icons/svg/206/206857.svg',
      description: 'Project to build a simple rocket that will reach 400m',
      duration: '4 hours'
    })
    .set('Accept', 'application/json')

  t.is(res.status, 200)

  const savedActivity = await Activity.findOne({ title: 'The first 400 metres' }).exec()
  t.is(savedActivity.subtitle, 'Launching into space step 3')
})

test.serial('Should correctly delete an activity', async t => {
  t.plan(2)

  const opp = new Activity({
    _id: '5cc8d60b8b16812b5b3920c3',
    title: 'The first 1000 metres',
    subtitle: 'Launching into space step 4',
    imgUrl: 'https://image.flaticon.com/icons/svg/206/206857.svg',
    description: 'Project to build a simple rocket that will reach 1000m',
    duration: '4 hours'
  })
  opp.save()

  const res = await request(server)
    .delete(`/api/activities/${opp._id}`)
    .set('Accept', 'application/json')

  t.is(res.status, 200)

  const queriedActivity = await Activity.findOne({ _id: opp._id }).exec()
  t.is(queriedActivity, null)
})

// Searching by something in the title (case insensitive)
test.serial('Should correctly give activity 3 when searching by "garden"', async t => {
  const res = await request(server)
    .get('/api/activities?search=GarDen')
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
  const got = res.body
  t.is(acts[2].title, got[0].title)
  t.is(1, got.length)
})

// Searching for something in the description (case insensitive)
test.serial('Should correctly give activity 2 when searching by "Algorithms"', async t => {
  const res = await request(server)
    .get('/api/activities?search=AlgorithMs')
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /json/)
  const got = res.body
  t.is(acts[1].description, got[0].description)
  t.is(1, got.length)
})