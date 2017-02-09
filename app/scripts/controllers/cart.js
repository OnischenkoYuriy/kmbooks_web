'use strict';

angular.module('angularApp')
  .controller('CartCtrl', function(cart, order, $scope, $http, $location, config, $rootScope, $cookies, authorization) {
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
            $scope.name = savedOrder.name;
            $scope.phone = savedOrder.phone;
            $scope.email = savedOrder.email;
            $scope.address = savedOrder.address;
            $scope.orderComment = savedOrder.orderComment;
            $scope.RecalculateDeliveryCost();
          })
      }
    }

    $scope.UpdateOrder = function (complete) {
      function successAdded(response) {
        if (complete){
          $scope.completedOrder = response;
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
          $scope.address = '';
          $scope.orderComment = '';
          $scope.deliveryCost = 0;
          $scope.totalAmount = 0;
      }else{
          order.SetOrder(response);
          $cookies.put('orderId', response.id);
        }
      }
      var orderAmount, goodsTable;
      if ($scope.selectedCity === undefined){
         return;
      }
      if (cart.Exist()){
         orderAmount = cart.GetCart().orderAmount;
         goodsTable = cart.GetCart().goodsTable;
      }else{
        orderAmount = 0;
        goodsTable = [];
      }
      var orderUpdate = {id:            $cookies.get('orderId'),
                         username:      authorization.username(),
                         cityId:        $scope.selectedCity.originalId,
                         delivery:      $scope.selectedDelivery,
                         payment:       $scope.selectedPayment,
                         newPostWHS:    $scope.selectedNewPostWHS,
                         shop:          $scope.selectedShop,
                         name:          $scope.name,
                         phone:         $scope.phone,
                         email:         $scope.email,
                         address:       $scope.address,
                         orderComment:  $scope.orderComment,
                         orderAmount:   orderAmount,
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

    /*$rootScope.$on("$routeChangeSuccess", function (event, next, current) {
      if (current.$$route.originalPath === '/cart'){
        if ($scope.needs_to_save){
          $scope.UpdateOrder();
        }
        $scope.needs_to_save = false;
      }else if(next.$$route.originalPath === '/cart'){
        $scope.needs_to_save = true;
      }
    });*/

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
       }else{
         $scope.LoadOrder();
       }
     })

    $scope.SelectCity = function () {
      var originalId = $scope.selector.city.originalId;
      $http.get(config.url() + "/api/get_city?originalId=" + originalId)
        .success(function(response) {
          $scope.selectedCity = response;
          $scope.selectedDelivery = $scope.selectedCity.delivery[0];
          $scope.selectedPayment = $scope.selectedDelivery.payments[0];
          $scope.SelectDelivery();
        })
    }

    $scope.RecalculateDeliveryCost = function () {
      var orderAmount;
      if (cart.Exist()){
        orderAmount = cart.GetCart().orderAmount;
      }else{
        orderAmount = 0;
      }
      if ($scope.selectedDelivery.id === '1'){
        if (orderAmount > 450){
          $scope.deliveryCost = 0;
        }else{
          $scope.deliveryCost = 45;
        }
      }else if($scope.selectedDelivery.id === '4'){
        $scope.deliveryCost = 0;
      }else {
        $scope.deliveryCost = 0;
      }
      $scope.totalAmount = orderAmount + $scope.deliveryCost;
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

    $scope.SaveCart = function () {
      if ($scope.cart !== undefined) {
        if (authorization.isAuthorized()) {
          $http.post(config.url() + "/api/user/carts/update", $scope.cart, {withCredentials: true})
            .success(function(response) {
              cart.SetCart(response);
            })
        }else{
          $http.post(config.url() + "/api/carts/update", $scope.cart)
            .success(function(response) {
              cart.SetCart(response);
            })
        }
      }
    }

    $rootScope.$on('cart_was_added', function () {
      $scope.cart = cart.GetCart();
    })

    $scope.ChangeQuantity = function () {
      $scope.RecalculateDeliveryCost();
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


