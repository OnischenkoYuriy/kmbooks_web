
'use strict';

angular.module('angularApp').factory('order', function (authorization, cart, config, $rootScope, $http, $cookies) {
  return {
    GetOrder: function () {
      return $rootScope.order;
    },
    Exist: function () {
      if ($rootScope.order === undefined){
        return false;
      }else{
        return true;
      }
    },
    SetOrder: function (order) {
      return $rootScope.order = order;
    },
    AlreadyInOrder: function (code) {
      if ($rootScope.order !== undefined) {
        var result = false;
        angular.forEach($rootScope.order.goodsTable, function (value, key) {
          if (value.code === code) {
            result = true;
          }
        });
        return result;
      }else{
        return false;
      }
    },
    IsNotEmpty: function () {
      if ($rootScope.order !== undefined){
        if ($rootScope.order.goodsTable.length > 0){
          return true;
        }
      }
    },
    ItemsCount: function () {
      if ($rootScope.order !== undefined) {
        return $rootScope.order.goodsTable.length;
      }
    },
    GetStoredData: function () {
      var orderId = $cookies.get('orderId');
      if (orderId !== undefined){
        if (orderId.length > 0){
          $http.get(config.url() + "/api/orders/get_order_by_id?id=" + orderId)
            .success(function(response) {
              $rootScope.order = response;
              if (response === ''){
                $rootScope.order = undefined;
              }
              /*if ($rootScope.order !== undefined) {
                if (!cart.Exist()){
                  cart.SetCart({email: authorization.username(), goodsTable: $rootScope.order.goodsTable});
                }
              }*/
            })
        }
      };
      var cartId = $cookies.get('cartId');
      if(cartId !== undefined){
        if (!cart.Exist() && cartId.length > 0){
          $http.get(config.url() + "/api/cart?id=" + cartId)
            .success(function(response) {
               cart.SetCart(response);
            })
        }
      }
    },
    RecalculateOrder: function(order){
      if (order.goodsTable !== undefined){
        order.orderAmount = 0;
        angular.forEach(order.goodsTable, function(value, key) {
          if (value !== undefined) {
            if (value.priceWithoutDiscount === undefined){
              value.priceWithoutDiscount = value.price;
            }
            value.price = Math.round(value.priceWithoutDiscount * (1 - value.discount / 100) * 10) / 10;
            value.amount = Math.round(value.quantity * value.price * 100) / 100;
            order.orderAmount += value.amount;
          }
        });
        if (order.promoCode !== null && order.orderAmount >= order.promoCode.minOrderAmount){
          order.orderAmountWithDiscount = Math.round(order.orderAmount * (1 - order.promoCode.percent / 100)* 10) / 10;
        }else{
          order.orderAmountWithDiscount = order.orderAmount;
        }
        // if (order.payment.id === '5') {
        //   order.orderAmountWithDiscount = order.orderAmountWithDiscount * (1 - 0.05);
        // }
        order.totalAmount = order.orderAmountWithDiscount + order.deliveryCost;
      }
    },
    RecalculateDeliveryCost: function (order) {
      if (order.delivery.id === '1') {    //Курьер
        if (order.orderAmountWithDiscount >= 500) {
          order.deliveryCost = 0;
        } else {
          order.deliveryCost = 50;
        }
      }else if (order.delivery.id === '3'){   // Самовивіз
        order.deliveryCost = 0;
      }else if (order.delivery.id === '5'){  // Нова пошта
        if (order.orderAmountWithDiscount >= 1000) {
          order.deliveryCost = 0;
        } else {
          order.deliveryCost = 60;
        }
      }else if(order.delivery.id === '4') {   //Укрпошта
        if (order.orderAmountWithDiscount >= 1000) {
          order.deliveryCost = 0;
        } else {
          order.deliveryCost = 39;  // 30
        }
        order.deliveryCost = 0;
      }else if(order.delivery.id === '6') {  //Курьер в обл. центры
        order.deliveryCost = 0;
      }
      order.totalAmount = order.orderAmountWithDiscount + order.deliveryCost;
    }
  }});
