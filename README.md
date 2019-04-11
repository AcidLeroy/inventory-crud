# Inventory
CRUD operations on inventory. 

## Installation
`npm install` 

## Running the server
`node server.js`

## Resources 

### / 
 - GET - returns the version of the app (can be used for service heartbeat) 
 ```
 curl -X GET 'http://localhost:3000/'
   -> response: Get yer inventory v1.0.0
 ```
### /inventory/
 - GET - Returns all values in the inventory (caution, this doesn't contain a
   limit so this call could fail if DB gets too large).
   ```
   curl -X GET 'http://localhost:3000/inventory'
      -> response: 
      [{"PRODUCT NAME":"BOAR'S HEAD, ALL NATURAL FETA CHEESE
      CRUMBLES","UPC":"42421059328","MANUFACTURER":"Boar's Head Provision Co.,
      Inc. ","QUANTITY_ON_HAND":"575","STORAGE_LOCATION":"WALK-IN
      FREEZER","LAST_ORDERED_AT":"2019-01-09"},{"PRODUCT NAME":"BOAR'S HEAD,
      CANADIAN CHEDDAR CHEESE","UPC":"42421059656","MANUFACTURER":"Boar's Head
      Provision Co., Inc. ","QUANTITY_ON_HAND":"504","STORAGE_LOCATION":"WALK-IN
      FREEZER","LAST_ORDERED_AT":"2019-02-05"}, ...]
   ```
- PUT - Add a new product to the inventory
```
curl --header "Content-Type: application/json" -X PUT 'http://localhost:3000/inventory/' -d @test-put.json
   -> response: (200)
```

### /inventory/:upc
- GET - returns a specific product in the inventory
```
curl -X GET 'http://localhost:3000/inventory/71921743741'
  -> response: 
  {"PRODUCT NAME":"DIGIORNO, CHEESE STUFFED CRUST PIZZA","UPC":"71921743741","MANUFACTURER":"Nestle USA Inc.","QUANTITY_ON_HAND":"4417","STORAGE_LOCATION":"FREEZER","LAST_ORDERED_AT":"2019-03-15"}
```
- DELETE - deletes a specific product from the inventory
```
curl -X DELETE 'localhost:3000/inventory/75968106705'
   -> response: (200)
```

### /inventory/:upc/quantity
- PATCH - Increment or decrement the quantity for a particular UPC in the DB.
  Returns the updated item. 
```
curl --header "Content-Type: application/json" -X PATCH 'http://localhost:3000/inventory/75968106705/quantity' -d @test-dec.json
   -> response: 
   {"PRODUCT NAME":"MARIE CALLENDER'S, COOKIE MIX","UPC":"75968106705","MANUFACTURER":"International Commissary Corporation","QUANTITY_ON_HAND":720,"STORAGE_LOCATION":"PANTRY","LAST_ORDERED_AT":"2019-03-20"}
```

```
curl --header "Content-Type: application/json" -X PATCH 'http://localhost:3000/inventory/75968106705/quantity' -d @test-inc.json
   -> response: 
   {"PRODUCT NAME":"MARIE CALLENDER'S, COOKIE MIX","UPC":"75968106705","MANUFACTURER":"International Commissary Corporation","QUANTITY_ON_HAND":724,"STORAGE_LOCATION":"PANTRY","LAST_ORDERED_AT":"2019-03-20"}
```


