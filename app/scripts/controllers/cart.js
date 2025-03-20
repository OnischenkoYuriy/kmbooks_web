'use strict';

angular.module('angularApp')
  .controller('CartCtrl', function(cart, order, $scope, $http, $location, config, $rootScope, $cookies, $window, authorization) {
    $scope.selector = {};

    var goodToAddCode = $location.search().goodCodeToAdd;

    if (goodToAddCode !== undefined && goodToAddCode !== ''){

        $http.get(config.url() + '/api/books/search?code=' + goodToAddCode)
          .success(function (response) {
              var book = response.bookList[0];

              function successAdded(response) {
                cart.SetCart(response);
                var expireDate = new Date();
                expireDate.setMonth(expireDate.getMonth() + 3);
                $cookies.put('cartId', response.id, {expires: expireDate});
              }

              if (book === undefined){
                return;
              }

              if (!cart.Exist()){
                cart.SetCart({email: authorization.username(), goodsTable: []});
              }

              if (cart.AlreadyInCart(book.code)){
                return;
              }

              var preorder = book.kvo > 0 ? false: true;
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

          })
    }


    $scope.AddECommerce = function (order) {
      ga('require', 'ecommerce');

      ga('ecommerce:addTransaction', {
        'id': order.number,
        'affiliation': 'kmbooks.com.ua',
        'revenue': order.totalAmount,
        'shipping': order.deliveryCost
      });

      angular.forEach(order.goodsTable, function (value, key) {
        ga('ecommerce:addItem', {
          'id': order.number,
          'name': value.name,
          'sku': value.code,
          'category': '',
          'price': value.price,
          'quantity': value.quantity
        });
      })
      ga('ecommerce:send');
    }

    $scope.SaveOrder = function () {
      $scope.UpdateOrder(true);
    }

    $scope.LoadOrder = function () {
      var savedOrder = order.GetOrder();
      if (savedOrder !== undefined) {
        if(savedOrder.cityId !== null){
          angular.forEach($scope.cities, function(city, key) {
            if (city.originalId === savedOrder.cityId){
              $scope.selector.city = $scope.cities[key];
            }
          })
        }
        $http.get(config.url() + "/api/get_city?originalId=" + $scope.selector.city.originalId)
          .success(function(response) {
            $scope.selectedCity = response;
            if(savedOrder.delivery !== null){
              angular.forEach($scope.selectedCity.delivery, function(delivery, key) {
                if (delivery.id == savedOrder.delivery.id){
                  $scope.selectedDelivery = delivery;
                }
              })
            }
            if(savedOrder.delivery !== null){
              angular.forEach($scope.selectedDelivery.payments, function(payment, key) {
                if (payment.id == savedOrder.payment.id){
                  $scope.selectedPayment = payment;
                }
              })
            }
            if(savedOrder.newPostWHS !== null){
              angular.forEach($scope.selectedCity.newPostWHS, function(newPostWHS, key) {
                if (newPostWHS.originalId == savedOrder.newPostWHS.originalId){
                  $scope.selectedNewPostWHS = newPostWHS;
                }
              })
            }
            if(savedOrder.shop !== null){
              angular.forEach($scope.selectedCity.shops, function(shop, key) {
                if (shop.id == savedOrder.shop.id){
                  $scope.selectedShop = shop;
                }
              })
            }
            if (authorization.isAuthorized()){
              var user = authorization.getUser();
              $scope.name = user.name;
              $scope.phone = user.phone;
              $scope.email = user.email;
              $scope.selector.address = user.address;
            }else{
              $scope.name = savedOrder.name;
              $scope.phone = savedOrder.phone;
              $scope.email = savedOrder.email;
              $scope.selector.address = savedOrder.address;
            }
            $scope.orderComment = savedOrder.orderComment;
            $scope.selector.zip = savedOrder.zip;
            $scope.RecalculateDeliveryCost();
          })
      }
    }

    $scope.UpdateOrder = function (complete) {
      function successAdded(response) {
        if (complete){
          $scope.completedOrder = response;
          $scope.AddECommerce(response);
          order.SetOrder(undefined);
          cart.SetCart({goodsTable: []});
          $cookies.put('orderId', '');
          $scope.selectedCity = undefined;
          $scope.selectedDelivery = undefined,
          $scope.selectedPayment = undefined,
          $scope.selectedNewPostWHS = undefined,
          $scope.selectedShop = undefined,
          $scope.name = '';
          $scope.phone = '';
          $scope.email = '';
          $scope.selector.address = '';
          $scope.orderComment = '';
          $scope.selector.zip = '';
          $scope.orderState = '';
          $scope.promoCode = '';
          $scope.promoCodeName = '';
          $scope.orderAmountWithDiscount = 0;
          $scope.deliveryCost = 0;
          $scope.totalAmount = 0;
      }else{
          order.SetOrder(response);
          var expireDate = new Date();
          expireDate.setMonth(expireDate.getMonth() + 3);
          $cookies.put('orderId', response.id, {expires: expireDate});
        }
        $scope.savingInProgress = false;
      }
      var orderAmount, goodsTable;
      if ($scope.selectedCity === undefined){
         return;
      }
      $scope.savingInProgress = true;
      if (cart.Exist()){
         orderAmount = cart.GetCart().orderAmount;
         goodsTable = cart.GetCart().goodsTable;
      }else{
        orderAmount = 0;
        goodsTable = [];
      }
      if (complete){
        $scope.orderState = 'Зроблений';
      }else{
        $scope.orderState = 'Робиться';
      }
      var orderUpdate = {id:            $cookies.get('orderId'),
                         type:          'Звичайна',
                         username:      authorization.username(),
                         cityId:        $scope.selectedCity.originalId,
                         delivery:      $scope.selectedDelivery,
                         payment:       $scope.selectedPayment,
                         newPostWHS:    $scope.selectedNewPostWHS,
                         shop:          $scope.selectedShop,
                         name:          $scope.name,
                         phone:         $scope.phone,
                         email:         $scope.email,
                         address:       $scope.selector.address,
                         orderState:    $scope.orderState,
                         orderComment:  $scope.orderComment,
                         zip:           $scope.selector.zip,
                         promoCode:     $scope.promoCode,
                         orderAmount:   orderAmount,
                         orderAmountWithDiscount: $scope.orderAmountWithDiscount,
                         deliveryCost:  $scope.deliveryCost,
                         totalAmount:   $scope.totalAmount,
                         goodsTable:    goodsTable};
      if (authorization.isAuthorized()) {
        $http.post(config.url() + "/api/user/orders/update", orderUpdate, {withCredentials: true})
          .success(function(response) {
            successAdded(response);
          })
      }else{
        $http.post(config.url() + "/api/orders/update", orderUpdate)
          .success(function(response) {
            successAdded(response);
          })
      }
    }

    $scope.$on('$locationChangeStart', function(event) {
       $scope.UpdateOrder();
    });

   $http.get(config.url() + "/api/get_cities")
     .success(function(response) {
       $scope.cities = response;
       $scope.selector = {};
       if (!order.Exist()) {
         $scope.selector.city = $scope.cities[0];
         $scope.SelectCity();
         if (authorization.isAuthorized()){
           var user = authorization.getUser();
           $scope.name = user.name;
           $scope.phone = user.phone;
           $scope.email = user.email;
           $scope.selector.address = user.address;
         }
       }else{
         $scope.LoadOrder();
       }
     })

    $scope.ChangeInterDelivery = function () {
      if ($scope.selector.interDelivery) {
        var originalId = config.interDeliveryID();
        $http.get(config.url() + "/api/get_city?originalId=" + originalId)
          .success(function(response) {
            angular.forEach($scope.cities, function(city, key) {
              if (city.originalId === originalId){
                $scope.selector.city = $scope.cities[key];
              }
            });
            $scope.SelectCity();
          })
      }else{
         $scope.selector.city = undefined;
         $scope.selectedCity = undefined;
         $scope.selectedDelivery = undefined;
         $scope.selectedPayment = undefined;
         $scope.SelectDelivery();
      }
    }

    $scope.SelectCity = function () {
      var originalId = $scope.selector.city.originalId;
      $http.get(config.url() + "/api/get_city?originalId=" + originalId)
        .success(function(response) {
          $scope.selectedCity = response;
          $scope.selectedDelivery = $scope.selectedCity.delivery[0];
          $scope.selectedPayment = $scope.selectedDelivery.payments[0];
          if ($scope.selectedCity.originalId === config.interDeliveryID()) {
            $scope.selector.interDelivery = true;
          }else{
            $scope.selector.interDelivery = false;
          };
          $scope.SelectDelivery();
        })
    }

    $scope.RecalculateDeliveryCost = function () {
      var itemsCount;
      if (cart.Exist()){
        if ($scope.promoCode !== undefined && cart.GetCart().orderAmount >= $scope.promoCode.minOrderAmount){
          $scope.orderAmountWithDiscount = Math.round(cart.GetCart().orderAmount * (1 - $scope.promoCode.percent / 100)* 10) / 10;
        }else{
          $scope.orderAmountWithDiscount = cart.GetCart().orderAmount;
        }
        if ($scope.selectedPayment.id === '5') {
           //
          //  var orderAmountWithDiscount = 0;
          //  angular.forEach(cart.GetCart().goodsTable, function(value, key) {
          //    if (value !== undefined) {
          //      if (!value.preorder) {
          //        orderAmountWithDiscount += Math.round(value.quantity * value.price / (1 - value.discount/100) * (1 - 0.08) * 100) / 100;
          //      }else{
          //        orderAmountWithDiscount += Math.round(value.quantity * value.price * 100) / 100;
          //      }
          //    }
          //  });
          // $scope.orderAmountWithDiscount = orderAmountWithDiscount;
          //
        }
        itemsCount = cart.ItemsCount();
      }else{
        $scope.orderAmountWithDiscount = 0;
      };

      if ($scope.selectedDelivery.id === '1') { // Courier
        if ($scope.orderAmountWithDiscount >= 500) {
          $scope.deliveryCost = 0;
        } else {
          $scope.deliveryCost = 50;
        }
      };

      if ($scope.selectedDelivery.id === '3'){  //selfdelivery
        $scope.deliveryCost = 0;
      };

      if ($scope.selectedDelivery.id === '5'){ // NewPost
        if ($scope.orderAmountWithDiscount >= 1000) {
          $scope.deliveryCost = 0;
        } else {
         $scope.deliveryCost = 60;
        }
      };

      if($scope.selectedDelivery.id === '4') {  // Ukrpost
        if ($scope.orderAmountWithDiscount >= 1000) {
          $scope.deliveryCost = 0;
        } else {
         $scope.deliveryCost = 39;  // 30
        }

      };

      if($scope.selectedDelivery.id === '6') {  //Ukrpost Courier
        if ($scope.orderAmountWithDiscount >= 1000) {
          $scope.deliveryCost = 0;
        } else {
         $scope.deliveryCost = 0; //35
        }

      };

      $scope.totalAmount = $scope.orderAmountWithDiscount + $scope.deliveryCost;
    }

    $scope.SelectDelivery = function () {
      $scope.selectedPayment = $scope.selectedDelivery.payments[0];
      if ($scope.selectedDelivery.id === '5'){
        $scope.selectedNewPostWHS = $scope.selectedCity.newPostWHS[0];
      }else if ($scope.selectedDelivery.id === '3'){
        $scope.selectedShop = $scope.selectedCity.shops[0];
      }
      $scope.RecalculateDeliveryCost();
    }

    $scope.SelectPayment = function () {
      $scope.RecalculateDeliveryCost();
    }

    $scope.SaveCart = function () {
      if ($scope.cart !== undefined) {
        if (authorization.isAuthorized()) {
          $http.post(config.url() + "/api/user/carts/update", $scope.cart, {withCredentials: true})
            .success(function(response) {
              cart.SetCart(response);
              $scope.RecalculateDeliveryCost();
            })
        }else{
          $http.post(config.url() + "/api/carts/update", $scope.cart)
            .success(function(response) {
              cart.SetCart(response);
              $scope.RecalculateDeliveryCost();
            })
        }
      }
    }

    $scope.ApplyPromoCode = function () {
      $scope.savingInProgress = true;
      $http.get(config.url() + "/api/promo_codes/get_by_name?name=" + $scope.promoCodeName)
        .success(function(response) {
          $scope.promoCode = response;
          $scope.RecalculateDeliveryCost();
        })
      $scope.savingInProgress = false;
    }

    $scope.RemovePromoCode = function () {
      $scope.promoCode = undefined;
      $scope.promoCodeName = '';
      $scope.RecalculateDeliveryCost();
    }

    $rootScope.$on('cart_was_added', function () {
      $scope.cart = cart.GetCart();
    })

    $scope.ChangeQuantity = function () {
      $scope.SaveCart();
    }

    $scope.removeFromCart = function (code) {
      angular.forEach($scope.cart.goodsTable, function(value, key) {
        if (value.code === code) {
          $scope.cart.goodsTable.splice(key, 1);
        }
      });
      $scope.SaveCart();
    }

    //
  })


