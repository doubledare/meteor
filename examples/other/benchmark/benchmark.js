var PARAMS = {
  numBuckets: 10,
  numCollections: 1,

  // initial document population.
  // probably not usefully combined w/ maxAge?
  initialDocuments: 1,

  // How many inserts should each client do per second.
  insertRate: 1,
  // How many updates should each client do per second.
  updateRate: 1,
  // How many removes should each client do per second.  This should be
  // less than or equal to the insert rate, otherwise the simulation
  // will stablize on 0 documents.
  removeRate: 0.1,

  // How long to leave documents in the database. This, combined with
  // all the various rates, determines the steady state database
  // size. In seconds. falsy to disable.
  maxAge: 60,

  // Document size.
  // XXX make this a random distribution?
  //
  // bytes of randomness per document.
  documentSize: 2048,
  // how many fields of randomness per document.
  documentNumFields: 16
};

// XXX pick different scenarios

var Collections = [];
_.times(PARAMS.numCollections, function (n) {
  Collections.push(new Meteor.Collection("Collection" + n));
});


var random = function (n) {
  return (Math.floor(Math.random() * n));
}

var pickCollection = function () {
  return Collections[random(Collections.length)];
};

var generateDoc = function () {
  var ret = {};
  ret.bucket = random(PARAMS.numBuckets); // XXX!
  // XXX trusting client clock is wrong!!
  ret.when = +(new Date);

  _.times(PARAMS.documentNumFields, function (n) {
    // XXX
    ret[n] = "XXX random string of length: " +
      (PARAMS.documentSize/PARAMS.documentNumFields);
  });

  return ret;
};



if (Meteor.isServer) {
  Meteor.startup(function () {
    // clear all the collections.
    _.each(Collections, function (C) {
      C.remove({});
    });

    // insert initial docs
    _.times(PARAMS.initialDocuments, function () {
      pickCollection().insert(generateDoc());
    });
  });

  if (PARAMS.maxAge) {
    Meteor.setInterval(function () {
      var when = +(new Date) - PARAMS.maxAge*1000;
      _.each(Collections, function (C) {
        C.remove({when: {$lt: when}});
      });
      // Clear out 5% of the DB each time, steady state. XXX parameterize?
    }, 1000*PARAMS.maxAge / 20);
  }

  Meteor.publish("data", function (collection, bucket) {
    var C = Collections[collection];
    if (!C)
      console.log("XXX", collection);

    return C.find({bucket: bucket});
  });

}



if (Meteor.isClient) {
  // sub to data
  _.times(PARAMS.numCollections, function (n) {
    Meteor.subscribe("data", n, random(PARAMS.numBuckets));
  });

  // templates
  Template.params.params = function () {
    return _.map(PARAMS, function (v, k) {
      return {key: k, value: v};
    });
  };

  Template.status.status = function () {
    return Meteor.status().status;
  };

  // do stuff periodically

  if (PARAMS.insertRate) {
    Meteor.setInterval(function () {
      pickCollection().insert(generateDoc());
    }, 1000 / PARAMS.insertRate);
  }

  if (PARAMS.removeRate) {
    Meteor.setInterval(function () {
      var C = pickCollection();
      // XXX optimize!!
      var doc = _.first(_.shuffle(C.find({}).fetch()));
      if (doc)
        C.remove(doc.id);
    }, 1000 / PARAMS.removeRate);
  }

  if (PARAMS.updateRate) {
    Meteor.setInterval(function () {
      var C = pickCollection();
      // XXX update!!
    }, 1000 / PARAMS.updateRate);
  }

}
