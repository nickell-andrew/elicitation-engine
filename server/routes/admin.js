var config = require('../config');
var uuid = require('node-uuid');

var express = require('express');
var router = express.Router();

var authenticateAccessTo = require('../elicitation/auth');
var handlebarsHelpers = require('../utils/handlebars-helpers');

var Promise = require('bluebird');
// FIXME: should only use in dev, not prod
Promise.longStackTraces();

module.exports = function (db, assetHelpers) {

  router.get('/', function (req, res, next) {

    return db.models.Task.findAll({
      where: {
        Discriminator: 'Elicitation' 
      },
      order: [['Modified', 'DESC']]
    }).then((elicitations) =>
      res.render('admin', {
        elicitations: elicitations,
        usingDefaultAdminPassword: config.haventSetAdminPassword(),
        helpers: handlebarsHelpers(assetHelpers)
      })
    );
  });
  
  router.post('/create', function (req, res, next) {
    console.error("\n\nFIXME: need to load auth and get person.ID, HARDCODING m.person.ID=2 ****\n\n");
    var m_person_ID = 2;
        
    var definitionText = "<elicitation><page title='Page Title Goes Here'></page></elicitation>";
    var changeSummary = "create new elicitation";
    var elicitationName = req.body.ElicitationName;
    var now = Date.now();
    
    var reviewToken=uuid.v4();
    
    return db.ready // fixme, next thing requires "m", need to authAndLoad
    .then((m) =>
      db.transaction(function (t) {
        return db.models.Task.create({
            Creator_ID: m_person_ID,
            Created: now,
            Modified: now,
            ElicitationName: elicitationName,
            Discriminator: "Elicitation",
            CompleteTaskInPopup: false,
            ShowResultsInDiscussion: false,
            NumCompleted: 0,
            NumAssigned: 0,
            ReviewToken: reviewToken,
            CompletePageIncludeLinkToDiscussion: false,
            CompleteTaskBeforeDiscussion: false,
            CompleteTaskInline: false,
            LastCompleted: now
          }, {transaction: t}
        )
        .then( elicitation => {
          return db.models.ElicitationDefinition.create({
              Definition: definitionText,
              ChangeSummary: changeSummary,
              Elicitation_ID: elicitation.ID,
              Created: now,
              Modified: now,
              CreatedBy_ID: m_person_ID
            }, {transaction: t}
          )
          .then( newDefinition => {
            elicitation.ElicitationDefinition_ID = newDefinition.ID;
            elicitation.Modified = now;
        
            return elicitation.save({transaction: t})
          })
        });
      }).then( function () {
        // FIXME: now redirect to editing the elicitation!
        console.error("FIXME: now redirect to the elicitation, this will time out forever!");
      })
    );
  });
  
  return router;
}
    