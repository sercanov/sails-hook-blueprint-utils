# sails-hook-blueprint-utils

Adds utility methods to Sails API blueprints. 

## Ingredients
- Count
Returns total record count of the specified model.
Ex. `GET /users/count -> { count: 42000 }`
- Associations
Returns related tables/collections associated with the model
Ex. 
```
GET /users/associations -> { associations: [
{
    "alias": "endpoints",
    "type": "collection",
    "collection": "endpoint",
    "via": "users"
},
{
    "alias": "clients",
    "type": "collection",
    "collection": "client",
    "via": "user"
}
]}
```
- Schema 
Returns the data model / schema of the specified model
Ex. 
````
GET /users/schema -> { schema: {
  "name": {
     "type": "string",
     "required": true,
     "minLength": 1,
     "maxLength": 50
   },
   "email": {
     "type": "email",
     "required": true,
     "unique": true,
     "isValidEmail": true
   },
   "password": {
     "type": "string",
     "required": true,
     "minLength": 3,
     "maxLength": 15,
     "protected": true
   }
 }}
 ```

## Installation

In Sails.js v0.11+ installed hooks are run automatically. Therefore, simply install the hook via `npm`:

    npm install sails-hook-blueprint-utils

## Usage

    GET /:model/count?where={:CRITERIA}

"where" parameter is optional. If it's used it's used in the same way like you use it in default blueprint api find method
[Sails.js blueprint api find method documentation](http://sailsjs.org/documentation/reference/blueprint-api/find-where).


## Credits

@kristian-ackar for the inspiration and @buraktt for nothing.