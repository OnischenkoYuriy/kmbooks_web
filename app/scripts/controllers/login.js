'use strict';

angular.module('angularApp').controller('LoginCtrl', function (wishList, $scope, $location, $rootScope,
                                                               $cookieStore, authorization, elBooks,
                                                               urlBeforeWrongAuth) {

  $scope.login = function () {
    var credentials = {
      username: this.email,
      password: this.password
    };

    var success = function (data) {
      if (data.email) {
        $scope.error = false;
        $rootScope.authenticated = true;
        $rootScope.user = data;
        $rootScope.username = data.email;
        $rootScope.role = data.role;
        wishList.GetStoredWishList();
        elBooks.SetElBooks(data.elBooks);
        $rootScope.$broadcast('successful_authorization');
        if (urlBeforeWrongAuth.GetUrlBeforeWrongAuth() === ''){
          if (authorization.onlyIsUser()) {
            $location.path("/");
          }else{
            $location.path("/edit");
          }
        }else{
          $location.url(urlBeforeWrongAuth.GetUrlBeforeWrongAuth());
          urlBeforeWrongAuth.SetUrlBeforeWrongAuth('');
        }
      } else {
        $rootScope.authenticated = false;
        $rootScope.username = '';
        $rootScope.role = '';
        $rootScope.user = undefined;
        $location.path("/login");
        $scope.error = true;
      }
    };
    var error = function () {
      $rootScope.authenticated = false;
      $rootScope.username = '';
      $rootScope.role = '';
      $rootScope.user = undefined;
      $location.path("/login");
      $scope.error = true;
    };

    authorization.login(credentials).success(success).error(error);
  };

  $scope.logout = function() {
    var success = function (data) {
      $rootScope.authenticated = false;
      $rootScope.username = '';
      $rootScope.role = '';
      wishList.SetWishList(undefined);
      elBooks.SetElBooks(undefined);
      $location.path("/");
      $rootScope.$broadcast('successful_logout');
    };
    var error = function () {
    };

    authorization.logout().success(success).error(error);
  }

});
