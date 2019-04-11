const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 3000
const version = require('./package.json').version
const fs = require('fs') 
const level = require('level') 
const csv = require('csv')

app.use(bodyParser.json()); 

const dbName = './leveldb'
const seedData = './seed-data.csv'

function seedLevel(db, csvFile, cb) {
  let stream = fs.createReadStream(seedData, {encoding: 'utf8'})  
  let parser = csv.parse({trim: true, skip_empty_lines: true, columns: true})
  stream.pipe(parser)
  parser.on('readable', () => {
    let record
    while (record = parser.read()) {
      let tmp = Object.assign({}, record )
      db.put(tmp['UPC'], record, (err) => {
        if (err) {
          console.log(`There was an error adding ${tmp}: ${err}`)
        } else {
          db.get(tmp['UPC'], (err, value) => {
            if (err) {
              console.log('Got an error when getting value from', tmp['UPC'])
            } else {
              console.log('Successfully add this value to DB: ', value) 
            } 
          })
        }
      }) 
    }
  })
  parser.on('error', err => cb(err))
  parser.on('end', cb) 
} 

function exists(path, cb) {
  fs.stat(path, function(err, stat) {
    if(err == null) {
      cb(null)
    } else if(err.code === 'ENOENT') {
      cb(err) 
    } else {
      cb(err)
      console.log('Some other error: ', err.code);
    }
  });
}

const requiredFields = [
  "PRODUCT NAME", 
  "UPC",
  "MANUFACTURER",
  "QUANTITY_ON_HAND", 
  "STORAGE_LOCATION",
  "LAST_ORDERED_AT", 
]

function missingFields(obj) {
  let keys = Object.keys(obj) 
  let missingFields = requiredFields.reduce( (acc, cur) => {
    if (!keys.includes(cur)) acc.push(cur) 
    return acc
  }, [])
  return missingFields
} 

exists(dbName, err => {
  if (err) {
    exists(seedData, err => {
      let db = level(dbName, { valueEncoding: 'json' }) 
      if (err) {
        // Start empty leveldb
        console.log('No seed data could be found: ', err) 
      } else {
        // initialized levelDB with Seed
        console.log('Seeding the db with ', seedData) 
        seedLevel(db, seedData, (err) =>{
          if (err) {
            console.log('There was an error populating DB!', err) 
          } else {
            console.log('Successfully populated the data base!')
            start(db) 
          } 
        }) 
      } 
    })  
  } else {
    let db = level(dbName, { valueEncoding: 'json' }) 
    start(db) 
  }
}) 


function start(db) {
  function getInventory(req, res){
    returnedData = []
    db.createReadStream()
      .on('data', data => {
        returnedData.push(data.value) 
      }) 
      .on('close', ()=>{
        console.log('Stream closed') 
      })
      .on('error', (err) => {
        console.log('Internal server error', err) 
        res.status(500).send(err)
      })
      .on('end',  () => {
        console.log('The stream has ended') 
        res.json(returnedData)
      })
  } 

  function getUpc(req, res) {
    console.log(`GET ${req.params.upc}`)
    if (req.params.upc) {
      db.get(req.params.upc, (err, data) => {
        if (err) {
          console.log('err =', err)
          res.status(400).json({error: "Not found!"}) 
        } else {
          res.json(data) 
        }
      }) 
    } else {
      res.status(400).json({error: "UPC required!"})
    } 
  }

  function deleteUpc(req, res) {
    console.log(`DELETE ${req.params.upc}`)
    if (req.params.upc) {
      db.del(req.params.upc, (err) => {
        if (err) {
          res.status(400).json({error: "Not found!"}) 
        } else {
          res.status(200).send()
        }
      }) 
    } else {
      res.status(400).json({error: "UPC required!"})
    } 
  }

  function updateUpc(req, res) {
    console.log('PUT = ', req.body) 
    let f = missingFields(req.body) 
    if (f.length != 0) {
      console.log('Request is missing fields: ', f) 
      res.status(400).send({error: 'Request is missing fields '+ JSON.stringify(f)})
    } else {
      db.put(req.body['UPC'], req.body, (err) => {
        if (err) res.status(500).send({error: err})
        else res.status(200).send()
      }) 
    } 
  }

  const op = {
    dec: (quantity, by) => Number(quantity) - Number(by), 
    inc: (quantity, by) => Number(quantity) + Number(by)
  } 

  function updateQuantity(req, res) {
    console.log('PATCH = ', req.body) 
    console.log('PATCH = ', req.params) 
    if (!req.body.type) {
      res.status(400).json({error: "'type' must be present in body"})
    } else if (!req.body.by) {
      res.status(400).json({error: "'by' must be present in body"})
    } else if (req.body.type != "inc" && req.body.type != "dec") { 
      res.status(400).json({error: "type must either be 'inc' or 'dec' not " + req.body.type})
    } else {
      db.get(req.params.upc, (err, data) => {
        if (err) res.status(500).json({error: err})
        else {
          let quantity = op[req.body.type](data["QUANTITY_ON_HAND"], req.body.by)
          if (quantity < 0) {
            res.status(400).json({error: `Only ${data["QUANTITY_ON_HAND"]} left in ${data["UPC"]}, cannot decrement by ${req.body.by}.`})
          } else {
            data["QUANTITY_ON_HAND"] = quantity
            db.put(data["UPC"], data, (err) => {
              if (err) res.status(500).json({error: err})
              else {
                res.status(200).send(data) 
              } 
            }) 
          }
        } 
      })
    } 
  } 

  app.get('/', (req, res) => res.send(`Get yer inventory v${version}`))
  app.get('/inventory', getInventory) 
  app.put('/inventory', updateUpc) 
  app.get('/inventory/:upc', getUpc) 
  app.delete('/inventory/:upc', deleteUpc) 
  app.patch('/inventory/:upc/quantity', updateQuantity) 
  app.listen(port, () => console.log(`Inventory app listening on port ${port}!`))
} 
