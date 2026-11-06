import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { brochureDemoEnvironment } from './run-brochure-demo.mjs'

test('local brochure demo strips inherited and dotenv credentials and keeps delivery disabled', () => {
  const env = brochureDemoEnvironment(resolve('synthetic-bundle'), {
    PATH: process.env.PATH, RESEND_API_KEY: 'never-inherit', DATABASE_URL: 'never-inherit',
    CUSTOM_SERVICE_SECRET: 'never-inherit',
  }, ['CUSTOM_SERVICE_SECRET=private\nRESEND_API_KEY=private\nBROCHURE_EMAIL_ENABLED=true'])
  assert.equal(env.RESEND_API_KEY, '')
  assert.equal(env.DATABASE_URL, '')
  assert.equal(env.CUSTOM_SERVICE_SECRET, '')
  for (const name of ['LEAD_INTAKE_ENABLED', 'LEAD_DELIVERY_ENABLED', 'LEAD_NOTIFICATIONS_ENABLED', 'LEAD_SHEETS_ENABLED', 'BROCHURE_EMAIL_ENABLED']) {
    assert.equal(env[name], 'false')
  }
  assert.equal(env.HAUS_BROCHURE_DEMO_ENABLED, 'true')
  assert.equal(env.HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW, 'true')
  assert.equal(env.NODE_ENV, 'development')
  assert.equal(env.HAUS_NEXT_DIST_DIR, '.next-brochure-demo')
})
