const fs = require('fs')
const AWS = require('aws-sdk')

const MAX_BATCH_SIZE = 25
const FILE = process.env.FILE
const TABLE = process.env.TABLE

const db = new AWS.DynamoDB({
  endpoint: 'http://localhost:9020'
})
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'))

console.log(`Table: ${TABLE}`)
console.log(`File ${FILE} entries: ${data.length}`)

const buildList = (items) => items.map(buildAttribute)

const buildAttribute = (attribute) => {
  const output = {}
  Object.keys(attribute).map((type) => {
    const typeCaps = type.toUpperCase()
    const value = attribute[type]
    switch (typeCaps) {
      case 'M':
        output[typeCaps] = buildAttributes(value)
        return
      case 'L':
      case 'BS':
      case 'NS':
        output[typeCaps] = buildList(value)
        return
      case 'N':
      case 'S':
      case 'SS':
      case 'BOOL':
      case 'NULL':
        output[typeCaps] = value
        return
      default:
        console.error(`Unhandled type: ${type}`, value)
        process.exit(1)
        return
    }
  })
  return output
}

const buildAttributes = (item) => {
  const output = {}
  Object.keys(item).map((key) => {
    output[key] = buildAttribute(item[key])
  })
  return output
}

const buildPutRequests = (items) => items.map((item) => ({
  PutRequest: {
    Item: buildAttributes(item)
  }
}))

const chunk = (arr, size) => {
  const output = []
  for (let i = 0; i < arr.length; i += size) {
    output.push(arr.slice(i, i + size))
  }
  return output
}

const processBatch = (chunk) => new Promise((resolve, reject) => {
  var params = {
    RequestItems: {
      [TABLE]: buildPutRequests(chunk)
    }
  }

  db.batchWriteItem(params, (err, data) => {
    if (err) {
      console.log(err, err.stack)
      reject(err)
      return
    }
    console.log(`Processed batch write`)
    resolve(data)
  })
})

const batches = chunk(data, MAX_BATCH_SIZE)

Promise.all(batches.map(processBatch))
  .then(() => {
    console.log(`Processed ${batches.length} batches`)
  })
  .catch((err) => {
    console.log(`Error processing ${batches.length} batches`, err)
  })
