'use strict'
/**
 * Sails Hook Blueprint Utils 
 * 
 * Adds basic CRUD focused hooks
 * 
 */

const _ = require('lodash')
const actionUtil = require('./actionUtil')
const pluralize = require('pluralize')
const sailsConfig = sails.config.blueprints

/**
 * Returns total record count of the specified model.
 * Ex. GET /users/count -> { count: 42000 }
 *
 */
const defaultCountBlueprint = function (request, response) {

	let model = actionUtil.parseModel(request)

	let countQuery = model.count(actionUtil.parseCriteria(request))

	countQuery
		.then(function (count) {

			return response.ok({ count: count })

		})
}

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

const defaultBlueprintAssociations = function (request, response) {

	let modelName = request.options.model || request.options.controller

	if (!modelName) {
		throw new Error(util.format('No "model" specified in route options.'))
	}

	let model = request._sails.models[modelName]

	if (!model) {
		throw new Error(util.format('Invalid route option, "model".\nI don\'t know about any models named: `%s`', model))
	}

	if (!model.associations) {
		return response.ok({ associations: [] })
	}

	return response.ok({ associations: model.associations })


}

/**
 * Returns total record count of the specified relation
 * Ex. GET /users/578f754d8e8ebc785deac59c/clients -> { count: 4 }
 *
 */

const associationCount = function (request, response) {

	let model = actionUtil.parseModel(request)

	let countQuery = model.findOne(actionUtil.parseCriteria(request)).populate(request.options.alias)

	countQuery
		.then(function (items) {

			return response.ok({ count: items[request.options.alias].length })

		})

}

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

	let modelName = request.options.model || request.options.controller

	if (!modelName) {
		throw new Error(util.format('No "model" specified in route options.'))
	}

	let model = request._sails.models[modelName]

	if (!model) {
		throw new Error(util.format('Invalid route option, "model".\nI don\'t know about any models named: `%s`', model))
	}

	let schema = model.attributes

	return response.ok({ schema: schema })

}

/**
 * Returns filterable fields defined in model
 * Ex. GET /users/filters -> {
  "filters": [
    {
      "name": "username",
      "text": "Username",
      "type": "string"
    },
    {
      "name": "createdAt",
      "text": "Created At",
      "type": "datetime"
    },
    {
      "name": "updatedAt",
      "text": "Updated At",
      "type": "datetime"
    }
  ]
}
 */

const defaultBlueprintFilters = function (request, response) {

	let modelName = request.options.model || request.options.controller

	if (!modelName) {
		throw new Error(util.format('No "model" specified in route options.'))
	}

	let model = request._sails.models[modelName]

	if (!model) {
		throw new Error(util.format('Invalid route option, "model".\nI don\'t know about any models named: `%s`', model))
	}

	var filters = []

	if (model.fields) {

		_.forEach(model.fields, function (field, fieldName) {

			if (_.isObject(field) && field.filter) {

				let attribute = model.attributes[fieldName]

				if (!attribute.protected) {

					let filter = {
						name: fieldName,
						text: field.title
					}

					if (attribute.type) {
						filter.type = attribute.type
					}

					if (attribute.minLength) {
						filter.minLength = attribute.minLength
					}

					if (attribute.maxLength) {
						filter.maxLength = attribute.maxLength
					}

					if (attribute.enum) {
						filter.enum = attribute.enum
					}

					filters.push(filter)
				}
			}

		})
	}

	return response.ok({ filters: filters })

}

const defaultBlueprintTitles = function (request, response) {

	let modelName = request.options.model || request.options.controller

	if (!modelName) {
		throw new Error(util.format('No "model" specified in route options.'))
	}

	let model = request._sails.models[modelName]

	if (!model) {
		throw new Error(util.format('Invalid route option, "model".\nI don\'t know about any models named: `%s`', model))
	}

	let titles = {}

	if (model.fields) {

		_.forEach(model.fields, function (field, fieldName) {

			if (_.isObject(field) && field.column) {
				titles[fieldName] = field.title
			}

		})

	}

	return response.ok({ titles: titles })

}

const initFn = function (callback) {

	let countFn = _.get(sails.middleware, 'blueprints.count') || defaultCountBlueprint
	let associationFn = _.get(sails.middleware, 'blueprints.association') || defaultBlueprintAssociations
	let schemaFn = _.get(sails.middleware, 'blueprints.schema') || defaultBlueprintSchema
	let filtersFn = _.get(sails.middleware, 'blueprints.filters') || defaultBlueprintFilters
	let titlesFn = _.get(sails.middleware, 'blueprints.titles') || defaultBlueprintTitles

	sails.on('router:before', function () {

		_.forEach(sails.models, function (model) {

			var controller = sails.middleware.controllers[model.identity]

			if (!controller) {

				return

			}

			var baseRoute = [sailsConfig.prefix, model.identity].join('/')


			if (sailsConfig.pluralize && _.get(controller, '_config.pluralize', true)) {

				baseRoute = pluralize(baseRoute)

			}


			// Count hook
			var countRoute = baseRoute + '/count'
			sails.router.bind(countRoute, countFn, null, { controller: model.identity })


			// Associations hook
			var associationRoute = baseRoute + '/associations'
			sails.router.bind(associationRoute, associationFn, null, { controller: model.identity })


			// Schema hook
			var schemaRoute = baseRoute + '/schema'
			sails.router.bind(schemaRoute, schemaFn, null, { controller: model.identity })


			// Filters hook
			var filtersRoute = baseRoute + '/filters'
			sails.router.bind(filtersRoute, filtersFn, null, { controller: model.identity })

			// Titles hook
			var titlesRoute = baseRoute + '/titles'
			sails.router.bind(titlesRoute, titlesFn, null, { controller: model.identity })


			// Loops model associations and adds /count suffix to the route
			_.forEach(model.associations, function (association) {

				if (association.type && association.type == 'collection') {

					var subRoute = baseRoute + '/:id/' + association.collection

					if (sailsConfig.pluralize && _.get(controller, '_config.pluralize', true)) {
						subRoute = pluralize(subRoute)
					}

					// Associated count hook
					subRoute += '/count'
					sails.router.bind(subRoute, associationCount, null, { controller: model.identity, alias: association.alias })

				}

			})

		})

	})

	return callback()
}


// policy must be defined in sails.config.blueprintUtils
const policyFn = function (request, response, callback) {


	if (typeof sails.config.blueprintUtils === 'undefined') {

		return callback()

	}


	if (_.isString(sails.config.blueprintUtils.policy)) {


		return sails.hooks.policies.middleware[sails.config.blueprintUtils.policy.toLowerCase()](request, response, callback)

	} else {

		return callback()

	}

}

// instead of module.exports, we define routes here and extend it
// later to prevent syntax errors generated for dynamic object names
let routes = {
	before: {}
}

// routes to attach policies
const routesToAttach = ['count', 'filters', 'titles', 'associations', 'schema', ':id/:model/count']


// loop through routes and attach policy function
_.forEach(routesToAttach, function (route) {

	routes.before['GET ' + sailsConfig.prefix + '/:model/' + route] = policyFn

})


// empty function, no configuration needed for now
const configFn = function () {

}


module.exports = function (sails) {

	return {
		configure: configFn,
		initialize: initFn,
		routes: routes
	}

}