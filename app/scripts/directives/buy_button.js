'use strict';

angular.module('angularApp').directive('bkBuyButton', ['$http', 'config', 'authorization', '$rootScope',
'cart', '$location', '$cookies', function($http, config, authorization, $rootScope, cart, $location, $cookies) {
  return {
    restrict: 'E',
    scope: {
      book: '='
    },
    templateUrl: 'views/bk_buy_button.html',
    link: function(scope, element, attributes) {

      function updateStatus() {
        if (scope.book !== undefined) {
          if ([1227, 2008].indexOf(scope.book.state) === -1) {
            if ($location.path().search('book') != -1 && !authorization.isAuthorized()) {
              scope.discountHint = "<span class='brand-color'><a href='/user_registration'>РЕЄСТРУЙТЕСЬ</a></span> та відразу отримайте <br> <span class='brand-color'><a href='/ntml_page?name=conditions_of_purchase'>ЗНИЖКУ 3%</a></span>";
            }else{
              scope.discountHint = "";
            };
            if (scope.book.kvo > 0) {
              scope.boughtText = "Купити";
              scope.boughtDisable = false;
              scope.boughtHint = "";
            } else {
              scope.boughtText = "Замовити";
              scope.boughtDisable = false;
              scope.boughtHint = "Книга очікується з друку"
            }
          } else {
            scope.boughtText = "Купити";
            scope.boughtDisable = true;
          }
          if (cart.AlreadyInCart(scope.book.code)){
            scope.boughtText = "У кошику";
            scope.boughtDisable = true;
          }
        }
      }

      scope.$watch('book', function () {
        updateStatus();
      })

      scope.$on('cart_was_added', function () {
        updateStatus();
      })

      scope.AddToCart = function(book) {
        function successAdded(response) {
          scope.boughtText = "У кошику";
          scope.boughtDisable = true;
          cart.SetCart(response);
          var expireDate = new Date();
          expireDate.setMonth(expireDate.getMonth() + 3);
          $cookies.put('cartId', response.id, {expires: expireDate});
        }
        if (!cart.Exist()){
          cart.SetCart({email: authorization.username(), goodsTable: []});
        }
        var preorder = scope.book.kvo > 0 ? false: true;
        cart.AddToGoodsTable({code: book.code, quantity: 1, price: book.price, discount: book.discount, name: book.name, preorder: preorder});

        if (authorization.isAuthorized()) {
          $http.post(config.url() + "/api/user/carts/update", cart.GetCart(), {withCredentials: true})
            .success(function(response) {
              successAdded(response);
            })
        }else{
          $http.post(config.url() + "/api/carts/update", cart.GetCart())
            .success(function(response) {
              successAdded(response);
            })
        }
        return 0;
      }

    }
  };
}])
