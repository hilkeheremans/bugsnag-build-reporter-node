const https = require('https')
const http = require('http')
const concat = require('concat-stream')
const url = require('url')

module.exports = (endpoint, data, onSuccess, onError, options = {}) => {
  console.log('opts', options)
  const { proxy } = options
  if (typeof proxy === 'string') {
    return proxiedRequest(endpoint, data, onSuccess, onError, proxy)
  } else {
    return normalRequest(endpoint, data, onSuccess, onError)
  }
}

function proxiedRequest (endpoint, data, onSuccess, onError, proxy) {
  const payload = JSON.stringify(data)
  const parsedProxyUrl = url.parse(proxy)
  const parsedUrl = url.parse(endpoint)
  const req = (parsedProxyUrl.protocol === 'https:' ? https : http).request({
    method: 'POST',
    hostname: parsedProxyUrl.hostname,
    path: endpoint,
    port: parsedProxyUrl.port,
    headers: {
      Host: parsedUrl.hostname,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, res => {
    res.pipe(concat(body => {
      if (res.statusCode === 200) return onSuccess()
      if (res.statusCode !== 400) {
        return onError(new Error(`HTTP status ${res.statusCode} received from builds API`))
      }
      try {
        const err = new Error('Invalid payload sent to builds API')
        err.errors = JSON.parse(body).errors
        return onError(err)
      } catch (e) {
        return onError(new Error(`HTTP status ${res.statusCode} received from builds API`))
      }
    }))
  })
  req.on('error', onError)
  req.write(payload)
  req.end()
}

function normalRequest (endpoint, data, onSuccess, onError) {
  const parsedUrl = url.parse(endpoint)
  const payload = JSON.stringify(data)
  const req = (parsedUrl.protocol === 'https:' ? https : http).request({
    method: 'POST',
    hostname: parsedUrl.hostname,
    path: parsedUrl.path || '/',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    port: parsedUrl.port || undefined
  }, res => {
    res.pipe(concat(body => {
      if (res.statusCode === 200) return onSuccess()
      if (res.statusCode !== 400) {
        return onError(new Error(`HTTP status ${res.statusCode} received from builds API`))
      }
      try {
        const err = new Error('Invalid payload sent to builds API')
        err.errors = JSON.parse(body).errors
        return onError(err)
      } catch (e) {
        return onError(new Error(`HTTP status ${res.statusCode} received from builds API`))
      }
    }))
  })
  req.on('error', onError)
  req.write(payload)
  req.end()
}
