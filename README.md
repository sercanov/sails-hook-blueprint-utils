# sails-hook-blueprint-utils

[![npm version](https://badge.fury.io/js/sails-hook-blueprint-utils.svg)](https://badge.fury.io/js/sails-hook-blueprint-utils)

Adds utility methods to Sails API blueprints. 

## Installation

In Sails.js v0.11+ installed hooks are run automatically. Therefore, simply install the hook via `npm`:

    npm install --save sails-hook-blueprint-utils

## Ingredients
- Count

Returns total record count of the specified model.

"where" parameter is optional. If it's used it's used in the same way like you use it in default blueprint API .find() method

```
GET /users/count?where={:CRITERIA}

{ 
    count: 42000 
}

GET /users/5694f97cc48a107117e19c2d/products/

{ 
    count: 42000 
}

```
- Associations

Returns related tables/collections associated with the model
```
GET /users/associations

{ 
    associations: [
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
    ]
}
```
- Schema

Returns the data model / schema of the specified model
```
GET /users/schema 

{ 
    schema:
    {
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
    }
}
```

## Credits

- [kristian-ackar](https://github.com/kristian-ackar) creator of the count function & https://github.com/kristian-ackar/sails-hook-blueprint-count  
- [buraktt](https://github.com/buraktt) association count function and policy integration
