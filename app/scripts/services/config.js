'use strict';

angular.module('angularApp').factory('config', function () {

    return {
        url: function() {
        var url = 'http://api.kmbooks.com.ua'; //'http://api.bukvashops.com.ua'; 'http://127.0.0.1:8080'
        return url;
      }
    }
  });
