const express = require('express')
const app = express()
const path = require('path')
const mustacheExpress = require('mustache-express')
const bodyParser = require('body-parser')
const config = require('config')
const mysql = require('mysql')

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.engine('mustache', mustacheExpress())
app.set('views', './views')
app.set('view engine', 'mustache')
app.use(express.static(path.join(__dirname, 'static')))


const conn = mysql.createConnection({
  host: config.get('db.host'),
  database: config.get('db.database'),
  user: config.get('db.user'),
  password: config.get('db.password')
})

//Selecting all items in vending maching
//URL:  vending/{items}
//expected response: {
//id: [int]
//desc:[varchar]
//cost:[int]
//qty:[int]

app.get('/items/all', function(req, res, next){
  const sql = `
  Select * FROM items
  `
  conn.query(sql, [req.params.id], function(err, results, fields){
    res.json({items:results})
  })
})
//Adding additional items to the vending machine

app.post('/items/add', function(req, res, next){
  const description = req.body.description
  const cost = req.body.cost
  const qty = req.body.qty

  const sql = `
  INSERT INTO items (description,cost,qty)
  VALUES (?,?,?)
  `
  conn.query(sql, [description,cost,qty], function(err, results, fields){
    if(!err){
      res.json({
        success: true,
        message:  "item successfully added",
        id:results.insertID
      })
    }
    else{
      console.log(err)
      res.json({
        success: false,
        message: "item not added",
      })
    }
  })
})
//Update items already in the vending maching
app.put('/items/:id', function(req, res, next){
  const description = req.body.description
  const cost = req.body.cost
  const qty = req.body.qty

  const sql = `
  UPDATE items SET description = ?, cost = ?, qty = ?
  WHERE id = ?
  `
  conn.query(sql, [description, cost, qty, req.params.id], function(err, results, fields){
    if(!err){
      res.json({
        success: true,
        message:  "item successfully edited",
        id:results.insertID
      })
    } else {
      console.log(err)
      res.json({
        success: false,
        message: "item not edited",
      })
    }
  })
})
//get a list of all purchased items:

app.get('/purchases/all', function(req, res, next){
  const sql = `
  Select * FROM purchases
  `
  conn.query(sql, [req.params.itemid], function(err, results, fields){
    res.json({purchases:results})
  })
})
//Purchase an item
app.put('/items/purchases/:itemid', function(req, res, next){
  const itemid = req.params.itemid

  const sql = `
  SELECT * FROM items
  WHERE qty > 0 AND id = ?
  `
  conn.query(sql,[req.params.itemid], function(err, results, fields){
    if(err){
        console.log(err)
        res.json()
    } else {
    const sql2 = `
        INSERT INTO purchases (itemid)
        VALUES (?)
        `
      conn.query(sql2,[itemid], function(err,results,fields){
        if (!err) {
          res.json({purchases:results})
        } else {
          console.log(err)
          res.json({
            success: false,
            message: "item is not available",
          })
        }
      })
    }
  })
})

app.listen(3000, function(){
  console.log("App running on port 3000")
})
