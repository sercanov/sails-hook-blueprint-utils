/**
 * Sails Hook Blueprint Utils 
 * 
 * Adds basic CRUD focused hooks. 
 * @crudConfig : ( Optional ) Config file that contains array of policies will be applied before hooks.
 * 
 */

var _ = require('lodash');
var actionUtil = require('./actionUtil');
var pluralize = require('pluralize');
var crudConfig;
try { crudConfig = require('../crud.config.js'); } catch (ex) {}

/**
 * Returns total record count of the specified model.
 * Ex. GET /users/count -> { count: 42000 }
 *
 */
const defaultCountBlueprint = function (req, res) {
  var Model = actionUtil.parseModel(req);

  var countQuery = Model.count(actionUtil.parseCriteria(req));

  countQuery
    .then(function (count) {
      return res.ok({ count: count });
    });
};

/**
 * Returns related tables/collections associated with the model
 * Ex. GET /users/associations -> { associations: [
 *   {
 *     "alias": "endpoints",
 *     "type": "collection",
 *     "collection": "endpoint",
 *     "via": "users"
 *   },
 *   {
 *     "alias": "clients",
 *     "type": "collection",
 *     "collection": "client",
 *     "via": "user"
 *   }
 * ]}
 *
 */
const defaultBlueprintAssociations = function(request, response) {
  var model = request.options.model || request.options.controller;
  if (!model) throw new Error(util.format('No "model" specified in route options.'));

  var Model = request._sails.models[model];
  if ( !Model ) throw new Error(util.format('Invalid route option, "model".\nI don\'t know about any models named: `%s`',model));

  if(Model.associations){
    return response.ok({associations: Model.associations});
  } else return response.ok({associations: []});

};

/**
 * Returns total record count of the specified relation
 * Ex. GET /users/578f754d8e8ebc785deac59c/clients -> { count: 4 }
 *
 */
const associationCount = function (request, response) {

  var Model = actionUtil.parseModel(request);

  var countQuery = Model.findOne(actionUtil.parseCriteria(request)).populate(request.options.alias);

  countQuery
    .then(function (items) {

      return response.ok({ count: items[request.options.alias].length });
    });

};

/**
 * Returns the data model / schema of the specified model
 * Ex. GET /users/schema -> { schema: {
 *  "name": {
 *     "type": "string",
 *     "required": true,
 *     "minLength": 1,
 *     "maxLength": 50
 *   },
 *   "email": {
 *     "type": "email",
 *     "required": true,
 *     "unique": true,
 *     "isValidEmail": true
 *   },
 *   "password": {
 *     "type": "string",
 *     "required": true,
 *     "minLength": 3,
 *     "maxLength": 15,
 *     "protected": true
 *   }
 * }}
 */
const defaultBlueprintSchema = function (request, response) {
  var model = request.options.model || request.options.controller;
  if (!model) throw new Error(util.format('No "model" specified in route options.'));

  var Model = request._sails.models[model];
  if (!Model) throw new Error(util.format('Invalid route option, "model".\nI don\'t know about any models named: `%s`', model));

  var schema = Model.attributes;

  return response.ok({ schema: schema });

};


module.exports = function (sails) {
  return {
    initialize: function (cb) {

      var config = sails.config.blueprints;
      var countFn = _.get(sails.middleware, 'blueprints.count') || defaultCountBlueprint;
      var associationFn = _.get(sails.middleware, 'blueprints.association') || defaultBlueprintAssociations;
      var schemaFn = _.get(sails.middleware, 'blueprints.schema') || defaultBlueprintSchema;

      sails.on('router:before', function () {

        _.forEach(sails.models, function (model) {
          var controller = sails.middleware.controllers[model.identity];

          if (!controller) return;

          var baseRoute = [config.prefix, model.identity].join('/');

          if (config.pluralize && _.get(controller, '_config.pluralize', true)) {
            baseRoute = pluralize(baseRoute);
          }

          // Count hook
          var countRoute = baseRoute + '/count';
          sails.router.bind(countRoute, countFn, null, { controller: model.identity });

          // Association hook
          var associationRoute = baseRoute + '/associations';
          sails.router.bind(associationRoute, associationFn, null, {controller: model.identity});

          // Schema hook
          var schemaRoute = baseRoute + '/schema';
          sails.router.bind(schemaRoute, schemaFn, null, { controller: model.identity });

          // Loops model associations and adds /count suffix to the route
          _.forEach(model.associations, function (association) {

            if (association.type && association.type == 'collection') {
              var subRoute = baseRoute + '/:id/' + association.collection;

              if (config.pluralize && _.get(controller, '_config.pluralize', true)) {
                subRoute = pluralize(subRoute);
              }

              // Associated count hook
              subRoute += '/count';
              sails.router.bind(subRoute, associationCount, null, { controller: model.identity, alias: association.alias });
            }

          });

        });

      });

      cb();
    },
    routes: {
      before: {
        'GET /api/:model/count': function (request, response, callback) {

          if (crudConfig && crudConfig.policies && crudConfig.policies.length > 0)
          {
            crudConfig.policies.forEach(function(policy){
              sails.hooks.policies.middleware[policy.toLowerCase()](request, response, callback)
            });

          } else return callback();

        },
        'GET /api/:model/schema': function (request, response, callback) {

          if (crudConfig && crudConfig.policies && crudConfig.policies.length > 0)
          {
            crudConfig.policies.forEach(function(policy){
              sails.hooks.policies.middleware[policy.toLowerCase()](request, response, callback)
            });

          } else return callback();

        },
        'GET /api/:model/associations': function (request, response, callback) {

          if (crudConfig && crudConfig.policies && crudConfig.policies.length > 0)
          {
            crudConfig.policies.forEach(function(policy){
              sails.hooks.policies.middleware[policy.toLowerCase()](request, response, callback)
            });

          } else return callback();

        },
        'GET /api/:model/:id/:model/count': function (request, response, callback) {

          if (crudConfig && crudConfig.policies && crudConfig.policies.length > 0)
          {
            crudConfig.policies.forEach(function(policy){
              sails.hooks.policies.middleware[policy.toLowerCase()](request, response, callback)
            });

          } else return callback();
        }
      }
    }
  }
};

